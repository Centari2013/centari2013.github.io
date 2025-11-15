# SpicyOS 🌶️💻

![MIT License](https://img.shields.io/badge/License-MIT-green.svg)
![Built with Vue](https://img.shields.io/badge/Built%20with-Vue%203-4fc08d?logo=vue.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Styled%20with-TailwindCSS-38bdf8?logo=tailwindcss&logoColor=white)
![WebAssembly](https://img.shields.io/badge/Powered%20by-WebAssembly-654ff0?logo=webassembly&logoColor=white)
![C++](https://img.shields.io/badge/Engineered%20in-C++-00599C?logo=c%2B%2B&logoColor=white)
![Open Source Love](https://img.shields.io/badge/made%20with-strife%20💀-black)


**SpicyOS** is a cyberpunk-inspired, fake operating system built entirely in the browser — serving as an unconventional developer portfolio and UI playground. It’s part terminal emulator, part desktop manager, part fever dream. Designed to break from the tired grid of “minimalist” portfolio sites, SpicyOS is fully interactive, highly stylized, and packed with hand-built components.

![SpicyOS Preview](https://github.com/user-attachments/assets/04156c32-4d07-4a04-aeee-f0080c815355)


---

## 🔗 Live Demo

**👉 [Try SpicyOS on GitHub Pages](https://centari2013.github.io/)**  

---

## 💾 What It Does

- Simulates a desktop UI with:
  - Clickable icons
  - File explorer with tree structure
  - Faux directories and folders
- Features a terminal interface inspired by POSIX, supporting:
  - `cd`, `ls`, `echo`, `pwd`, `clear`, `exit`, `tree`, `type`, `man`
- Bridges multiple technologies:
  - WebAssembly module powered by C++ (compiled with Emscripten)
  - JS interop with a custom shell engine and real-time rendering

---

## 🛠 Built With

| Layer       | Tech Stack                                                                 |
|-------------|-----------------------------------------------------------------------------|
| Framework   | [Vue 3](https://vuejs.org/), [Pinia](https://pinia.vuejs.org/)              |
| Styling     | [Tailwind CSS](https://tailwindcss.com/), [augmented-ui](https://augmented-ui.com/), PostCSS |
| Animations  | [GSAP](https://greensock.com/gsap/)                                         |
| Terminal    | [Xterm.js](https://xtermjs.org/) + `@xterm/addon-fit`                       |
| Markdown    | [marked](https://marked.js.org/) + `marked-emoji`                           |
| Bundler     | [Vite](https://vitejs.dev/)                                                 |
| WASM Bridge | C++ compiled via [Emscripten](https://emscripten.org/)                      |

---

## 🚀 Goals & Design Philosophy

> Traditional portfolio sites bored me. So I built a fake OS instead.

SpicyOS is meant to signal range — showcasing not just what I can build, but how I think about interaction, storytelling, and cross-platform experimentation. It started as a POSIX shell challenge (via CodeCrafters) and spiraled into a hybrid OS–portfolio built from scratch.

As a nod to my roots in C++, my first and favorite programming language, I compiled my backend with Emscripten instead of relying solely on JavaScript. By compiling with Emscripten into WebAssembly, I honored the low-level systems side of me while bringing it into the browser world.

---

## 🧠 Notable Features

- 🌲 Fully dynamic file tree system written from scratch in Vue
- 🖥️ Terminal supports real commands + simulated file system navigation
- 🌐 Bridges C++ and JS using Emscripten and WebAssembly
- 🎛️ Custom icon dock and boot animations
- ✨ Cyberpunk-adjacent visual theme (because dark mode’s not enough)

---
## 🧰 Dev Setup Notes

SpicyOS includes a custom file system backend written in C++, compiled to WebAssembly using [Emscripten](https://emscripten.org/). That said — **if you're not modifying the C++ shell**, you don’t need to worry about any of that.

### 🔧 Standard Setup (No C++ Changes)

If you're just cloning the repo to explore or make frontend/UI changes, the compiled WebAssembly artifacts (`system.js`, `system.wasm`, and `system.data`) are already included. You can spin up the local dev environment with:

```bash
git clone https://github.com/Centari2013/centari2013.github.io.git
cd centari2013.github.io
npm install
npm run dev
```

No Emscripten required unless you're going under the hood.

---

### ⚙️ Recompiling the Shell Backend (C++)

If you **do** plan to modify the C++ backend (like the files in `./shell_src_for_emcc/`), you’ll need to recompile the system using Emscripten.

#### Requirements:

- Emscripten installed and configured
- Python 3 (for pre-encoding the filesystem)

#### Recompile Process:

Use the included shell script:

```bash
cd ./shell_src_for_emcc
./build_shell.sh
```

This will:

1. Run a Python script to base64-encode the initial filesystem
2. Compile the C++ files using Emscripten into:
   - `system.js`
   - `system.wasm`
   - `system.data`
3. Move those artifacts to their correct locations:
   - `system.js` → `src/assets/js/terminal/`
   - `system.wasm` + `system.data` → `public/`
4. Append `window.SystemModule = Module;` to `system.js` to expose it to the frontend

> ⚠️ The script must be executed from within `./shell_src_for_emcc/`. Running it elsewhere will break path assumptions.

---

## 🗃️ Remote manifest (Sanity-only)

The faux filesystem that powers the desktop is still compiled into WebAssembly, but every folder/file you see at runtime now comes directly from Sanity. On load, the Pinia `files` store executes a GROQ query, normalizes the result into a Unix-style tree, and streams it into the WebAssembly module so the terminal, Desktop, and File Manager stay in sync without rebuilding the bundle.

### 1. Configure Sanity credentials

Set the required environment variables before `npm run dev` / `npm run build`:

```bash
VITE_SANITY_PROJECT_ID="your-project-id"
VITE_SANITY_DATASET="production"      # or your dataset name
# Optional advanced knobs
# VITE_SANITY_API_VERSION="v2021-10-21"
# VITE_SANITY_QUERY="*[_type == \"portfolioManifest\"][0]{ ... }"
# VITE_SANITY_QUERY_PARAMS='{"slug": "main"}'
```

Without `VITE_SANITY_PROJECT_ID` **and** `VITE_SANITY_DATASET` the app refuses to boot the manifest—there is no local JSON fallback anymore.

### 2. Manifest schema

```jsonc
{
  "version": 1,
  "root": { "name": "Filesystem" },
  "desktop": [
    { "id": "resume", "name": "Resume", "extension": "PDF", "kind": "link", "content": "https://.../resume.pdf" },
    { "id": "poster", "name": "Poster.png", "extension": "PNG", "contentMode": "url", "content": "https://cdn.../poster.png" }
  ],
  "filesystem": [
    { "name": "bin", "role": "bin", "entries": [] },
    { "name": "etc", "role": "etc", "entries": [] },
    {
      "name": "home",
      "role": "users",
      "entries": [
        {
          "name": "spicy",
          "role": "home",
          "entries": [
            { "name": "Desktop", "role": "desktop", "entries": [{ "name": "Welcome", "extension": "TXT", "content": "Hello" }] },
            { "name": "Documents", "role": "documents", "entries": [] }
          ]
        }
      ]
    }
  ]
}
```

- `desktop` entries appear as icons on the desktop.
- `filesystem` describes the entire Unix-like tree mounted at `/`. Assign `role` to map directories to `home`, `desktop`, `documents`, `bin`, etc. and nest via `entries` to add the rest of the hierarchy.
- The manifest root is materialized as `/`, so the terminal, Desktop, and File Manager all read the exact same files.
- Set `kind: "link"` (or `launch: "browser"`) to open a URL in the in-app browser.
- Use `contentMode: "url"` whenever the `content` points at an external file; otherwise the viewer assumes a Base64 data URI.

Because the SPA fetches the manifest straight from Sanity on every page load, any publish in Studio (or via mutations/scripts) immediately refreshes the filesystem—no JSON files, repos, or WebAssembly rebuilds are required.

#### Example schema

Drop these schema snippets into `sanity/schemaTypes` to mirror the manifest:

```ts
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
    defineField({ name: 'meta', type: 'object' }),
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
      type: 'string',
      options: { list: ['custom', 'home', 'desktop', 'documents', 'downloads', 'pictures', 'bin', 'etc', 'usr', 'usr/bin', 'usr/sbin', 'var', 'tmp', 'users'] },
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
      type: 'array',
      of: [{ type: 'remoteFolder' }],
    }),
  ],
});
```

Publish new entries through Sanity Studio and reload the site—the manifest refreshes instantly without touching the repo or the WebAssembly build.

---

If by some miracle you're interested in contributing, open an issue or reach out. I’ll walk you through it!


---

## 🧪 Author

**Zaria Burton**  
- Creative Full Stack Developer & Systems Tinkerer  
- 🔗 [LinkedIn](https://www.linkedin.com/in/zariaburton) | [GitHub](https://github.com/centari2013)  
- 📍 Miami, FL

---

## 🪪 License

MIT — remix, fork, deploy, just don’t be a copycat.

---

## 🫀 Why This Matters

SpicyOS isn’t just aesthetic. It’s a technically ambitious, UI-forward portfolio meant to demonstrate breadth — from frontend creativity to tech stack integration.
