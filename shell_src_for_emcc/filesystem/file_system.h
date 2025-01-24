/**
 * @file file_system.h
 * @author Zaria Burton (zaria.burton2000@gmail.com)
 * @brief Defines the FileSystem class, a simple representation of a filesystem.
 * @date 2024-12-23
 * 
 * 
 */


//TODO: REFACTOR CODE FOR PROPER PUBLIC GETTERS AND SETTERS.
//TODO: ADD NAME COLLISON RESOLUTION FOR FILES/DIRECTORIES WITH SAME NAME.

#ifndef FILE_SYSTEM
#define FILE_SYSTEM

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <utility>


/**
 * @class FileSystem 
 * @brief A class that simulates a filesystem with directories and files.
 * @details This class provides methods for creating, navigating, and listing directories
 * and files. It uses a hierarchial tree structure that supports nested directories.
 */
class FileSystem {
public:
    
    /**
     * @struct FileSystem::Directory
     * @brief Represents a directory in the filesystem.
     * 
     */
    struct Directory {
        /**
         * @struct FileSystem::Directory::File
         * @brief Represents a file in a directory.
         * 
         */
        struct File {
            std::string name; /** Name of the file. */
            std::string extension_abbr; /** File extension abbreviation. */
            std::string content; /** File content. */

            /**
             * @brief Construct a new File object with the specified name.
             * 
             * @param name 
             * @param extension_abbr
             */
            File(const std::string &name, const std::string &extension_abbr, const std::string &content=""): 
                name(name), extension_abbr(extension_abbr), content(content) {}; 
            std::string get_name() const { return name; }
            std::string get_extension_abbr() const { return extension_abbr; };
            std::string get_content() const { return content; };
        };

        std::string name; /** Name of the directory. */

        /**
         * @brief A vector of files within the directory.
         * @details Each file is represented as a smart pointer to that 
         * file's object for proper memory management.
         * 
         */
        std::vector<std::unique_ptr<File>> files;

        /**
         * @brief A vector of directory of directories with in the directory.
         * @details Each directory is represented as a smart pointer to that 
         * file's object for proper memory management.
         * 
         */
        std::vector<std::unique_ptr<Directory>> directories; 

        /**
         * @brief A pointer to the directory's parent.
         * @details Allows traversal up the filesystem tree. Is 'nullptr' for the root directory.
         */
        Directory *parent;

        /**
         * @brief Constructs a new Directory object.
         * 
         * @param name Name of the directory
         * @param parent Pointer to the parent directory. Pass 'nullptr' if this is the root.
         */
        Directory(const std::string& name, Directory* parent): name(name), parent(parent) {};


        std::string get_name() const { return name; }
    };
    

    std::string name; /** Name of the filesystem. */

    

    /**
     * @brief A pointer to the home directory.
     * @details An optional pointer to the home directory. It MUST have a parent 
     * directory for proper file system traversal. (Plans to possibly make private.)
     */
    
    

    /**
     * @brief A string containing the filesystem's paths.
     * @details Each path is delimited by ':'. Functionality relating to PATH
     * has not yet been implemented.
     */
    std::string PATH;

    void set_home_dir_ptr(Directory* p);
    void set_downloads_dir_ptr(Directory* p);
    void set_pictures_dir_ptr(Directory* p);
    void set_documents_dir_ptr(Directory* p);
    void set_desktop_dir_ptr(Directory *p);

    Directory* get_home_dir_ptr() const;
    Directory* get_downloads_dir_ptr() const;
    Directory* get_pictures_dir_ptr() const;
    Directory* get_root_dir_ptr() const;
    Directory* get_documents_dir_ptr() const;
    Directory* get_desktop_dir_ptr() const;

    /**
     * @brief Sets the home directory.
     * 
     * @param dir A pointer to a directory object.
     */
    void set_home_dir(Directory* dir);

    /**
     * @brief Gets the home directory path.
     * 
     * @return Returns a string to home directory.
     * @details The format of the string is '/dir/dir1/home...'.
     */
    std::string get_home_dir();

    /**
     * @brief Gets the current working directory.
     * 
     * @return Returns a string to the current working directory. 
     * @details The format of the string is '/dir/dir1/home...'.
     */
    std::string get_cwd();

    /**
     * @brief Changes the current working directory.
     * 
     * @param dir_name A valid path to a directory. Works similarly to POSIX compliant shells.
     * @return Returns an int indicating success. 
     * @details Returns codes: 0=directory succesfully changes, 1=directory not found, 2=home directory not set,
     * 3=no previous directory
     * 
     */
    int chdir(std::string dir_name);

    /**
     * @brief Lists all current files and directories in the current working directory.
     * 
     * @param dir A valid path to a directory.
     * @return Returns a vector of (string, char) pairs (dir_name, 'd') or (file_name, 'f') in alphabetic order.
     */
    std::vector<std::pair<std::string, char>> list_dir(std::string dir);

    /**
     * @brief Lists all current directories in the current working directory.
     * 
     * @param dir A valid pointer to a directory.
     * @return Returns a vector in alphabetic order.
     */
    std::vector<Directory*>list_directories(Directory* dir);

    /**
     * @brief Lists all current files in the current working directory.
     * 
     * @param dir A valid pointer to a directory.
     * @return Returns a vector in alphabetic order.
     */
    std::vector<Directory::File*> list_files(Directory* dir);
   

    /**
     * @brief NOT IMPLEMENTED
     * 
     * @param f NOTIMPLEMENTED
     * @return NOT IMPLEMENTED
     */
    std::vector<std::string> find(std::string f);

    /**
     * @brief Gets a directory object based on its path.
     * 
     * @param path A valid path to a directory.
     * @return Directory* A pointer to the directory matching the path.
     */
    Directory* get_dir(std::string path);

    /**
     * @brief Constructs a new FileSystem object.
     * 
     * @param name The name of the filesystem.
     * @param root_name The name of the root directory. Defaults to '/'.
     */
    FileSystem(const std::string &name, const std::string&root_name);

    /**
     * @brief Gets the string path based on a directory pointer.
     * 
     * @param d FileSystem::directory object pointer 
     * @return A string with the path name
     */
    std::string get_dir_path(Directory *d); 

private:

    Directory* home; /** Pointer to home directory. */
    Directory* downloads; /** Pointer to downloads directory. */
    Directory* pictures; /** Pointer to picures directory. */
    Directory* documents; /** Pointer to documents directory. */
    Directory* desktop; /** Pointer to desktop directory. */


    Directory *current_dir; /** Pointer to current working directory. */
    Directory *previous_dir; /** Pointer to previous directory. */
    const char DIR_DELIM = '/'; /** Filepath delimeter. */

    void set_current_dir(Directory *d); /** Sets the current directory. */
    void set_previous_dir(); /** Sets the previous directory. */
    Directory* find_dir_by_path(Directory *d, std::vector<std::string> dirs); /** Recursively searches for directory based on parsed path name. */
    std::vector<std::string> parse_path_name(const std::string &dir_name); /** Breaks pathname into a vector of tokens. */

    /**
     * @brief A smart pointer to the root directory. 
     * @details A required pointer to the root directory of the filesystem.
     * Automatically created by FileSystem. 
     */
    std::unique_ptr<Directory> root;
};
#endif //FILE_SYSTEM