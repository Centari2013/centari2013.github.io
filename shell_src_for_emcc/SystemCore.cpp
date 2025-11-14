#include "SystemCore.h"

void SystemCore::set_terminal(emscripten::val terminal){
    t.set_terminal(terminal);
}

void SystemCore::process_command(std::string command){
    t.process_command(command);
}

std::vector<FileSystem::Directory*> SystemCore::list_directories(FileSystem::Directory* d){
    return f.list_directories(d);
}

std::vector<FileSystem::Directory::File*> SystemCore::list_files(FileSystem::Directory* d){
    return f.list_files(d);
}

void SystemCore::cd(FileSystem::Directory* d){
    return f.cd(d);
}

void SystemCore::cd_back(){
    return f.cd_back();
}

void SystemCore::cd_forward(){
    return f.cd_forward();
}

bool SystemCore::back_history_empty(){
    return f.back_history_empty();
}

bool SystemCore::forward_history_empty(){
    return f.forward_history_empty();
}

FileSystem::Directory* SystemCore::get_cur_fs_dir(){
    return f.get_cur_dir();
}

FileSystem::Directory* SystemCore::get_home_dir_ptr() const {
    return this->f.get_home_dir_ptr();
}

FileSystem::Directory* SystemCore::get_downloads_dir_ptr() const {
    return this->f.get_downloads_dir_ptr();
}

FileSystem::Directory* SystemCore::get_pictures_dir_ptr() const {
    return this->f.get_pictures_dir_ptr();
}

FileSystem::Directory* SystemCore::get_root_dir_ptr() const {
    return this->f.get_root_dir_ptr();
}

FileSystem::Directory* SystemCore::get_documents_dir_ptr() const {
    return this->f.get_documents_dir_ptr();
}

FileSystem::Directory* SystemCore::get_desktop_dir_ptr() const {
    return this->f.get_desktop_dir_ptr();
}

FileSystem::Directory* SystemCore::create_directory(FileSystem::Directory* parent, const std::string& name) {
    return this->f.create_directory(parent, name);
}

FileSystem::Directory::File* SystemCore::create_file(
    FileSystem::Directory* parent,
    const std::string& name,
    const std::string& extension_abbr,
    const std::string& content,
    bool is_shortcut,
    bool is_link) {
    return this->f.create_file(parent, name, extension_abbr, content, is_shortcut, is_link);
}

void SystemCore::clear_directory(FileSystem::Directory* dir) {
    this->f.clear_directory(dir);
}