import { Point } from '@neo4j-arrows/model';

export const showExportDialog = () => {
  return {
    type: 'SHOW_EXPORT_DIALOG',
  };
};

export const hideExportDialog = () => {
  return {
    type: 'HIDE_EXPORT_DIALOG',
  };
};

export const showGptModal = (startingPrompt?: string) => {
  return {
    type: 'SHOW_GPT_MODAL',
    startingPrompt,
  };
};

export const hideGptModal = () => {
  return {
    type: 'HIDE_GPT_MODAL',
  };
};

export const showContextMenu = (canvasPosition: Point) => ({
  type: 'SHOW_CONTEXT_MENU',
  canvasPosition,
});

export const hideContextMenu = () => ({
  type: 'HIDE_CONTEXT_MENU',
});

export const showSaveAsDialog = () => {
  return {
    type: 'SHOW_SAVE_AS_DIALOG',
  };
};

export const hideSaveAsDialog = () => {
  return {
    type: 'HIDE_SAVE_AS_DIALOG',
  };
};

export const showImportDialog = () => {
  return {
    type: 'SHOW_IMPORT_DIALOG',
  };
};

export const hideImportDialog = () => {
  return {
    type: 'HIDE_IMPORT_DIALOG',
  };
};

export const showHelpDialog = () => {
  return {
    type: 'SHOW_HELP_DIALOG',
  };
};

export const hideHelpDialog = () => {
  return {
    type: 'HIDE_HELP_DIALOG',
  };
};
