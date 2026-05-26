import { Point } from '@neo4j-arrows/model';

export const loginSuccess = (userData) => {
  return {
    type: 'LOGIN_SUCCESS',
    payload: { userData },
  };
};

export const logout = () => {
  return {
    type: 'LOGOUT_SUCCESS',
  };
};

export const delete_account = () => {
  return {
    type: 'DELETE_ACCOUNT_SUCCESS',
  };
};

export const showViewUsersDialog = () => {
  return {
    type: 'SHOW_VIEW_USERS_DIALOG',
  };
};

export const hideViewUsersDialog = () => {
  return {
    type: 'HIDE_VIEW_USERS_DIALOG',
  };
};

export const showDashboardDialog = () => {
  return {
    type: 'SHOW_DASHBOARD_DIALOG',
  };
};

export const hideDashboardDialog = () => {
  return {
    type: 'HIDE_DASHBOARD_DIALOG',
  };
};

export const showSubscribeToPolicyDialog = () => {
  return {
    type: 'SHOW_SUBSCRIBE_TO_POLICY_DIALOG',
  };
};

export const hideSubscribeToPolicyDialog = () => {
  return {
    type: 'HIDE_SUBSCRIBE_TO_POLICY_DIALOG',
  };
};

export const showInfoAccountDialog = () => {
  return {
    type: 'SHOW_INFO_ACCOUNT_DIALOG',
  };
};

export const hideInfoAccountDialog = () => {
  return {
    type: 'HIDE_INFO_ACCOUNT_DIALOG',
  };
};

export const showAuthDialog = () => {
  return {
    type: 'SHOW_AUTH_DIALOG',
  };
};

export const hideAuthDialog = () => {
  return {
    type: 'HIDE_AUTH_DIALOG',
  };
};

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

export const showGptModal = (
  callback?: (text: string) => Promise<void>,
  startingPrompt?: string,
  operationName?: string
) => {
  return {
    type: 'SHOW_GPT_MODAL',
    startingPrompt,
    callback,
    operationName
  };
};

export const hideGptModal = () => {
  return {
    type: 'HIDE_GPT_MODAL',
  };
};

export const showGptExplanationModal = (explanation: string) => {
  return {
    type: 'SHOW_GPT_EXPLANATION_MODAL',
    explanation,
  };
};

export const hideGptExplanationModal = () => {
  return {
    type: 'HIDE_GPT_EXPLANATION_MODAL',
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

export const showAcknowledgementsDialog = () => {
  return {
    type: 'SHOW_ACKNOWLEDGEMENTS_DIALOG',
  };
};

export const hideAcknowledgementsDialog = () => {
  return {
    type: 'HIDE_ACKNOWLEDGEMENTS_DIALOG',
  };
};

export const updateUserData = (updatedData: Partial<UserData>) => ({
  type: 'UPDATE_USER_DATA',
  payload: updatedData
});

export const showEnumRegexDialog = () => {
  return {
    type: 'SHOW_ENUM_REGEX_DIALOG',
  };
};

export const hideEnumRegexDialog = () => {
  return {
    type: 'HIDE_ENUM_REGEX_DIALOG',
  };
};

export const showOntologiesDialog = () => {
  return {
    type: 'SHOW_ONTOLOGIES_DIALOG',
  };
};

export const hideOntologiesDialog = () => {
  return {
    type: 'HIDE_ONTOLOGIES_DIALOG',
  };
};
