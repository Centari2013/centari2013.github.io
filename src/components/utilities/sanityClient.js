import {createClient} from '@sanity/client'

function requireEnv(name) {
  const value = import.meta.env?.[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const projectId = requireEnv('VITE_SANITY_PROJECT_ID')
const dataset = requireEnv('VITE_SANITY_DATASET')
const apiVersion = requireEnv('VITE_SANITY_API_VERSION')

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

export const imageBuilderBase = `https://cdn.sanity.io/images/${projectId}/${dataset}/`
