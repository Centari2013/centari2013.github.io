#include "initialize_spcy_fs.h"

#include <algorithm>
#include <cctype>
#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace {

using Directory = FileSystem::Directory;
using File = FileSystem::Directory::File;

struct PendingShortcut {
    std::weak_ptr<File> shortcut;
    std::string target_path;
};

std::vector<PendingShortcut> pending_shortcuts;

std::string trim_copy(std::string value) {
    auto is_space = [](unsigned char ch) {
        return std::isspace(ch) != 0;
    };

    value.erase(value.begin(), std::find_if(value.begin(), value.end(), [&](unsigned char ch) {
        return !is_space(ch);
    }));

    value.erase(std::find_if(value.rbegin(), value.rend(), [&](unsigned char ch) {
        return !is_space(ch);
    }).base(), value.end());

    return value;
}

std::string normalize_path(std::string value) {
    value = trim_copy(std::move(value));
    if (value.empty()) {
        return value;
    }

    std::replace(value.begin(), value.end(), '\\', '/');
    return value;
}

struct FilePathParts {
    std::string directory;
    std::string filename;
    std::string extension;
};

FilePathParts parse_file_path(const std::string &path) {
    FilePathParts parts;
    const std::string normalized = normalize_path(path);
    if (normalized.empty()) {
        return parts;
    }

    const auto slash_pos = normalized.find_last_of('/');
    if (slash_pos == std::string::npos) {
        parts.directory = "/";
        parts.filename = normalized;
    } else {
        parts.directory = normalized.substr(0, slash_pos);
        parts.filename = normalized.substr(slash_pos + 1);
        if (parts.directory.empty()) {
            parts.directory = "/";
        }
    }

    if (parts.filename.empty()) {
        return parts;
    }

    const auto dot_pos = parts.filename.find_last_of('.');
    if (dot_pos != std::string::npos && dot_pos != 0 && dot_pos < parts.filename.size() - 1) {
        parts.extension = parts.filename.substr(dot_pos + 1);
        parts.filename = parts.filename.substr(0, dot_pos);
    }

    return parts;
}

std::shared_ptr<File> find_file_in_directory(Directory *dir, const std::string &name, const std::string &extension) {
    if (!dir || name.empty()) {
        return nullptr;
    }

    if (!extension.empty()) {
        for (auto &candidate : dir->files) {
            if (candidate && candidate->name == name && candidate->extension == extension) {
                return candidate;
            }
        }
        return nullptr;
    }

    for (auto &candidate : dir->files) {
        if (candidate && candidate->name == name && candidate->extension.empty()) {
            return candidate;
        }
    }

    std::shared_ptr<File> unique_match;
    for (auto &candidate : dir->files) {
        if (candidate && candidate->name == name) {
            if (unique_match) {
                return nullptr;
            }
            unique_match = candidate;
        }
    }
    return unique_match;
}

std::shared_ptr<File> find_file_by_path(FileSystem &fs, const std::string &path) {
    const FilePathParts parts = parse_file_path(path);
    if (parts.filename.empty()) {
        return nullptr;
    }

    Directory *dir = nullptr;
    if (parts.directory.empty() || parts.directory == ".") {
        dir = fs.get_root_dir_ptr();
    } else {
        dir = fs.get_dir(parts.directory);
    }

    if (!dir) {
        return nullptr;
    }

    return find_file_in_directory(dir, parts.filename, parts.extension);
}

void register_pending_shortcut(const std::shared_ptr<File> &shortcut, const std::string &target_path) {
    if (!shortcut) {
        return;
    }

    const std::string sanitized = normalize_path(target_path);
    if (sanitized.empty()) {
        return;
    }

    pending_shortcuts.push_back(PendingShortcut{shortcut, sanitized});
}

void log_shortcut_warning(const std::string &target_path) {
    emscripten::val::global("console").call<void>("warn", std::string("[filesystem] Unable to resolve shortcut target: ") + target_path);
}

void resolve_pending_shortcuts(FileSystem &fs) {
    for (const auto &pending : pending_shortcuts) {
        auto shortcut = pending.shortcut.lock();
        if (!shortcut) {
            continue;
        }

        auto target = find_file_by_path(fs, pending.target_path);
        if (target) {
            shortcut->shortcut_target = target;
        } else {
            log_shortcut_warning(pending.target_path);
        }
    }

    pending_shortcuts.clear();
}

bool has_file(const Directory *dir, const std::string &name, const std::string &extension) {
    if (!dir) {
        return false;
    }

    return std::any_of(dir->files.begin(), dir->files.end(), [&](const auto &existing) {
        if (!existing) {
            return false;
        }
        return existing->name == name && existing->extension == extension;
    });
}

void append_file_unique(Directory *dir, std::shared_ptr<File> file) {
    if (!dir || !file) {
        return;
    }

    if (has_file(dir, file->name, file->extension)) {
        return;
    }

    dir->files.push_back(std::move(file));
}

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
        std::string target_path = read_string(entry, "shortcutTargetPath");
        if (target_path.empty()) {
            target_path = read_string(entry, "shortcut_target_path");
        }
        register_pending_shortcut(file, target_path);
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
                append_file_unique(target, std::move(file));
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

    pending_shortcuts.clear();

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
                        append_file_unique(root, std::move(file));
                    }
                }
            }
        }
    }

    apply_desktop_manifest(*fs, manifest_json);

    resolve_pending_shortcuts(*fs);

    Directory *home = fs->get_home_dir_ptr();
    if (home) {
        fs->chdir("~");
    } else {
        fs->chdir("/");
    }
}
