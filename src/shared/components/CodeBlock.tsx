import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language: string;
  theme: any;
  isLight: boolean;
}

export function CodeBlock({ code, language, theme, isLight }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative my-3.5 rounded-xl border ${
      isLight ? "border-slate-200 bg-slate-50 text-slate-800" : "border-white/[0.06] bg-slate-950 text-slate-200"
    } font-mono text-[10px] overflow-hidden`}>
      <div className={`flex items-center justify-between px-3.5 py-1.5 border-b ${
        isLight ? "border-slate-200 bg-slate-100/50" : "border-white/[0.04] bg-slate-900/40"
      } select-none`}>
        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-[9px] font-bold"
        >
          {copied ? (
            <>
              <Check size={10} className="text-emerald-400 animate-in zoom-in duration-200" />
              <span className="text-emerald-400 font-extrabold">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={10} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto m-0 custom-scrollbar leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
