
let JsPdfConstructor = null;

const ensureJsPdf = async () => {
  if (!JsPdfConstructor) {
    const { jsPDF } = await import('jspdf');
    JsPdfConstructor = jsPDF;
  }

  return JsPdfConstructor;
}

const emojiToImg = (emoji) => {
  const canvas = document.createElement("canvas");
  const size = 48;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.font = `${size}px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2);

  const img = document.createElement("img");
  img.src = canvas.toDataURL("image/png");
  img.style.width = `${size}px`;
  img.style.height = `${size}px`;
  img.style.display = "inline-block";
  img.style.verticalAlign = "middle";

  return img;
};

const replaceEmojisInNode = (node) => {
  const emojiRegex = /\p{RGI_Emoji}/v;

  if (node.nodeType === Node.TEXT_NODE && emojiRegex.test(node.nodeValue)) {
    const frag = document.createDocumentFragment();
    const parts = node.nodeValue.split(emojiRegex);

    let match;
    const emojiMatches = node.nodeValue.match(emojiRegex) || [];

    parts.forEach((part, i) => {
      if (part) frag.appendChild(document.createTextNode(part));
      if (emojiMatches[i]) frag.appendChild(emojiToImg(emojiMatches[i]));
    });

    node.replaceWith(frag);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    Array.from(node.childNodes).forEach(replaceEmojisInNode);
  }
};

export function useExportFile() {
  const saveBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPlainText = async (text, filename) => {
    const JsPdf = await ensureJsPdf();
    const doc = new JsPdf();
    const lines = (text || '').split('\n');
    lines.forEach((line, i) => doc.text(line, 10, 10 + i * 7));
    doc.save(filename.replace(/\.\w+$/, '') + '.pdf');
  };

  const exportHTMLToPDF = async (elementSelector, filename) => {

    const JsPdf = await ensureJsPdf();

    const element = document.querySelector(`#${CSS.escape(elementSelector)}`);

    if (!element) {
      console.warn('Element not found for export:', elementSelector);
      return;
    }

    const el = element.cloneNode(true);

    // Create an off-screen container to render it for jsPDF
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.appendChild(el);
    document.body.appendChild(container);

    // Replace inline emoji characters with images
    replaceEmojisInNode(el);

    const doc = new JsPdf({
      orientation: 'p',
      unit: 'px',
      format: 'a4',
      putOnlyUsedFonts:true
    });

    await doc.html(el, {
      callback: (pdf) => {
        pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
        container.remove()
      },
      x: 10,
      y: 10,
      html2canvas: {
        scale: 0.5,
        useCORS: true
      },
      autoPaging: 'text',
      margin: 10,
    });
  };


  const exportMarkdownAsPDF = async (id, name) => {
    await exportHTMLToPDF(id, name);
  };

  const createBlobFromRenderable = (renderableFile) => {
    if (!renderableFile) {
      throw new Error('Nothing to export yet.');
    }

    if (renderableFile.rawData instanceof ArrayBuffer) {
      return new Blob([renderableFile.rawData], { type: renderableFile.mimeType || 'application/octet-stream' });
    }

    if (renderableFile.rawData instanceof Blob) {
      return renderableFile.rawData;
    }

    if (typeof renderableFile.rawData === 'string') {
      return new Blob([renderableFile.rawData], { type: renderableFile.mimeType || 'text/plain' });
    }

    throw new Error('Unsupported file format for export.');
  };

  const exportBinary = (renderableFile, filename) => {
    const blob = createBlobFromRenderable(renderableFile);
    saveBlob(blob, filename);
  };

  const exportFile = async ({ id, renderableFile, exten, name }) => {
    if (!renderableFile) {
      console.warn('Attempted to export before the file finished loading.');
      return;
    }

    const ext = (exten || '').toLowerCase();
    if (renderableFile.renderMode === 'markdown' || ext === 'md') {
      await exportMarkdownAsPDF(id, name);
      return;
    }

    if (renderableFile.renderMode === 'text' || ['txt', 'json', 'html', 'css', 'js', 'ts', 'cpp', 'h'].includes(ext)) {
      await exportPlainText(typeof renderableFile.rawData === 'string' ? renderableFile.rawData : '', name);
      return;
    }

    exportBinary(renderableFile, name);
  };

  return { exportFile };
}
