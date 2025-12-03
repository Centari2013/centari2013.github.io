<template>
  <div class="blog-shell">
    <header class="blog-header">
      <div>
        <p class="eyebrow">SpicyOS / Blog</p>
        <h1 class="headline">{{ post?.title || 'Loading…' }}</h1>
        <p class="lede">{{ formatDate(post?.publishedAt) }}</p>
        <div v-if="post?.tags?.length" class="tags">
          <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
      <RouterLink class="back-link" to="/blog">Back to Blog</RouterLink>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <p>Decrypting entry…</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <RouterLink class="back-link" to="/blog">Return to index</RouterLink>
    </div>

    <div v-else-if="post" class="post-body">
      <div v-if="coverUrl(post.coverImage)" class="cover-wrapper">
        <img :src="coverUrl(post.coverImage)" :alt="post.title" class="cover" />
      </div>
      <article class="prose" v-html="renderedMarkdown" />
    </div>

    <div v-else class="empty-state">
      <p>Post not found.</p>
      <RouterLink class="back-link" to="/blog">Return to index</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { marked } from 'marked'
import { getPostBySlug } from '@/components/utilities/blogQueries'
import { getCoverImageUrl } from '@/components/utilities/sanityImages'

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const post = ref(null)
const loading = ref(true)
const error = ref('')

const formatDate = (value) => {
  if (!value) return 'Unscheduled'
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}

const coverUrl = (image) => getCoverImageUrl(image)

const renderedMarkdown = computed(() => {
  if (!post.value?.content) return ''
  return marked.parse(post.value.content)
})

onMounted(async () => {
  try {
    post.value = await getPostBySlug(props.slug)
  } catch (err) {
    error.value = 'Unable to load this post right now.'
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@reference '../../style.css';

.blog-shell {
  @apply min-h-dvh bg-primary-bg text-white p-8 flex flex-col gap-8;
}

.blog-header {
  @apply flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-primary-glow pb-4;
}

.eyebrow {
  @apply uppercase tracking-widest text-xs text-accent-yellow-shadow;
}

.headline {
  @apply text-4xl font-semibold mt-1;
}

.lede {
  @apply text-gray-300;
}

.tags {
  @apply flex flex-wrap gap-2 mt-2;
}

.tag {
  @apply text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-primary-shadow border border-primary-glow;
}

.back-link {
  @apply text-sm text-accent-yellow-shadow underline hover:text-alerts-base;
}

.loading-state,
.empty-state {
  @apply flex flex-col items-center gap-3 text-gray-300;
}

.spinner {
  @apply h-10 w-10 border-2 border-primary-glow border-t-alerts-base rounded-full animate-spin;
}

.error-state {
  @apply bg-alerts-base/10 border border-alerts-base text-alerts-base px-4 py-3 rounded;
}

.post-body {
  @apply flex flex-col gap-6;
}

.cover-wrapper {
  @apply h-80 overflow-hidden rounded-lg border border-primary-glow;
}

.cover {
  @apply object-cover w-full h-full;
}

.prose {
  @apply bg-primary-shadow/40 border border-primary-glow p-6 rounded-lg leading-relaxed text-gray-100;
}

.prose :deep(a) {
  @apply text-accent-yellow-shadow underline;
}

.prose :deep(code) {
  @apply bg-primary-shadow px-1 py-0.5 rounded;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4) {
  @apply text-white mt-6 mb-3 font-semibold;
}

.prose :deep(p) {
  @apply mb-4;
}
</style>
