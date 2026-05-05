<template>
  <div class="doc-viewer">
    <div v-if="loading" class="page-content-container">
      <div class="page-content">Loading file…</div>
    </div>

    <div v-else-if="error" class="page-content-container">
      <div class="page-content unsupported">{{ error }}</div>
    </div>

    <template v-else>
      <div v-if="renderer.mode === 'text'" class="page-content-container">
        <div class="page-content" v-html="renderer.content"></div>
      </div>

      <div v-else-if="renderer.mode === 'markdown'" class="page-content-container">
        <div :id="id" class="page-content" v-html="renderer.content"></div>
      </div>

      <div v-else-if="renderer.mode === 'html'" class="page-content-container">
        <div class="page-content html-content" v-html="renderer.content"></div>
      </div>

      <img v-else-if="renderer.mode === 'image'" :src="renderer.source" alt="Image preview" class="image-preview" />
      <video v-else-if="renderer.mode === 'video'" :src="renderer.source" controls class="video-preview"></video>
      <audio v-else-if="renderer.mode === 'audio'" :src="renderer.source" controls class="audio-preview"></audio>
      <iframe v-else-if="renderer.mode === 'pdf'" :src="renderer.source" class="pdf-frame"></iframe>

      <div v-else class="unsupported">
        Unsupported file type: {{ file.exten || 'unknown' }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { marked } from 'marked';
import { markedEmoji } from 'marked-emoji';
import { onBeforeUnmount, ref, watch } from 'vue';

import { loadFileContents } from '@/components/utilities/fileLoader';

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  file: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['loaded']);

const loading = ref(true);
const error = ref(null);
const renderer = ref({ mode: 'loading' });
const activeObjectUrl = ref(null);
let loadToken = 0;

const markdownRenderer = new marked.Renderer();
markdownRenderer.link = function (href, title, text) {
  const link = marked.Renderer.prototype.link.call(this, href, title, text);
  return link.replace('<a', "<a target='_blank' ");
};

const emojiOptions = {
  emojis: {
    star: '🌟',
    chili: '🌶️',
    laptop: '💻',
    rainbow: '🌈',
    briefcase: '💼',
    woman_technologist: '👩🏽‍💻',
    heart: '❤️',
    tada: '🎉',
    arrow_right: '➡️',
    computer: '🖥️',
    mag: '🔍',
    handshake: '🤝'
  },
  renderer: (token) => token.emoji
};

if (!marked.__spicyEmojiApplied) {
  marked.use(markedEmoji(emojiOptions));
  marked.__spicyEmojiApplied = true;
}

watch(
  () => props.file,
  () => {
    hydrateFile();
  },
  { immediate: true }
);

async function hydrateFile() {
  const token = ++loadToken;
  loading.value = true;
  error.value = null;
  renderer.value = { mode: 'loading' };
  cleanupObjectUrl();

  try {
    const renderableFile = await loadFileContents(props.file);
    if (token !== loadToken) {
      return;
    }
    renderer.value = renderFile(renderableFile);
    emit('loaded', renderableFile);
  } catch (err) {
    if (token !== loadToken) {
      return;
    }
    console.error('Failed to load file', err);
    error.value = err?.message || 'Failed to load file.';
  } finally {
    if (token === loadToken) {
      loading.value = false;
    }
  }
}

function renderFile(file) {
  if (!file) {
    return { mode: 'unsupported' };
  }

  if (file.renderMode === 'markdown') {
    return { mode: 'markdown', content: renderMarkdownContent(file.rawData) };
  }

  if (file.renderMode === 'html') {
    return { mode: 'html', content: typeof file.rawData === 'string' ? file.rawData : '' };
  }

  if (file.renderMode === 'text') {
    return { mode: 'text', content: formatTextContent(file.rawData) };
  }

  if (['image', 'audio', 'video', 'pdf'].includes(file.renderMode)) {
    return { mode: file.renderMode, source: getMediaSource(file) };
  }

  return { mode: 'unsupported' };
}

function formatTextContent(raw) {
  if (typeof raw !== 'string') {
    return '';
  }
  return raw.replace(/\n/g, '<br>');
}

function renderMarkdownContent(raw) {
  const value = typeof raw === 'string' ? raw : '';
  try {
    return marked.parse(value, { renderer: markdownRenderer });
  } catch (err) {
    console.error('Error rendering markdown', err);
    return '<p>Invalid content provided.</p>';
  }
}

function cleanupObjectUrl() {
  if (activeObjectUrl.value) {
    URL.revokeObjectURL(activeObjectUrl.value);
    activeObjectUrl.value = null;
  }
}

function getMediaSource(file) {
  cleanupObjectUrl();
  const { rawData, mimeType, sourceUrl } = file;

  if (typeof rawData === 'string') {
    if (rawData.startsWith('data:') || /^https?:\/\//i.test(rawData)) {
      return rawData;
    }
    return sourceUrl || rawData;
  }

  if (rawData instanceof ArrayBuffer) {
    const blob = new Blob([rawData], { type: mimeType || 'application/octet-stream' });
    activeObjectUrl.value = URL.createObjectURL(blob);
    return activeObjectUrl.value;
  }

  return sourceUrl || '';
}

onBeforeUnmount(() => {
  cleanupObjectUrl();
});
</script>

<style>
@reference '../../style.css';

.doc-viewer {
  @apply w-full h-full flex flex-col items-center p-0;
}

.page-content-container {
  @apply bg-primary-bg h-full w-full;
}

.page-content hr {
  @apply border-primary-base;
}

.page-content {
  @apply relative text-primary-dark-base p-8 h-full overflow-auto;
  line-height: 1.8rem;
}

.image-preview {
  @apply w-auto h-auto max-w-full max-h-full p-3;
  object-fit: contain;
  display: block;
}

.video-preview,
.audio-preview {
  @apply w-full max-w-4xl;
}

.pdf-frame {
  @apply w-full h-full border-none;
  background-color: #111827;
}

.unsupported {
  @apply text-red-500 font-bold;
}

.html-content {
  padding: 0;
}

.page-content ul {
  @apply list-disc pl-6 mb-4;
}

.page-content ol {
  @apply list-decimal pl-6 mb-4;
}

.page-content li {
  @apply mb-1;
}

.page-content h1 {
  @apply text-2xl font-bold text-primary-base mb-5;
}

.page-content h2 {
  @apply text-xl font-bold text-primary-base mt-6 mb-2;
}

.page-content h3 {
  @apply text-lg font-semibold text-primary-base mt-4 mb-1;
}

.page-content p {
  @apply pb-3;
}

@media (max-width: 768px) {
  .image-preview {
    @apply max-w-full max-h-[80vh];
  }
}
</style>
