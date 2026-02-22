import { MarkEdit, JSONObject } from 'markedit-api';

export const rootValue = MarkEdit.userSettings['extension.markeditEnhancedPaste'] as JSONObject ?? {};
export const enableImagePaste = (rootValue['enableImagePaste'] ?? true) as boolean;
