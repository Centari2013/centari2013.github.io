function extractAssetUrl(file) {
    return (
        file?.assetUrl ||
        file?.asset_url ||
        file?.asset?.url ||
        null
    );
}

function deriveContentMode(file) {
    const mode = file?.contentMode || file?.content_mode;
    if (mode === 'data' || mode === 'url') {
        return mode;
    }

    const content = file?.content || '';
    if (typeof content === 'string' && content.trim().startsWith('data:')) {
        return 'data';
    }

    if (typeof content === 'string' && /^https?:\/\//i.test(content)) {
        return 'url';
    }

    if (extractAssetUrl(file)) {
        return 'url';
    }

    return 'data';
}

import {
    getShortcutTargetPath,
    shortcutTargetsDirectory,
} from '@/components/utilities/filesystemMetadata';

function toFileObject(f) {
    const assetUrl = extractAssetUrl(f);
    const contentMode = deriveContentMode(f);
    const targetsDirectory = shortcutTargetsDirectory(f);
    return {
        object: f,
        type: "f",
        name: f.name,
        exten: f.extension_abbr,
        content: f.content,
        contentMode,
        assetUrl: assetUrl || (contentMode === 'url' ? f.content : null),
        asset: f.asset,
        is_shortcut: f.is_shortcut,
        is_link: f.is_link,
        shortcutTargetsDirectory: targetsDirectory,
        shortcutTargetPath: targetsDirectory ? getShortcutTargetPath(f) : null,
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



