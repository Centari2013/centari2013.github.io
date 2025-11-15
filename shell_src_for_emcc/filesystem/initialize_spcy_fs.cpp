#include "initialize_spcy_fs.h"

#include <algorithm>
#include <cctype>
#include <sstream>
#include <string>
#include <vector>

namespace {

std::string to_lower_copy(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char c) { return std::tolower(c); });
    return value;
}

std::string sanitize_path(std::string value) {
    if (value.empty()) {
        return value;
    }

    while (value.size() > 1 && value.back() == '/') {
        value.pop_back();
    }

    if (value.front() != '/') {
        value.insert(value.begin(), '/');
    }

    std::string normalized;
    normalized.reserve(value.size());
    bool previous_was_slash = false;
    for (char ch : value) {
        if (ch == '/') {
            if (!previous_was_slash) {
                normalized.push_back(ch);
                previous_was_slash = true;
            }
        } else {
            normalized.push_back(ch);
            previous_was_slash = false;
        }
    }

    return normalized;
}

std::string read_string(const emscripten::val& source, const char* key, const std::string& fallback = "") {
    if (source.isUndefined() || source.isNull() || !source.hasOwnProperty(key)) {
        return fallback;
    }
    emscripten::val candidate = source[key];
    auto type = candidate.typeOf().as<std::string>();
    if (type == "undefined" || (type == "object" && candidate.isNull())) {
        return fallback;
    }
    if (type == "string") {
        return candidate.as<std::string>();
    }
    if (type == "number") {
        std::ostringstream stream;
        stream << candidate.as<double>();
        return stream.str();
    }
    if (type == "boolean") {
        return candidate.as<bool>() ? "true" : "false";
    }
    return fallback;
}

bool read_bool(const emscripten::val& source, const char* key) {
    if (source.isUndefined() || source.isNull() || !source.hasOwnProperty(key)) {
        return false;
    }
    emscripten::val candidate = source[key];
    auto type = candidate.typeOf().as<std::string>();
    if (type == "boolean") {
        return candidate.as<bool>();
    }
    if (type == "number") {
        return candidate.as<double>() != 0.0;
    }
    return false;
}

bool val_is_array(const emscripten::val& value) {
    if (value.isUndefined() || value.isNull()) {
        return false;
    }
    return emscripten::val::global("Array").call<bool>("isArray", value);
}

std::string infer_role_from_name(const std::string& explicit_role, const std::string& name) {
    if (!explicit_role.empty()) {
        return to_lower_copy(explicit_role);
    }
    return to_lower_copy(name);
}

void reset_system_pointers(FileSystem* fs) {
    if (!fs) {
        return;
    }
    fs->set_home_dir_ptr(nullptr);
    fs->set_desktop_dir_ptr(nullptr);
    fs->set_documents_dir_ptr(nullptr);
    fs->set_downloads_dir_ptr(nullptr);
    fs->set_pictures_dir_ptr(nullptr);
}

void assign_directory_role(FileSystem* fs, FileSystem::Directory* dir, const std::string& role, std::vector<std::string>& path_entries) {
    if (!fs || !dir || role.empty()) {
        return;
    }

    const auto normalized = to_lower_copy(role);
    if (normalized == "home") {
        fs->set_home_dir_ptr(dir);
    } else if (normalized == "desktop") {
        fs->set_desktop_dir_ptr(dir);
    } else if (normalized == "documents") {
        fs->set_documents_dir_ptr(dir);
    } else if (normalized == "downloads") {
        fs->set_downloads_dir_ptr(dir);
    } else if (normalized == "pictures" || normalized == "images") {
        fs->set_pictures_dir_ptr(dir);
    }

    if (normalized == "bin" || normalized == "sbin" || normalized == "usr/bin" || normalized == "usr/sbin") {
        path_entries.push_back(sanitize_path(fs->get_dir_path(dir)));
    }
}

bool entry_is_directory(const emscripten::val& entry) {
    if (entry.isUndefined() || entry.isNull()) {
        return false;
    }

    if (entry.hasOwnProperty("type")) {
        const auto type_value = to_lower_copy(read_string(entry, "type"));
        if (type_value == "d" || type_value == "directory" || type_value == "folder") {
            return true;
        }
        if (type_value == "f" || type_value == "file") {
            return false;
        }
    }

    const auto kind_value = to_lower_copy(read_string(entry, "kind"));
    if (kind_value == "folder" || kind_value == "directory") {
        return true;
    }

    if (entry.hasOwnProperty("entries")) {
        const auto& child_entries = entry["entries"];
        if (val_is_array(child_entries) && child_entries["length"].as<unsigned>() > 0) {
            return true;
        }
    }

    return false;
}

void populate_entries(FileSystem* fs, FileSystem::Directory* parent, const emscripten::val& entries_val, std::vector<std::string>& path_entries);

void hydrate_folder(FileSystem* fs, FileSystem::Directory* parent, const emscripten::val& folder_val, std::vector<std::string>& path_entries) {
    if (!fs || !parent) {
        return;
    }

    const auto folder_name = read_string(folder_val, "name", "Folder");
    auto* directory = fs->create_directory(parent, folder_name);
    if (!directory) {
        return;
    }

    fs->clear_directory(directory);

    const auto explicit_role = read_string(folder_val, "role", read_string(folder_val, "systemRole"));
    const auto inferred_role = infer_role_from_name(explicit_role, folder_name);
    if (!inferred_role.empty()) {
        assign_directory_role(fs, directory, inferred_role, path_entries);
    }

    if (folder_val.hasOwnProperty("entries")) {
        populate_entries(fs, directory, folder_val["entries"], path_entries);
    }
}

void hydrate_file(FileSystem* fs, FileSystem::Directory* parent, const emscripten::val& file_val) {
    if (!fs || !parent) {
        return;
    }
    const auto name = read_string(file_val, "name", "File");
    auto extension = read_string(file_val, "exten");
    if (extension.empty()) {
        extension = read_string(file_val, "extension");
    }
    const auto content = read_string(file_val, "content");
    const auto explicit_mode = to_lower_copy(read_string(file_val, "contentMode"));
    const auto kind = to_lower_copy(read_string(file_val, "kind"));
    const auto launch_mode = to_lower_copy(read_string(file_val, "launch"));

    const bool is_shortcut = read_bool(file_val, "is_shortcut") || kind == "shortcut";
    const bool is_link = read_bool(file_val, "is_link") || kind == "link" || launch_mode == "browser" || explicit_mode == "url";

    fs->create_file(parent, name, extension, content, is_shortcut, is_link);
}

void populate_entries(FileSystem* fs, FileSystem::Directory* parent, const emscripten::val& entries_val, std::vector<std::string>& path_entries) {
    if (!fs || !parent || !val_is_array(entries_val)) {
        return;
    }

    const auto length = entries_val["length"].as<unsigned>();
    for (unsigned i = 0; i < length; ++i) {
        auto entry = entries_val[i];
        if (entry_is_directory(entry)) {
            hydrate_folder(fs, parent, entry, path_entries);
        } else {
            hydrate_file(fs, parent, entry);
        }
    }
}

} // namespace

std::shared_ptr<FileSystem> create_spicy_linux_filesystem() {
    std::shared_ptr<FileSystem> fs = std::make_shared<FileSystem>(FileSystem("Spicy Linux", "/"));
    auto root = fs->get_root_dir_ptr();

    auto home = std::make_unique<FileSystem::Directory>("home", root);
    auto user = std::make_unique<FileSystem::Directory>("SpicyKneecaps", home.get());
    auto desktop = std::make_unique<FileSystem::Directory>("Desktop", user.get());
    fs->set_desktop_dir_ptr(desktop.get());
    user->directories.push_back(std::move(desktop));

    fs->set_home_dir_ptr(user.get());
    home->directories.push_back(std::move(user));
    root->directories.push_back(std::move(home));

    fs->chdir("/");

    return fs;
}

void build_filesystem_from_manifest(std::shared_ptr<FileSystem> fs, const emscripten::val& manifest_entries) {
    if (!fs) {
        return;
    }
    auto root = fs->get_root_dir_ptr();
    if (!root) {
        return;
    }

    fs->clear_directory(root);
    reset_system_pointers(fs.get());

    std::vector<std::string> path_entries;
    if (val_is_array(manifest_entries)) {
        populate_entries(fs.get(), root, manifest_entries, path_entries);
    }

    if (!path_entries.empty()) {
        fs->PATH = path_entries.front();
        for (size_t i = 1; i < path_entries.size(); ++i) {
            fs->PATH.append(":").append(path_entries[i]);
        }
    } else {
        fs->PATH.clear();
    }

    if (auto* home = fs->get_home_dir_ptr()) {
        fs->chdir(fs->get_dir_path(home));
    } else {
        fs->chdir("/");
    }
}
