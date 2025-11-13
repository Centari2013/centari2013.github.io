const randomId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `dir-${Math.random().toString(36).slice(2, 10)}`;
};

export default function makeDirectoryItems(directories) {
  const contentsList = [];
  for (let i = 0; i < directories.size(); i++) {
    const d = directories.get(i);
    const id = d?.$$?.ptr ?? randomId();
    contentsList.push({ object: d, type: 'd', name: d.name, id: `dir-${id}` });
  }

  return contentsList;
}