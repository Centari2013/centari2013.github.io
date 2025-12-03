import { imageBuilderBase } from './sanityClient'

export function buildImageUrlFromRef(ref) {
  if (!ref) return null

  const imageMatch = /^image-([^-]+)-(\d+x\d+)-([a-zA-Z0-9]+)$/.exec(ref)
  if (!imageMatch) {
    return null
  }

  const [, hash, dimensions, extension] = imageMatch
  return `${imageBuilderBase}${hash}-${dimensions}.${extension}`
}

export function getCoverImageUrl(imageField) {
  if (!imageField || typeof imageField !== 'object') return null
  return buildImageUrlFromRef(imageField.asset?._ref)
}
