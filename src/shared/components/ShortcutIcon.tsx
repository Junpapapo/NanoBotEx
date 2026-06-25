import React from "react";
import { icons } from "lucide-react";
import * as Icons from "lucide-react";

interface ShortcutIconProps {
  iconName: string;
  size?: number;
  className?: string;
}

export default function ShortcutIcon({ iconName, size = 14, className = "" }: ShortcutIconProps) {
  if (!iconName) {
    return <Icons.Sparkles size={size} className={className} />;
  }

  // 1. Emoji 처리 (예: emoji:🚀)
  if (iconName.startsWith("emoji:")) {
    const emoji = iconName.replace("emoji:", "");
    return (
      <span 
        className={`inline-flex items-center justify-center select-none ${className}`} 
        style={{ 
          fontSize: `${size + 2}px`, 
          width: `${size + 4}px`, 
          height: `${size + 4}px`, 
          lineHeight: 1 
        }}
      >
        {emoji}
      </span>
    );
  }

  // 2. Lucide Icon 처리 (예: lucide:TrendingUp)
  if (iconName.startsWith("lucide:")) {
    const name = iconName.replace("lucide:", "");
    const IconComp = (icons as any)[name];
    if (IconComp) {
      return <IconComp size={size} className={className} />;
    }
    return <Icons.Sparkles size={size} className={className} />;
  }

  // 3. 레거시 숫자 및 일반 아이콘 이름 매핑 처리 (예: Num0, TrendingUp)
  if (iconName.startsWith("Num")) {
    const num = iconName.replace("Num", "");
    const colors: Record<string, string> = {
      "0": "text-slate-300 border-slate-500/40 bg-slate-950/20",
      "1": "text-rose-400 border-rose-500/30 bg-rose-950/10",
      "2": "text-orange-400 border-orange-500/30 bg-orange-950/10",
      "3": "text-amber-400 border-amber-500/30 bg-amber-950/10",
      "4": "text-emerald-400 border-emerald-500/30 bg-emerald-950/10",
      "5": "text-teal-400 border-teal-500/30 bg-teal-950/10",
      "6": "text-sky-400 border-sky-500/30 bg-sky-950/10",
      "7": "text-indigo-400 border-indigo-500/30 bg-indigo-950/10",
      "8": "text-purple-400 border-purple-500/30 bg-purple-950/10",
      "9": "text-pink-400 border-pink-500/30 bg-pink-950/10"
    };
    const colorClass = colors[num] || "text-indigo-300 border-indigo-500/30 bg-indigo-950/10";
    return (
      <div 
        className={`flex items-center justify-center font-black font-mono leading-none border rounded-full select-none ${colorClass} ${className}`} 
        style={{ 
          width: `${size + 4}px`, 
          height: `${size + 4}px`, 
          fontSize: `${size - 3}px` 
        }}
      >
        {num}
      </div>
    );
  }

  const LegacyIconComp = (icons as any)[iconName];
  if (LegacyIconComp) {
    return <LegacyIconComp size={size} className={className} />;
  }

  return <Icons.Sparkles size={size} className={className} />;
}
