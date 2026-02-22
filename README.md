# MarkEdit-enhanced-paste

Enhance [MarkEdit](https://github.com/MarkEdit-app/MarkEdit) with additional paste features, such as handling copied images.

## Installation

Copy [dist/markedit-enhanced-paste.js](dist/markedit-enhanced-paste.js?raw=true) to `~/Library/Containers/app.cyan.markedit/Data/Documents/scripts/`.

You can also run `yarn install && yarn build` to build and deploy the script.

## Settings

In [settings.json](https://github.com/MarkEdit-app/MarkEdit/wiki/Customization#advanced-settings), you can define a settings node named `extension.markeditEnhancedPaste` to configure this extension, default settings are:

```json
{
  "extension.markeditEnhancedPaste": {
    "enableImagePaste": true
  }
}
```

- `enableImagePaste`: Whether to handle image paste.
