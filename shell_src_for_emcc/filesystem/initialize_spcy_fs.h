#ifndef INITIALIZE_SPCY_FS
#define INITIALIZE_SPCY_FS

#include "file_system.h"
#include "files/files.h"
#include <memory>
#include <emscripten/val.h>

std::shared_ptr<FileSystem> create_spicy_linux_filesystem();
void build_filesystem_from_manifest(std::shared_ptr<FileSystem> fs, const emscripten::val& manifest_entries);

#endif //INITIALIZE_SPCY_FS
