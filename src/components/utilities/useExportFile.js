import { jsPDF } from 'jspdf';

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
  const downloadBase64 = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const exportText = (base64Data, filename) => {
    const decoded = atob(base64Data.split(',')[1]);
    const doc = new jsPDF();
    const lines = decoded.split('\n');
    lines.forEach((line, i) => doc.text(line, 10, 10 + i * 7));
    doc.save(filename.replace(/\.\w+$/, '') + '.pdf');
  };

  const exportHTMLToPDF = async (elementSelector, filename) => {
      
    const el = document.querySelector(`#${CSS.escape(elementSelector)}`).cloneNode(true);
    
    if (!el) {
      console.warn('Element not found for export:', elementSelector);
      return;
    }

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

    const doc = new jsPDF({
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


  const exportGeneric = (dataUrl, filename) => {
    downloadBase64(dataUrl, filename);
  };

  const exportFile = async ({ id, content, exten, name }) => {
    const ext = exten.toLowerCase();

    if (ext === 'md') {
      await exportMarkdownAsPDF(id, name);
    } else if (['txt', 'json', 'html', 'css', 'js', 'cpp', 'h'].includes(ext)) {
      exportText(content, name);
    } else {
      exportGeneric(content, name);
    }
  };

  return { exportFile };
}
