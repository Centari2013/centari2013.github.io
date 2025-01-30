#!/bin/bash

# Define output directory
OUTPUT_DIR=".."
DEST_DIR="../src/assets/js/terminal/"

# Create necessary base64 data
 /usr/bin/python3 /Users/spicykneecaps/Projects/centari2013.github.io/shell_src_for_emcc/encoders/to_base64.py

# Make sure the output directory exists
mkdir -p $OUTPUT_DIR

# Compile the source files using emcc
emcc system.cpp SystemCore.cpp FileManagerContext.cpp TerminalShellContext.cpp filesystem/files/files.cpp filesystem/file_system.cpp filesystem/initialize_spcy_fs.cpp -o $OUTPUT_DIR/system.js \
    -s WASM=1 \
    -s EXPORT_NAME="SystemModule" \
    --preload-file filesystem/\
    -lembind

# Add the line 'window.SystemModule = Module;' to system.js
echo 'window.SystemModule = Module;' >> $OUTPUT_DIR/system.js

# Move system.js to the destination directory, overwriting the existing file
mv -f $OUTPUT_DIR/system.js $DEST_DIR

mv -f $OUTPUT_DIR/system.data $OUTPUT_DIR/system.wasm $OUTPUT_DIR/public

echo "system.js has been compiled and moved successfully."
