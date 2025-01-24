#ifndef FILE_MANAGER_CONTEXT
#define FILE_MANAGER_CONTEXT

#include <string>
#include <map>
#include <functional>
#include <vector>
#include <iostream>
#include <iomanip>
#include <cstdlib>
#include <unistd.h>
#include <sys/wait.h>
#include <algorithm>
#include <memory>
#include "filesystem/file_system.h"



class FileManagerContext {
public:
    
    FileManagerContext(std::shared_ptr<FileSystem> f);
    std::vector<FileSystem::Directory*> list_directories(FileSystem::Directory* dir);
    std::vector<FileSystem::Directory::File*> list_files(FileSystem::Directory* dir);
    void cd(FileSystem::Directory* dir_ptr);
    
    bool back_history_empty();
    bool forward_history_empty();
    
    void cd_back();
    void cd_forward();

    FileSystem::Directory* get_cur_dir();

    FileSystem::Directory* get_home_dir_ptr() const;
    FileSystem::Directory* get_downloads_dir_ptr() const;
    FileSystem::Directory* get_pictures_dir_ptr() const;
    FileSystem::Directory* get_root_dir_ptr() const;
    FileSystem::Directory* get_documents_dir_ptr() const;
    FileSystem::Directory* get_desktop_dir_ptr() const;
    
private:
    FileSystem::Directory* cur_dir;
    std::vector<FileSystem::Directory*> back_history;
    std::vector<FileSystem::Directory*> forward_history;
    std::shared_ptr<FileSystem> fs;
    
    
};


#endif //FILE_MANAGER_CONTEXT