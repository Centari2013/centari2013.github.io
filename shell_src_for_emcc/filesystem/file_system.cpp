#include "file_system.h"
#include <algorithm>

FileSystem::FileSystem(const std::string &name, const std::string&root_name = "/"){
    this->name = name;
    this->root = std::make_unique<FileSystem::Directory>(FileSystem::Directory(root_name, nullptr));
    this->home = nullptr;
    this->downloads = nullptr;
    this->pictures = nullptr;
    this->documents = nullptr;
    this->current_dir = this->root.get();

}


void FileSystem::set_home_dir_ptr(FileSystem::Directory* p){
    this->home = p;
}

void FileSystem::set_downloads_dir_ptr(FileSystem::Directory* p){
    this->downloads = p;
}

void FileSystem::set_pictures_dir_ptr(FileSystem::Directory* p){
    this->pictures = p;
}

void FileSystem::set_documents_dir_ptr(FileSystem::Directory* p){
    this->documents = p;
}

void FileSystem::set_desktop_dir_ptr(FileSystem::Directory* p){
    this->desktop = p;
}

FileSystem::Directory* FileSystem::get_home_dir_ptr() const {
    return this->home;
}

FileSystem::Directory* FileSystem::get_downloads_dir_ptr() const {
    return this->downloads;
}

FileSystem::Directory* FileSystem::get_pictures_dir_ptr() const {
    return this->pictures;
}

FileSystem::Directory* FileSystem::get_root_dir_ptr() const {
    return this->root.get();
}

FileSystem::Directory* FileSystem::get_documents_dir_ptr() const {
    return this->documents;
}

FileSystem::Directory* FileSystem::get_desktop_dir_ptr() const {
    return this->desktop;
}

std::string FileSystem::get_home_dir(){
    return this->get_dir_path(this->home);
}

std::string FileSystem::get_cwd(){
    return this->get_dir_path(this->current_dir);
}

std::string FileSystem::get_dir_path(FileSystem::Directory *d){
    std::vector<std::string> path_name_vec;
    while (d){
        path_name_vec.push_back(d->name);
        d = d->parent;
    }

    std::string path_name;
    while (!path_name_vec.empty()){
        if(path_name_vec.size() > 1){
            path_name.append(path_name_vec.back()[0] == DIR_DELIM ? path_name_vec.back() : (path_name_vec.back() + DIR_DELIM));
        }else{
            path_name.append(path_name_vec.back());
        }
        
        path_name_vec.pop_back();
    }
    return path_name;
}

std::vector<std::string> FileSystem::parse_path_name(const std::string &dir_name) {
    std::vector<std::string> dirs;
    if (dir_name.empty()){
        return dirs;
    }
    size_t start = dir_name.find_last_not_of(DIR_DELIM);
    size_t end = start;

    while (start != 0 && start != std::string::npos && end != std::string::npos){
        start = dir_name.rfind(DIR_DELIM, end);
        if (start != std::string::npos){
            dirs.push_back(dir_name.substr(start + 1, end - start));
            end = dir_name.find_last_not_of(DIR_DELIM, start);
        }else{
            dirs.push_back(dir_name.substr(0, end + 1));
        }
    }

    if (dir_name.front() == DIR_DELIM){
        dirs.push_back(std::string(1, DIR_DELIM));
    }
    
    
    return dirs;
}


void FileSystem::set_current_dir(FileSystem::Directory *d){ 
    this->set_previous_dir();
    this->current_dir = d;
} 
void FileSystem::set_previous_dir(){
    this->previous_dir = this->current_dir;
}
FileSystem::Directory* FileSystem::find_dir_by_path(Directory* d, std::vector<std::string> dirs){ // returns directory if path valid
    std::string name = dirs.back();
    dirs.pop_back(); // remove name from dirs
    
    if (name == ".."){
        if (d->parent){ // if parent is not nullptr
            if (dirs.empty()){
                return d->parent;
            }else{
                return this->find_dir_by_path(d->parent, dirs);
            }
        }else{
            if (d == this->root.get()){
                return d; // is root
            }
            return nullptr; // no parent
        }
    }

    if (name == "."){
        if (dirs.empty()){
            return d; // this dir found
        }else{
            return this->find_dir_by_path(d, dirs);
        }
    }

    auto it = std::find_if(d->directories.begin(), d->directories.end(), [name] (std::unique_ptr<FileSystem::Directory> &dir){
        return dir->name == name;
    });

    if (it != d->directories.end()){ // if directory found
        if (dirs.empty()){
            return it->get(); // last dir found
        }else{
            return this->find_dir_by_path(it->get(), dirs);
        } 
    }

    return nullptr; // dir does not exist
}

FileSystem::Directory* FileSystem::get_dir(std::string path){
    std::vector<std::string> dirs = this->parse_path_name(path);
    FileSystem::Directory* d = nullptr;
 
    if (dirs.empty()){ // current dir
        d = this->current_dir;
    }else if (dirs.size() == 1 && dirs.back() == "/"){
        d = this->root.get();
    }else if (dirs.back() == "~" || dirs.back()== "$HOME"){
        dirs.pop_back();
        if (dirs.size() < 1){
            d = this->home;
        }else if (this->home){
            d = this->find_dir_by_path(this->home, dirs);
        }

    }else if (dirs.back() == "/"){
        dirs.pop_back();
        d = this->find_dir_by_path(this->root.get(), dirs);
    }else{ // relative dir, .., .
        d = this->find_dir_by_path(this->current_dir, dirs);
    }

    return d;

}


int FileSystem::chdir(std::string dir_name){
    std::vector<std::string> dirs = this->parse_path_name(dir_name);
    
    if (dirs.empty()){
        if (this->home){
            this->set_current_dir(this->home);
            return 0;
        }
        
        return 2; // home dir not set
    }
    if (dirs.size() == 1 && (dirs.back().find_first_of('.')) == std::string::npos){
        if (dirs.back() == "/"){
            this->set_current_dir(this->root.get());
            return 0;
        }else if(dirs.back() == "-"){
            if (this->previous_dir){
                this->set_current_dir(this->previous_dir);
                return 0;
            }
            return 3; // no previous dir
        }else if(dirs.back() == "~" || dirs.back()== "$HOME"){
            this->set_current_dir(this->home);
            return 0;
        }
    }
    FileSystem::Directory *d = nullptr;

    if(dirs.back() == "~" || dirs.back()== "$HOME"){
        dirs.pop_back();
        if (this->home){
            d = this->find_dir_by_path(this->home, dirs);
        }else{
            return 2; // home dir not set
        }

    }else if (dirs.back() == "/"){
        dirs.pop_back();
        d = this->find_dir_by_path(this->root.get(), dirs);
    }else{ // relative dir, .., .
        d = this->find_dir_by_path(this->current_dir, dirs);
    }
    
    

    if (d){
        this->set_current_dir(d);
        return 0;
    }
    
    
    return 1; // dir not found
}

std::vector<std::pair<std::string, char>> FileSystem::list_dir(std::string dir){
    std::vector<std::pair<std::string, char>> contents;
    auto d = this->get_dir(dir);
    if (d){
        for (auto &f : d->files){
            contents.push_back(std::make_pair(f->name + "." + f->extension_abbr, 'd'));
        }

        for (auto &d : d->directories){
            contents.push_back(std::make_pair(d->name, 'f'));
        }
        std::sort(contents.begin(), contents.end());
    }
    
    return contents;
}


std::vector<FileSystem::Directory*> FileSystem::list_directories(FileSystem::Directory* dir){
    std::vector<FileSystem::Directory*> contents;

    for (auto &d : dir->directories){
        contents.push_back(d.get());
    }
        std::sort(contents.begin(), contents.end());
    
    
    return contents;
}

std::vector<FileSystem::Directory::File*> FileSystem::list_files(FileSystem::Directory* dir){
    std::vector<FileSystem::Directory::File*> contents;

    for (auto &f : dir->files){
        contents.push_back(f.get());
    }
    
    
    return contents;
}

std::vector<std::string> FileSystem::find(std::string f){
    std::vector<std::string> files;
    return files;
}