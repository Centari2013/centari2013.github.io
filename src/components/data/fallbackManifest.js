const repoAsset = (name) =>
  `https://raw.githubusercontent.com/Centari2013/centari2013.github.io/main/shell_src_for_emcc/filesystem/files/${name}`;

const desktopReadme = `# Welcome to SpicyOS

This is the offline manifest that ships with the repo so you can explore the fake filesystem without wiring up
Sanity. Once your remote CMS is configured this tree will be replaced automatically, but the commands still work
exactly the same.
`;

const resumeMd = `# Résumé (Offline Extract)

## Core Focus
- Systems programming, WebAssembly, weird UI experiments.
- Ship fast, leave the neon LEDs on.

## Recent Work
- Built SpicyOS, a fake operating system portfolio.
- Ported a POSIX-inspired shell from C++ to WebAssembly.
`;

const aboutMeMd = `# About Me

Hi, I'm Zaria (aka SpicyKneecaps). When I'm not writing C++ for fun, I'm usually making the browser pretend it's a
terminal. This fallback tree exists so the \`tree\`, \`ls\`, and \`type\` commands always have something interesting to
show you.
`;

const logTxt = `== install.log ==
[BOOT] Provisioning SpicyOS offline manifest.
[OK] Linked desktop shortcuts.
[OK] Mounted documents and dotfiles.
`;

const cacheTxt = `Directory: /var/cache
The cache stores precomputed data so repeated operations stay fast. Clearing it will free some space, but the system
will regenerate whatever it needs on demand.
`;

const tmpTxt = `Directory: /tmp
Temporary scratch space for downloads, shell experiments, and code snippets. Everything here is ephemeral so don't
get too attached.
`;

const hostnameTxt = 'spicyos-offline\n';

const passwdTxt = `root:x:0:0:root:/root:/bin/bash
zaria:x:1001:1001:Zaria SpicyKneecaps:/home/SpicyKneecaps:/bin/bash
`;

const shadowTxt = `root:*:19876:0:99999:7:::
zaria:*:19876:0:99999:7:::
`;

const gccTxt = `gcc (Spicy toolchain) 13.2.0
Copyright (C) 2024 Zaria SpicyKneecaps
This is a fake binary that prints help text so \`type /usr/bin/gcc\` has something to display offline.
`;

const pythonTxt = `Python 3.12.1 (fake build)
>>> print('Hello from the fallback manifest!')
Hello from the fallback manifest!
`;

const lsTxt = `Usage: ls [directory]
Lists the contents of the target directory. Supports the faux filesystem that backs SpicyOS.
`;

const echoTxt = `Usage: echo [text]
Exactly what you'd expect.
`;

const fallbackManifest = {
  version: 1,
  root: { name: 'SpicyOS Filesystem' },
  desktop: [
    {
      id: 'desktop-readme',
      name: 'README.md',
      extension: 'MD',
      contentMode: 'data',
      content: desktopReadme,
      kind: 'file',
    },
    {
      id: 'desktop-sound-room',
      name: 'SoundRoom.link',
      extension: 'LINK',
      kind: 'link',
      contentMode: 'url',
      content: 'https://centari2013.github.io/SoundRoom/',
    },
  ],
  filesystem: [
    {
      id: 'root-bin',
      name: 'bin',
      role: 'bin',
      entries: [
        { id: 'bin-ls', name: 'ls', contentMode: 'data', content: lsTxt },
        { id: 'bin-echo', name: 'echo', contentMode: 'data', content: echoTxt },
      ],
    },
    {
      id: 'root-etc',
      name: 'etc',
      role: 'etc',
      entries: [
        { id: 'etc-hostname', name: 'hostname.txt', extension: 'TXT', contentMode: 'data', content: hostnameTxt },
        { id: 'etc-passwd', name: 'passwd.txt', extension: 'TXT', contentMode: 'data', content: passwdTxt },
        { id: 'etc-shadow', name: 'shadow.txt', extension: 'TXT', contentMode: 'data', content: shadowTxt },
      ],
    },
    {
      id: 'root-home',
      name: 'home',
      role: 'home',
      entries: [
        {
          id: 'home-zaria',
          name: 'SpicyKneecaps',
          role: 'users',
          entries: [
            {
              id: 'home-desktop',
              name: 'Desktop',
              role: 'desktop',
              entries: [
                {
                  id: 'desktop-readme-copy',
                  name: 'README.md',
                  extension: 'MD',
                  contentMode: 'data',
                  content: desktopReadme,
                },
                {
                  id: 'desktop-sound-room-shortcut',
                  name: 'Sound Room.url',
                  extension: 'URL',
                  kind: 'link',
                  contentMode: 'url',
                  content: 'https://centari2013.github.io/SoundRoom/',
                },
              ],
            },
            {
              id: 'home-documents',
              name: 'Documents',
              role: 'documents',
              entries: [
                { id: 'documents-resume', name: 'Resume.md', extension: 'MD', contentMode: 'data', content: resumeMd },
                { id: 'documents-about', name: 'AboutMe.md', extension: 'MD', contentMode: 'data', content: aboutMeMd },
              ],
            },
            {
              id: 'home-downloads',
              name: 'Downloads',
              role: 'downloads',
              entries: [
                { id: 'downloads-log', name: 'install.log', extension: 'LOG', contentMode: 'data', content: logTxt },
                { id: 'downloads-cache-note', name: 'cache.txt', extension: 'TXT', contentMode: 'data', content: cacheTxt },
              ],
            },
            {
              id: 'home-pictures',
              name: 'Pictures',
              role: 'pictures',
              entries: [
                {
                  id: 'pictures-hiiii',
                  name: 'hiiii.jpeg',
                  extension: 'JPEG',
                  contentMode: 'url',
                  content: repoAsset('hiiii.jpeg'),
                },
                {
                  id: 'pictures-itsa-me',
                  name: 'its_a_me.jpeg',
                  extension: 'JPEG',
                  contentMode: 'url',
                  content: repoAsset('its_a_me.jpeg'),
                },
                {
                  id: 'pictures-mel',
                  name: 'mel_cosplay_makeup.jpeg',
                  extension: 'JPEG',
                  contentMode: 'url',
                  content: repoAsset('mel_cosplay_makeup.jpeg'),
                },
              ],
            },
            {
              id: 'home-projects',
              name: 'Projects',
              entries: [
                {
                  id: 'projects-shell',
                  name: 'shell',
                  entries: [
                    {
                      id: 'projects-shell-files-cpp',
                      name: 'files.cpp',
                      extension: 'CPP',
                      contentMode: 'url',
                      content: repoAsset('files.cpp'),
                    },
                    {
                      id: 'projects-shell-files-h',
                      name: 'files.h',
                      extension: 'H',
                      contentMode: 'url',
                      content: repoAsset('files.h'),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'root-tmp',
      name: 'tmp',
      role: 'tmp',
      entries: [{ id: 'tmp-readme', name: 'README.txt', extension: 'TXT', contentMode: 'data', content: tmpTxt }],
    },
    {
      id: 'root-usr',
      name: 'usr',
      role: 'usr',
      entries: [
        {
          id: 'usr-bin',
          name: 'bin',
          role: 'usr/bin',
          entries: [
            { id: 'usr-bin-gcc', name: 'gcc', contentMode: 'data', content: gccTxt },
            { id: 'usr-bin-python', name: 'python3', contentMode: 'data', content: pythonTxt },
          ],
        },
        {
          id: 'usr-sbin',
          name: 'sbin',
          role: 'usr/sbin',
          entries: [],
        },
      ],
    },
    {
      id: 'root-var',
      name: 'var',
      role: 'var',
      entries: [
        {
          id: 'var-log',
          name: 'log',
          entries: [
            { id: 'var-log-system', name: 'system.log', extension: 'LOG', contentMode: 'data', content: logTxt },
          ],
        },
        {
          id: 'var-cache',
          name: 'cache',
          entries: [
            { id: 'var-cache-readme', name: 'README.txt', extension: 'TXT', contentMode: 'data', content: cacheTxt },
          ],
        },
      ],
    },
  ],
};

export default fallbackManifest;
