//terminal.js
import { Terminal } from "@xterm/xterm";
import { FitAddon } from '@xterm/addon-fit';
import './system';
import "@xterm/xterm/css/xterm.css";

// Function to initialize the terminal
export function initializeTerminal(terminalContainer, parentWindow) {
    const term = terminalSetup(terminalContainer, parentWindow);

    if (SystemModule) {
        // Initialize the terminal in the Module object
        SystemModule.set_terminal(term);
    } else {
        SystemModule.onRuntimeInitialized = () => {
            console.log("SystemModule initialized!");
            SystemModule.set_terminal(term); // Initialize terminal
        };
    }
}

function printIntro(art, terminal) {
    terminal.wrap = false;
    terminal.write(art);
    terminal.wrap = true;
}

// Your ASCII art
const art = `
 __         _                 ___  __    \r
/ _\\ _ __  (_)  ___  _   _   /___\\/ _\\   \r
\\ \\ | '_ \\ | | / __|| | | | //  //\\ \\   \r
_\\ \\| |_) || || (__ | |_| |/ \\_// _\\ \\   \r
\\__/| .__/ |_| \\___| \\__, |\\___/  \\__/   \r
    |_|              |___/               \r

         🌶️  Welcome to SpicyOS 🌶️       \r       
Type 'help' to get started.      \r\n
`;


function terminalSetup(terminalContainer, parentWindow) {
    let fontSize = 16;
    if (isMobile()) fontSize = 12;
    const term = new Terminal({
        cursorBlink: true,
        fontSize: fontSize,
        theme: {
            foreground: "#fee801",
            background: "#450327",
            cursor: "#fee801",
        },
    });

    const fitAddon = new FitAddon();

    if (terminalContainer) {
        requestAnimationFrame(() => {
            term.open(terminalContainer);

            // Call fitAddon.activate(term) to ensure proper functionality.
            // This might be undocumented but is required in this setup.
            fitAddon.fit(); // Fit after opening
            fitAddon.activate(term);
        });
    }

    // ResizeObserver to track size changes in the parent container
    const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit(); // Adjust terminal size dynamically
        fitAddon.activate(term);
        term.scrollToBottom();
    });

    resizeObserver.observe(terminalContainer);

    let inputBuffer = ""; // Temporary input buffer
    const commandHistory = []; // Array to store last 100 commands
    let historyIndex = -1; // Tracks the position in history (-1 means no history selected)
    let cursorPosition = 0;

    printIntro(art, term);
    term.write("$ ");

    // Listen for key events
    term.onKey((event) => {
        const char = event.key;

        // Handle Backspace (remove last character of input, not the prompt)
        if (char === '\u007F') {
            if (cursorPosition > 0) { // Ensure we're not backspacing past the prompt
                // Remove the character before the cursor position
                inputBuffer = inputBuffer.slice(0, cursorPosition - 1) + inputBuffer.slice(cursorPosition);
                cursorPosition--; // Move the cursor back
            
                // Redraw the line
                term.write('\x1b[2K\r'); // Clear the entire line
                term.write('$ ' + inputBuffer); // Redraw the prompt and inputBuffer
            
                // Move the cursor back to the correct position
                const cursorOffset = inputBuffer.length - cursorPosition;
                if (cursorOffset > 0) {
                    term.write(`\x1b[${cursorOffset}D`); // Move the cursor back to the correct position
                }
            }
            
        }
        // Handle Left Arrow
        else if (char === '\u001b[D') { // '\u001b[D' is the escape sequence for Left Arrow
            if (cursorPosition > 0) {
                term.write('\u001b[D'); // Visually move cursor left
                cursorPosition--;
            }
        }
        // Handle Right Arrow
        else if (char === '\u001b[C') { // '\u001b[C' is the escape sequence for Right Arrow
            if (cursorPosition < inputBuffer.length) {
                term.write('\u001b[C'); // Visually move cursor right
                cursorPosition--;
            }
        }
        // Handle Enter (process command)
        else if (char === '\r') {
            cursorPosition = 0;
            if (inputBuffer.length !== 0) {
                if (inputBuffer == 'exit'){
                    parentWindow.closeApp();
                }
                // Add command to history (if not duplicate of the last command)
                if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== inputBuffer) {
                    commandHistory.push(inputBuffer);

                    // Limit history to the last 100 commands
                    if (commandHistory.length > 100) {
                        commandHistory.shift();
                    }
                }

                term.write('\r\n');
                if (inputBuffer.trim() == "clear") {
                    term.clear();
                } else {
                    SystemModule.process_terminal_command(inputBuffer);
                }

                inputBuffer = ""; // Clear the input buffer
            } else {
                term.write("\r\n");
            }
            term.write("$ "); // Display the prompt again
        }
        // Handle Up Arrow (cycle back through history)
        else if (char === '\u001b[A') { // '\u001b[A' is the escape sequence for Up Arrow
            if (commandHistory.length > 0) {
                // Move back in history
                if (historyIndex === -1) {
                    historyIndex = commandHistory.length - 1; // Start from the last command
                } else if (historyIndex > 0) {
                    historyIndex--;
                }

                // Replace current input buffer with the selected history command
                inputBuffer = commandHistory[historyIndex];
                term.write('\x1b[2K\r') // clear last line
                term.write('\r$ ' + inputBuffer); // write history command
                cursorPosition = inputBuffer.length - 1;
            }
        }
        // Handle Down Arrow (cycle forward through history)
        else if (char === '\u001b[B') { // '\u001b[B' is the escape sequence for Down Arrow
            if (commandHistory.length > 0) {
                if (historyIndex !== -1) {
                    historyIndex++;
                    if (historyIndex >= commandHistory.length) {
                        historyIndex = -1; // Go back to an empty input
                        inputBuffer = "";
                    } else {
                        inputBuffer = commandHistory[historyIndex];
                    }

                    // Replace current input buffer with the selected history command
                    term.write('\x1b[2K\r') // clear last line
                    term.write('\r$ ' + inputBuffer); // write history command
                    cursorPosition = inputBuffer.length - 1;
                }
            }
        }
        // Handle regular character input
        else {
            inputBuffer = inputBuffer.slice(0, cursorPosition) + char + inputBuffer.slice(cursorPosition); // Insert at position
            term.write('\x1b[2K\r') // clear last line
            term.write('\r$ ' + inputBuffer); // write command
            term.write('\u001b[D'.repeat(inputBuffer.length - cursorPosition - 1));
            cursorPosition++;
        }
    });

    return term;
}
