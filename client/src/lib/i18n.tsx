import React, { createContext, useContext, useState, useCallback } from 'react';

export type Lang = 'zh-CN' | 'zh-TW' | 'en' | 'bilingual';

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (tw: string, en: string, cn?: string) => string;
}>({
  lang: 'bilingual',
  setLang: () => {},
  t: (tw, en) => `${tw} / ${en}`,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('cmf_lang') as Lang) || 'bilingual';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('cmf_lang', l);
  }, []);

  const t = useCallback((tw: string, en: string, cn?: string) => {
    switch (lang) {
      case 'zh-TW': return tw;
      case 'zh-CN': return cn || tw; // fallback to TW if no CN provided
      case 'en': return en;
      case 'bilingual': return `${tw} / ${en}`;
      default: return tw;
    }
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export const LANG_LABELS: Record<Lang, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en': 'English',
  'bilingual': '中英對照',
};
