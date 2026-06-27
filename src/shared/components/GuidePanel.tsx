import React, { useState, useEffect } from "react";
import { Cpu, ShieldCheck } from "lucide-react";

export function GuidePanel({ 
  theme, 
  isBuddy = false, 
  initialTab 
}: { 
  t?: any; 
  theme: any; 
  isBuddy?: boolean; 
  initialTab?: string; 
}) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (initialTab) return initialTab;
    return isBuddy ? "buddy_reset" : "flags";
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs = isBuddy 
    ? (["buddy_reset", "buddy_crypto", "buddy_personality"] as const)
    : (["flags", "api", "check", "api_settings"] as const);

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit p-4 overflow-y-auto custom-scrollbar">
      <div className={`flex items-center gap-2 pb-4 border-b ${theme.borderMuted} pr-16`}>
        {isBuddy ? (
          <ShieldCheck className="h-5 w-5 text-purple-400" />
        ) : (
          <Cpu className="h-5 w-5 text-indigo-400" />
        )}
        <span className={`text-sm font-bold ${theme.textMain}`}>
          {isBuddy ? "Private AI Buddy Privacy & Usage Guide" : "On-Device AI & External API Guide"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 my-4">
        {tabs.map(tab => (
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
              : tab === "api_settings"
              ? "4. External API"
              : tab === "buddy_reset"
              ? "🗑️ Reset Chats & Memories"
              : tab === "buddy_crypto"
              ? "🔒 AES-256 Encryption"
              : "🎨 Personality Config"}
          </button>
        ))}
      </div>

      <div className={`flex-1 text-xs leading-relaxed ${theme.textSub} space-y-4`}>
        {/* 일반 봇 가이드 탭들 */}
        {!isBuddy && activeTab === "flags" && (
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

        {!isBuddy && activeTab === "api" && (
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

        {!isBuddy && activeTab === "check" && (
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

        {!isBuddy && activeTab === "api_settings" && (
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

        {/* 버디 가이드 탭들 */}
        {isBuddy && activeTab === "buddy_reset" && (
          <div className="space-y-3">
            <p className={`font-semibold ${theme.textMain}`}>🗑️ How to Reset Buddy Chats & Memories</p>
            <p>All chat logs and memory data with your Buddy are isolated from the main chatbot's reset button and securely preserved for privacy.</p>
            <div className={`p-3 ${theme.bgInput} rounded-lg border ${theme.borderMuted} space-y-2`}>
              <p>1. Click the Buddy avatar icon at the bottom of the right vertical menu bar to enter the Buddy Chat view.</p>
              <p>2. Click the trash bin (🗑️) icon located at the top-right corner of the Buddy Settings Panel.</p>
              <p>3. Enter and verify your configured Buddy password.</p>
              <p className="text-rose-400 font-bold">⚠️ Upon verification, all AES-GCM encrypted chat history, stored memories, and encryption keys saved on your local device will be permanently deleted without any trace.</p>
            </div>
          </div>
        )}

        {isBuddy && activeTab === "buddy_crypto" && (
          <div className="space-y-3">
            <p className={`font-semibold ${theme.textMain}`}>🔒 AES-256 Local Encryption Principle</p>
            <p>Your Buddy's top priority is privacy and security. No chat logs or personal information are ever transmitted to external clouds or networks.</p>
            <div className={`p-3 ${theme.bgInput} rounded-lg border ${theme.borderMuted} space-y-2`}>
              <p className={`font-bold ${theme.textMain}`}>🛡️ Web Crypto API Encryption Details</p>
              <p>• <strong>Symmetric Key Algorithm</strong>: Uses the high-performance W3C standard AES-GCM 256-bit encryption to protect local storage (Chrome Storage) data at a hardware-equivalent level.</p>
              <p>• <strong>Secure Key Derivation</strong>: Generates a master key using the PBKDF2 key derivation algorithm by combining user-defined passwords with a random salt.</p>
              <p>• <strong>Memory Volatility</strong>: When the browser session is closed or logged out, the decryption key in memory is instantly and securely volatilized, preventing any recovery.</p>
            </div>
          </div>
        )}

        {isBuddy && activeTab === "buddy_personality" && (
          <div className="space-y-3">
            <p className={`font-semibold ${theme.textMain}`}>🎨 Presets & Custom Personality Configuration</p>
            <p>You can freely customize your Buddy to have a unique personality, tone of voice, and identity.</p>
            <div className={`p-3 ${theme.bgInput} rounded-lg border ${theme.borderMuted} space-y-2`}>
              <p>• <strong>Personality Presets</strong>: Choose from 7 built-in presets—including Caring Friend, Cheerful Buddy, Tsundere, and Wise Mentor—to start conversing.</p>
              <p>• <strong>Custom Personality</strong>: Select ✏️ Custom Personality from the preset list to reveal input fields where you can describe roleplay scenarios, behavioral instructions, taboo words, and titles for your Buddy. Bring your ideal virtual companion to life.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
