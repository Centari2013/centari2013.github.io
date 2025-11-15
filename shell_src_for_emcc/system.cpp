#include "SystemCore.h"

#include "filesystem/initialize_spcy_fs.h"

#include <emscripten/bind.h>
#include <emscripten.h>
#include <emscripten/val.h>
#include <string>



auto fs = create_spicy_linux_filesystem();

SystemCore s(fs);

void set_terminal(emscripten::val terminal){
    s.set_terminal(terminal);
}

void process_command(std::string command){
    s.process_command(command);
}

std::vector<FileSystem::Directory*> list_directories(FileSystem::Directory* d){
    return s.list_directories(d);
}

std::vector<FileSystem::Directory::File*> list_files(FileSystem::Directory* d){
    return s.list_files(d);
}

void cd(FileSystem::Directory* d){
    return s.cd(d);
}

void cd_back(){
    return s.cd_back();
}

void cd_forward(){
    return s.cd_forward();
}

bool back_history_empty(){
    return s.back_history_empty();
}

bool forward_history_empty(){
    return s.forward_history_empty();
}

FileSystem::Directory* get_cur_fs_dir() {
    return s.get_cur_fs_dir();
}

FileSystem::Directory* get_home_dir_ptr() {
    return s.get_home_dir_ptr();
}

FileSystem::Directory* get_downloads_dir_ptr() {
    return s.get_downloads_dir_ptr();
}

FileSystem::Directory* get_pictures_dir_ptr() {
    return s.get_pictures_dir_ptr();
}

FileSystem::Directory* get_root_dir_ptr() {
    return s.get_root_dir_ptr();
}

FileSystem::Directory* get_documents_dir_ptr() {
    return s.get_documents_dir_ptr();
}

FileSystem::Directory* get_desktop_dir_ptr() {
    return s.get_desktop_dir_ptr();
}

FileSystem::Directory::File* resolve_shortcut(FileSystem::Directory::File* f) {
    return (f && f->is_shortcut) ? f->shortcut_target.lock().get() : nullptr;
}

FileSystem::Directory* create_directory(FileSystem::Directory* parent, const std::string& name) {
    return s.create_directory(parent, name);
}

FileSystem::Directory::File* create_file(
    FileSystem::Directory* parent,
    const std::string& name,
    const std::string& extension_abbr,
    const std::string& content,
    bool is_shortcut,
    bool is_link) {
    return s.create_file(parent, name, extension_abbr, content, is_shortcut, is_link);
}

void clear_directory(FileSystem::Directory* dir) {
    s.clear_directory(dir);
}

void build_fs_from_manifest(emscripten::val manifest_entries) {
    build_filesystem_from_manifest(fs, manifest_entries);
}


// Expose the functions to JavaScript
EMSCRIPTEN_BINDINGS(terminal) {
    emscripten::function("set_terminal", &set_terminal); // Expose set_terminal
    emscripten::function("process_terminal_command", &process_command); // Existing command processor
}


EMSCRIPTEN_BINDINGS(file_manager) {

    emscripten::class_<FileSystem::Directory>("Directory")
        .property("name", &FileSystem::Directory::get_name);
        ;
    
    emscripten::class_<FileSystem::Directory::File>("File")
        .smart_ptr<std::shared_ptr<FileSystem::Directory::File>>("shared_ptr<File>")
        .property("name", &FileSystem::Directory::File::get_name)
        .property("extension_abbr", &FileSystem::Directory::File::get_extension_abbr)
        .property("content", &FileSystem::Directory::File::get_content)
        .property("is_shortcut", &FileSystem::Directory::File::get_is_shortcut) 
        .property("is_link", &FileSystem::Directory::File::get_is_link);

    
    emscripten::register_vector<FileSystem::Directory*>("DirectoryVec");
    emscripten::register_vector<FileSystem::Directory::File*>("FileVec");

    emscripten::function("list_directories", &list_directories, emscripten::allow_raw_pointers());
    emscripten::function("list_files", &list_files, emscripten::allow_raw_pointers());
    emscripten::function("cd", &cd, emscripten::allow_raw_pointers());
    
    emscripten::function("cd_back", &cd_back);
    emscripten::function("cd_forward", &cd_forward);
    emscripten::function("back_history_empty", &back_history_empty);
    emscripten::function("forward_history_empty", &forward_history_empty);                                                                                                      ;

    emscripten::function("get_cur_fs_dir", &get_cur_fs_dir, emscripten::allow_raw_pointers());
    emscripten::function("get_home_dir_ptr", &get_home_dir_ptr, emscripten::allow_raw_pointers());
    emscripten::function("get_downloads_dir_ptr", &get_downloads_dir_ptr, emscripten::allow_raw_pointers());
    emscripten::function("get_pictures_dir_ptr", &get_pictures_dir_ptr, emscripten::allow_raw_pointers());
    emscripten::function("get_root_dir_ptr", &get_root_dir_ptr, emscripten::allow_raw_pointers());
    emscripten::function("get_documents_dir_ptr", &get_documents_dir_ptr, emscripten::allow_raw_pointers());
    emscripten::function("get_desktop_dir_ptr", &get_desktop_dir_ptr, emscripten::allow_raw_pointers());

    emscripten::function("resolve_shortcut", &resolve_shortcut, emscripten::allow_raw_pointers());

    emscripten::function("create_directory", &create_directory, emscripten::allow_raw_pointers());
    emscripten::function("create_file", &create_file, emscripten::allow_raw_pointers());
    emscripten::function("clear_directory", &clear_directory, emscripten::allow_raw_pointers());
    emscripten::function("build_fs_from_manifest", &build_fs_from_manifest);

}