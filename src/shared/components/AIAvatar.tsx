import React from "react";
import { motion } from "framer-motion";

interface AIAvatarProps {
  avatarPath: string;
  size?: number;
  className?: string;
}

export function AIAvatar({ avatarPath, size = 32, className = "" }: AIAvatarProps) {
  const getAvatarUrl = (path: string) => {
    const defaultPath = "nanobots/bot-01.webp";
    let actualPath = path === "random" || path === undefined ? defaultPath : path;

    // Migrate obsolete/non-existent paths to bot-01.webp
    if (actualPath.includes("bot-default.png") || actualPath.includes("bot-cynic.png") || actualPath.includes("bot-mentor.png")) {
      actualPath = defaultPath;
    }

    if (actualPath.startsWith("http")) return actualPath;

    let cleanPath = actualPath;
    if (cleanPath.startsWith("/")) {
      cleanPath = cleanPath.slice(1);
    }
    if (cleanPath.startsWith("public/")) {
      cleanPath = cleanPath.replace("public/", "");
    }

    try {
      return chrome.runtime.getURL(cleanPath);
    } catch {
      return "/" + cleanPath;
    }
  };

  const path = avatarPath === "random" || avatarPath === undefined ? "nanobots/bot-01.webp" : avatarPath;
  const isImageAvatar = !!path;

  return (
    <motion.div
      whileHover={{ scale: 1.08, rotate: [0, -1.5, 1.5, 0] }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={`relative rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-400 p-[1px] shadow-lg shadow-indigo-500/20 ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden">
        {isImageAvatar ? (
          <img
            src={getAvatarUrl(path)}
            alt="AI Avatar"
            className="w-full h-full object-cover rounded-xl"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <svg
            width="80%"
            height="80%"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-indigo-400 animate-pulse"
          >
            <line
              x1="32"
              y1="16"
              x2="32"
              y2="6"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="32" cy="6" r="3.5" fill="#f43f5e" className="animate-ping" />
            <circle cx="32" cy="6" r="2.5" fill="#f43f5e" />
            <path
              d="M14 36C14 22 20 16 32 16C44 16 50 22 50 36"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <rect
              x="17"
              y="22"
              width="30"
              height="24"
              rx="9"
              fill="#0f172a"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <rect x="11" y="29" width="6" height="10" rx="3" fill="#6366f1" />
            <rect x="47" y="29" width="6" height="10" rx="3" fill="#6366f1" />
            <rect x="22" y="27" width="20" height="9" rx="4.5" fill="#1e1b4b" />
            <circle cx="28" cy="31.5" r="2.5" fill="#38bdf8" />
            <circle cx="36" cy="31.5" r="2.5" fill="#38bdf8" />
            <path
              d="M28 40C29.5 41.5 32.5 41.5 34 40"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="23" cy="33.5" r="1.5" fill="#f43f5e" opacity="0.6" />
            <circle cx="41" cy="33.5" r="1.5" fill="#f43f5e" opacity="0.6" />
          </svg>
        )}
      </div>
    </motion.div>
  );
}
