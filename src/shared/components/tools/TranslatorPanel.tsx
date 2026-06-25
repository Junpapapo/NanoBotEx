import React, { useState } from "react";
import { Languages, Copy, Check, RotateCw } from "lucide-react";
import { ChatbotModel } from "../../chatbot-model";
import { useAISession } from "../../hooks/useAISession";
import { UserSettings } from "../../chatbot-types";

interface TranslatorPanelProps {
  settings: UserSettings;
  t: any;
  theme: any;
}

export function TranslatorPanel({ settings, t, theme }: TranslatorPanelProps) {
  const { createSession } = useAISession();
  const [inputText, setInputText] = useState<string>("");
  const [outputText, setOutputText] = useState<string>("");
  const [targetLang, setTargetLang] = useState<string>("English");
  const [translating, setTranslating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const languages = [
    { name: t("tools.translator.languages.en", "English"), val: "English" },
    { name: t("tools.translator.languages.ko", "Korean"), val: "Korean" },
    { name: t("tools.translator.languages.ja", "Japanese"), val: "Japanese" },
    { name: t("tools.translator.languages.zh", "Chinese"), val: "Chinese" },
    { name: t("tools.translator.languages.es", "Spanish"), val: "Spanish" },
    { name: t("tools.translator.languages.fr", "French"), val: "French" }
  ];

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setTranslating(true);
    setOutputText("");
    setCopied(false);

    const promptText = `You are a professional translator. Translate the following text into ${targetLang} naturally. Do not include any explanations, footnotes, or remarks. Output ONLY the translated text.\n\nText to translate:\n${inputText}`;

    try {
      if (settings.api_mode === "local") {
        const systemPrompt = "You are a translation assistant. You must output only the translation result without any conversation.";
        const session = await createSession(systemPrompt);
        if (session) {
          let accumulated = "";
          if (typeof session.promptStreaming === "function") {
            const stream = session.promptStreaming(promptText);
            for await (const chunk of stream) {
              accumulated = (accumulated && chunk.startsWith(accumulated)) ? chunk : accumulated + chunk;
              setOutputText(accumulated);
            }
          } else {
            const result = await session.prompt(promptText);
            setOutputText(result);
          }
          if (typeof session.destroy === "function") await session.destroy();
          else if (typeof session.close === "function") await session.close();
        } else {
          throw new Error("Failed to create local AI session");
        }
      } else {
        let accumulated = "";
        await ChatbotModel.streamExternalChat(
          [{ id: "temp-trans-1", role: "user", content: promptText }],
          (chunk: string) => {
            accumulated += chunk;
            setOutputText(accumulated);
          },
          () => {},
          (err: any) => {
            console.error(err);
            setOutputText(t("tools.translator.errorApi", "API 요청 오류가 발생했습니다."));
          }
        );
      }
    } catch (e) {
      console.error("Translation failed:", e);
      setOutputText(t("tools.translator.errorFail", "번역 처리에 실패했습니다. 온디바이스 엔진 상태 또는 API 연결을 확인하세요."));
    } finally {
      setTranslating(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit p-4 overflow-y-auto custom-scrollbar">
      <div className={`flex justify-between items-center select-none border-b ${theme.borderMuted} pb-3 pr-16`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          <Languages size={15} className="text-indigo-400" />
          {t("tools.translator.title", "번역")}
        </span>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className={`${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2 py-1 text-xs ${theme.textMain} outline-none font-semibold ${theme.focusBorder} cursor-pointer`}
        >
          {languages.map((lang) => (
            <option key={lang.val} value={lang.val} className={theme.textMain === "text-slate-800" ? "bg-white text-slate-800" : "bg-slate-950 text-white"}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* 원문 입력창 */}
      <div className="flex flex-col gap-1.5">
        <span className={`text-[10px] ${theme.textSub} font-bold uppercase tracking-wider`}>{t("tools.translator.sourceLabel", "번역할 원문 입력")}</span>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t("tools.translator.placeholder", "여기에 번역할 텍스트를 입력하세요...")}
          className={`w-full h-28 ${theme.bgInput} border ${theme.borderMuted} rounded-lg p-2.5 text-xs focus:outline-none ${theme.focusBorder} ${theme.textMain} resize-none leading-relaxed custom-scrollbar`}
        />
      </div>

      {/* 번역 실행 버튼 */}
      <button
        type="button"
        onClick={handleTranslate}
        disabled={translating || !inputText.trim()}
        className={`w-full py-2.5 rounded-lg ${theme.primary} hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${theme.shadow} disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {translating ? (
          <>
            <RotateCw size={14} className="animate-spin" />
            {t("tools.translator.translating", "번역 진행 중...")}
          </>
        ) : (
          t("tools.translator.btnTranslate", "실시간 번역 실행 ⚡")
        )}
      </button>

      {/* 번역 결과 출력창 */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-0">
        <div className="flex justify-between items-center select-none">
          <span className={`text-[10px] ${theme.textSub} font-bold uppercase tracking-wider`}>{t("tools.translator.resultLabel", "번역 결과")}</span>
          {outputText && (
            <button
              type="button"
              onClick={handleCopy}
              className={`text-xs ${theme.text} hover:opacity-80 font-semibold flex items-center gap-1 cursor-pointer transition-all focus:outline-none`}
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">{t("common.copied", "복사 완료!")}</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>{t("common.copy", "복사하기")}</span>
                </>
              )}
            </button>
          )}
        </div>
        <div className={`w-full flex-1 min-h-[100px] ${theme.bgInput} border ${theme.borderMuted} text-xs ${theme.textMain} rounded-lg p-3 outline-none font-medium leading-relaxed custom-scrollbar overflow-y-auto whitespace-pre-wrap select-text`}>
          {outputText || (
            <span className={`${theme.textSub} font-medium italic select-none`}>
              {t("tools.translator.resultPlaceholder", "번역 결과가 여기에 표시됩니다...")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
