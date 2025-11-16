function deriveContentMode(file) {
    const mode = file?.contentMode || file?.content_mode;
    if (mode === 'data' || mode === 'url') {
        return mode;
    }

    const content = file?.content || '';
    if (typeof content === 'string' && content.trim().startsWith('data:')) {
        return 'data';
    }

    if (/^https?:\/\//i.test(content)) {
        return 'url';
    }

    return 'data';
}

function toFileObject(f) {
    const contentMode = deriveContentMode(f);
    return {
        object: f,
        type: "f",
        name: f.name,
        exten: f.extension_abbr,
        content: f.content,
        contentMode,
        assetUrl: contentMode === 'url' ? f.content : null,
        is_shortcut: f.is_shortcut,
        is_link: f.is_link
    };
}

export function makeFileItems (files) {
    const contentsList = [];
    for (let i = 0; i < files.size(); i++) {
        const f = files.get(i);
        contentsList.push(toFileObject(f));

    }

    return contentsList;
};

export function makeFileItem (f) {

    return toFileObject(f);
};



