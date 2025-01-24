#ifndef INITIALIZE_SPCY_FS
#define INITIALIZE_SPCY_FS

#include "file_system.h"
#include "files/files.h"
#include <memory>

std::shared_ptr<FileSystem> create_spicy_linux_filesystem();

#endif //INITIALIZE_SPCY_FS
