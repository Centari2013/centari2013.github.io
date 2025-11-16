#ifndef INITIALIZE_SPCY_FS
#define INITIALIZE_SPCY_FS

#include "file_system.h"
#include <emscripten/val.h>
#include <memory>

std::shared_ptr<FileSystem> create_spicy_linux_filesystem();
void loadFilesystemFromManifest(std::shared_ptr<FileSystem> fs, const emscripten::val &manifest_json);

#endif //INITIALIZE_SPCY_FS
