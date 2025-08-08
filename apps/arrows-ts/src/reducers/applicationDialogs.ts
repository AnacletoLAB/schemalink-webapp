import { Action } from 'redux';
import { retrieveHelpDismissed } from '../actions/localStorage';
import { Point } from '@neo4j-arrows/model';

export type ContextMenuState = {
  open: boolean;
  x: number;
  y: number;
};

export type GptModalState = {
  open: boolean;
  startingPrompt: string;
  callback?: (text: string) => Promise<void>;
  operationName?: string;
};

export type GptExplanationModalState = {
  open: boolean;
  explanation: string;
};

export type ApplicationDialogsState = {
  isAuthenticated: boolean,
  userData: any;
  showAuthDialog: boolean;
  showViewUsersDialog: boolean;
  showDashboardDialog: boolean;
  showSubscribeToPolicyDialog: boolean;
  showInfoAccountDialog: boolean;
  showExportDialog: boolean;
  showSaveAsDialog: boolean;
  showImportDialog: boolean;
  showHelpDialog: boolean;
  showAcknowledgementsDialog: boolean;
  contextMenu: ContextMenuState;
  gptModal: GptModalState;
  gptExplanationModal: GptExplanationModalState;
};

interface ShowContextMenuAction extends Action<'SHOW_CONTEXT_MENU'> {
  canvasPosition: Point;
}

interface ShowGptModalAction extends Action<'SHOW_GPT_MODAL'> {
  startingPrompt: string;
  callback?: (text: string) => Promise<void>;
  operationName?: string;
}

interface ShowGptExplanationModalAction
  extends Action<'SHOW_GPT_EXPLANATION_MODAL'> {
  explanation: string;
}

interface LoginSuccessAction extends Action<'LOGIN_SUCCESS'> {
  payload: {
    userData: any;
  };
}

interface LogoutSuccessAction extends Action<'LOGOUT_SUCCESS'> {}

interface DeleteAccountSuccessAction extends Action<'DELETE_ACCOUNT_SUCCESS'> {}

interface UpdateUserDataAction extends Action<'UPDATE_USER_DATA'> {
  payload: any;
}


type ApplicationDialogsAction =
  | LoginSuccessAction
  | LogoutSuccessAction
  | DeleteAccountSuccessAction
  | UpdateUserDataAction
  | ShowContextMenuAction
  | ShowGptModalAction
  | ShowGptExplanationModalAction
  | Action<
      | 'SHOW_AUTH_DIALOG'
      | 'HIDE_AUTH_DIALOG'
      | 'SHOW_VIEW_USERS_DIALOG'
      | 'HIDE_VIEW_USERS_DIALOG'
      | 'SHOW_DASHBOARD_DIALOG'
      | 'HIDE_DASHBOARD_DIALOG'
      | 'SHOW_SUBSCRIBE_TO_POLICY_DIALOG'
      | 'HIDE_SUBSCRIBE_TO_POLICY_DIALOG'
      | 'SHOW_INFO_ACCOUNT_DIALOG'
      | 'HIDE_INFO_ACCOUNT_DIALOG'
      | 'SHOW_EXPORT_DIALOG'
      | 'HIDE_EXPORT_DIALOG'
      | 'HIDE_GPT_MODAL'
      | 'HIDE_GPT_EXPLANATION_MODAL'
      | 'HIDE_CONTEXT_MENU'
      | 'SHOW_SAVE_AS_DIALOG'
      | 'HIDE_SAVE_AS_DIALOG'
      | 'SHOW_IMPORT_DIALOG'
      | 'HIDE_IMPORT_DIALOG'
      | 'SHOW_HELP_DIALOG'
      | 'HIDE_HELP_DIALOG'
      | 'SHOW_ACKNOWLEDGEMENTS_DIALOG'
      | 'HIDE_ACKNOWLEDGEMENTS_DIALOG'
    >;

export default function applicationDialogs(
  state: ApplicationDialogsState = {
    isAuthenticated: false,
    userData: null,
    showAuthDialog: false,
    showViewUsersDialog: false,
    showDashboardDialog: false,
    showSubscribeToPolicyDialog: false,
    showInfoAccountDialog: false,
    showExportDialog: false,
    showSaveAsDialog: false,
    showImportDialog: false,
    showAcknowledgementsDialog: false,
    gptModal: { open: false, startingPrompt: '' },
    gptExplanationModal: { open: false, explanation: '' },
    contextMenu: { open: false, x: 0, y: 0 },
    showHelpDialog: !retrieveHelpDismissed(),
  },
  action: ApplicationDialogsAction
): ApplicationDialogsState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        userData: action.payload.userData,
      };

    case 'LOGOUT_SUCCESS':
      return {
        ...state,
        isAuthenticated: false,
        userData: null,
      };

      case 'DELETE_ACCOUNT_SUCCESS':
        return {
          ...state,
          isAuthenticated: false,
          userData: null,
        };

    case 'SHOW_AUTH_DIALOG':
      return {
        ...state,
        showAuthDialog: true,
      };

    case 'HIDE_AUTH_DIALOG':
      return {
        ...state,
        showAuthDialog: false,
      };

    case 'SHOW_VIEW_USERS_DIALOG':
      return {
        ...state,
        showViewUsersDialog: true,
      };

    case 'HIDE_VIEW_USERS_DIALOG':
      return {
        ...state,
        showViewUsersDialog: false,
      };

    case 'SHOW_DASHBOARD_DIALOG':
      return {
        ...state,
        showDashboardDialog: true,
      };

    case 'HIDE_DASHBOARD_DIALOG':
      return {
        ...state,
        showDashboardDialog: false,
      };

    case 'SHOW_SUBSCRIBE_TO_POLICY_DIALOG':
      return {
        ...state,
        showSubscribeToPolicyDialog: true,
      };

    case 'HIDE_SUBSCRIBE_TO_POLICY_DIALOG':
      return {
        ...state,
        showSubscribeToPolicyDialog: false,
      };

    case 'SHOW_INFO_ACCOUNT_DIALOG':
      return {
        ...state,
        showInfoAccountDialog: true,
      };
    
    case 'HIDE_INFO_ACCOUNT_DIALOG':
      return {
        ...state,
        showInfoAccountDialog: false,
      };

    case 'SHOW_EXPORT_DIALOG':
      return {
        ...state,
        showExportDialog: true,
      };

    case 'HIDE_EXPORT_DIALOG':
      return {
        ...state,
        showExportDialog: false,
      };

    case 'SHOW_GPT_MODAL':
      return {
        ...state,
        gptModal: {
          open: true,
          startingPrompt: action.startingPrompt,
          callback: action.callback,
          operationName: action.operationName,
        },
      };

    case 'HIDE_GPT_MODAL':
      return {
        ...state,
        gptModal: {
          open: false,
          startingPrompt: '',
          callback: undefined,
        },
      };

    case 'SHOW_GPT_EXPLANATION_MODAL':
      return {
        ...state,
        gptExplanationModal: {
          open: true,
          explanation: action.explanation,
        },
      };

    case 'HIDE_GPT_EXPLANATION_MODAL':
      return {
        ...state,
        gptExplanationModal: {
          open: false,
          explanation: '',
        },
      };

    case 'SHOW_CONTEXT_MENU':
      return {
        ...state,
        contextMenu: {
          ...state.contextMenu,
          open: true,
          x: action.canvasPosition.x,
          y: action.canvasPosition.y,
        },
      };

    case 'HIDE_CONTEXT_MENU':
      return {
        ...state,
        contextMenu: { ...state.contextMenu, open: false },
      };

    case 'SHOW_SAVE_AS_DIALOG':
      return {
        ...state,
        showSaveAsDialog: true,
      };

    case 'HIDE_SAVE_AS_DIALOG':
      return {
        ...state,
        showSaveAsDialog: false,
      };

    case 'SHOW_IMPORT_DIALOG':
      return {
        ...state,
        showImportDialog: true,
      };

    case 'HIDE_IMPORT_DIALOG':
      return {
        ...state,
        showImportDialog: false,
      };

    case 'SHOW_HELP_DIALOG':
      return {
        ...state,
        showHelpDialog: true,
      };

    case 'HIDE_HELP_DIALOG':
      return {
        ...state,
        showHelpDialog: false,
      };

    case 'SHOW_ACKNOWLEDGEMENTS_DIALOG':
      return {
        ...state,
        showAcknowledgementsDialog: true,
      };

    case 'HIDE_ACKNOWLEDGEMENTS_DIALOG':
      return {
        ...state,
        showAcknowledgementsDialog: false,
      };

    case 'UPDATE_USER_DATA':
      return {
        ...state,
        userData: {
          ...state.userData,
          ...action.payload
        }
      };

    default:
      return state;
  }
}
