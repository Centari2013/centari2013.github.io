import { defineField, defineType } from 'sanity';

export const portfolioEntry = defineType({
  name: 'portfolioEntry',
  type: 'object',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'extension', type: 'string' }),
    defineField({ name: 'kind', type: 'string', options: { list: ['file', 'link', 'shortcut'] } }),
    defineField({ name: 'contentMode', type: 'string', options: { list: ['url', 'data'] } }),
    defineField({ name: 'content', type: 'url' }),
    defineField({ name: 'asset', type: 'file' }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }] }),
    //defineField({ name: 'meta', type: 'object', fields: []}),
  ],
});

export const remoteFolder = defineType({
  name: 'remoteFolder',
  type: 'object',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'entries', type: 'array', of: [{ type: 'portfolioEntry' }, { type: 'remoteFolder' }] }),
  ],
});

export default defineType({
  name: 'portfolioManifest',
  title: 'Portfolio Manifest',
  type: 'document',
  fields: [
    defineField({ name: 'root', type: 'object', fields: [defineField({ name: 'name', type: 'string' })] }),
    defineField({ name: 'desktop', type: 'array', of: [{ type: 'portfolioEntry' }] }),
    defineField({ name: 'folders', type: 'array', of: [{ type: 'remoteFolder' }] }),
  ],
});