import type { KeyboardLayout } from '../types';

type NavigatorWithKeyboard = Navigator & {
  keyboard?: {
    getLayoutMap?: () => Promise<Map<string, string>>;
  };
};

export const detectLayout = async (): Promise<KeyboardLayout> => {
  const keyboardApi = (navigator as NavigatorWithKeyboard).keyboard;
  if (!keyboardApi?.getLayoutMap) {
    return 'unknown';
  }
  try {
    const layoutMap: Map<string, string> = await keyboardApi.getLayoutMap();
    const qKey = layoutMap.get('KeyQ');
    if (qKey === 'a' || qKey === 'A') return 'azerty';
    const backquote = layoutMap.get('Backquote');
    if (backquote === ';' || backquote === '½') return 'azerty';
    if (qKey === 'ק' || backquote === 'ק') return 'hebrew';
    return 'qwerty';
  } catch (err) {
    console.warn('Keyboard layout detection failed', err);
    return 'unknown';
  }
};
