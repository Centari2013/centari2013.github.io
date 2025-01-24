#include "SystemCore.h"

#include "filesystem/initialize_spcy_fs.h"

#include <emscripten/bind.h>
#include <emscripten.h>



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
        .property("name", &FileSystem::Directory::File::get_name)
        .property("extension_abbr", &FileSystem::Directory::File::get_extension_abbr)
        .property("content", &FileSystem::Directory::File::get_content)
        ;
    
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
    
}