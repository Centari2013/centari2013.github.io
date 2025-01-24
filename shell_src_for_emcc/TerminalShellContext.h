#ifndef TERMINAL_SHELL_CONTEXT
#define TERMINAL_SHELL_CONTEXT

#include <string>
#include <map>
#include <functional>
#include <vector>
#include <iostream>
#include <iomanip>
#include <cstdlib>
#include <unistd.h>
#include <sys/wait.h>
#include <algorithm>
#include <memory>
#include <sstream>

#include <emscripten/bind.h>
#include <emscripten.h>

#include "filesystem/file_system.h"



class TerminalShellContext {
public:
    void process_command(std::string command);
    void set_terminal(emscripten::val terminal);
    TerminalShellContext(std::shared_ptr<FileSystem> f);
private:
    emscripten::val js_terminal;
    std::shared_ptr<FileSystem> fs;
    const std::string WHITE_SPACE = "   \t\r\n";

    void write_to_terminal(std::string text);
    void trim(std::string &line);
    std::string pop_last_word(std::string &line);
    std::vector<std::string> parse_command(std::string& command);
    int end(std::vector<std::string>& args);
    int echo(std::vector<std::string>& words);
    std::vector<std::string> split_by_delimiter(std::string s, std::string d);
    //std::string exists_on_path(std::string s);
    int type(std::vector<std::string>& func_name);
    int pwd(std::vector<std::string>& ignore);
    int cd(std::vector<std::string>& dir);
    int list_files(std::vector<std::string>& dir);
    void print_tree(FileSystem::Directory* d, const std::string& prefix, bool is_last);
    int tree(std::vector<std::string>& dir);
    int help(std::vector<std::string>& args);
    int man(std::vector<std::string>& args);

    struct Command_Info {
        std::string type;
        std::function<int(std::vector<std::string>&)> handler;

        // Constructor with default value for `type`
        Command_Info(std::function<int(std::vector<std::string>&)> func, const std::string type = "builtin")
            : handler(func), type(type) {}
    };
    const std::map<std::string, Command_Info> COMMAND_MAP = {
        {"exit", Command_Info(std::bind(&TerminalShellContext::end, this, std::placeholders::_1))},
        {"echo", Command_Info(std::bind(&TerminalShellContext::echo, this, std::placeholders::_1))},
        {"type", Command_Info(std::bind(&TerminalShellContext::type, this, std::placeholders::_1))},
        {"pwd", Command_Info(std::bind(&TerminalShellContext::pwd, this, std::placeholders::_1))},
        {"cd", Command_Info(std::bind(&TerminalShellContext::cd, this, std::placeholders::_1))},
        {"ls", Command_Info(std::bind(&TerminalShellContext::list_files, this, std::placeholders::_1))},
        {"tree", Command_Info(std::bind(&TerminalShellContext::tree, this, std::placeholders::_1))},
        {"help", Command_Info(std::bind(&TerminalShellContext::help, this, std::placeholders::_1))},
        {"man", Command_Info(std::bind(&TerminalShellContext::man, this, std::placeholders::_1))}
    }; // map of valid commands and their functions
};


#endif //TERMINAL_SHELL_CONTEXT