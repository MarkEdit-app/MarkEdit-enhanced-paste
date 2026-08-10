import { EditorView, keymap } from '@codemirror/view';
import { MarkEdit } from 'markedit-api';
import { handleRichPaste, pasteAsPlainText } from './src/rich';
import { handleImagePaste } from './src/image';
import { handleLinkPaste, linkTitleHandler } from './src/link';

import {
  enableImagePaste,
  enableLinkTitleFetch,
  richPasteBehavior,
  pasteAsPlainTextHotKey,
} from './src/settings';

const pasteHandler = EditorView.domEventHandlers({
  paste: event => {
    if (enableLinkTitleFetch && handleLinkPaste(event)) {
      return;
    }

    if (enableImagePaste) {
      handleImagePaste(event);
    }

    if (richPasteBehavior !== 'none') {
      handleRichPaste(event, richPasteBehavior);
    }
  },
});

MarkEdit.addExtension([
  linkTitleHandler,
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
