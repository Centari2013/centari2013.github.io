#include "initialize_spcy_fs.h"

#include <algorithm>
#include <cctype>
#include <string>
#include <utility>
#include <vector>

namespace {

using Directory = FileSystem::Directory;
using File = FileSystem::Directory::File;

bool is_nullish(const emscripten::val &value) {
    return value.isUndefined() || value.isNull();
}

bool has_property(const emscripten::val &object, const std::string &property) {
    if (is_nullish(object)) {
        return false;
    }
    return object.call<bool>("hasOwnProperty", property);
}

std::string to_lower(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char ch) {
        return static_cast<char>(std::tolower(ch));
    });
    return value;
}

std::string read_string(const emscripten::val &object, const std::string &property, const std::string &fallback = "") {
    if (!has_property(object, property)) {
        return fallback;
    }

    emscripten::val value = object[property];
    if (is_nullish(value)) {
        return fallback;
    }

    return value.as<std::string>();
}

bool is_array(const emscripten::val &value) {
    if (is_nullish(value)) {
        return false;
    }
    return emscripten::val::global("Array").call<bool>("isArray", value);
}

unsigned array_length(const emscripten::val &value) {
    if (!is_array(value)) {
        return 0;
    }
    return value["length"].as<unsigned>();
}

void register_role(FileSystem &fs, const std::string &role, Directory *dir) {
    if (!dir || role.empty()) {
        return;
    }

    if (role == "home") {
        fs.set_home_dir_ptr(dir);
        return;
    }

    if (role == "downloads") {
        fs.set_downloads_dir_ptr(dir);
        return;
    }

    if (role == "pictures") {
        fs.set_pictures_dir_ptr(dir);
        return;
    }

    if (role == "documents") {
        fs.set_documents_dir_ptr(dir);
        return;
    }

    if (role == "desktop") {
        fs.set_desktop_dir_ptr(dir);
        return;
    }

    if (role == "bin") {
        const std::string path = fs.get_dir_path(dir);
        if (!fs.PATH.empty()) {
            fs.PATH.append(":");
        }
        fs.PATH.append(path);
    }
}

std::shared_ptr<File> buildFile(const emscripten::val &entry) {
    std::string name = read_string(entry, "name");
    if (name.empty()) {
        return nullptr;
    }

    std::string extension = read_string(entry, "extension");
    std::string content = read_string(entry, "content");

    if (content.empty() && has_property(entry, "asset")) {
        const emscripten::val asset = entry["asset"];
        content = read_string(asset, "url");
    }

    auto file = std::make_shared<File>(name, extension, content);
    const std::string kind = to_lower(read_string(entry, "kind", "file"));

    if (kind == "link") {
        file->is_link = true;
    } else if (kind == "shortcut") {
        file->is_shortcut = true;
    }

    return file;
}

Directory *buildFolder(FileSystem &fs, const emscripten::val &folder_json, Directory *parent);

void buildEntries(FileSystem &fs, Directory *target, const emscripten::val &entries) {
    if (!target || !is_array(entries)) {
        return;
    }

    const unsigned length = array_length(entries);
    for (unsigned i = 0; i < length; ++i) {
        const emscripten::val entry = entries[i];
        const std::string type = read_string(entry, "_type");

        if (type == "remoteFolder") {
            buildFolder(fs, entry, target);
        } else if (type == "portfolioEntry") {
            auto file = buildFile(entry);
            if (file) {
                target->files.push_back(std::move(file));
            }
        }
    }
}

Directory *buildFolder(FileSystem &fs, const emscripten::val &folder_json, Directory *parent) {
    if (!parent) {
        return nullptr;
    }

    const std::string name = read_string(folder_json, "name", "untitled");
    auto dir = std::make_unique<Directory>(name, parent);
    Directory *dir_ptr = dir.get();
    parent->directories.push_back(std::move(dir));

    const std::string role = to_lower(read_string(folder_json, "role"));
    register_role(fs, role, dir_ptr);

    if (has_property(folder_json, "entries")) {
        buildEntries(fs, dir_ptr, folder_json["entries"]);
    }

    return dir_ptr;
}

void apply_desktop_manifest(FileSystem &fs, const emscripten::val &manifest) {
    Directory *desktop = fs.get_desktop_dir_ptr();
    if (!desktop || !has_property(manifest, "desktop")) {
        return;
    }

    buildEntries(fs, desktop, manifest["desktop"]);
}

} // namespace

std::shared_ptr<FileSystem> create_spicy_linux_filesystem() {
    auto fs = std::make_shared<FileSystem>("Spicy Linux", "/");
    fs->PATH.clear();
    return fs;
}

void loadFilesystemFromManifest(std::shared_ptr<FileSystem> fs, const emscripten::val &manifest_json) {
    if (!fs) {
        return;
    }

    Directory *root = fs->get_root_dir_ptr();
    if (!root) {
        return;
    }

    root->files.clear();
    root->directories.clear();

    fs->set_home_dir_ptr(nullptr);
    fs->set_downloads_dir_ptr(nullptr);
    fs->set_pictures_dir_ptr(nullptr);
    fs->set_documents_dir_ptr(nullptr);
    fs->set_desktop_dir_ptr(nullptr);
    fs->PATH.clear();

    if (has_property(manifest_json, "root")) {
        const emscripten::val root_meta = manifest_json["root"];
        const std::string root_name = read_string(root_meta, "name", root->name);
        if (!root_name.empty()) {
            root->name = root_name;
        }
    }

    if (has_property(manifest_json, "filesystem")) {
        const emscripten::val entries = manifest_json["filesystem"];
        if (is_array(entries)) {
            const unsigned length = array_length(entries);
            for (unsigned i = 0; i < length; ++i) {
                const emscripten::val entry = entries[i];
                const std::string type = read_string(entry, "_type");
                if (type == "remoteFolder") {
                    buildFolder(*fs, entry, root);
                } else if (type == "portfolioEntry") {
                    auto file = buildFile(entry);
                    if (file) {
                        root->files.push_back(std::move(file));
                    }
                }
            }
        }
    }

    apply_desktop_manifest(*fs, manifest_json);

    Directory *home = fs->get_home_dir_ptr();
    if (!home) {
        home = root;
    }
    fs->set_current_dir(home);
}
