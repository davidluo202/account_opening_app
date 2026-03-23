import { Link } from "wouter";
import React from "react";

export function TopHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container py-4 flex justify-between items-center px-4 max-w-[1400px] mx-auto">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src="/logo-zh.png" alt="誠港金融" className="h-10" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-800">客户开户系统</span>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                v1.0.260323.011
              </span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {children}
        </div>
      </div>
    </header>
  );
}
