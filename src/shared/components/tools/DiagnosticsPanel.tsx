import React from "react";
import { Activity } from "lucide-react";

interface DiagnosticsPanelProps {
  t: any;
  theme: any;
}

export function DiagnosticsPanel({ t, theme }: DiagnosticsPanelProps) {
  const isSecure = typeof window !== "undefined" && window.isSecureContext;
  const origin = typeof window !== "undefined" ? window.location.origin : "-";
  
  const [aiDiagnostics, setAIDiagnostics] = React.useState(() => {
    const glob = typeof window !== "undefined" ? (window as any) : {};
    return {
      hasWindowAI: !!glob.ai,
      hasLanguageModel: !!glob.ai?.languageModel,
      hasChromeLanguageModel: !!glob.chrome?.ai?.languageModel,
      hasChromeAiOriginTrial: !!glob.chrome?.aiOriginTrial?.languageModel,
      hasLanguageModelClass: typeof glob.LanguageModel !== "undefined",
      hasAssistant: !!glob.ai?.assistant
    };
  });

  React.useEffect(() => {
    try {
      chrome.runtime.sendMessage({ action: "diagnose_ai_support" }, (res) => {
        if (res) {
          setAIDiagnostics(res);
        }
      });
    } catch (err) {
      console.warn("Failed to query background AI diagnostics:", err);
    }
  }, []);

  const {
    hasWindowAI,
    hasLanguageModel,
    hasChromeLanguageModel,
    hasChromeAiOriginTrial,
    hasLanguageModelClass,
    hasAssistant
  } = aiDiagnostics;

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit p-4 overflow-y-auto custom-scrollbar">
      {/* 헤더 */}
      <div className={`flex justify-between items-center select-none border-b ${theme.borderMuted} pb-3 pr-16`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          <Activity size={15} className="text-indigo-400" />
          {t("panel.titles.diagnostics", "시스템 환경 진단")}
        </span>
      </div>

      {/* 브라우저 환경 정보 */}
      <div className={`p-3.5 rounded-xl border ${theme.borderMuted} ${theme.bgSub} space-y-2.5`}>
        <h5 className={`font-bold ${theme.text} text-[10px] uppercase tracking-wider select-none`}>
          {t("panel.diagnostics.sectionEnv", "브라우저 환경")}
        </h5>
        <div className={`grid grid-cols-2 gap-y-2 font-mono text-xs ${theme.textSub}`}>
          <div>{t("panel.diagnostics.secureContext", "보안 컨텍스트")}</div>
          <div className="text-right">
            {isSecure ? (
              <span className="text-emerald-400 font-bold">{t("panel.diagnostics.secure", "Secure")}</span>
            ) : (
              <span className="text-rose-400 font-bold">{t("panel.diagnostics.insecure", "Insecure")}</span>
            )}
          </div>
          <div>{t("panel.diagnostics.origin", "실행 Origin")}</div>
          <div className="text-right truncate text-[10px]" title={origin}>
            {origin}
          </div>
        </div>
      </div>

      {/* 로컬 AI 지원 여부 */}
      <div className={`p-3.5 rounded-xl border ${theme.borderMuted} ${theme.bgSub} space-y-2.5`}>
        <h5 className={`font-bold ${theme.text} text-[10px] uppercase tracking-wider select-none`}>
          {t("panel.diagnostics.sectionAi", "로컬 AI 엔진 (Gemini Nano)")}
        </h5>
        <div className={`space-y-2 font-mono text-xs ${theme.textSub}`}>
          <div className="flex justify-between">
            <span>window.ai / globalThis.ai</span>
            <span className={hasWindowAI ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {hasWindowAI ? "Detected" : "Not Found"}
            </span>
          </div>
          <div className={`flex justify-between pl-3 border-l ${theme.borderMuted}`}>
            <span>.languageModel</span>
            <span className={hasLanguageModel ? "text-emerald-400 font-bold" : "text-slate-500"}>
              {hasLanguageModel ? "Detected" : "Not Found"}
            </span>
          </div>
          <div className={`flex justify-between pl-3 border-l ${theme.borderMuted}`}>
            <span>.assistant</span>
            <span className={hasAssistant ? "text-emerald-400 font-bold" : "text-slate-500"}>
              {hasAssistant ? "Detected" : "Not Found"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>chrome.ai.languageModel</span>
            <span className={hasChromeLanguageModel ? "text-emerald-400 font-bold" : "text-slate-500"}>
              {hasChromeLanguageModel ? "Detected" : "Not Found"}
            </span>
          </div>
          {hasChromeAiOriginTrial && (
            <div className="flex justify-between">
              <span>chrome.aiOriginTrial.languageModel</span>
              <span className="text-emerald-400 font-bold">Detected</span>
            </div>
          )}
          {hasLanguageModelClass && (
            <div className="flex justify-between">
              <span>LanguageModel (Legacy Class)</span>
              <span className="text-emerald-400 font-bold">Detected</span>
            </div>
          )}
        </div>
      </div>

      {/* 진단 가이드 */}
      <div className={`p-3 text-[10.5px] leading-relaxed ${theme.textSub} ${theme.bgMuted} border ${theme.border} rounded-lg select-none`}>
        <p className={`font-semibold ${theme.text} mb-1`}>💡 Gemini Nano not detected?</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Make sure your Chrome version is 127 or higher.</li>
          <li>In Chrome flags, set <code className={theme.text}>#optimization-guide-on-device-model</code> to Enabled.</li>
          <li>Set <code className={theme.text}>#prompt-api-for-gemini-nano</code> to Enabled.</li>
          <li>Fully restart your browser, then download <code className={theme.text}>Optimization Guide On Device Model</code> in <code className={theme.text}>chrome://components</code>.</li>
        </ol>
      </div>
    </div>
  );
}
