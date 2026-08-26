import { beforeEach, describe, expect, it, vi } from 'vitest';

const markEdit = vi.hoisted(() => ({
  editorAPI: {
    getSelections: vi.fn(() => [{ from: 0, to: 0 }]),
    setSelections: vi.fn(),
    setText: vi.fn(),
  },
  userSettings: {} as Record<string, unknown>,
}));

vi.mock('markedit-api', () => ({ MarkEdit: markEdit }));
const html = '<p>- alpha</p><p>[beta](#gamma)</p>';

function createPasteEvent() {
  return {
    clipboardData: {
      getData: (type: string) => type === 'text/html' ? html : '',
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as ClipboardEvent;
}

async function pasteWithMarkdownEscaping(enabled?: boolean) {
  markEdit.userSettings = enabled === undefined ? {} : {
    'extension.markeditEnhancedPaste': {
      enableMarkdownEscaping: enabled,
    },
  };

  const { handleRichPaste } = await import('../src/rich');
  await handleRichPaste(createPasteEvent(), 'auto');
  return markEdit.editorAPI.setText.mock.calls[0]?.[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('rich paste Markdown escaping', () => {
  it('preserves Markdown syntax by default', async () => {
    expect(await pasteWithMarkdownEscaping()).toBe('- alpha\n\n[beta](#gamma)');
  });

  it('escapes Markdown syntax when enabled', async () => {
    expect(await pasteWithMarkdownEscaping(true)).toBe('\\- alpha\n\n\\[beta\\](#gamma)');
  });
});
