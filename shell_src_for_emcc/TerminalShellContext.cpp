#include "TerminalShellContext.h"


TerminalShellContext::TerminalShellContext(std::shared_ptr<FileSystem> f) {
    this->fs = std::move(f);
    this->js_terminal = emscripten::val::undefined();
}

void TerminalShellContext::set_terminal(emscripten::val terminal) {
    this->js_terminal = terminal;
}

// Function to write to the terminal
void TerminalShellContext::write_to_terminal(std::string text) {
    if (!this->js_terminal.isUndefined()) {
        this->js_terminal.call<void>("write", text); // Call the terminal's write method
    }
}

void TerminalShellContext::trim(std::string &line){

    auto val = line.find_last_not_of(this->WHITE_SPACE);
    if (val == std::string::npos) {
        line.clear();
        return;
    }
    val += 1;

    if(val == line.size() || val == std::string::npos){
        val = line.find_first_not_of(WHITE_SPACE);
        line = line.substr(val);
    }
    else
        line.erase(val);
}

std::string TerminalShellContext::pop_last_word(std::string &line) {
    trim(line);

    if (line.empty()) {
        return "";
    }


    // check for quoted word starting at end
    if (line.back() == '"' || line.back() == '\'') {
        char quote = line.back(); // store type of quote
        size_t end_pos = line.size() - 1;
        size_t start_pos = line.rfind(quote, end_pos - 1); // find matching starting quote

        if (start_pos != std::string::npos) {
            std::string quoted_word = line.substr(start_pos + 1, end_pos - start_pos - 1); // extract word within quotes
            line.erase(start_pos); // remove quoted part and quotes from line
            trim(line);

            return quoted_word;
        } else {
            // unmatched quote, return raw text
            std::cerr << "Error: Unmatched quote in input!" << std::endl;
            std::string word = line;
            line.clear();
            return word;
        }
    }

    // TODO: check for backslashes
    
    

    // Handle unquoted word
    size_t pos = line.find_last_of(WHITE_SPACE);
    std::string word;

    if (pos == std::string::npos) {
        word = line; // The entire line is one word
        line.clear();
    } else {
        word = line.substr(pos + 1); // Extract the last word
        line.erase(pos); // Remove the last word from the line
    }

    trim(line); // Clean up the remaining line
    return word;
}



std::vector<std::string> TerminalShellContext::parse_command(std::string& command){ // stores arguments in reverse in vector
    std::vector<std::string> args;
    while (!command.empty()){
        args.push_back(pop_last_word(command));
    }
    return args;
}

int TerminalShellContext::end(std::vector<std::string>& args){
    return 0;
}


int TerminalShellContext::echo(std::vector<std::string>& words){
    for (auto it = words.rbegin(); it != words.rend(); ++it) {
        write_to_terminal(*it);
        if (it + 1 != words.rend()) {
            write_to_terminal(" ");
        }
    }
    write_to_terminal("\r\n");
    return 0;
}

int TerminalShellContext::help(std::vector<std::string>& args){
    if (!args.empty()) {
        write_to_terminal("Usage: help\r\n");
        write_to_terminal("Description: Displays a list of available commands.\r\n");
        return 0;
    }

    write_to_terminal("Available commands:\r\n\r\n");
    write_to_terminal("  cd      Change the current directory.\r\n");
    write_to_terminal("  clear   Clear the terminal screen.\r\n\r\n");
    write_to_terminal("  echo    Print a message to the terminal.\r\n");
    write_to_terminal("  exit    Exit the shell.\r\n");
    write_to_terminal("  ls      List the files in the current directory.\r\n");
    write_to_terminal("  pwd     Print the current working directory.\r\n");
    write_to_terminal("  tree    Display the directory structure in a tree format.\r\n\r\n");
    write_to_terminal("  type    Display the contents of a file.\r\n");
    write_to_terminal("Use 'man [command]' for detailed information about a specific command.\r\n");
    write_to_terminal("\r\n");
    return 0;
}

int TerminalShellContext::man(std::vector<std::string>& args) {
    if (args.empty()) {
        write_to_terminal("Usage: man [command]\r\n");
        write_to_terminal("Description: Displays detailed information about a specific command.\r\n");
        return 0;
    }

    const std::string& command = args.back();

    if (command == "exit") {
        write_to_terminal(
            "NAME\r\n"
            "    exit - Exit the shell.\r\n\r\n"
            "SYNOPSIS\r\n"
            "    exit\r\n\r\n"
            "DESCRIPTION\r\n"
            "    The `exit` command terminates the shell session and closes the terminal window.\r\n\r\n"
            "EXAMPLES\r\n"
            "    exit\r\n"
            "        Exits the shell immediately.\r\n"
        );
    } else if (command == "echo") {
        write_to_terminal(
            "NAME\r\n"
            "    echo - Print a message to the terminal.\r\n\r\n"
            "SYNOPSIS\r\n"
            "    echo [message]\r\n\r\n"
            "DESCRIPTION\r\n"
            "    The `echo` command prints the specified message to the terminal.\r\n\r\n"
            "EXAMPLES\r\n"
            "    echo Hello, World!\r\n"
            "        Prints \"Hello, World!\" to the terminal.\r\n\r\n"
            "    echo\r\n"
            "        Prints an empty line.\r\n"
        );
    } else if (command == "clear") {
        write_to_terminal(
            "NAME\r\n"
            "    clear - Clear the terminal screen.\r\n\r\n"
            "SYNOPSIS\r\n"
            "    clear\r\n\r\n"
            "DESCRIPTION\r\n"
            "    The `clear` command clears all text currently displayed in the terminal window.\r\n"
            "    It provides a clean slate for subsequent commands.\r\n\r\n"
            "EXAMPLES\r\n"
            "    clear\r\n"
            "        Clears the terminal screen.\r\n"
        );
    }else if (command == "type") {
        write_to_terminal(
            "NAME\r\n"
            "    type - Display the contents of a file.\r\n\r\n"
            "SYNOPSIS\r\n"
            "    type [file]\r\n\r\n"
            "DESCRIPTION\r\n"
            "    The `type` command displays the contents of the specified file.\r\n\r\n"
            "EXAMPLES\r\n"
            "    type example.txt\r\n"
            "        Displays the contents of `example.txt`.\r\n\r\n"
            "NOTES\r\n"
            "    - The file must exist in the current directory or the path must be specified.\r\n"
        );
    } else if (command == "pwd") {
        write_to_terminal(
            "NAME\r\n"
            "    pwd - Print the current working directory.\r\n\r\n"
            "SYNOPSIS\r\n"
            "    pwd\r\n\r\n"
            "DESCRIPTION\r\n"
            "    The `pwd` command prints the full path of the current working directory.\r\n\r\n"
            "EXAMPLES\r\n"
            "    pwd\r\n"
            "        Displays the current directory, e.g., `/home/user`.\r\n"
        );
    } else if (command == "cd") {
        write_to_terminal(
            "NAME\r\n"
            "    cd - Change the current directory.\r\n\r\n"
            "SYNOPSIS\r\n"
            "    cd [directory]\r\n\r\n"
            "DESCRIPTION\r\n"
            "    The `cd` command changes the current working directory to the specified directory.\r\n\r\n"
            "EXAMPLES\r\n"
            "    cd Documents\r\n"
            "        Changes the current directory to `Documents`.\r\n\r\n"
            "    cd\r\n"
            "        Changes to the home directory.\r\n\r\n"
            "    cd -\r\n"
            "        Switches to the previous directory.\r\n\r\n"
            "NOTES\r\n"
            "    - If no directory is specified, `cd` changes to the home directory.\r\n"
            "    - If the specified directory does not exist, an error message is displayed.\r\n"
        );
    } else if (command == "ls") {
        write_to_terminal(
            "NAME\r\n"
            "    ls - List the files in the current directory.\r\n\r\n"
            "SYNOPSIS\r\n"
            "    ls\r\n\r\n"
            "DESCRIPTION\r\n"
            "    The `ls` command lists all files and directories in the current directory.\r\n\r\n"
            "EXAMPLES\r\n"
            "    ls\r\n"
            "        Displays a list of files and directories in the current directory.\r\n\r\n"
            "NOTES\r\n"
            "    - Files and directories are displayed in columns for better readability.\r\n"
        );
    } else if (command == "tree") {
        write_to_terminal(
            "NAME\r\n"
            "    tree - Display the directory structure in a tree format.\r\n\r\n"
            "SYNOPSIS\r\n"
            "    tree [directory]\r\n"
            "    tree\r\n\r\n"
            "DESCRIPTION\r\n"
            "    The `tree` command displays the directory structure of the specified directory in a hierarchical tree format.\r\n"
            "    If no directory is specified, the tree starts at the current directory.\r\n\r\n"
            "EXAMPLES\r\n"
            "    tree\r\n"
            "        Displays the tree structure of the current directory.\r\n\r\n"
            "    tree Documents\r\n"
            "        Displays the tree structure of the `Documents` directory.\r\n\r\n"
            "NOTES\r\n"
            "    - Files are displayed with their extensions, if applicable.\r\n"
            "    - Subdirectories are indented visually for clarity.\r\n"
            "    - If the specified directory does not exist, an error message is displayed.\r\n"
        );
    } else {
        write_to_terminal("Unknown command: " + command + "\r\n");
    }

    write_to_terminal("\r\n");

    return 0;
}



std::vector<std::string> TerminalShellContext::split_by_delimiter(std::string s, std::string d){
    std::vector<std::string> lines; 
    size_t start = 0;
    size_t end = s.find_first_of(d);
    while(true){
        lines.push_back(s.substr(start, end - start));

        start = end;
        if (start == std::string::npos){
            break;
        }
        start ++;
        end = s.find_first_of(d, start);
    }

    return lines;
}

/* std::string TerminalShellContext::exists_on_path(std::string s){
    if (PATH_DIRS.empty()){
        PATH = std::getenv("PATH");
        PATH_DIRS = split_by_delimiter(PATH, ":");
    }
    
    for (auto d : PATH_DIRS){
            std::string cur_dir = d + '/' + s;
            if (std::filesystem::exists(cur_dir)){
                return cur_dir;
            }
    }

    return "";
} */


int TerminalShellContext::type(std::vector<std::string>& args){
    auto it = this->COMMAND_MAP.find(args.back());
    
    if (it == this->COMMAND_MAP.end()){
        write_to_terminal(args.back() + ": not found\r\nAt least not in this shell :P\r\n");
        return 0;
    }
    write_to_terminal( args.back() + " is a shell " + it->second.type + "\r\n");
    return 0;
}

int TerminalShellContext::pwd(std::vector<std::string>& ignore){

    write_to_terminal(fs->get_cwd() + "\r\n");

    return 0;
}

int TerminalShellContext::cd(std::vector<std::string>& dir){
    if (dir.size() > 1){
        write_to_terminal("That's not how that works here! (Too many arguments supplied lol.)\r\n");
        return 0;
    }
    if (dir.empty()){
        fs->chdir("");
        return 0;
    }
    int result = fs->chdir(dir.back());

    if (result == 1){
        write_to_terminal("cd: no such directory: " + dir.back() + "\r\n");
    }else if (result == 2){
        write_to_terminal("cd: home directory not set\r\n");
    }else if (result == 3){
        write_to_terminal("cd: no previous directory\r\n");
    }

    return 0;
}


int TerminalShellContext::list_files(std::vector<std::string>& dir){
    auto items = fs->list_dir(dir.empty() ? "" : dir.back());
    int col_num = 4;
    for (int i = 0; i < items.size(); i++){
        std::stringstream s;
        s << std::left << std::setw(15) << std::get<std::string>(items[i]);
        write_to_terminal(s.str());
        if ((i + 1) % col_num == 0 || i == items.size() - 1){
            write_to_terminal("\r\n");
        }
    }
    write_to_terminal("\r\n");
    return 0;
}

void TerminalShellContext::print_tree(FileSystem::Directory* d, const std::string& prefix = "", bool is_last = true) {
    if (!d) return; // Base case: If directory is null, return

    // Print current directory
    write_to_terminal(prefix);
    write_to_terminal((is_last ? "└── " : "├── ") + d->name + "\r\n");

    // Prepare the prefix for children
    std::string new_prefix = prefix + (is_last ? "    " : "│   ");

    // Print all files in the current directory
    for (size_t i = 0; i < d->files.size(); ++i) {
        write_to_terminal(new_prefix);
        write_to_terminal(i == d->files.size() - 1 && d->directories.empty() ? "└── " : "├── ");
        write_to_terminal(d->files[i]->name + (d->files[i]->extension_abbr.empty() ? "" : "." + d->files[i]->extension_abbr) + "\r\n");
    }

    // Recursively print subdirectories
    for (size_t i = 0; i < d->directories.size(); ++i) {
        bool last_child = (i == d->directories.size() - 1);
        print_tree(d->directories[i].get(), new_prefix, last_child);
    }
}


int TerminalShellContext::tree(std::vector<std::string>& dir_path) {
    // Get the starting directory
    FileSystem::Directory* start_dir = fs->get_dir(dir_path.back());
    if (!start_dir) {
        write_to_terminal("Error: Directory not found!\r\n");
        return 0;
    }

    // Print the tree starting from the given directory
    write_to_terminal(start_dir->name + "\r\n");
    for (size_t i = 0; i < start_dir->directories.size(); ++i) {
        bool is_last = (i == start_dir->directories.size() - 1);
        print_tree(start_dir->directories[i].get(), "", is_last);
    }

    return 0;
}


void TerminalShellContext::process_command(std::string command){
    if (command.empty()){
        return;
    }
    std::vector<std::string> command_args = parse_command(command);

    if (command_args.back() == ""){
        return;
    }
    
    auto it = COMMAND_MAP.find(command_args.back());
    
    
    if (it == COMMAND_MAP.end()){
        
        write_to_terminal(command_args.back() + ": command not found\r\n");
        
        return;
    }

    command_args.pop_back(); // remove command from arg vector

    std::function<int(std::vector<std::string>&)> f = it->second.handler;
    f(command_args);
    
    return;
}





