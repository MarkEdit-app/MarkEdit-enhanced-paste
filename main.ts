import { EditorView, keymap } from '@codemirror/view';
import { MarkEdit } from 'markedit-api';
import { enableImagePaste, richPasteBehavior, pasteAsPlainTextHotKey } from './src/settings';
import { handleRichPaste, pasteAsPlainText } from './src/rich';
import { handleImagePaste } from './src/image';

const pasteHandler = EditorView.domEventHandlers({
  paste: event => {
    if (enableImagePaste) {
      handleImagePaste(event);
    }

    if (richPasteBehavior !== 'none') {
      handleRichPaste(event, richPasteBehavior);
    }
  },
});

MarkEdit.addExtension([
  pasteHandler,
  keymap.of([
    {
      key: pasteAsPlainTextHotKey,
      preventDefault: true,
      run: () => {
        pasteAsPlainText();
        return true;
      },
    },
  ]),
]);
