import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw]}
      components={{
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
      {content}
    </ReactMarkdown>
  );
}
