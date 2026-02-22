import { MarkEdit } from 'markedit-api';
import { blobToBase64, generateFileName } from './util';

export async function handleImagePaste(event: ClipboardEvent) {
  const basePath = (await MarkEdit.getFileInfo())?.parentPath;
  if (basePath === undefined) {
    return;
  }

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
}
