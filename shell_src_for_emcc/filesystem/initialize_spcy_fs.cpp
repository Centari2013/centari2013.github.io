#include "initialize_spcy_fs.h"


std::shared_ptr<FileSystem> create_spicy_linux_filesystem() {
    std::shared_ptr<FileSystem> fs = std::make_shared<FileSystem>(FileSystem("Spicy Linux", "/"));
    fs->PATH.append("/bin");

    // Root directory
    auto root = fs->get_root_dir_ptr();

    // /bin: Essential binaries
    auto bin = std::make_unique<FileSystem::Directory>("bin", root);
    bin->files.push_back(std::make_unique<FileSystem::Directory::File>("ls", "", ls_txt_data()));
    //bin->files.push_back(std::make_unique<FileSystem::Directory::File>("cp", ""));
    //bin->files.push_back(std::make_unique<FileSystem::Directory::File>("mv", ""));
    //bin->files.push_back(std::make_unique<FileSystem::Directory::File>("cat", ""));
    bin->files.push_back(std::make_unique<FileSystem::Directory::File>("echo", "", echo_txt_data()));
    root->directories.push_back(std::move(bin));

    // /etc: System configuration files
    auto etc = std::make_unique<FileSystem::Directory>("etc", root);
    etc->files.push_back(std::make_unique<FileSystem::Directory::File>("passwd", "", passwd_txt_data()));
    etc->files.push_back(std::make_unique<FileSystem::Directory::File>("shadow", "", shadow_txt_data()));
    etc->files.push_back(std::make_unique<FileSystem::Directory::File>("hostname", "", hostname_txt_data()));
    root->directories.push_back(std::move(etc));

    // /home: User directories
    auto home = std::make_unique<FileSystem::Directory>("home", root);

    // User 1 directory
    auto user1 = std::make_unique<FileSystem::Directory>("SpicyKneecaps", home.get());
    auto user1_docs = std::make_unique<FileSystem::Directory>("Documents", user1.get());
    fs->set_documents_dir_ptr(user1_docs.get());
    user1_docs->files.push_back(std::make_unique<FileSystem::Directory::File>("Resume", "md", resume_md_data()));
    user1->directories.push_back(std::move(user1_docs));

    auto user1_downloads = std::make_unique<FileSystem::Directory>("Downloads", user1.get());
    fs->set_downloads_dir_ptr(user1_downloads.get());
    //user1_downloads->files.push_back(std::make_unique<FileSystem::Directory::File>("setup.exe"));
    //user1_downloads->files.push_back(std::make_unique<FileSystem::Directory::File>("movie.mp4"));
    user1->directories.push_back(std::move(user1_downloads));

    auto user1_desktop = std::make_unique<FileSystem::Directory>("Desktop", user1.get());
    fs->set_desktop_dir_ptr(user1_desktop.get());
    user1_desktop->files.push_back(std::make_unique<FileSystem::Directory::File>("README", "md", about_me_md_data()));
    user1->directories.push_back(std::move(user1_desktop));

    auto user1_pictures = std::make_unique<FileSystem::Directory>("Pictures", user1.get());
    fs->set_pictures_dir_ptr(user1_pictures.get());
    user1_pictures->files.push_back(std::make_unique<FileSystem::Directory::File>("mel-makeup", "jpeg", mel_cosplay_makeup_jpeg_data()));
    user1_pictures->files.push_back(std::make_unique<FileSystem::Directory::File>("hiiii", "jpeg", hiiii_jpeg_data()));
    user1_pictures->files.push_back(std::make_unique<FileSystem::Directory::File>("its-a-me", "jpeg", its_a_me_jpeg_data()));
    user1->directories.push_back(std::move(user1_pictures));

    home->directories.push_back(std::move(user1));

    // User 2 directory
    /*
    auto user2 = std::make_unique<FileSystem::Directory>("user2", home.get());
    auto user2_docs = std::make_unique<FileSystem::Directory>("Documents", user2.get());
    user2_docs->files.push_back(std::make_unique<FileSystem::Directory::File>("budget.xlsx"));
    user2_docs->files.push_back(std::make_unique<FileSystem::Directory::File>("recipe.txt"));
    user2->directories.push_back(std::move(user2_docs));
    
    auto user2_music = std::make_unique<FileSystem::Directory>("Music", user2.get());
    user2_music->files.push_back(std::make_unique<FileSystem::Directory::File>("song1.mp3"));
    user2_music->files.push_back(std::make_unique<FileSystem::Directory::File>("song2.mp3"));
    user2->directories.push_back(std::move(user2_music));

    home->directories.push_back(std::move(user2));
    */
    fs->set_home_dir_ptr(home.get());
    root->directories.push_back(std::move(home));

    // /var: Variable data files
    auto var = std::make_unique<FileSystem::Directory>("var", root);
    var->files.push_back(std::make_unique<FileSystem::Directory::File>("log", "", log_txt_data()));
    var->files.push_back(std::make_unique<FileSystem::Directory::File>("cache", "", cache_txt_data()));
    var->files.push_back(std::make_unique<FileSystem::Directory::File>("tmp", "", tmp_txt_data()));
    root->directories.push_back(std::move(var));

    // /usr: User applications
    auto usr = std::make_unique<FileSystem::Directory>("usr", root);
    auto usr_bin = std::make_unique<FileSystem::Directory>("bin", usr.get());
    usr_bin->files.push_back(std::make_unique<FileSystem::Directory::File>("python3", "", python3_txt_data()));
    usr_bin->files.push_back(std::make_unique<FileSystem::Directory::File>("gcc", "", gcc_txt_data()));
    usr->directories.push_back(std::move(usr_bin));
    root->directories.push_back(std::move(usr));

    // Set the home directory as the current working directory
    fs->chdir("");

    return fs;
}
