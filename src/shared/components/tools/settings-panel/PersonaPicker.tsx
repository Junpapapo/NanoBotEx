import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { UserSettings } from "../../../chatbot-types";
import { ThemePalette } from "../../../chatbot-constants";

interface PersonaPickerProps {
  theme: ThemePalette;
  settings: UserSettings;
  updateSettings: (s: Partial<UserSettings>) => void;
  t: any;
}

interface CustomPreset {
  id: string;
  label: string;
  value: string;
}

const DEFAULT_PRESETS = [
  {
    id: "preset-1",
    label: "⚡ Short-term Trader",
    value:
      "You are a cynical, strict technical analysis trading expert. Answer with data-focused metrics and highlight risks aggressively. Keep it extremely brief. Please reply in English.",
  },
  {
    id: "preset-2",
    label: "☕ Value Investing Mentor",
    value:
      "You are a warm, friendly value investing mentor like Warren Buffett. Focus on long-term values, company moats, stability, and growth potentials. Avoid short-term noise. Please reply in English.",
  },
  {
    id: "preset-3",
    label: "🔄 Restore Default",
    value:
      "You are a friendly and intelligent AI assistant named 'Nano AI'. Provide helpful, concise, and professional answers in English. Use markdown formatting when appropriate. Keep answers highly readable with bullet points or bold text.",
  },
];

export function PersonaPicker({
  theme,
  settings,
  updateSettings,
  t
}: PersonaPickerProps) {
  const isLight = settings.nano_skin_mode === "light";
  const [presets, setPresets] = useState<CustomPreset[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nano-custom-personas");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            // 기존 한국어 프리셋 또는 값에 한국어가 포함된 경우 영어 프리셋으로 마이그레이션
            const migrated = parsed.map((p: CustomPreset) => {
              const def = DEFAULT_PRESETS.find((d) => d.id === p.id);
              if (def) {
                const isOldKorean =
                  p.label === "⚡ 단기 트레이더" ||
                  p.label === "☕ 가치 투자 멘토" ||
                  p.label === "🔄 기본 복원" ||
                  p.value.includes("한국어");
                if (isOldKorean) {
                  return def;
                }
              }
              return p;
            });
            setPresets(migrated);
            localStorage.setItem("nano-custom-personas", JSON.stringify(migrated));
          } else {
            setPresets(DEFAULT_PRESETS);
            localStorage.setItem("nano-custom-personas", JSON.stringify(DEFAULT_PRESETS));
          }
        } catch (e) {
          console.error("Failed to load personas, using defaults:", e);
          setPresets(DEFAULT_PRESETS);
        }
      } else {
        setPresets(DEFAULT_PRESETS);
        localStorage.setItem("nano-custom-personas", JSON.stringify(DEFAULT_PRESETS));
      }
    }
  }, []);

  const savePresets = (updatedPresets: CustomPreset[]) => {
    setPresets(updatedPresets);
    if (typeof window !== "undefined") {
      localStorage.setItem("nano-custom-personas", JSON.stringify(updatedPresets));
    }
  };

  const handleCreate = () => {
    if (!newLabel.trim()) {
      alert(t("persona.alertLabelRequired", "성향의 라벨 이름을 입력해주세요."));
      return;
    }
    if (!newValue.trim()) {
      alert(t("persona.alertValueRequired", "성향 지침 내용을 입력해주세요."));
      return;
    }

    const newPreset: CustomPreset = {
      id: "preset-" + Date.now(),
      label: newLabel.trim(),
      value: newValue.trim(),
    };

    savePresets([...presets, newPreset]);
    setNewLabel("");
    setNewValue("");
    setIsAdding(false);
  };

  const startEdit = (preset: CustomPreset) => {
    setEditingId(preset.id);
    setEditingLabel(preset.label);
    setEditingValue(settings.nano_ai_persona || preset.value);
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (!editingLabel.trim()) {
      alert(t("persona.alertLabelRequired", "성향의 라벨 이름을 입력해주세요."));
      return;
    }
    if (!editingValue.trim()) {
      alert(t("persona.alertValueRequired", "성향 지침 내용을 입력해주세요."));
      return;
    }

    const updated = presets.map((p) =>
      p.id === editingId ? { ...p, label: editingLabel.trim(), value: editingValue.trim() } : p
    );
    savePresets(updated);

    const targetPreset = presets.find((p) => p.id === editingId);
    if (targetPreset && settings.nano_ai_persona === targetPreset.value) {
      updateSettings({ nano_ai_persona: editingValue.trim() });
    }

    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("persona.deleteConfirm", "이 성향 프리셋을 삭제하시겠습니까?"))) {
      const filtered = presets.filter((p) => p.id !== id);
      savePresets(filtered);
      if (editingId === id) setEditingId(null);
    }
  };

  const currentPersona = settings.nano_ai_persona || "";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center select-none">
        <label className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">
          {t("persona.title", "AI 성향 (Persona)")}
        </label>
        
        <button
          type="button"
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setNewLabel("");
            setNewValue(settings.nano_ai_persona || "");
          }}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold cursor-pointer transition-all ${
            isLight
              ? "border-slate-250 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm"
              : "border-white/[0.06] bg-slate-900 text-slate-400 hover:text-white"
          }`}
          title={t("persona.addBtnTooltip", "새로운 성향 프리셋을 추가합니다")}
        >
          <Plus size={10} />
          {t("persona.addBtn", "성향 등록")}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const isSelected = currentPersona.trim() === preset.value.trim();
          return (
            <div key={preset.id} className="relative group/preset-btn flex items-center">
              <button
                type="button"
                onClick={() => updateSettings({ nano_ai_persona: preset.value })}
                className={`pr-7 pl-2 py-1 border text-[9px] rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 ${
                  isSelected
                    ? `${theme.bgMuted} ${theme.text} ${theme.border} scale-105`
                    : isLight
                      ? "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm"
                      : "bg-slate-950/60 hover:bg-slate-900 border border-white/[0.05] text-slate-400 hover:text-slate-200"
                }`}
              >
                {preset.label}
              </button>

              <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/preset-btn:opacity-100 transition-opacity duration-200 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(preset);
                  }}
                  className="p-0.5 rounded hover:bg-black/5 text-slate-400 hover:text-indigo-500 cursor-pointer"
                  title={t("persona.editTooltip", "편집 (이름 및 내용 수정)")}
                >
                  <Pencil size={8} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(preset.id);
                  }}
                  className="p-0.5 rounded hover:bg-black/5 text-slate-400 hover:text-rose-500 cursor-pointer"
                  title={t("persona.deleteTooltip", "삭제")}
                >
                  <Trash2 size={8} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
        <div className={`p-2.5 rounded-xl border ${theme.borderMuted} ${isLight ? "bg-slate-50" : "bg-slate-900/60"} space-y-2 text-[10px] animate-in slide-in-from-top-1 duration-200`}>
          <div className="font-extrabold text-slate-500 uppercase tracking-wider text-[8px]">
            {t("persona.registerTitle", "현재 지침 내용을 새 성향으로 등록")}
          </div>
          <div className="space-y-1.5">
            <input
              type="text"
              placeholder={t("persona.labelPlaceholder", "라벨 이름 입력 (예: 경제 분석가)")}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className={`w-full rounded-lg px-2.5 py-1.5 outline-none border text-[10px] ${
                isLight
                  ? "bg-white border-slate-200 text-slate-800"
                  : "bg-slate-950 border-white/[0.08] text-white"
              } ${theme.focusBorder}`}
            />
            <textarea
              rows={3}
              placeholder={t("persona.valuePlaceholder", "성향 지침 프롬프트 내용")}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className={`w-full rounded-lg px-2.5 py-1.5 outline-none border text-[10px] resize-none ${
                isLight
                  ? "bg-white border-slate-200 text-slate-800"
                  : "bg-slate-950 border-white/[0.08] text-white"
              } ${theme.focusBorder}`}
            />
          </div>
          <div className="flex justify-end gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleCreate}
              className={`px-3 py-1.5 rounded-lg text-white font-extrabold text-[9px] cursor-pointer transition-all ${theme.primary} hover:opacity-90 shadow-sm`}
            >
              {t("persona.saveBtn", "등록")}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={`px-3 py-1.5 rounded-lg border font-extrabold text-[9px] cursor-pointer ${
                isLight
                  ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                  : "bg-slate-950 border-white/[0.08] text-slate-405 hover:bg-slate-900"
              }`}
            >
              {t("persona.cancelBtn", "취소")}
            </button>
          </div>
        </div>
      )}

      {editingId && (
        <div className={`p-2.5 rounded-xl border ${theme.borderMuted} ${isLight ? "bg-slate-50" : "bg-slate-900/60"} space-y-2 text-[10px] animate-in slide-in-from-top-1 duration-200`}>
          <div className="font-extrabold text-slate-500 uppercase tracking-wider text-[8px] flex justify-between items-center">
            <span>{t("persona.editTitle", "성향 이름 및 지침 편집")}</span>
            <span className="text-[7.5px] text-slate-400 font-normal">{t("persona.editSubtitle", "*(변경 사항을 템플릿에 저장)*")}</span>
          </div>
          <div className="space-y-1.5">
            <input
              type="text"
              placeholder={t("persona.editLabelPlaceholder", "라벨 이름 입력")}
              value={editingLabel}
              onChange={(e) => setEditingLabel(e.target.value)}
              className={`w-full rounded-lg px-2.5 py-1.5 outline-none border text-[10px] ${
                isLight
                  ? "bg-white border-slate-200 text-slate-800"
                  : "bg-slate-950 border-white/[0.08] text-white"
              } ${theme.focusBorder}`}
            />
            <textarea
              rows={3}
              placeholder={t("persona.editValuePlaceholder", "성향 지침 프롬프트 내용")}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              className={`w-full rounded-lg px-2.5 py-1.5 outline-none border text-[10px] resize-none ${
                isLight
                  ? "bg-white border-slate-200 text-slate-800"
                  : "bg-slate-950 border-white/[0.08] text-white"
              } ${theme.focusBorder}`}
            />
          </div>
          <div className="flex justify-end gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleSaveEdit}
              className={`px-3 py-1.5 rounded-lg text-white font-extrabold text-[9px] cursor-pointer transition-all ${theme.primary} hover:opacity-90 shadow-sm`}
            >
              {t("persona.updateBtn", "저장")}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className={`px-3 py-1.5 rounded-lg border font-extrabold text-[9px] cursor-pointer ${
                isLight
                  ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                  : "bg-slate-950 border-white/[0.08] text-slate-405 hover:bg-slate-900"
              }`}
            >
              {t("persona.cancelBtn", "취소")}
            </button>
          </div>
        </div>
      )}

      <textarea
        value={settings.nano_ai_persona || ""}
        onChange={(e) => updateSettings({ nano_ai_persona: e.target.value })}
        rows={5}
        placeholder={t("persona.textareaPlaceholder", "AI의 성향 및 답변 방식을 직접 설정하세요...")}
        className={`w-full ${
          isLight
            ? "bg-white border-slate-200 text-slate-800"
            : "bg-slate-950 border border-white/[0.08] text-white"
        } ${theme.focusBorder} rounded-xl p-2.5 outline-none resize-none font-medium leading-relaxed custom-scrollbar text-xs`}
      />
    </div>
  );
}
