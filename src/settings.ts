import { MarkEdit, JSONObject } from 'markedit-api';

export const rootValue = MarkEdit.userSettings['extension.markeditEnhancedPaste'] as JSONObject ?? {};
export const enableImagePaste = (rootValue['enableImagePaste'] ?? true) as boolean;
export const richPasteBehavior = (rootValue['richPasteBehavior'] ?? 'auto') as 'auto' | 'ask' | 'none';
export const turndownOptions = (rootValue['turndownOptions'] ?? {}) as JSONObject;
export const pasteAsPlainTextHotKey = (rootValue['pasteAsPlainTextHotKey'] ?? 'Shift-Alt-Mod-v') as string;
