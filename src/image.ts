import { MarkEdit } from 'markedit-api';
import { blobToBase64, generateFileName, extractImages, insertSnippet, insertText } from './util';

export async function handleImagePaste(event: ClipboardEvent) {
  const images = extractImages(event);

  // Fall back to file names if no images
  if (images.length === 0) {
    return handleFileNames(event);
  }

  await Promise.all(images.map(pasteImage));
  event.preventDefault();
  event.stopPropagation();
}

async function pasteImage(file: File) {
  const basePath = (await MarkEdit.getFileInfo())?.parentPath;
  if (basePath === undefined) {
    return;
  }

  const imageData = (await blobToBase64(file)).replace(/^data:.+;base64,/, '');
  const existingNames = (await MarkEdit.listFiles(basePath)) ?? [];
  const newFileName = generateFileName(file.name, existingNames);

  MarkEdit.createFile({
    path: `${basePath}/${newFileName}`,
    data: imageData,
  });

  const target = newFileName.includes(' ') ? `<${newFileName}>` : newFileName;
  insertSnippet(`![#{Image}](${target})`);
}

function handleFileNames(event: ClipboardEvent) {
  const clipboardData = event.clipboardData;
  const plainText = clipboardData?.getData('text/plain') ?? '';
  if (plainText.length > 0) {
    return;
  }

  const files = Array.from(clipboardData?.files ?? []);
  insertText(files.map(file => file.name).join('\n'));

  event.preventDefault();
  event.stopPropagation();
}
