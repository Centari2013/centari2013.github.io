# SpicyOS
**Link:** https://centari2013.github.io/  
**Repository:** https://github.com/Centari2013/centari2013.github.io  
**Tech Stack:** Vue 3, Pinia, Tailwind CSS, augmented-ui, GSAP, Xterm.js, WebAssembly (C++ via Emscripten), Vite  
**Status:** Live on GitHub Pages  

---

## 🧭 Overview  
SpicyOS is a cyberpunk-inspired fake operating system that doubles as a portfolio and UI playground, blending a desktop metaphor, terminal, and storytelling-driven interface entirely in the browser.【F:README.md†L11-L69】
It showcases the author's range—from frontend animation to systems tinkering—by pairing a handcrafted Vue desktop shell with a compiled C++/WebAssembly backend originally built as a POSIX shell challenge.【F:README.md†L52-L69】
The site targets hiring managers and collaborators who are tired of minimalist resumes and want to interact with a living operating system instead.【F:README.md†L52-L69】
Boot animations, desktop icons, faux directories, and a functioning shell emphasize interactivity over static case studies.【F:README.md†L24-L69】
A Sanity-authored filesystem manifest is streamed into WebAssembly so the author can update projects, links, and shortcuts without redeploying code.【F:README.md†L71-L126】
The result is a live playground meant to highlight cross-platform experimentation, systems thinking, and a playful brand voice that stands apart from traditional portfolio templates.【F:README.md†L52-L150】

---

## 🎨 Features  
- **Desktop workspace** — Dynamic Vue desktop renders Sanity-authored files and directories, spawns windows for each open app or document, and adapts layout for mobile or desktop breakpoints.【F:src/components/desktop/Desktop.vue†L1-L143】
- **Dock, taskbar, and minimized file bar** — Animated GSAP-powered taskbar and vertical file bar let users toggle apps, lock the dock in place, and restore minimized file windows with smooth transitions.【F:src/components/desktop/Taskbar.vue†L1-L110】【F:src/components/desktop/MinimizedFileBar.vue†L1-L82】
- **WebAssembly-backed terminal** — The PyroShell terminal uses Xterm.js for history, cursor control, and `SystemModule.process_terminal_command`, handing commands to the compiled C++ shell for POSIX-like behavior.【F:src/components/views/TerminalView.vue†L1-L33】【F:src/assets/js/terminal/terminal.js†L1-L192】
- **Spatial file manager** — A two-pane manager mirrors desktop folders, offers sidebar shortcuts (Desktop, Downloads, Projects, etc.), and maintains back/forward history by calling WebAssembly filesystem APIs.【F:src/components/views/FileManagerView.vue†L1-L194】
- **Rich file viewer & exporter** — Files open in dedicated windows that detect markdown, text, media, or PDFs, stream content via `loadFileContents`, and let users export to PDF or binary downloads with a jsPDF bridge.【F:src/components/views/FileViewerView.vue†L1-L189】【F:src/components/utilities/useExportFile.js†L1-L173】
- **In-app browser** — Shortcut files marked as links open a sandboxed iframe browser with base64-safe URL passing plus quick actions for reloads and opening content in a real tab.【F:src/components/views/BrowserView.vue†L1-L110】【F:src/components/desktop/Desktop.vue†L116-L125】

---

## 🧱 Architecture & Design  
The project boots through Vite, creating a Vue 3 app, registering Pinia, and pulling in global styles plus the compiled WebAssembly entry before mounting `App.vue`.【F:src/main.js†L1-L13】
`App.vue` shows a progress-aware loading screen until the desktop signals initialization, then hands off full control to the Desktop component for runtime orchestration.【F:src/App.vue†L1-L32】

`Desktop.vue` acts as the root window manager: it loads the Sanity manifest, instantiates shared applications via async `ContentWindow` wrappers, injects references so the taskbar can drive focus, and renders the icon grid that mimics a desktop filesystem.【F:src/components/desktop/Desktop.vue†L1-L143】
Window lifecycle is centralized in the Pinia `apps` store, which tracks app/file windows, z-index stacking, and minimized/maximized state while `ContentWindow.vue` swaps between Terminal, File Manager, and Browser views inside a base window with animation hooks.【F:src/components/stores/apps.js†L1-L105】【F:src/components/windows/ContentWindow.vue†L1-L109】
Supporting utilities (`initFilesystem`, `makeDirectoryItems`, `makeFileItems`, `openFile`, `useExportFile`, etc.) normalize manifest data, resolve shortcuts, and bridge to WebAssembly for filesystem calls, producing the same dataset for both the desktop icons and in-window experiences.【F:src/components/utilities/initFilesystem.js†L1-L115】【F:src/components/utilities/makeFileItems.js†L1-L40】【F:src/components/utilities/openFile.js†L1-L18】【F:src/components/utilities/useExportFile.js†L1-L173】

---

## 🗄️ Database & API  
SpicyOS does not use a traditional relational database; instead, Sanity serves as the headless CMS describing the filesystem tree, desktop shortcuts, and file metadata via the `portfolioManifest` document plus nested `remoteFolder` and `portfolioEntry` objects (supporting fields like `kind`, `contentMode`, `asset`, and `shortcutTargetPath`).【F:studio-spicyos/schemaTypes/portfolioManifest.ts†L3-L76】
At runtime `initFilesystem` either fetches the manifest from Sanity using project/dataset/API version environment variables or loads a local JSON override, hydrates asset refs into CDN URLs, and calls `SystemModule.initFilesystem` to seed the in-memory filesystem WebAssembly module consumes.【F:src/components/utilities/initFilesystem.js†L1-L115】
No additional API endpoints or serverless functions are defined beyond Sanity's query endpoint.

---

## 🔊 Core Workflows  
**Boot & manifest hydration.** `App.vue` renders a loading screen while `Desktop.vue` waits for `SystemModule.onRuntimeInitialized`, then `initFilesystem` fetches and hydrates the manifest before emitting `initialized`, unlocking the desktop grid and windows.【F:src/App.vue†L1-L32】【F:src/components/desktop/Desktop.vue†L49-L143】【F:src/components/utilities/initFilesystem.js†L1-L115】

**Terminal command handling.** When the terminal view mounts it calls `initializeTerminal`, which configures Xterm.js, FitAddon sizing, command history, cursor navigation, and dispatches each command (except `clear` or `exit`) to `SystemModule.process_terminal_command`, letting the C++ backend respond inside the browser shell.【F:src/components/views/TerminalView.vue†L1-L33】【F:src/assets/js/terminal/terminal.js†L1-L192】

**File browsing, opening, and export.** The file manager lists directories/files from the WebAssembly filesystem, maintains navigation history, and double-clicking either opens directories via `SystemModule.cd` or files via `openFile`, which resolves shortcuts before pushing new file windows into the Pinia store; `FileWindow` then hydrates the file through `FileViewerView`, providing markdown/text/media renderers and `useExportFile` helpers for downloading the content as PDF or binary blobs.【F:src/components/views/FileManagerView.vue†L64-L194】【F:src/components/utilities/openFile.js†L1-L18】【F:src/components/windows/FileWindow.vue†L1-L96】【F:src/components/views/FileViewerView.vue†L1-L189】【F:src/components/utilities/useExportFile.js†L1-L173】

---

## 🖥️ UI & UX  
![Desktop preview](https://github.com/user-attachments/assets/04156c32-4d07-4a04-aeee-f0080c815355)
*Booted desktop with floating windows and neon chrome.*【F:README.md†L13-L13】

---

## ⚡ Performance & Optimization  
Vite handles bundling with Vue, SVG, WASM, and top-level-await plugins so the WASM shell and assets are code-split and lazy loaded as soon as the runtime initializes.【F:vite.config.js†L1-L35】
The Rollup visualizer can be toggled via `mode=analyze` to inspect bundle weight, while Tailwind via Vite strips unused styles for minimal CSS.【F:vite.config.js†L1-L35】
File loading utilities infer MIME types, convert data URIs only when necessary, and stream binaries into Blob URLs, keeping viewer components efficient even for large assets.【F:src/components/utilities/fileLoader.js†L1-L200】

---

## 🔐 Security Considerations  
- Sanity credentials (project ID, dataset, API version) are injected via Vite env variables, and `initFilesystem` throws if any are missing, preventing anonymous manifest fetches during build or dev sessions.【F:src/components/utilities/initFilesystem.js†L1-L33】
- Manifest hydration only accepts known document shapes (files, folders, shortcuts) and builds CDN URLs from Sanity asset refs, limiting arbitrary URL injection.【F:src/components/utilities/initFilesystem.js†L39-L115】
- Shortcut entries require a `shortcutTargetPath`, enforced at the schema level, reducing the risk of broken or malicious alias targets.【F:studio-spicyos/schemaTypes/portfolioManifest.ts†L3-L27】

---

## 🧪 Testing  
Currently no automated test suite is defined; npm scripts only cover `dev`, `build`, and `preview` commands.【F:package.json†L1-L24】

---

## 🚀 Deployment  
GitHub Actions builds and deploys the site to GitHub Pages whenever `main` is updated, installing Node 20, running `npm ci`, and invoking `npm run build` with the necessary Sanity environment variables wired in as secrets.【F:.github/workflows/jekyll-gh-pages.yml†L1-L46】
The workflow then uploads the `dist` artifact and releases it through the Pages deployment job, so publishing requires no manual steps beyond pushing to the default branch.【F:.github/workflows/jekyll-gh-pages.yml†L31-L46】
Because WebAssembly artifacts (`system.wasm`/`.data`) live under `public/`, they are baked into the static build and served alongside the Vite bundle when Pages hosts the site.【F:README.md†L75-L126】

---

## 🛣️ Roadmap  
- Finish wiring the `opendir` helper so desktop directory icons reliably focus or instantiate the file manager instead of hitting the placeholder `//TODO: FIX` path.【F:src/components/desktop/Desktop.vue†L85-L93】
- Refactor the C++ filesystem class to expose proper getters/setters and support automatic name collision handling, as noted in the shell source TODOs.【F:shell_src_for_emcc/filesystem/file_system.h†L11-L66】
- Expand the WebAssembly shell to sanitize backslashes and other path variants when resolving shortcuts or commands, per the TODO in `TerminalShellContext.cpp`.【F:shell_src_for_emcc/TerminalShellContext.cpp†L66-L66】

---

## 🧩 Challenges & Lessons  
SpicyOS emerged from a desire to escape minimalist portfolios, so the author leaned into building an interactive OS-sim experience that marries low-level systems work (a C++ shell compiled with Emscripten) with cinematic Vue/GSAP UI layers.【F:README.md†L52-L69】
Bridging WebAssembly with Sanity-authored content introduced unique challenges such as compiling the filesystem, base64-encoding initial data, and providing a repeatable build script to move artifacts into the correct Vite locations.【F:README.md†L71-L126】

---

## 📎 Resources  
- Project README with philosophy, setup, and author details.【F:README.md†L1-L150】
- Sanity Studio (`studio-spicyos/`) defining the `portfolioManifest` schema used to author files, folders, and shortcuts.【F:studio-spicyos/schemaTypes/portfolioManifest.ts†L3-L76】
- WebAssembly shell sources and build script under `shell_src_for_emcc/` for contributors who want to change the underlying filesystem or command set.【F:README.md†L94-L126】

# END TEMPLATE
