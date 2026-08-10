import { snippet } from '@codemirror/autocomplete';
import { MarkEdit } from 'markedit-api';

export function extractImages(event: ClipboardEvent) {
  return Array.from(event.clipboardData?.items ?? [])
    .map(item => item.getAsFile())
    .filter((file): file is File => file?.type.startsWith('image/') ?? false);
}

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

export function insertSnippet(template: string, label = '') {
  const editor = MarkEdit.editorView;
  const { from, to } = editor.state.selection.main;
  snippet(template + '#{}')(editor, { label }, from, to);
}

export function insertText(text: string) {
  const editorAPI = MarkEdit.editorAPI;
  const selection = editorAPI.getSelections()[0];
  editorAPI.setText(text, selection);

  // Collapse the selection to the end of the inserted text
  const caret = selection.from + text.length;
  editorAPI.setSelections([{ from: caret, to: caret }]);
}
