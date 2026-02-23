import TurndownService from 'turndown';
import { MarkEdit } from 'markedit-api';
import { turndownOptions } from './settings';
import { insertText } from './util';

const turndown = new TurndownService({
  ...{
    'headingStyle': 'atx',
    'bulletListMarker': '-',
    'codeBlockStyle': 'fenced',
    'emDelimiter': '*',
    'strongDelimiter': '**',
  },
  ...turndownOptions,
});

export async function handleRichPaste(event: ClipboardEvent, behavior: 'auto' | 'ask') {
  const html = event.clipboardData?.getData('text/html') ?? '';
  if (html.length === 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (behavior === 'auto') {
    pasteAsRichText(html);
  } else if (behavior === 'ask') {
    MarkEdit.showContextMenu([
      {
        title: 'Paste as Rich Text',
        action: () => pasteAsRichText(html),
      },
      {
        title: 'Paste as Plain Text',
        action: () => pasteAsPlainText(),
      },
    ]);
  }
}

export async function pasteAsPlainText() {
  const text = await MarkEdit.getPasteboardString();
  if (text !== undefined) {
    insertText(text);
  }
}

function pasteAsRichText(html: string) {
  const markdown = turndown.turndown(html);
  if (markdown.length > 0) {
    insertText(markdown);
  }
}
