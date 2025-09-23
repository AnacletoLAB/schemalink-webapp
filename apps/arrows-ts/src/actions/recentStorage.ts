export const updateRecentStorage = (
  mode: string,
  fileId: string,
  diagramName: string
) => {
  return {
    type: 'UPDATE_RECENT_STORAGE',
    mode,
    fileId,
    diagramName,
    timestamp: Date.now(),
  };
};

export const removeFromRecentStorage = (mode: string, fileId: string) => {
  return {
    type: 'REMOVE_RECENT_STORAGE_ENTRY',
    mode,
    fileId,
  } as const;
};
