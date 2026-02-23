import { MarkEdit } from 'markedit-api';

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function generateFileName(prefered: string, existing: string[]) {
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

export function insertText(text: string) {
  const selection = MarkEdit.editorAPI.getSelections()[0];
  MarkEdit.editorAPI.setText(text, selection);
}
