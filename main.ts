import { EditorView } from '@codemirror/view';
import { MarkEdit } from 'markedit-api';
import { handleImagePaste } from './src/image';
import { enableImagePaste } from './src/settings';

const pasteHandler = EditorView.domEventHandlers({
  paste: event => {
    if (enableImagePaste) {
      handleImagePaste(event);
    }
  },
});

MarkEdit.addExtension(pasteHandler);
