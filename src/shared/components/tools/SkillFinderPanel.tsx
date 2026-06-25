import React, { useState } from "react";
import { Compass, Search, Download, Check, AlertCircle, RotateCw, ExternalLink } from "lucide-react";
import { API_BASE_URL } from "../../chatbot-constants";

interface SkillFinderPanelProps {
  t: any;
  theme: any;
}

interface SearchedSkill {
  id: string;
  name: string;
  author: string;
  installs: string;
  url: string;
}
export function SkillFinderPanel({ t, theme }: SkillFinderPanelProps) {
  const [inputText, setInputText] = useState<string>("");
  const [results, setResults] = useState<SearchedSkill[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSearch = async () => {
    if (!inputText.trim()) return;
    setSearching(true);
    setMessage(null);
    setResults([]);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/search-skills?query=${encodeURIComponent(inputText)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        if (data.length === 0) {
          setMessage({ type: "error", text: t("skills.finder.noResults", "검색 결과가 없습니다.") });
        }
      } else {
        setMessage({ type: "error", text: t("skills.finder.searchFailed", "스킬 검색에 실패했습니다.") });
      }
    } catch (err) {
      console.warn("Search skills failed:", err);
      setMessage({ type: "error", text: t("skills.finder.serverError", "서버 연결에 실패했습니다.") });
    } finally {
      setSearching(false);
    }
  };

  const handleInstall = async (skill: SearchedSkill) => {
    if (installingId) return;
    setInstallingId(skill.id);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/install-skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_id: skill.id })
      });

      if (res.ok) {
        setMessage({ 
          type: "success", 
          text: t("skills.finder.installSuccess", "스킬 '{name}'이(가) 성공적으로 설치되었습니다.").replace("{name}", skill.name) 
        });
        
        // 스킬 목록 서버에서 새로 불러와서 chrome.storage.local에 동기화
        const skillsRes = await fetch(`${API_BASE_URL}/api/chatbot/skills`);
        if (skillsRes.ok) {
          const updatedSkills = await skillsRes.json();
          if (chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ user_skills: updatedSkills });
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: errData.detail || t("skills.finder.installFailed", "스킬 설치에 실패했습니다.") });
      }
    } catch (err) {
      console.warn("Install skill failed:", err);
      setMessage({ type: "error", text: t("skills.finder.serverError", "서버 연결에 실패했습니다.") });
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit p-4 overflow-y-auto custom-scrollbar">
      {/* 헤더 */}
      <div className={`flex justify-between items-center select-none border-b ${theme.borderMuted} pb-3 pr-16`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          <Compass size={15} className="text-amber-500 animate-spin-slow" />
          {t("skills.finder.title", "스킬 탐색기")}
        </span>
      </div>

      {/* 키워드 입력 필드 */}
      <div className="flex gap-1.5 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder={t("skills.finder.inputPlaceholder", "검색할 스킬 키워드를 입력하세요...")}
          className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-3 py-2 text-xs ${theme.textMain} outline-none focus:border-amber-500/50`}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !inputText.trim()}
          className="px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 transition cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          title={t("skills.finder.searchTooltip", "검색")}
        >
          {searching ? (
            <RotateCw size={12} className="animate-spin text-amber-500" />
          ) : (
            <Search size={12} />
          )}
        </button>
      </div>

      {/* 안내 또는 에러 메시지 */}
      {message && (
        <div className={`p-2.5 rounded-lg text-xs leading-normal font-semibold flex items-start gap-1.5 border animate-in fade-in slide-in-from-top-1 duration-200 ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/25 text-rose-400"
        }`}>
          {message.type === "success" ? <Check size={13} className="mt-0.5" /> : <AlertCircle size={13} className="mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 검색 결과 리스트 */}
      <div className="flex-1 min-h-0 flex flex-col space-y-2">
        <span className={`text-[10px] ${theme.textSub} font-bold select-none pl-1`}>{t("skills.finder.results", "검색 결과")}</span>
        <div className={`w-full flex-1 rounded-xl border ${theme.borderMuted} ${theme.bgInput} overflow-y-auto custom-scrollbar p-2.5 space-y-2.5 min-h-[160px]`}>
          {results.length > 0 ? (
            results.map((skill) => {
              const isInstalling = installingId === skill.id;
              return (
                <div 
                  key={skill.id} 
                  className={`p-2.5 rounded-lg border ${theme.borderMuted} ${theme.bgSub} flex flex-col space-y-2.5 hover:${theme.bgHover} transition duration-200`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className={`text-xs font-bold ${theme.textMain} truncate`} title={skill.name}>
                        {skill.name}
                      </span>
                      <span className={`text-[10px] ${theme.textSub} font-medium truncate mt-0.5`} title={skill.author}>
                        by {skill.author}
                      </span>
                    </div>
                    {/* 링크 */}
                    <a
                      href={skill.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} transition-all cursor-pointer flex items-center justify-center`}
                      title={t("skills.finder.infoTooltip", "스킬 정보 확인")}
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/[0.05]">
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded font-black font-mono">
                      {skill.installs} installs
                    </span>

                    <button
                      type="button"
                      onClick={() => handleInstall(skill)}
                      disabled={!!installingId}
                      className="px-2.5 py-1 rounded-md border border-amber-500/35 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 transition-all cursor-pointer font-bold text-[10px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isInstalling ? (
                        <>
                          <RotateCw size={10} className="animate-spin" />
                          <span>{t("skills.finder.installing", "설치 중...")}</span>
                        </>
                      ) : (
                        <>
                          <Download size={10} />
                          <span>{t("skills.finder.install", "설치")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : !searching && !message ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 select-none opacity-50 space-y-2">
              <Search size={18} className="text-slate-500" />
              <span className={`text-[10.5px] ${theme.textSub} font-medium whitespace-pre-line leading-relaxed`}>
                {t("skills.finder.placeholderDesc", "키워드를 입력해\n새로운 AI 봇 스킬을 검색하세요.")}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
