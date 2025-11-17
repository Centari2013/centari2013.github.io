#ifndef SYSTEMCORE_H
#define SYSTEMCORE_H

#include "TerminalShellContext.h"
#include "FileManagerContext.h"

class SystemCore
{
private:
    std::shared_ptr<FileSystem> fs;
    TerminalShellContext t;
    FileManagerContext f;
public:
    SystemCore(std::shared_ptr<FileSystem> fs):
    fs(std::move(fs)), t(TerminalShellContext(this->fs)), f(FileManagerContext(this->fs)){}

    void set_terminal(emscripten::val terminal);
    void process_command(std::string command);
    std::vector<FileSystem::Directory*> list_directories(FileSystem::Directory* d);
    std::vector<FileSystem::Directory::File*> list_files(FileSystem::Directory* d);
    void cd(FileSystem::Directory* d);
    void cd_back();
    void cd_forward();
    bool back_history_empty();
    bool forward_history_empty();

    FileSystem::Directory* get_home_dir_ptr() const;
    FileSystem::Directory* get_downloads_dir_ptr() const;
    FileSystem::Directory* get_pictures_dir_ptr() const;
    FileSystem::Directory* get_root_dir_ptr() const;
    FileSystem::Directory* get_documents_dir_ptr() const;
    FileSystem::Directory* get_desktop_dir_ptr() const;

    FileSystem::Directory* get_cur_fs_dir();
    void reset_filesystem_state();
};

#endif // SYSTEMCORE_H
