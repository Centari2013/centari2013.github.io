#include "FileManagerContext.h"


FileManagerContext::FileManagerContext(std::shared_ptr<FileSystem> f) {
    this->fs = std::move(f);
    this->cur_dir = fs->get_dir("$HOME");
    this->back_history.push_back(this->cur_dir);
    
}



void FileManagerContext::cd(FileSystem::Directory* dir_ptr){
    this->forward_history.clear();
    this->cur_dir = dir_ptr;
    this->back_history.push_back(dir_ptr); // add dir to back_history

    return;
}

bool FileManagerContext::back_history_empty() {
    return (this->back_history.size() == 1);
}

bool FileManagerContext::forward_history_empty() {
    return (this->forward_history.size() == 0);
}

void FileManagerContext::cd_back() {
    if (!back_history_empty()){
        this->forward_history.push_back(this->back_history.back());
        this->back_history.pop_back(); // remove cur directory from back_history to expose previous dir
        this->cur_dir = this->back_history.back();
    }

    return;
}

void FileManagerContext::cd_forward() {
    if (!forward_history_empty()){
        this->back_history.push_back(this->forward_history.back());
        this->cur_dir = this->forward_history.back();
        this->forward_history.pop_back(); // remove cur directory from foward_history
    }

    return;
}

std::vector<FileSystem::Directory*> FileManagerContext::list_directories(FileSystem::Directory* dir){
    return fs->list_directories(dir);
}

std::vector<FileSystem::Directory::File*> FileManagerContext::list_files(FileSystem::Directory* dir){
    return fs->list_files(dir);
}


FileSystem::Directory* FileManagerContext::get_cur_dir(){
    return this->cur_dir;
}

FileSystem::Directory* FileManagerContext::get_home_dir_ptr() const {
    return this->fs->get_home_dir_ptr();
}

FileSystem::Directory* FileManagerContext::get_downloads_dir_ptr() const {
    return this->fs->get_downloads_dir_ptr();
}

FileSystem::Directory* FileManagerContext::get_pictures_dir_ptr() const {
    return this->fs->get_pictures_dir_ptr();
}

FileSystem::Directory* FileManagerContext::get_root_dir_ptr() const {
    return this->fs->get_root_dir_ptr();
}

FileSystem::Directory* FileManagerContext::get_documents_dir_ptr() const {
    return this->fs->get_documents_dir_ptr();
}

FileSystem::Directory* FileManagerContext::get_desktop_dir_ptr() const {
    return this->fs->get_desktop_dir_ptr();
}