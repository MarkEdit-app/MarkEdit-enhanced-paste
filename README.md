# MarkEdit-enhanced-paste

Enhance [MarkEdit](https://github.com/MarkEdit-app/MarkEdit) with additional paste features, such as handling copied images, rich text (HTML), and URLs with automatically fetched titles.

## Installation

Copy [dist/markedit-enhanced-paste.js](dist/markedit-enhanced-paste.js?raw=true) to `~/Library/Containers/app.cyan.markedit/Data/Documents/scripts/`.

You can also run `yarn install && yarn build` to build and deploy the script.

## Settings

In [settings.json](https://github.com/MarkEdit-app/MarkEdit/wiki/Customization#advanced-settings), you can define a settings node named `extension.markeditEnhancedPaste` to configure this extension, default settings are:

```json
{
  "extension.markeditEnhancedPaste": {
    "enableImagePaste": true,
    "enableLinkTitleFetch": false,
    "richPasteBehavior": "auto",
    "turndownOptions": {
      "headingStyle": "atx",
      "bulletListMarker": "-",
      "codeBlockStyle": "fenced",
      "emDelimiter": "*",
      "strongDelimiter": "**"
    },
    "pasteAsPlainTextHotKey": "Shift-Alt-Mod-v"
  }
}
```

- `enableImagePaste`: Whether to handle image paste.
- `enableLinkTitleFetch`: Whether to fetch the title of a pasted URL and create a Markdown link.
- `richPasteBehavior`: The behavior when handling rich text. Valid values are `auto`, `ask`, and `none`.
- `turndownOptions`: Options used by [turndown](https://github.com/mixmark-io/turndown?tab=readme-ov-file#options), the service that converts HTML into Markdown.
- `pasteAsPlainTextHotKey`: The hotkey to always paste plain text. See specs [here](https://codemirror.net/docs/ref/#view.KeyBinding).
