<template>
  <div class="doc-viewer">
    <!-- Handle different file types -->
    <div v-if="isTextFile" class="page-content-container">
      <div  class="page-content" v-html="renderDecodedContent()"></div>
    </div>

    <img v-else-if="isImageFile" :src="content" alt="Image preview" class="image-preview" />
    <video v-else-if="isVideoFile" :src="content" controls class="video-preview"></video>
    <audio v-else-if="isAudioFile" :src="content" controls class="audio-preview"></audio>

    <div v-else-if="isMarkdown" class="page-content-container">
      <div :id="id" class="page-content" v-html="renderMarkdown()"></div>
    </div>
    <div v-else class="unsupported">
      Unsupported file type: {{ file_ext }}
    </div>
  </div>
</template>

<script>
import { marked } from 'marked';
import { markedEmoji } from 'marked-emoji';

import { extractAndDecodeBase64 } from '@/components/utilities/decode'

export default {
  props: {
    id: {
      type: String,
      required: true
    },
    content: {
      type: String, // Base64 data URI for binary files or raw text
      required: true,
    },
    name: {
      type: String,
      default: "File_Name",
    },
    file_ext: {
      type: String, // File extension (e.g., 'txt', 'png', 'mp3')
      required: true,
    },
    contentMode: {
      type: String,
      default: 'data', // 'data' = base64 data URI, 'url' = remote URL
    },
  },
  data() {
    return {
      remoteTextContent: '',
      remoteContentError: null,
      remoteLoading: false,
    };
  },
  computed: {
    isTextFile() {
      return ['txt', 'json', 'html', 'css', 'js', 'cpp', 'h', ''].includes(this.file_ext.toLowerCase());
    },
    isImageFile() {
      return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(this.file_ext.toLowerCase());
    },
    isVideoFile() {
      return ['mp4', 'webm', 'ogg', 'mov'].includes(this.file_ext.toLowerCase());
    },
    isAudioFile() {
      return ['mp3', 'wav', 'ogg', 'm4a'].includes(this.file_ext.toLowerCase());
    },
    isMarkdown() {
      return this.file_ext.toLowerCase() == 'md';
    }
  },
  watch: {
    content: {
      handler() {
        this.prepareRemoteContent();
      },
      immediate: true,
    },
    contentMode() {
      this.prepareRemoteContent();
    },
  },
  methods: {
    async prepareRemoteContent() {
      if (this.contentMode !== 'url' || !(this.isTextFile || this.isMarkdown)) {
        this.remoteTextContent = '';
        this.remoteContentError = null;
        this.remoteLoading = false;
        return;
      }

      this.remoteLoading = true;
      this.remoteContentError = null;

      try {
        const response = await fetch(this.content, { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        this.remoteTextContent = await response.text();
      } catch (error) {
        console.error('Unable to load remote content', error);
        this.remoteContentError = error instanceof Error ? error.message : 'Unknown error';
        this.remoteTextContent = '';
      } finally {
        this.remoteLoading = false;
      }
    },
    renderDecodedContent() {
    if (this.contentMode === 'url') {
      if (this.remoteContentError) {
        return `Failed to load file: ${this.remoteContentError}`;
      }
      if (this.remoteLoading) {
        return 'Loading remote file…';
      }
      return this.remoteTextContent.replace(/\n/g, "<br>");
    }

    const decodedText = extractAndDecodeBase64(this.content);
    return decodedText.replace(/\n/g, "<br>");
    },
    renderMarkdown() {
      // Ensure links open in a new tab
        const renderer = new marked.Renderer();
        renderer.link = function (href, title, text) {
          var link = marked.Renderer.prototype.link.call(this, href, title, text);
          return link.replace("<a","<a target='_blank' ");
        }

        // Emoji options for marked
        const emojiOptions = {
        emojis: {
          "star": "🌟",
          "chili": "🌶️",
          "laptop": "💻",
          "rainbow": "🌈",
          "briefcase": "💼",
          "woman_technologist": "👩🏽‍💻",
          "heart": "❤️",
          "tada": "🎉",
          // add new ones from README
          "arrow_right": "➡️",
          "computer": "🖥️",
          "mag": "🔍",
          "handshake": "🤝"
        },
        renderer: (token) => token.emoji,
      };


      // Apply emoji options (only once)
      if (!marked.extensions?.emojiApplied) {
        marked.use(markedEmoji(emojiOptions));
        marked.extensions = { ...marked.extensions, emojiApplied: true };
      }

      // Decode Base64 content and parse Markdown
      try {
        if (this.contentMode === 'url') {
          if (this.remoteContentError) {
            return `<p>Failed to load file: ${this.remoteContentError}</p>`;
          }
          if (this.remoteLoading) {
            return '<p>Loading remote file…</p>';
          }
          return marked.parse(this.remoteTextContent, { renderer });
        }
        const decodedContent = extractAndDecodeBase64(this.content);
        return marked.parse(decodedContent, { renderer });
      } catch (error) {
        console.error("Error decoding content:", error);
        return "<p>Invalid content provided.</p>";
      }
    }

  }
};
</script>

<style>
@reference '../../style.css';

.doc-viewer {
  @apply w-full h-full flex flex-col items-center p-0; /* Container for all file previews */
}

.page-content-container {
  @apply bg-primary-bg h-full w-full;
}

.page-content hr {
  @apply border-primary-base;
}

.page-content {
  @apply relative text-primary-dark-base p-8 h-full overflow-auto; /* Styling for text content */
  filter: brightness(0.5); /* Neutralize brightness for text */
  line-height: 1.8rem;
  
}

.image-preview {
  @apply w-auto h-auto max-w-full max-h-full p-3; /* Ensures the image maintains aspect ratio */
  object-fit: contain; /* Ensures the image fits within its container while keeping aspect ratio */
  display: block; /* Prevent inline gaps */
  filter: brightness(0.5);
}

.video-preview,
.audio-preview {
  @apply w-full max-w-4xl; /* Styling for videos and audio */
  filter: brightness(0.5);
}

.unsupported {
  @apply text-red-500 font-bold; /* Styling for unsupported file types */
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
  @apply mb-5;
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
    @apply max-w-full max-h-[80vh]; /* Adjust image size for smaller screens */
  }
}
</style>

