import { EditorState, TransactionSpec } from '@codemirror/state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleLinkPaste, linkTitleHandler } from '../src/link';

const markEdit = vi.hoisted(() => ({ editorView: undefined as TestEditor | undefined }));
vi.mock('markedit-api', () => ({ MarkEdit: markEdit }));

const pendingTitle = 'Fetching title...';
const url = 'https://example.com';

class TestEditor {
  state: EditorState;

  constructor(document = '', anchor = document.length) {
    this.state = EditorState.create({
      doc: document,
      selection: { anchor },
      extensions: [linkTitleHandler],
    });
  }

  dispatch(spec: TransactionSpec) {
    this.state = this.state.update(spec).state;
  }

  get document() {
    return this.state.doc.toString();
  }
}

function createPasteEvent(text = url) {
  let defaultPrevented = false;
  return {
    get defaultPrevented() {
      return defaultPrevented;
    },
    clipboardData: {
      getData: (type: string) => type === 'text/plain' ? text : '',
      items: [],
    },
    preventDefault: () => {
      defaultPrevented = true;
    },
    stopPropagation: vi.fn(),
  } as unknown as ClipboardEvent;
}

function htmlResponse(title: string) {
  return new Response(`<title>${title}</title>`, {
    headers: { 'content-type': 'text/html' },
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(promiseResolve => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

async function waitForDocument(editor: TestEditor, expected: string) {
  await vi.waitFor(() => expect(editor.document).toBe(expected));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('link title fetching', () => {
  it('leaves image URLs for image paste handling', () => {
    const editor = new TestEditor();
    markEdit.editorView = editor;
    const fetch = vi.spyOn(globalThis, 'fetch');

    expect(handleLinkPaste(createPasteEvent('https://example.com/image.PNG?size=2'))).toBe(false);
    expect(editor.document).toBe('');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('updates the tracked link when identical placeholder text already exists', async () => {
    const existing = `[${pendingTitle}](${url})`;
    const editor = new TestEditor(`${existing}\n`);
    markEdit.editorView = editor;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(htmlResponse('Example'));

    handleLinkPaste(createPasteEvent());
    await waitForDocument(editor, `${existing}\n[Example](${url})`);
  });

  it('updates the originating editor after the active editor changes', async () => {
    const request = deferred<Response>();
    const original = new TestEditor();
    const other = new TestEditor(`[${pendingTitle}](${url})`);
    markEdit.editorView = original;
    vi.spyOn(globalThis, 'fetch').mockReturnValue(request.promise);

    handleLinkPaste(createPasteEvent());
    markEdit.editorView = other;
    request.resolve(htmlResponse('Example'));

    await waitForDocument(original, `[Example](${url})`);
    expect(other.document).toBe(`[${pendingTitle}](${url})`);
  });

  it('preserves a title edited while the request is pending', async () => {
    const request = deferred<Response>();
    const editor = new TestEditor();
    markEdit.editorView = editor;
    vi.spyOn(globalThis, 'fetch').mockReturnValue(request.promise);

    handleLinkPaste(createPasteEvent());
    editor.dispatch({ changes: { from: 1, to: pendingTitle.length + 1, insert: 'Custom title' } });
    request.resolve(htmlResponse('Example'));

    await waitForDocument(editor, `[Custom title](${url})`);
  });

  it('parses a title from a large HTML response', async () => {
    const editor = new TestEditor();
    markEdit.editorView = editor;
    const html = `${'x'.repeat(700_000)}<title>Example</title>${'x'.repeat(400_000)}`;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(html, {
      headers: { 'content-type': 'text/html' },
    }));

    handleLinkPaste(createPasteEvent());
    await waitForDocument(editor, `[Example](${url})`);
  });

  it('does not split a surrogate pair when truncating a title', async () => {
    const title = `${'a'.repeat(60)}😀${'b'.repeat(10)}`;
    const expected = `${'a'.repeat(60)}😀...`;
    const editor = new TestEditor();
    markEdit.editorView = editor;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(htmlResponse(title));

    handleLinkPaste(createPasteEvent());
    await waitForDocument(editor, `[${expected}](${url})`);
  });
});
