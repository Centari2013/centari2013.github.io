import {sanityClient} from './sanityClient'

export async function getAllPosts() {
  const query = `*[_type == "post"] | order(publishedAt desc){
    title,
    "slug": slug.current,
    excerpt,
    coverImage,
    publishedAt
  }`

  return sanityClient.fetch(query)
}

export async function getPostBySlug(slug) {
  const query = `*[_type == "post" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    excerpt,
    coverImage,
    publishedAt,
    tags,
    content
  }`

  return sanityClient.fetch(query, {slug})
}
