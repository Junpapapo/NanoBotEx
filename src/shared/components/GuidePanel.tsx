import React, { useState } from "react";
import { Cpu } from "lucide-react";

export function GuidePanel({ theme }: { t?: any; theme: any }) {
  const [activeTab, setActiveTab] = useState<"flags" | "api" | "check" | "api_settings">("flags");

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit p-4 overflow-y-auto custom-scrollbar">
      <div className={`flex items-center gap-2 pb-4 border-b ${theme.borderMuted} pr-16`}>
        <Cpu className="h-5 w-5 text-indigo-400" />
        <span className={`text-sm font-bold ${theme.textMain}`}>On-Device AI & External API Guide</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 my-4">
        {(["flags", "api", "check", "api_settings"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-1.5 px-1.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer text-center ${
              activeTab === tab
                ? `${theme.bgMuted} ${theme.border} ${theme.text}`
                : `${theme.bgInput} ${theme.borderMuted} ${theme.textSub} hover:${theme.bgHover}`
            }`}
          >
            {tab === "flags"
              ? "🛠️ Flags Settings"
              : tab === "api"
              ? "📦 Components"
              : tab === "check"
              ? "3. Local Check"
              : "4. External API"}
          </button>
        ))}
      </div>

      <div className={`flex-1 text-xs leading-relaxed ${theme.textSub} space-y-4`}>
        {activeTab === "flags" && (
          <div className="space-y-3">
            <p className={`font-semibold ${theme.textMain}`}>Step 1: Enable Chrome Gemini Nano</p>
            <p>To activate the built-in on-device AI feature in Chrome, you need to enable the following two experimental features (Flags).</p>
            <div className={`p-3 ${theme.bgInput} rounded-lg border ${theme.borderMuted} space-y-2`}>
              <div className="overflow-x-auto">
                <code className="text-indigo-400 select-all block text-[10px]">chrome://flags/#optimization-guide-on-device-model</code>
                <p className={`${theme.textSub} mt-1`}>➡️ Enter this in the address bar and set to "Enabled BypassPerfRequirement".</p>
              </div>
              <div className={`border-t ${theme.borderMuted} pt-2 overflow-x-auto`}>
                <code className="text-indigo-400 select-all block text-[10px]">chrome://flags/#prompt-api-for-gemini-nano</code>
                <p className={`${theme.textSub} mt-1`}>➡️ Enter this in the address bar and set to "Enabled".</p>
              </div>
            </div>
            <p className="text-amber-500 font-semibold mt-2">💡 After completing the settings, please relaunch the Chrome browser completely.</p>
          </div>
        )}

        {activeTab === "api" && (
          <div className="space-y-3">
            <p className={`font-semibold ${theme.textMain}`}>Step 2: Download Device Built-in Model</p>
            <p>After enabling the flags, Chrome needs to download the Gemini Nano model file for local inference.</p>
            <div className={`p-3 ${theme.bgInput} rounded-lg border ${theme.borderMuted} space-y-2`}>
              <p className={`font-bold ${theme.textMain}`}>🔍 Step 2: Download Components</p>
              <p>1. Enter chrome://components in the address bar.</p>
              <p>2. Find the "Optimization Guide On Device Model" item.</p>
              <p>3. Click the "Check for update" button below it.</p>
              <p>4. Verify if the status changes to "Up-to-date" or "Downloading...".</p>
            </div>
          </div>
        )}

        {activeTab === "check" && (
          <div className="space-y-3">
            <p className={`font-semibold ${theme.textMain}`}>Step 3: API Connection Status & Local Execution</p>
            <p>You can manually test if the Gemini Nano session is successfully created by entering the command below in the F12 developer console.</p>
            <pre className={`p-3 ${theme.bgInput} rounded-lg border ${theme.borderMuted} overflow-x-auto text-indigo-400 select-all font-mono text-[10px]`}>
{`const session = await window.ai.assistant.create();
const response = await session.prompt("Hello!");
console.log(response);`}
            </pre>
            <p className="text-emerald-500">✅ If you receive a normal response in the console, the on-device chatbot will run completely independently.</p>
          </div>
        )}

        {activeTab === "api_settings" && (
          <div className="space-y-3">
            <p className={`font-semibold ${theme.textMain}`}>Step 4: Configure External LLM API (Bypass Mode)</p>
            <p>You can also connect cloud APIs like OpenAI directly instead of the local Gemini Nano.</p>
            <div className={`p-3 ${theme.bgInput} rounded-lg border ${theme.borderMuted} space-y-2`}>
              <p>1. Turn on Bypass Mode in the popup or chatbot settings window.</p>
              <p>2. Register the API Key, API URL (e.g. OpenAI or Anthropic compatible address), and Model (e.g. gpt-4o-mini) you wish to use.</p>
              <p>3. All requests are sent directly from your browser, operating securely.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
