import React, { useState, useEffect, useRef } from "react";
import { MarkdownViewer } from "./MarkdownViewer";
import {
  FileText,
  Eye,
  Edit2,
  History,
  Download,
  Copy,
  Printer,
  Check,
  Trash2,
  Save,
  Sparkles,
  Loader2,
  RotateCcw,
  Bookmark,
} from "lucide-react";
import { useChromeStorage } from "../../hooks/useChromeStorage";
import { CustomDialog } from "../CustomDialog";

interface ViewerDoc {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

interface DocViewerPanelProps {
  activeDoc: { title: string; content: string } | null;
  setActiveDoc: React.Dispatch<
    React.SetStateAction<{ title: string; content: string } | null>
  >;
  theme: any;
  t: any;
  locale: string;
}

export function DocViewerPanel({
  activeDoc,
  setActiveDoc,
  theme,
  t,
  locale,
}: DocViewerPanelProps) {
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "edit" | "history">(
    "preview",
  );
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [isRefining, setIsRefining] = useState(false);
  const [prevDocBeforeRefine, setPrevDocBeforeRefine] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [refineSuccess, setRefineSuccess] = useState(false);
  const [activeToast, setActiveToast] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // 로컬 스토리지 기반 최근 열어본 문서 히스토리 관리
  const [history, setHistory, isHistoryLoaded] = useChromeStorage<ViewerDoc[]>(
    "nanobot-viewer-history",
    [],
  );

  // 인쇄 및 HTML 다운로드용 폰트 크기 선택 상태 (S / M / L, 기본값 M)
  const [printFontSize, setPrintFontSize] = useChromeStorage<"S" | "M" | "L">(
    "nanobot-print-font-size",
    "M",
  );

  // 로컬 스토리지 기반 메모 목록 상태 연동
  const [notes, setNotes] = useChromeStorage<any[]>(
    "nanobot-tool-notes",
    [],
  );
  // 활성 메모 ID 상태 연동
  const [activeNoteId, setActiveNoteId] = useChromeStorage<string | null>(
    "nanobot-tool-active-note-id",
    null,
  );

  // 크기별 폰트 스타일 매핑 헬퍼
  const getFontSizeStyles = (size: "S" | "M" | "L") => {
    return {
      S: { body: "11px", h1: "17px", h2: "13px", h3: "11px", other: "10px" },
      M: { body: "13px", h1: "20px", h2: "15px", h3: "13px", other: "12px" },
      L: { body: "16px", h1: "24px", h2: "18px", h3: "15px", other: "14px" },
    }[size];
  };

  // 외부(대화방/메모장)에서 전송된 마지막 문서 정보 캐싱
  const lastProcessedDocRef = useRef<{ title: string; content: string } | null>(
    null,
  );

  // 1. props로 새 문서가 전송되면 상태 업데이트 및 히스토리에 자동 추가
  useEffect(() => {
    if (activeDoc) {
      const title =
        activeDoc.title.trim() ||
        t("docViewer.titlePlaceholder", "제목 없는 문서");
      const content = activeDoc.content;

      // 이미 처리(캐싱)된 마지막 문서와 props가 일치하는지 비교하여 불필요한 원복 및 덮어쓰기 방지
      const isAlreadyProcessed =
        lastProcessedDocRef.current &&
        lastProcessedDocRef.current.title === title &&
        lastProcessedDocRef.current.content === content;

      if (!isAlreadyProcessed) {
        // 캐시 업데이트
        lastProcessedDocRef.current = { title, content };
        setPrevDocBeforeRefine(null);

        // 외부에서 진짜 새로운 문서가 왔을 때만 상태 업데이트
        setDocTitle(title);
        setDocContent(content);
        setActiveTab("preview");

        // 크롬 로컬 스토리지 비동기 로드가 완료된 후에만 히스토리에 추가하여 데이터 무시 방지
        if (isHistoryLoaded) {
          setHistory((prev) => {
            const filtered = prev.filter(
              (item) => !(item.title === title && item.content === content),
            );
            const newDoc: ViewerDoc = {
              id:
                "doc-" +
                Date.now() +
                Math.random().toString(36).substring(3, 8),
              title,
              content,
              timestamp: Date.now(),
            };
            return [newDoc, ...filtered].slice(0, 15);
          });
        }
      }
    }
  }, [activeDoc, isHistoryLoaded, setHistory, t]);

  // AI 편집 및 정리 기능 (Gemini Nano)
  const handleAIRefine = async () => {
    if (!docContent.trim() || isRefining) return;
    setIsRefining(true);

    try {
      // 1. 문서 포맷 감지 (HTML 태그 여부 체크)
      const isHtml = /<\/?[a-z][\s\S]*>/i.test(docContent);
      const formatName = isHtml ? "HTML" : "Markdown";

      // locale에 따른 대상 언어 명칭 매핑
      const langName =
        locale === "ko" ? "Korean" : locale === "ja" ? "Japanese" : "English";

      // 2. prompt 생성
      const systemPrompt = `You are an expert document editor. Analyze the provided document, thoroughly supplement any lacking information, and refine it into a highly polished, comprehensive document.

Constraints:

1.Maintain and Expand Format: You must strictly maintain the original input format (${formatName} format). However, if the input includes a 'Table', do not restrict yourself only to the cells. You must elaborate on the contents within the cells AND add separate paragraphs (e.g., detailed explanations, additional examples, practical applications) below the table to significantly enrich the content.
2.Language Consistency: The final output must perfectly match the language of the input document (specifically, ${langName}).
3.Refinement and Quality: Do not simply copy and paste the input. Focus on improving clarity, logical flow, and filling in genuinely missing details. Keep the text concise and professional, and avoid making it unnecessarily long or adding repetitive explanations.

4.Title Generation Rules:
- You MUST independently generate a NEW, appropriate, and concise title representing the core topic of the refined content. Do NOT reuse the original title if it is just a sentence snippet.
- For Markdown, the very first line of your output MUST start with '# ' followed by the new title (e.g., '# New Document Title').
- For HTML, the very first line of your output MUST start with '<h1>' followed by the new title (e.g., '<h1>New Document Title</h1>').

5.Output Restrictions: Strictly omit any conversational filler, introductions, conclusions, or polite remarks (e.g., "Here is the revised document," "Hope this helps"). Output only the final refined document data.`;

      // 실행 직전의 상태 백업 (되돌리기용)
      setPrevDocBeforeRefine({ title: docTitle, content: docContent });

      // AI에게 제공할 프롬프트 텍스트
      const promptText = isHtml
        ? `<h1>${docTitle || t("docViewer.titlePlaceholder", "제목 없는 문서")}</h1>\n\n${docContent}`
        : `# ${docTitle || t("docViewer.titlePlaceholder", "제목 없는 문서")}\n\n${docContent}`;

      // 백그라운드 서비스 워커로 AI 처리 릴레이
      chrome.runtime.sendMessage(
        {
          action: "refine_document_ai",
          systemPrompt,
          promptText,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Relay Error:", chrome.runtime.lastError);
            setAlertDialog({
              title: t("docViewer.aiErrorTitle", "AI 오류"),
              message:
                t(
                  "docViewer.aiErrorMessage",
                  "AI 편집 중 오류가 발생했습니다.",
                ) + ` (${chrome.runtime.lastError.message})`,
            });
            setIsRefining(false);
            return;
          }

          if (response && response.success) {
            const result = response.result;
            console.log("AI Raw Output from Background Relay:", result);

            let refinedTitle = "";
            let refinedContent = result.trim();

            // 백틱 마크다운 코드 감싸개(```markdown ... ```)가 있는 경우 이를 우선 걷어냄
            if (refinedContent.startsWith("```")) {
              refinedContent = refinedContent
                .replace(/^```[a-zA-Z]*\n/, "")
                .replace(/\n```$/, "")
                .trim();
            }

            let titleExtracted = false;

            if (isHtml) {
              // HTML <h1> 태그 추출
              const htmlTitleMatch =
                refinedContent.match(/<h1>([\s\S]*?)<\/h1>/i);
              if (htmlTitleMatch) {
                // HTML 태그 제거하여 텍스트만 추출
                refinedTitle = htmlTitleMatch[1]
                  .replace(/<\/?[^>]+(>|$)/g, "")
                  .trim();
                // <h1> 태그 영역을 본문에서 지움
                refinedContent = refinedContent
                  .replace(/<h1>[\s\S]*?<\/h1>/i, "")
                  .trim();
                titleExtracted = true;
              }
            } else {
              // 마크다운 최상단 헤더 '# ' 추출
              const mdTitleMatch = refinedContent.match(/^#\s+(.+)$/m);
              if (mdTitleMatch) {
                refinedTitle = mdTitleMatch[1].replace(/[#*`_-]/g, "").trim();
                // '# 제목' 라인을 본문에서 지움
                refinedContent = refinedContent.replace(/^#\s+.+$/m, "").trim();
                titleExtracted = true;
              }
            }

            // 만약 명시적인 <h1> 이나 '#' 헤더로 제목을 추출하지 못했다면 첫 줄 Fallback 적용
            if (!titleExtracted) {
              const lines = refinedContent.split("\n");
              const firstLine = lines[0].trim();
              if (firstLine && firstLine.length <= 60) {
                refinedTitle = firstLine.replace(/[#*`_-]/g, "").trim();
                refinedContent = lines.slice(1).join("\n").trim();
                titleExtracted = true;
              }
            }

            // 제목이 추출되지 않았다면 기존 제목 유지
            if (!refinedTitle) {
              refinedTitle = docTitle;
            }

            // 만약 지우고 난 본문이 비어있다면, 원본 AI 결과를 본문으로 보존 (세이프가드)
            if (!refinedContent) {
              refinedContent = result.trim();
            }

            if (refinedContent) {
              const finalTitle =
                refinedTitle ||
                t("docViewer.titlePlaceholder", "제목 없는 문서");
              setDocTitle(finalTitle);
              setDocContent(refinedContent);
              setActiveDoc({ title: finalTitle, content: refinedContent });

              // 히스토리 업데이트
              setHistory((prev) => {
                const filtered = prev.filter(
                  (item) =>
                    !(
                      item.title === finalTitle &&
                      item.content === refinedContent
                    ),
                );
                const newDoc: ViewerDoc = {
                  id: "doc-" + Date.now(),
                  title: finalTitle,
                  content: refinedContent,
                  timestamp: Date.now(),
                };
                return [newDoc, ...filtered].slice(0, 15);
              });

              // 결과 확인을 위해 프리뷰 탭으로 이동 및 캐시 업데이트
              lastProcessedDocRef.current = { title: finalTitle, content: refinedContent };
              setActiveTab("preview");

              // 성공 비주얼 피드백 표시
              setRefineSuccess(true);
              setTimeout(() => setRefineSuccess(false), 2000);

              setActiveToast({
                title: t(
                  "docViewer.aiRefineSuccessToastTitle",
                  "✨ AI 문서 편집 완료",
                ),
                message: t(
                  "docViewer.aiRefineSuccessToastMessage",
                  "제공된 타이틀과 본문을 깔끔하게 정리했습니다.",
                ),
              });
            }
          } else {
            console.error("AI Refine Failed:", response?.error);
            setAlertDialog({
              title: t("docViewer.aiNotSupported", "로컬 AI 미지원"),
              message:
                response?.error ||
                t("docViewer.aiNotSupported", "로컬 AI를 사용할 수 없습니다."),
            });
          }
          setIsRefining(false);
        },
      );
    } catch (error: any) {
      console.error("AI Refine Error:", error);
      setAlertDialog({
        title: t("docViewer.aiErrorTitle", "AI 오류"),
        message:
          error?.message ||
          t("docViewer.aiErrorMessage", "AI 편집 중 오류가 발생했습니다."),
      });
      setIsRefining(false);
    }
  };

  // AI 편집 이전으로 복구
  const handleUndoRefine = () => {
    if (prevDocBeforeRefine) {
      setDocTitle(prevDocBeforeRefine.title);
      setDocContent(prevDocBeforeRefine.content);
      setActiveDoc({
        title: prevDocBeforeRefine.title,
        content: prevDocBeforeRefine.content,
      });
      // 되돌린 값으로 캐시 업데이트
      lastProcessedDocRef.current = {
        title: prevDocBeforeRefine.title,
        content: prevDocBeforeRefine.content,
      };
      setPrevDocBeforeRefine(null);
    }
  };

  // 2. 텍스트 수동 편집 후 로컬 저장
  const handleSaveEdit = () => {
    if (!docContent.trim()) return;
    const title =
      docTitle.trim() || t("docViewer.titlePlaceholder", "제목 없는 문서");

    // 수동 저장한 값으로 캐시 업데이트
    lastProcessedDocRef.current = { title, content: docContent };
    setActiveDoc({ title, content: docContent });

    setHistory((prev) => {
      // 기존 현재 문서가 히스토리에 있으면 삭제하고 맨 위에 삽입
      const filtered = prev.filter(
        (item) => !(item.title === title && item.content === docContent),
      );
      const updatedDoc: ViewerDoc = {
        id: "doc-" + Date.now(),
        title,
        content: docContent,
        timestamp: Date.now(),
      };
      return [updatedDoc, ...filtered].slice(0, 15);
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  // 3. 히스토리에서 문서 로드
  const handleLoadFromHistory = (doc: ViewerDoc) => {
    setDocTitle(doc.title);
    setDocContent(doc.content);
    setActiveTab("preview");
    // 캐시 정보도 업데이트하여 동일 문서를 다시 외부에서 보낼 때 오작동 없이 리로드될 수 있게 함
    lastProcessedDocRef.current = { title: doc.title, content: doc.content };
    setActiveDoc({ title: doc.title, content: doc.content });
  };

  // 4. 히스토리 개별 삭제
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // 5. 히스토리 전체 삭제
  const handleClearHistory = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmClear = () => {
    setHistory([]);
    setIsConfirmOpen(false);
  };

  // 4.5 메모장에 새 메모로 추가 저장
  const handleSaveToMemo = () => {
    if (!docContent.trim()) return;
    const title =
      docTitle.trim() || t("docViewer.titlePlaceholder", "제목 없는 문서");
    const newNoteId =
      "note-" +
      Date.now() +
      Math.random().toString(36).substring(3, 8);

    const newNote = {
      id: newNoteId,
      title,
      content: docContent,
      updatedAt: Date.now(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNoteId);

    setActiveToast({
      title: t("docViewer.memoSavedToastTitle", "📝 메모 저장 완료"),
      message: t(
        "docViewer.memoSavedToastMessage",
        "문서 내용이 메모장에 새로운 메모로 저장되었습니다.",
      ),
    });
  };

  // 6. 클립보드 복사
  const handleCopyToClipboard = () => {
    if (!docContent) return;
    navigator.clipboard.writeText(docContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 7. 포맷별 파일 다운로드 실행
  const downloadFile = (
    fileName: string,
    content: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMd = () => {
    const name =
      (docTitle.trim() || t("docViewer.titlePlaceholder", "제목 없는 문서")) +
      ".md";
    downloadFile(name, docContent, "text/markdown;charset=utf-8;");
  };

  const handleDownloadTxt = () => {
    const name =
      (docTitle.trim() || t("docViewer.titlePlaceholder", "제목 없는 문서")) +
      ".txt";
    downloadFile(name, docContent, "text/plain;charset=utf-8;");
  };

  const handleDownloadHtml = () => {
    const name =
      (docTitle.trim() || t("docViewer.titlePlaceholder", "제목 없는 문서")) +
      ".html";
    const bodyStyle = theme.isLight
      ? "background-color: #ffffff; color: #1e293b;"
      : "background-color: #0f172a; color: #f1f5f9;";
    const containerStyle =
      "max-width: 800px; margin: 40px auto; padding: 20px; font-family: system-ui, sans-serif; line-height: 1.6;";

    // 인쇄용 돔에서 마크다운 파싱된 HTML 가져오기
    let parsedHtml = "";
    const printSourceEl = document.getElementById("nanobot-doc-print-source");
    if (printSourceEl) {
      parsedHtml = printSourceEl.innerHTML;
    } else {
      parsedHtml = `<div style="white-space: pre-wrap;">${docContent}</div>`;
    }

    const fs = getFontSizeStyles(printFontSize);

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body { ${bodyStyle} ${containerStyle} font-size: ${fs.body}; }
    h1 { font-size: ${fs.h1}; border-bottom: 2px solid #ddd; padding-bottom: 8px; margin-top: 24px; }
    h2 { font-size: ${fs.h2}; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px; }
    h3 { font-size: ${fs.h3}; margin-top: 15px; }
    code { background-color: rgba(120, 120, 120, 0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: ${fs.other}; }
    pre { background-color: rgba(120, 120, 120, 0.1); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: ${fs.other}; }
    pre code { background-color: transparent; padding: 0; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 16px; color: #64748b; margin-left: 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: ${fs.other}; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background-color: rgba(120, 120, 120, 0.05); }
  </style>
</head>
<body>
  <h1>${docTitle}</h1>
  <div>${parsedHtml}</div>
</body>
</html>`;
    downloadFile(name, htmlContent, "text/html;charset=utf-8;");
  };

  // 8. PDF 인쇄 (새 인쇄용 창 팝업 실행)
  // 8. PDF 인쇄 (새 인쇄용 창 팝업 실행)
  const handlePrintPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(t("docViewer.popupBlockerAlert", "팝업 차단을 해제해 주세요."));
      return;
    }

    const title = docTitle || t("docViewer.titlePlaceholder", "제목 없는 문서");
    const styleTheme = theme.isLight
      ? "background: white; color: black;"
      : "background: #0f172a; color: #f1f5f9;";

    // 인쇄용 마크다운 HTML 엘리먼트 추출
    let parsedHtml = "";
    const printSourceEl = document.getElementById("nanobot-doc-print-source");
    if (printSourceEl) {
      parsedHtml = printSourceEl.innerHTML;
    } else {
      parsedHtml = `<div style="white-space: pre-wrap;">${docContent}</div>`;
    }

    const fs = getFontSizeStyles(printFontSize);

    const isThemeLight = theme.isLight;
    const btnContainerBg = isThemeLight ? "#f1f5f9" : "#1e293b";
    const btnContainerBorder = isThemeLight ? "#e2e8f0" : "#334155";
    const btnTextColor = isThemeLight ? "#475569" : "#cbd5e1";

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              font-size: ${fs.body};
              padding: 40px;
              line-height: 1.6;
              margin: 0;
              ${styleTheme}
            }
            h1 {
              font-size: ${fs.h1};
              border-bottom: 2px solid #ddd;
              padding-bottom: 10px;
              margin-bottom: 25px;
            }
            h2 {
              font-size: ${fs.h2};
              margin-top: 20px;
              margin-bottom: 10px;
            }
            h3 {
              font-size: ${fs.h3};
              margin-top: 15px;
              margin-bottom: 8px;
            }
            pre {
              background: #f1f5f9;
              color: black;
              padding: 15px;
              border-radius: 5px;
              overflow-x: auto;
              font-family: monospace;
              white-space: pre-wrap;
              font-size: ${fs.other};
            }
            code {
              background: #f1f5f9;
              color: black;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: monospace;
              font-size: ${fs.other};
            }
            blockquote {
              border-left: 4px solid #6366f1;
              padding-left: 15px;
              color: #555;
              margin-left: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: ${fs.other};
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px 12px;
            }
            th {
              background: ${theme.isLight ? "#f8fafc" : "#1e293b"};
              color: ${theme.isLight ? "#0f172a" : "#f1f5f9"};
              font-weight: bold;
            }
            @media print {
              body {
                background: white;
                color: black;
                padding: 0;
              }
              button, #nanobot-print-pdf-trigger-container {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div id="nanobot-print-pdf-trigger-container" style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-bottom: 20px; font-family: sans-serif;">
            <span style="font-size: 11px; font-weight: bold; color: #888;">Font Size:</span>
            <div style="display: flex; border: 1px solid ${btnContainerBorder}; border-radius: 6px; overflow: hidden; background: ${btnContainerBg}; padding: 2px; gap: 2px;">
              <button id="fs-btn-s" style="padding: 4px 10px; background: transparent; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: bold; color: ${btnTextColor}; transition: all 0.2s; font-family: sans-serif;">S</button>
              <button id="fs-btn-m" style="padding: 4px 10px; background: transparent; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: bold; color: ${btnTextColor}; transition: all 0.2s; font-family: sans-serif;">M</button>
              <button id="fs-btn-l" style="padding: 4px 10px; background: transparent; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: bold; color: ${btnTextColor}; transition: all 0.2s; font-family: sans-serif;">L</button>
            </div>
            <button id="nanobot-print-pdf-trigger" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 12px; font-family: sans-serif; transition: background 0.2s;">
              Print / Save PDF
            </button>
          </div>
          <h1>${title}</h1>
          <div>${parsedHtml}</div>
        </body>
      </html>
    `);
    printWindow.document.close();

    // 팝업 창 로드 완료 후 부모 컨텍스트에서 버튼에 이벤트 리스너 동적 바인딩 (Manifest V3 CSP 준수)
    const printButton = printWindow.document.getElementById(
      "nanobot-print-pdf-trigger",
    );
    if (printButton) {
      printButton.addEventListener("click", () => {
        printWindow.print();
      });
      // 마우스 오버 효과 동적 적용
      printButton.addEventListener("mouseover", () => {
        printButton.style.background = "#4f46e5";
      });
      printButton.addEventListener("mouseout", () => {
        printButton.style.background = "#6366f1";
      });
    }

    // 폰트 크기 변경 헬퍼 함수
    const updatePrintWindowFontSize = (size: "S" | "M" | "L") => {
      const fsStyles = getFontSizeStyles(size);
      const doc = printWindow.document;

      doc.body.style.fontSize = fsStyles.body;

      const h1s = doc.querySelectorAll("h1");
      h1s.forEach((el: any) => { el.style.fontSize = fsStyles.h1; });

      const h2s = doc.querySelectorAll("h2");
      h2s.forEach((el: any) => { el.style.fontSize = fsStyles.h2; });

      const h3s = doc.querySelectorAll("h3");
      h3s.forEach((el: any) => { el.style.fontSize = fsStyles.h3; });

      const codes = doc.querySelectorAll("code");
      codes.forEach((el: any) => { el.style.fontSize = fsStyles.other; });

      const pres = doc.querySelectorAll("pre");
      pres.forEach((el: any) => { el.style.fontSize = fsStyles.other; });

      const tables = doc.querySelectorAll("table");
      tables.forEach((el: any) => { el.style.fontSize = fsStyles.other; });

      // 단추 활성화 상태 스타일링 업데이트
      const btnS = doc.getElementById("fs-btn-s");
      const btnM = doc.getElementById("fs-btn-m");
      const btnL = doc.getElementById("fs-btn-l");

      if (btnS && btnM && btnL) {
        [btnS, btnM, btnL].forEach((btn: any) => {
          btn.style.background = "transparent";
          btn.style.color = btnTextColor;
        });

        const activeBtn = size === "S" ? btnS : size === "M" ? btnM : btnL;
        activeBtn.style.background = "#6366f1";
        activeBtn.style.color = "white";
      }
    };

    const btnS = printWindow.document.getElementById("fs-btn-s");
    const btnM = printWindow.document.getElementById("fs-btn-m");
    const btnL = printWindow.document.getElementById("fs-btn-l");

    if (btnS) {
      btnS.addEventListener("click", () => updatePrintWindowFontSize("S"));
      btnS.addEventListener("mouseover", () => {
        if (btnS.style.background !== "rgb(99, 102, 241)") btnS.style.background = isThemeLight ? "#e2e8f0" : "#334155";
      });
      btnS.addEventListener("mouseout", () => {
        if (btnS.style.background !== "rgb(99, 102, 241)") btnS.style.background = "transparent";
      });
    }
    if (btnM) {
      btnM.addEventListener("click", () => updatePrintWindowFontSize("M"));
      btnM.addEventListener("mouseover", () => {
        if (btnM.style.background !== "rgb(99, 102, 241)") btnM.style.background = isThemeLight ? "#e2e8f0" : "#334155";
      });
      btnM.addEventListener("mouseout", () => {
        if (btnM.style.background !== "rgb(99, 102, 241)") btnM.style.background = "transparent";
      });
    }
    if (btnL) {
      btnL.addEventListener("click", () => updatePrintWindowFontSize("L"));
      btnL.addEventListener("mouseover", () => {
        if (btnL.style.background !== "rgb(99, 102, 241)") btnL.style.background = isThemeLight ? "#e2e8f0" : "#334155";
      });
      btnL.addEventListener("mouseout", () => {
        if (btnL.style.background !== "rgb(99, 102, 241)") btnL.style.background = "transparent";
      });
    }

    // 팝업 생성 시점의 부모 설정값으로 초기화 적용
    updatePrintWindowFontSize(printFontSize);
  };

  const isLight = theme.isLight;

  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      {/* 1. 패널 헤더 */}
      <div className={`p-4 border-b ${theme.borderMuted} shrink-0`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="text-indigo-500" size={16} />
            <h2 className="text-sm font-black tracking-tight">
              {t("docViewer.title", "AI 문서 뷰어")}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 mr-8">
            {/* AI 이전 상태 되돌리기 */}
            {prevDocBeforeRefine && (
              <button
                onClick={handleUndoRefine}
                className={`px-2 py-1 rounded text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all border ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                    : "bg-slate-800 hover:bg-slate-700 border-white/[0.08] text-slate-300"
                }`}
                title={t("docViewer.aiUndo", "되돌리기")}
              >
                <RotateCcw size={11} />
                <span>{t("docViewer.aiUndo", "되돌리기")}</span>
              </button>
            )}

            {/* AI 편집 및 정리 */}
            <button
              onClick={handleAIRefine}
              disabled={!docContent.trim() || isRefining}
              className={`px-2 py-1 rounded text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all border ${
                isRefining
                  ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400 cursor-not-allowed"
                  : refineSuccess
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                    : !docContent.trim()
                      ? "bg-slate-500/10 border-transparent text-slate-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-sm"
              }`}
            >
              {isRefining ? (
                <>
                  <Loader2 className="animate-spin" size={11} />
                  {t("docViewer.aiRefining", "정리 중...")}
                </>
              ) : refineSuccess ? (
                <>
                  <Check size={11} />
                  {t("docViewer.aiRefineSuccess", "정리 완료!")}
                </>
              ) : (
                <>
                  <Sparkles size={11} />
                  {t("docViewer.aiRefine", "AI 편집 및 정리")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* 제목 입력란 */}
        <input
          type="text"
          value={docTitle}
          onChange={(e) => {
            setDocTitle(e.target.value);
            setPrevDocBeforeRefine(null);
          }}
          placeholder={t("docViewer.titlePlaceholder", "제목 없는 문서")}
          className={`w-full text-xs font-bold px-2 py-1 rounded border outline-none transition-all ${
            isLight
              ? "bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-400 text-slate-800"
              : "bg-slate-900 border-white/[0.06] focus:bg-slate-950 focus:border-indigo-500 text-white"
          }`}
        />
      </div>

      {/* 2. 탭 바 */}
      <div
        className={`flex border-b ${theme.borderMuted} px-2 shrink-0 bg-slate-500/5`}
      >
        <button
          onClick={() => setActiveTab("preview")}
          className={`px-3 py-2 text-[10px] font-black transition-all border-b-2 flex items-center gap-1 cursor-pointer ${
            activeTab === "preview"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Eye size={11} />
          {t("docViewer.tabPreview", "미리보기")}
        </button>
        <button
          onClick={() => setActiveTab("edit")}
          className={`px-3 py-2 text-[10px] font-black transition-all border-b-2 flex items-center gap-1 cursor-pointer ${
            activeTab === "edit"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Edit2 size={11} />
          {t("docViewer.tabRaw", "텍스트 편집")}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3 py-2 text-[10px] font-black transition-all border-b-2 flex items-center gap-1 cursor-pointer ${
            activeTab === "history"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History size={11} />
          {t("docViewer.tabHistory", "최근 문서")}
        </button>
      </div>

      {/* 3. 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {activeTab === "preview" && (
          <div className="h-full">
            {docContent ? (
              <div 
                className="prose prose-sm dark:prose-invert max-w-none break-all selection:bg-indigo-500/30"
                style={{ fontSize: getFontSizeStyles(printFontSize).body }}
              >
                <style dangerouslySetInnerHTML={{ __html: `
                  #nanobot-doc-preview h1 { font-size: ${getFontSizeStyles(printFontSize).h1} !important; }
                  #nanobot-doc-preview h2 { font-size: ${getFontSizeStyles(printFontSize).h2} !important; }
                  #nanobot-doc-preview h3 { font-size: ${getFontSizeStyles(printFontSize).h3} !important; }
                  #nanobot-doc-preview code, #nanobot-doc-preview pre { font-size: ${getFontSizeStyles(printFontSize).other} !important; }
                  #nanobot-doc-preview table { font-size: ${getFontSizeStyles(printFontSize).other} !important; }
                `}} />
                <div id="nanobot-doc-preview">
                  <MarkdownViewer content={docContent} />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12 px-4">
                <FileText
                  size={24}
                  className="opacity-20 mb-2.5 text-indigo-500"
                />
                <p className="text-[10px] font-bold leading-normal whitespace-pre-line">
                  {t(
                    "docViewer.empty",
                    "뷰어로 전송된 문서가 없습니다.\n챗봇 답변이나 메모장의 문서 아이콘을 눌러보세요!",
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "edit" && (
          <div className="h-full flex flex-col gap-2">
            <textarea
              value={docContent}
              onChange={(e) => {
                setDocContent(e.target.value);
                setPrevDocBeforeRefine(null);
              }}
              placeholder={t("docViewer.editPlaceholder", "여기에 문서를 자유롭게 입력하거나 편집하세요... (마크다운 지원)")}
              className={`flex-1 w-full p-3 rounded border outline-none resize-none font-mono transition-all custom-scrollbar ${
                isLight
                  ? "bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-400 text-slate-800"
                  : "bg-slate-900 border-white/[0.06] focus:bg-slate-950 focus:border-indigo-500 text-white"
              }`}
              style={{ fontSize: getFontSizeStyles(printFontSize).body }}
            />
            <button
              onClick={handleSaveEdit}
              className={`w-full py-1.5 rounded text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                saveSuccess
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check size={11} />
                  {t("docViewer.copied", "저장 완료!")}
                </>
              ) : (
                <>
                  <Save size={11} />
                  {t("docViewer.saveBtn", "저장")}
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === "history" && (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-black text-slate-500 uppercase">
                Document History
              </span>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[9px] font-black text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <Trash2 size={9} />
                  {t("docViewer.historyClear", "전체 삭제")}
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="flex flex-col gap-1.5 max-h-[350px] overflow-y-auto custom-scrollbar pr-0.5">
                {history.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleLoadFromHistory(doc)}
                    className={`p-2 rounded border cursor-pointer flex items-center justify-between group transition-all ${
                      isLight
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200"
                        : "bg-slate-900 hover:bg-slate-800/80 border-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                      <FileText
                        size={12}
                        className="text-slate-400 group-hover:text-indigo-400 shrink-0"
                      />
                      <span className="text-[10px] font-bold truncate text-slate-300 group-hover:text-white">
                        {doc.title}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteHistoryItem(doc.id, e)}
                      className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded cursor-pointer"
                      title={t("docViewer.delete", "삭제")}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                <History
                  size={20}
                  className="opacity-20 mb-2 text-indigo-500"
                />
                <p className="text-[10px] font-bold">
                  {t("docViewer.historyEmpty", "최근 열람 기록이 없습니다.")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. 내보내기 및 유틸리티 하단 바 */}
      {docContent && activeTab !== "history" && (
        <div
          className={`p-3 border-t ${theme.borderMuted} shrink-0 bg-slate-500/5 flex flex-col gap-2`}
        >
          {/* S M L 인쇄/내보내기 폰트 크기 조절 */}
          <div className="flex items-center gap-1.5 mb-1.5 select-none">
            <span className="text-[9.5px] font-black text-slate-500 shrink-0">
              Print Size:
            </span>
            <div className="flex-1 grid grid-cols-3 gap-1">
              {(["S", "M", "L"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPrintFontSize(sz)}
                  className={`py-0.5 rounded text-[9px] font-black cursor-pointer border transition-all ${
                    printFontSize === sz
                      ? `${theme.primary} border-transparent text-white shadow-sm`
                      : isLight
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700"
                        : "bg-slate-900/60 hover:bg-slate-800 border-white/[0.05] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 저장 & 복사 & 인쇄 */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={handleSaveToMemo}
              className={`py-1 rounded text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all border ${
                isLight
                  ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                  : "bg-slate-900 hover:bg-slate-800 border-white/[0.06] text-slate-300"
              }`}
            >
              <Bookmark size={11} />
              {t("docViewer.saveToMemo", "메모 저장")}
            </button>
            <button
              onClick={handleCopyToClipboard}
              className={`py-1 rounded text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all border ${
                copied
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : isLight
                    ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                    : "bg-slate-900 hover:bg-slate-800 border-white/[0.06] text-slate-300"
              }`}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied
                ? t("docViewer.copied", "복사됨!")
                : t("docViewer.copy", "복사")}
            </button>
            <button
              onClick={handlePrintPdf}
              className={`py-1 rounded text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all border ${
                isLight
                  ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                  : "bg-slate-900 hover:bg-slate-800 border-white/[0.06] text-slate-300"
              }`}
            >
              <Printer size={11} />
              {t("docViewer.printPdf", "PDF")}
            </button>
          </div>

          {/* 다운로드 3종 */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] font-black text-slate-500 shrink-0 flex items-center gap-0.5">
              <Download size={9} />
              Save:
            </span>
            <div className="flex-1 grid grid-cols-3 gap-1">
              <button
                onClick={handleDownloadMd}
                className={`py-0.5 rounded text-[8.5px] font-extrabold cursor-pointer border ${
                  isLight
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-slate-950/60 hover:bg-slate-800 border-white/[0.05] text-indigo-400 hover:text-indigo-300"
                }`}
              >
                MD
              </button>
              <button
                onClick={handleDownloadHtml}
                className={`py-0.5 rounded text-[8.5px] font-extrabold cursor-pointer border ${
                  isLight
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-slate-950/60 hover:bg-slate-800 border-white/[0.05] text-indigo-400 hover:text-indigo-300"
                }`}
              >
                HTML
              </button>
              <button
                onClick={handleDownloadTxt}
                className={`py-0.5 rounded text-[8.5px] font-extrabold cursor-pointer border ${
                  isLight
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-slate-950/60 hover:bg-slate-800 border-white/[0.05] text-indigo-400 hover:text-indigo-300"
                }`}
              >
                TXT
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 인쇄 추출용 hidden 마크다운 컴포넌트 */}
      <div id="nanobot-doc-print-source" style={{ display: "none" }}>
        <MarkdownViewer content={docContent} />
      </div>
      {/* 히스토리 전체 삭제 확인용 커스텀 모달 */}
      <CustomDialog
        isOpen={isConfirmOpen}
        type="confirm"
        title={t("docViewer.clearHistoryTitle", "히스토리 전체 삭제")}
        message={t(
          "docViewer.clearHistoryMessage",
          "최근 열람 문서 히스토리를 모두 삭제하시겠습니까?",
        )}
        confirmText={t("docViewer.delete", "삭제")}
        cancelText={t("docViewer.cancel", "취소")}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsConfirmOpen(false)}
      />
      {/* AI 관련 알림용 커스텀 모달 */}
      <CustomDialog
        isOpen={!!alertDialog}
        type="alert"
        title={alertDialog?.title || ""}
        message={alertDialog?.message || ""}
        onConfirm={() => setAlertDialog(null)}
      />

      {/* 성공 안내 토스트 */}
      {activeToast && (
        <div className="fixed bottom-4 right-4 z-[9999] max-w-xs bg-slate-900/95 border border-indigo-500/30 text-white rounded-xl shadow-2xl p-4 flex flex-col gap-1 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-5 duration-300 select-none">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[11px] font-bold text-indigo-400">
              {activeToast.title}
            </span>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white text-[10px] cursor-pointer"
            >
              ✕
            </button>
          </div>
          <span className="text-[10px] text-slate-300 leading-relaxed">
            {activeToast.message}
          </span>
        </div>
      )}
    </div>
  );
}
