# SpicyOS 🌶️💻

![MIT License](https://img.shields.io/badge/License-MIT-green.svg)
![Built with Vue](https://img.shields.io/badge/Built%20with-Vue%203-4fc08d?logo=vue.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Styled%20with-TailwindCSS-38bdf8?logo=tailwindcss&logoColor=white)
![WebAssembly](https://img.shields.io/badge/Powered%20by-WebAssembly-654ff0?logo=webassembly&logoColor=white)
![C++](https://img.shields.io/badge/Engineered%20in-C++-00599C?logo=c%2B%2B&logoColor=white)
![Open Source Love](https://img.shields.io/badge/made%20with-strife%20💀-black)

**SpicyOS** is a cyberpunk-inspired portfolio built as an interactive operating-system interface in the browser. It combines systems thinking, information architecture, interaction design, and hands-on engineering in one deliberately unconventional experience.

It is part terminal emulator, part desktop manager, part portfolio, and part technical experiment. The point is not just to show what I can build, but how I structure complex systems, connect technical layers, and turn an idea into something people can actually interact with.

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
  - JavaScript interoperability with a custom shell engine and real-time rendering
- Loads the portfolio filesystem from a GitHub-managed JSON manifest, keeping the presentation layer and content structure independent

---

## 🛠 Built With

| Layer       | Tech Stack                                                                 |
|-------------|-----------------------------------------------------------------------------|
| Framework   | [Vue 3](https://vuejs.org/), [Pinia](https://pinia.vuejs.org/)              |
| Styling     | [Tailwind CSS](https://tailwindcss.com/), [augmented-ui](https://augmented-ui.com/), PostCSS |
| Animations  | [GSAP](https://greensock.com/gsap/)                                         |
| Terminal    | [Xterm.js](https://xtermjs.org/) + `@xterm/addon-fit`                       |
| Markdown    | [marked](https://marked.js.org/) + `marked-emoji`                           |
| Content     | GitHub-managed JSON manifest + overrides                                     |
| Bundler     | [Vite](https://vitejs.dev/)                                                 |
| WASM Bridge | C++ compiled via [Emscripten](https://emscripten.org/)                      |

---

## 🚀 Goals & Design Philosophy

> Traditional portfolio sites bored me. So I built a fake OS instead.

SpicyOS is meant to demonstrate range without reducing that range to a wall of technology logos. The project combines software engineering, systems design, information architecture, interface design, and content modeling inside a single coherent metaphor.

It started as a POSIX shell challenge through CodeCrafters and grew into a browser-based operating-system portfolio. As a nod to my roots in C++, I compiled the shell layer to WebAssembly with Emscripten rather than rebuilding the entire experience in JavaScript.

The current portfolio is increasingly focused on the work I enjoy most: understanding complicated systems, identifying where they break down, designing better structures and workflows, and using technology to make those designs real.

---

## 🧠 Notable Features

- 🌲 Dynamic file-tree system written in Vue
- 🖥️ Terminal supporting real commands and simulated filesystem navigation
- 🌐 C++ and JavaScript integration through Emscripten and WebAssembly
- 🗂️ GitHub-managed portfolio filesystem manifest and override layer
- 🎛️ Custom icon dock and boot animations
- ✨ Cyberpunk-adjacent visual theme, because beige was never going to happen

---
## 🧰 Dev Setup Notes

SpicyOS includes a custom file system backend written in C++, compiled to WebAssembly using [Emscripten](https://emscripten.org/). That said, **if you're not modifying the C++ shell**, you don’t need to worry about any of that.

### 🔧 Standard Setup (No C++ Changes)

If you're just cloning the repo to explore or make frontend/UI changes, the compiled WebAssembly artifacts (`system.js`, `system.wasm`, and `system.data`) are already included. You can spin up the local dev environment with:

```bash
git clone https://github.com/Centari2013/centari2013.github.io.git
cd centari2013.github.io
npm install
npm run dev
```

No Emscripten required unless you're going under the hood.

### 🗂️ Authoring filesystem shortcuts

The portfolio filesystem is defined in `public/portfolioManifest.json`. Any entry whose `kind` is set to `shortcut` can use a `shortcutTargetPath` field. Point it at the absolute or `~`-relative path of the file you want to open, such as `/home/SpicyKneecaps/Documents/Resume.md` or `~/Documents/Resume.md`. The WebAssembly loader resolves that path at boot so shortcuts behave like real desktop aliases without duplicating content.

Need a shortcut that launches the File Manager in a folder instead? Set `shortcutTargetType` to `directory`. SpicyOS renders the folder shortcut icon and opens the requested directory directly.

---

### ⚙️ Recompiling the Shell Backend (C++)

If you **do** plan to modify the C++ backend, you’ll need to recompile the system using Emscripten.

#### Requirements

- Emscripten installed and configured
- Python 3 for pre-encoding the filesystem

#### Recompile Process

```bash
cd ./shell_src_for_emcc
./build_shell.sh
```

This will:

1. Run a Python script to base64-encode the initial filesystem
2. Compile the C++ files using Emscripten into `system.js`, `system.wasm`, and `system.data`
3. Move the artifacts into their expected frontend locations
4. Expose the compiled module to the browser runtime

> ⚠️ The script must be executed from within `./shell_src_for_emcc/` because it relies on relative path assumptions.

---

## 🧪 Author

**Zaria Burton**  
Business Systems & Technology Professional | Technical Builder  
[LinkedIn](https://www.linkedin.com/in/zariaburton) | [GitHub](https://github.com/centari2013)  
Miami, FL | Open to Atlanta relocation

---

## 🪪 License

MIT — remix, fork, deploy, just don’t pretend you made it.

---

## 🫀 Why This Matters

SpicyOS is more than a themed portfolio. It is a working demonstration of how I approach complicated problems: define the structure, understand the moving parts, connect the layers, prototype the experience, and make the system understandable to the person using it.
