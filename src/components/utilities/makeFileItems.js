export function makeFileItems (files) {
    const contentsList = [];
    for (let i = 0; i < files.size(); i++) {
        const f = files.get(i);
        contentsList.push({ 
            object: f, 
            type: "f", 
            name: f.name, 
            exten: f.extension_abbr, 
            content: f.content, 
            is_shortcut: f.is_shortcut
        });

    }

    return contentsList;
};

export function makeFileItem (f) {
   
    const file_object = { 
        object: f, 
        type: "f", 
        name: f.name, 
        exten: f.extension_abbr, 
        content: f.content, 
        is_shortcut: f.is_shortcut
    };

    return file_object;
};



