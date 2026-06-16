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

// Override turndown's built-in listItem rule, which hardcodes 3 spaces after
// the bullet marker, to use a single space instead.
turndown.addRule('listItem', {
  filter: 'li',
  replacement: (content, node, options) => {
    content = content
      .replace(/^\n+/, '')
      .replace(/\n+$/, '\n')
      .replace(/\n/gm, '\n  '); // 2-space indent for wrapped/nested content

    let prefix = `${options.bulletListMarker} `;
    const parent = node.parentNode as HTMLElement;

    if (parent.nodeName === 'OL') {
      const start = parent.getAttribute('start');
      const index = Array.prototype.indexOf.call(parent.children, node);
      prefix = `${start ? Number(start) + index : index + 1}. `;
    }

    return prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '');
  },
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
