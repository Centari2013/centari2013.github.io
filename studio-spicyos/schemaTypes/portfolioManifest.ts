import { defineField, defineType } from 'sanity';

export const portfolioEntry = defineType({
  name: 'portfolioEntry',
  type: 'object',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'extension', type: 'string' }),
    defineField({ name: 'kind', type: 'string', options: { list: ['file', 'link', 'shortcut'] } }),
    defineField({ name: 'contentMode', type: 'string', options: { list: ['url', 'data'] } }),
    defineField({ name: 'content', type: 'text', rows: 3 }),
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
    defineField({
      name: 'role',
      title: 'System role',
      description: 'Map this folder to Unix defaults like home, desktop, bin, etc.',
      type: 'string',
      options: {
        list: [
          { title: 'Custom', value: 'custom' },
          { title: 'home', value: 'home' },
          { title: 'Desktop', value: 'desktop' },
          { title: 'Documents', value: 'documents' },
          { title: 'Downloads', value: 'downloads' },
          { title: 'Pictures', value: 'pictures' },
          { title: '/bin', value: 'bin' },
          { title: '/etc', value: 'etc' },
          { title: '/usr', value: 'usr' },
          { title: '/var', value: 'var' },
          { title: '/tmp', value: 'tmp' },
          { title: '/users', value: 'users' },
        ],
        layout: 'radio',
      },
    }),
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
    defineField({
      name: 'filesystem',
      title: 'Filesystem',
      description: 'Describe the entire Unix-like tree starting at /. Include bin, etc, usr, home, users, etc.',
      type: 'array',
      of: [{ type: 'remoteFolder' }],
    }),
  ],
});