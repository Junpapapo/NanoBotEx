import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";

interface MarkdownViewerProps {
  content: string;
}

// 텍스트 본문 내의 원시 URL을 마크다운 링크 포맷 [URL](URL)로 변환해주는 헬퍼
const linkifyRawUrls = (text: string): string => {
  if (!text) return "";
  // 이미 존재하는 마크다운 링크 [text](url) 구조는 그대로 두고, 단독으로 존재하는 raw URL만 마크다운 링크로 변환
  const markdownLinkOrUrlRegex = /(\[.*?\]\(.*?\))|(?<!href=")(https?:\/\/[^\s<]+)/gi;
  return text.replace(markdownLinkOrUrlRegex, (match, p1) => {
    if (p1) return p1; // 이미 마크다운 링크 포맷인 경우 원본 유지
    return `[${match}](${match})`;
  });
};

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const processedContent = React.useMemo(() => linkifyRawUrls(content), [content]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw]}
      components={{
        a: ({ href, children, ...props }) => {
          const handleLinkClick = (e: React.MouseEvent) => {
            e.preventDefault();
            if (href) {
              if (typeof chrome !== "undefined" && chrome.tabs) {
                chrome.tabs.create({ url: href });
              } else {
                window.open(href, "_blank");
              }
            }
          };
          return (
            <a
              href={href}
              onClick={handleLinkClick}
              className="text-indigo-400 hover:text-indigo-300 underline font-bold cursor-pointer break-all"
              {...props}
            >
              {children}
            </a>
          );
        },
        pre: ({ node, ...props }) => (
          <pre
            className="bg-slate-500/10 p-3 rounded-lg overflow-x-auto text-[11px] font-mono border border-white/[0.05]"
            {...props}
          />
        ),
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");
          const isInline = !match && !codeString.includes("\n");
          return isInline ? (
            <code
              className="bg-slate-500/10 px-1 py-0.5 rounded text-[11px] font-mono text-indigo-400"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code className="block text-[11px] font-mono" {...props}>
              {children}
            </code>
          );
        },
        table: ({ node, ...props }) => (
          <table
            className="w-full border-collapse my-3 text-[11.5px]"
            {...props}
          />
        ),
        th: ({ node, ...props }) => (
          <th
            className="border border-slate-500/20 px-2 py-1 bg-slate-500/5 font-black text-left"
            {...props}
          />
        ),
        td: ({ node, ...props }) => (
          <td className="border border-slate-500/20 px-2 py-1" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-indigo-500 pl-3 italic text-slate-400 my-2"
            {...props}
          />
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
