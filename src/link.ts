import { StateEffect, StateField, Transaction } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { MarkEdit } from 'markedit-api';
import { extractImages } from './util';

const imageExtensions = /\.(?:avif|bmp|gif|heic|jpe?g|png|psd|svg|tga|tiff?|webp)$/i;
const pendingTitle = 'Fetching title...';
const maximumTitleLength = 64;

interface PendingTitleRange {
  id: number;
  from: number;
  to: number;
}

const addPendingTitle = StateEffect.define<PendingTitleRange>();
const removePendingTitle = StateEffect.define<number>();
let nextPendingTitleId = 0;

export const linkTitleHandler = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (pendingTitles, transaction) => {
    pendingTitles = pendingTitles.map(transaction.changes);

    for (const effect of transaction.effects) {
      if (effect.is(addPendingTitle)) {
        const { id, from, to } = effect.value;
        const marker = Decoration.mark({ pendingTitleId: id }).range(from, to);
        pendingTitles = pendingTitles.update({ add: [marker], sort: true });
      } else if (effect.is(removePendingTitle)) {
        pendingTitles = pendingTitles.update({
          filter: (_from, _to, marker) => marker.spec.pendingTitleId !== effect.value,
        });
      }
    }

    return pendingTitles;
  },
});

export function handleLinkPaste(event: ClipboardEvent) {
  if (event.defaultPrevented) {
    return false;
  }

  const clipboardData = event.clipboardData;
  const text = clipboardData?.getData('text/plain').trim() ?? '';
  const url = parseWebURL(text);
  if (url === undefined || imageExtensions.test(url.pathname) || extractImages(event).length > 0) {
    return false;
  }

  const editor = MarkEdit.editorView;
  const { from } = editor.state.selection.main;
  const beforeSelection = editor.state.doc.sliceString(Math.max(0, from - 2), from);
  if (beforeSelection.endsWith('](') || /["']$/.test(beforeSelection)) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();

  const destination = escapeLinkDestination(text);
  const pendingLink = `[${pendingTitle}](${destination})`;
  const pendingId = nextPendingTitleId++;
  const titleFrom = from + 1;

  editor.dispatch({
    changes: { from, to: editor.state.selection.main.to, insert: pendingLink },
    selection: { anchor: from + pendingLink.length },
  });

  editor.dispatch({
    effects: addPendingTitle.of({
      id: pendingId,
      from: titleFrom,
      to: titleFrom + pendingTitle.length,
    }),
    annotations: Transaction.addToHistory.of(false),
  });

  replacePendingTitle(editor, pendingId, text);
  return true;
}

async function replacePendingTitle(editor: EditorView, pendingId: number, url: string) {
  const title = await fetchPageTitle(url);
  const range = findPendingTitle(editor, pendingId);
  if (range === undefined) {
    return;
  }

  if (editor.state.doc.sliceString(range.from, range.to) !== pendingTitle) {
    editor.dispatch({
      effects: removePendingTitle.of(pendingId),
      annotations: Transaction.addToHistory.of(false),
    });
    return;
  }

  const linkTitle = title === undefined ? url : truncateTitle(title);
  editor.dispatch({
    changes: {
      from: range.from,
      to: range.to,
      insert: escapeLinkTitle(linkTitle),
    },
    effects: removePendingTitle.of(pendingId),
  });
}

async function fetchPageTitle(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
      return undefined;
    }

    const html = await response.text();
    const title = new DOMParser().parseFromString(html, 'text/html').querySelector('title')?.textContent;
    return title?.replace(/\s+/g, ' ').trim() || undefined;
  } catch (error) {
    console.error(`Unable to fetch title for ${url}`, error);
    return undefined;
  }
}

function parseWebURL(text: string) {
  if (text.length === 0 || /\s/.test(text)) {
    return undefined;
  }

  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

function findPendingTitle(editor: EditorView, pendingId: number) {
  const pendingTitles = editor.state.field(linkTitleHandler, false);
  let match: { from: number; to: number } | undefined;

  pendingTitles?.between(0, editor.state.doc.length, (from, to, marker) => {
    if (marker.spec.pendingTitleId === pendingId) {
      match = { from, to };
      return false;
    }
  });

  return match;
}

function truncateTitle(title: string) {
  const characters = Array.from(title);
  if (characters.length <= maximumTitleLength) {
    return title;
  }

  return `${characters.slice(0, maximumTitleLength - 3).join('').trimEnd()}...`;
}

function escapeLinkTitle(title: string) {
  return title.replace(/[\\`*_[\]<>|~]/g, '\\$&');
}

function escapeLinkDestination(url: string) {
  return url.replace(/[\\()]/g, '\\$&');
}
