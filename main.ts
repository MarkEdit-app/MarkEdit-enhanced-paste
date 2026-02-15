import { MarkEdit } from 'markedit-api';

MarkEdit.onEditorReady(async() => {
  const basePath = (await MarkEdit.getFileInfo())?.parentPath;
  if (basePath === undefined) {
    return;
  }

  const contentDOM = MarkEdit.editorView.contentDOM;
  contentDOM.addEventListener('paste', async(event) => {
    const items = event.clipboardData?.items ?? [];
    for (let index = 0; index < items.length; ++index) {
      const file = items[index].getAsFile();
      if (!file?.type.startsWith('image/')) {
        continue;
      }

      const imageData = (await blobToBase64(file)).replace(/^data:.+;base64,/, '');
      const existingNames = (await MarkEdit.listFiles(basePath)) ?? [];
      const newFileName = generateFileName(file.name, existingNames);

      MarkEdit.createFile({
        path: `${basePath}/${newFileName}`,
        data: imageData,
      });

      const targetPos = MarkEdit.editorAPI.getSelections()[0];
      MarkEdit.editorAPI.setText(`![Image](${newFileName})`, targetPos);
    }
  });
});

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function generateFileName(prefered: string, existing: string[]) {
  if (!existing.includes(prefered)) {
    return prefered;
  }

  const dotPos = prefered.lastIndexOf('.');
  const baseName = dotPos === -1 ? prefered : prefered.substring(0, dotPos);
  const extension = dotPos === -1 ? '' : prefered.substring(dotPos);

  // Try "name-1.ext", "name-2.ext", ... until we find a name that doesn't exist.
  for (let index = 1; ; ++index) {
    const candidate = `${baseName}-${index}${extension}`;
    if (!existing.includes(candidate)) {
      return candidate;
    }
  }
}
