export default function makeDirectoryItems(directories) {
    const contentsList = [];
    for (let i = 0; i < directories.size(); i++) {
    const d = directories.get(i);
    contentsList.push({ object: d, type: "d", name: d.name});
    }

    return contentsList;
}