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
};

export type ApplicationDialogsState = {
  showExportDialog: boolean;
  showSaveAsDialog: boolean;
  showImportDialog: boolean;
  showHelpDialog: boolean;
  contextMenu: ContextMenuState;
  gptModal: GptModalState;
};

interface ShowContextMenuAction extends Action<'SHOW_CONTEXT_MENU'> {
  canvasPosition: Point;
}

interface ShowGptModalAction extends Action<'SHOW_GPT_MODAL'> {
  startingPrompt: string;
}

type ApplicationDialogsAction =
  | Action<
      | 'SHOW_EXPORT_DIALOG'
      | 'HIDE_EXPORT_DIALOG'
      | 'HIDE_GPT_MODAL'
      | 'HIDE_CONTEXT_MENU'
      | 'SHOW_SAVE_AS_DIALOG'
      | 'HIDE_SAVE_AS_DIALOG'
      | 'SHOW_IMPORT_DIALOG'
      | 'HIDE_IMPORT_DIALOG'
      | 'SHOW_HELP_DIALOG'
      | 'HIDE_HELP_DIALOG'
    >
  | ShowContextMenuAction
  | ShowGptModalAction;

export default function applicationDialogs(
  state: ApplicationDialogsState = {
    showExportDialog: false,
    showSaveAsDialog: false,
    showImportDialog: false,
    gptModal: { open: false, startingPrompt: '' },
    contextMenu: { open: false, x: 0, y: 0 },
    showHelpDialog: !retrieveHelpDismissed(),
  },
  action: ApplicationDialogsAction
): ApplicationDialogsState {
  switch (action.type) {
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
        gptModal: { open: true, startingPrompt: action.startingPrompt },
      };

    case 'HIDE_GPT_MODAL':
      return {
        ...state,
        gptModal: { open: false, startingPrompt: '' },
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

    default:
      return state;
  }
}
