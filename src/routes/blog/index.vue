<template>
  <div class="blog-shell">
    <header class="blog-header">
      <div>
        <p class="eyebrow">SpicyOS / Blog</p>
        <h1 class="headline">Signal Log</h1>
        <p class="lede">Dispatches, release notes, and thoughts from the cockpit.</p>
      </div>
      <RouterLink class="back-link" to="/">Back to SpicyOS</RouterLink>
    </header>

    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div class="posts-grid" v-else-if="!loading && posts.length">
      <article
        v-for="post in posts"
        :key="post.slug"
        class="post-card"
      >
        <RouterLink :to="`/blog/${post.slug}`" class="card-link">
          <div v-if="coverUrl(post.coverImage)" class="cover-wrapper">
            <img :src="coverUrl(post.coverImage)" :alt="post.title" class="cover" />
          </div>
          <div class="post-meta">
            <p class="post-date">{{ formatDate(post.publishedAt) }}</p>
            <h2 class="post-title">{{ post.title }}</h2>
            <p class="post-excerpt">{{ post.excerpt }}</p>
          </div>
        </RouterLink>
      </article>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <p>No posts yet. Check back soon.</p>
    </div>

    <div v-else class="loading-state">
      <div class="spinner" />
      <p>Loading transmissions…</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getAllPosts } from '@/components/utilities/blogQueries'
import { getCoverImageUrl } from '@/components/utilities/sanityImages'

const posts = ref([])
const loading = ref(true)
const error = ref('')

const formatDate = (value) => {
  if (!value) return 'Unscheduled'
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

const coverUrl = (image) => getCoverImageUrl(image)

onMounted(async () => {
  try {
    posts.value = await getAllPosts()
  } catch (err) {
    error.value = 'Unable to fetch posts right now.'
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

.back-link {
  @apply text-sm text-accent-yellow-shadow underline hover:text-alerts-base;
}

.posts-grid {
  @apply grid gap-6 md:grid-cols-2;
}

.post-card {
  @apply bg-primary-shadow/60 border border-primary-glow rounded-lg overflow-hidden hover:border-alerts-base transition-colors;
}

.card-link {
  @apply flex flex-col h-full no-underline text-inherit;
}

.cover-wrapper {
  @apply h-52 overflow-hidden;
}

.cover {
  @apply object-cover w-full h-full;
}

.post-meta {
  @apply p-4 flex-1 flex flex-col gap-2;
}

.post-date {
  @apply text-xs uppercase tracking-wide text-accent-yellow-shadow;
}

.post-title {
  @apply text-xl font-semibold;
}

.post-excerpt {
  @apply text-gray-300 line-clamp-3;
}

.loading-state,
.empty-state {
  @apply flex flex-col items-center gap-3 text-gray-300;
}

.error-state {
  @apply bg-alerts-base/10 border border-alerts-base text-alerts-base px-4 py-3 rounded;
}

.spinner {
  @apply h-10 w-10 border-2 border-primary-glow border-t-alerts-base rounded-full animate-spin;
}
</style>
