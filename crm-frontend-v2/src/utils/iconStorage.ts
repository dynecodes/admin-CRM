const iconStorage: { [key: string]: string | undefined } = {};

export const setTempIcon = (addonId: number, icon: string | undefined) => {
  iconStorage[`addon-${addonId}`] = icon;
};

export const getTempIcon = (addonId: number): string | undefined => {
  return iconStorage[`addon-${addonId}`];
};

export const clearTempIcon = (addonId: number) => {
  delete iconStorage[`addon-${addonId}`];
};