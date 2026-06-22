import { APP_VERSION } from "@/const";
import { Link } from "wouter";
import React from "react";
import { useLang, LANG_LABELS, type Lang } from "@/lib/i18n";

export function TopHeader({ children }: { children?: React.ReactNode }) {
  const { lang, setLang, t } = useLang();

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container py-4 flex justify-between items-center px-4 max-w-[1400px] mx-auto">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src="/logo-zh.png" alt="誠港金融" className="h-10" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-800">{t('客戶開戶系統', 'Account Opening', '客户开户系统')}</span>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                {APP_VERSION}
              </span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="text-sm border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 cursor-pointer hover:border-slate-400"
          >
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <option key={l} value={l}>{LANG_LABELS[l]}</option>
            ))}
          </select>
          {children}
        </div>
      </div>
    </header>
  );
}
