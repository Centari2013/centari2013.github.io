const randomId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `file-${Math.random().toString(36).slice(2, 10)}`;
};

const buildFileObject = (f) => ({
  object: f,
  type: 'f',
  name: f.name,
  exten: f.extension_abbr,
  content: f.content,
  contentMode: 'data',
  is_shortcut: f.is_shortcut,
  is_link: f.is_link,
  id: `file-${f?.$$?.ptr ?? randomId()}`,
});

export function makeFileItems(files) {
  const contentsList = [];
  for (let i = 0; i < files.size(); i++) {
    const f = files.get(i);
    contentsList.push(buildFileObject(f));
  }

  return contentsList;
};

export function makeFileItem(f) {
  return buildFileObject(f);
};



