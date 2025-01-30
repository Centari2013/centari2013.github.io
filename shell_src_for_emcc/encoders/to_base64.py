import base64
import os
import mimetypes

def file_to_base64(directory):
    cpp_filename = os.path.join(directory, "files.cpp")
    h_filename = os.path.join(directory, "files.h")
    
    # Create and initialize the header file
    with open(h_filename, "w") as h_file:
        h_file.write("#ifndef FILES_H\n#define FILES_H\n#include <string>\n\n")
    
    # Create and initialize the .cpp file
    with open(cpp_filename, "w") as cpp_file:
        cpp_file.write('#include "files.h"\n\n')

    # Iterate through all files in the directory
    for filename in os.listdir(directory):
        if (filename[0] == '.'):
            continue
        file_path = os.path.join(directory, filename)
        
        if os.path.isfile(file_path):  # Ensure it's a file
            # Detect MIME type
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = "application/octet-stream"  # Fallback for unknown types
            
            # Read the file and encode it to Base64
            with open(file_path, "rb") as f:
                file_data = f.read()
                base64_data = base64.b64encode(file_data).decode('utf-8')  # Encode to Base64
            
            # Create a function name based on the file name
            function_name = filename.replace('.', '_')
            
            # Write the function declaration to the header file
            with open(h_filename, "a") as h_file:
                h_file.write(f"std::string {function_name}_data();\n")
            
            # Write the function definition to the .cpp file
            with open(cpp_filename, "a") as cpp_file:
                cpp_file.write(f"std::string {function_name}_data() {{\n")
                cpp_file.write(f"    return \"data:{mime_type};base64,{base64_data}\";\n")
                cpp_file.write("}\n\n")

            print(f"Processed and saved: {filename} (MIME: {mime_type})")

    # Close the header file with an endif
    with open(h_filename, "a") as h_file:
        h_file.write("#endif /* FILES_H */")

if __name__ == "__main__":
    directory = "/Users/spicykneecaps/Projects/centari2013.github.io/shell_src_for_emcc/filesystem/files"  # Replace with your directory path
    file_to_base64(directory)
