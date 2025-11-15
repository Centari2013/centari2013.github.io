#include "initialize_spcy_fs.h"


std::shared_ptr<FileSystem> create_spicy_linux_filesystem() {
    std::shared_ptr<FileSystem> fs = std::make_shared<FileSystem>(FileSystem("Spicy Linux", "/"));
    fs->PATH.append("/bin");

    auto root = fs->get_root_dir_ptr();

    // Keep familiar top-level directories so commands like `cd /bin` keep working,
    // but leave their contents empty so Sanity can fully define the runtime tree.
    root->directories.push_back(std::make_unique<FileSystem::Directory>("bin", root));
    root->directories.push_back(std::make_unique<FileSystem::Directory>("etc", root));
    root->directories.push_back(std::make_unique<FileSystem::Directory>("usr", root));
    root->directories.push_back(std::make_unique<FileSystem::Directory>("var", root));

    auto home = std::make_unique<FileSystem::Directory>("home", root);
    auto user = std::make_unique<FileSystem::Directory>("SpicyKneecaps", home.get());

    auto documents = std::make_unique<FileSystem::Directory>("Documents", user.get());
    fs->set_documents_dir_ptr(documents.get());
    user->directories.push_back(std::move(documents));

    auto downloads = std::make_unique<FileSystem::Directory>("Downloads", user.get());
    fs->set_downloads_dir_ptr(downloads.get());
    user->directories.push_back(std::move(downloads));

    auto desktop = std::make_unique<FileSystem::Directory>("Desktop", user.get());
    fs->set_desktop_dir_ptr(desktop.get());
    user->directories.push_back(std::move(desktop));

    auto pictures = std::make_unique<FileSystem::Directory>("Pictures", user.get());
    fs->set_pictures_dir_ptr(pictures.get());
    user->directories.push_back(std::move(pictures));

    home->directories.push_back(std::move(user));
    fs->set_home_dir_ptr(home.get());
    root->directories.push_back(std::move(home));

    // Set the home directory as the current working directory
    fs->chdir("");

    return fs;
}
