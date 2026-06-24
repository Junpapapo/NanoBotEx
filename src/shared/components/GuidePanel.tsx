import React, { useState } from "react";
import { Cpu } from "lucide-react";

export function GuidePanel({ t }: { t: any }) {
  const [activeTab, setActiveTab] = useState<"flags" | "api" | "check" | "api_settings">("flags");

  return (
    <div className="flex flex-col h-full bg-[#080e21]/95 text-slate-100 border-l border-white/5 p-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 pb-4 border-b border-white/5">
        <Cpu className="h-5 w-5 text-indigo-400" />
        <span className="text-sm font-bold">{t("guide.title", "온디바이스 AI 및 외부 API 가이드")}</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 my-4">
        {(["flags", "api", "check", "api_settings"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-1.5 px-1.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer text-center ${
              activeTab === tab
                ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-400"
                : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {tab === "flags"
              ? t("guide.tabFlags", "🛠️ Flags 설정")
              : tab === "api"
              ? t("guide.tabComponents", "📦 컴포넌트")
              : tab === "check"
              ? t("guide.tabLocalCheck", "3. 로컬 체크")
              : t("guide.tabExternalApi", "4. 외부 API")}
          </button>
        ))}
      </div>

      <div className="flex-1 text-xs leading-relaxed text-slate-300 space-y-4">
        {activeTab === "flags" && (
          <div className="space-y-3">
            <p className="font-semibold text-white">Step 1: {t("guide.flagsTitle", "Chrome Gemini Nano 활성화")}</p>
            <p>{t("guide.flagsDesc", "크롬에 내장된 온디바이스 AI 기능을 활성화하기 위해 아래 두 가지 실험용 기능(Flags)을 활성화해야 합니다.")}</p>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-white/5 space-y-2">
              <div className="overflow-x-auto">
                <code className="text-indigo-400 select-all block text-[10px]">chrome://flags/#optimization-guide-on-device-model</code>
                <p className="text-slate-400 mt-1">➡️ {t("guide.flagsStep2", "주소창에 chrome://flags/#optimization-guide-on-device-model 입력 후 Enabled BypassPerfRequirement 설정.")}</p>
              </div>
              <div className="border-t border-white/[0.03] pt-2 overflow-x-auto">
                <code className="text-indigo-400 select-all block text-[10px]">chrome://flags/#prompt-api-for-gemini-nano</code>
                <p className="text-slate-400 mt-1">➡️ {t("guide.flagsStep1", "주소창에 chrome://flags/#prompt-api-for-gemini-nano 입력 후 Enabled로 설정.")}</p>
              </div>
            </div>
            <p className="text-amber-400 font-semibold mt-2">💡 {t("guide.flagsStep3", "설정을 마친 후 크롬 브라우저를 완전히 재실행(Relaunch)해 주세요.")}</p>
          </div>
        )}

        {activeTab === "api" && (
          <div className="space-y-3">
            <p className="font-semibold text-white">Step 2: {t("guide.componentsTitle", "디바이스 내장 모델 다운로드")}</p>
            <p>{t("guide.componentsDesc", "Flags 설정 후, 크롬이 로컬 추론을 위한 Gemini Nano 모델 파일을 내려받아야 합니다.")}</p>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-white/5 space-y-2">
              <p className="font-bold text-slate-200">🔍 {t("chatbot.setupGuides.g2.label", "2단계: 컴포넌트 다운로드")}</p>
              <p>{t("guide.componentsStep1", "주소창에 chrome://components 입력.")}</p>
              <p>{t("guide.componentsStep2", "Optimization Guide On Device Model 항목을 찾습니다.")}</p>
              <p>{t("guide.componentsStep3", "하단의 Check for update 버튼을 클릭합니다.")}</p>
              <p>{t("guide.componentsStep4", "상태가 Up-to-date 또는 다운로드 중으로 전환되는지 확인해 주세요.")}</p>
            </div>
          </div>
        )}

        {activeTab === "check" && (
          <div className="space-y-3">
            <p className="font-semibold text-white">Step 3: {t("guide.checkTitle", "API 연동 상태 및 로컬 실행")}</p>
            <p>{t("guide.checkDesc", "F12 개발자 도구의 Console 창에 아래 명령을 입력하여 정상적으로 Gemini Nano 세션이 생성되는지 직접 테스트해 볼 수 있습니다.")}</p>
            <pre className="p-3 bg-slate-950/80 rounded-lg border border-white/5 overflow-x-auto text-indigo-300 select-all font-mono text-[10px]">
{`const session = await window.ai.assistant.create();
const response = await session.prompt("안녕하세요!");
console.log(response);`}
            </pre>
            <p className="text-emerald-400">{t("guide.checkSuccess", "✅ 콘솔에서 정상 응답이 오면 온디바이스 챗봇이 완벽하게 독립 동작합니다.")}</p>
          </div>
        )}

        {activeTab === "api_settings" && (
          <div className="space-y-3">
            <p className="font-semibold text-white">Step 4: {t("guide.externalApiTitle", "외부 LLM API 설정 (Bypass Mode)")}</p>
            <p>{t("guide.externalApiDesc", "로컬 Gemini Nano 대신 OpenAI 등의 클라우드 API를 직접 연결할 수도 있습니다.")}</p>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-white/5 space-y-2">
              <p>{t("guide.externalApiStep1", "1. 팝업 또는 챗봇 설정창에서 Bypass Mode를 켭니다.")}</p>
              <p>{t("guide.externalApiStep2", "2. 사용하실 API Key와 API URL(예: OpenAI, Anthropic 호환 주소) 및 Model(예: gpt-4o-mini)을 등록합니다.")}</p>
              <p>{t("guide.externalApiStep3", "3. 모든 요청은 브라우저에서 직접 전달되어 안전하게 작동합니다.")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
