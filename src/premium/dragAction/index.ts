// Premium Feature - 드래그 텍스트 감지 및 플로팅 툴팁 제공
// 나중에 프리미엄 기능을 쉽게 패키징에서 포함/제외할 수 있도록 물리적으로 전용 폴더에 격리 배치되었습니다.

let tooltipContainer: HTMLDivElement | null = null;
let selectedText = "";

function createTooltip(x: number, y: number) {
  removeTooltip();

  tooltipContainer = document.createElement("div");
  tooltipContainer.id = "nanobot-floating-tooltip";
  
  // 인라인 스타일로 스타일 고정 (외부 CSS 오염 방지 및 zIndex 최대화)
  Object.assign(tooltipContainer.style, {
    position: "absolute",
    left: `${x}px`,
    top: `${y + 10}px`,
    zIndex: "2147483647", // 브라우저 최대 값으로 설정하여 다른 레이어에 가려지지 않게 함
    display: "flex",
    gap: "4px",
    padding: "4px 6px",
    backgroundColor: "#0c122c",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)",
    pointerEvents: "auto",
    userSelect: "none",
    boxSizing: "border-box",
    lineHeight: "normal"
  });

  // 요약 버튼 - 👑 프리미엄 표기 (일괄 영문으로 지정)
  const sumBtn = document.createElement("button");
  sumBtn.innerText = "👑 Summary";
  styleButton(sumBtn, "#6366f1");
  sumBtn.addEventListener("click", () => {
    sendAction("summarize");
  });

  // 번역 버튼 - 👑 프리미엄 표기 (일괄 영문으로 지정)
  const transBtn = document.createElement("button");
  transBtn.innerText = "👑 Translate";
  styleButton(transBtn, "#10b981");
  transBtn.addEventListener("click", () => {
    sendAction("translate");
  });

  tooltipContainer.appendChild(sumBtn);
  tooltipContainer.appendChild(transBtn);
  document.body.appendChild(tooltipContainer);

  // 화면을 벗어나지 않도록 좌표 보정 (Clamping)
  const tooltipWidth = tooltipContainer.offsetWidth || 160;
  const tooltipHeight = tooltipContainer.offsetHeight || 34;

  const minX = window.scrollX + 10;
  const maxX = window.scrollX + window.innerWidth - tooltipWidth - 20;
  const clampedX = Math.max(minX, Math.min(maxX, x));

  const minY = window.scrollY + 10;
  const maxY = window.scrollY + window.innerHeight - tooltipHeight - 20;
  const clampedY = Math.max(minY, Math.min(maxY, y + 10));

  tooltipContainer.style.left = `${clampedX}px`;
  tooltipContainer.style.top = `${clampedY}px`;
}

function styleButton(btn: HTMLButtonElement, color: string) {
  Object.assign(btn.style, {
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "bold",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#ffffff",
    backgroundColor: color,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "opacity 0.2s",
    outline: "none",
    lineHeight: "1.4",
    boxSizing: "border-box"
  });
  btn.addEventListener("mouseenter", () => { btn.style.opacity = "0.85"; });
  btn.addEventListener("mouseleave", () => { btn.style.opacity = "1"; });
}

function removeTooltip() {
  if (tooltipContainer) {
    tooltipContainer.remove();
    tooltipContainer = null;
  }
}

function sendAction(type: "summarize" | "translate") {
  if (!selectedText.trim()) return;
  
  // 컨텍스트 무효화 여부 체크
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
    console.warn("NanoBot: Extension context invalidated. Please refresh the page.");
    removeTooltip();
    return;
  }
  
  try {
    // 백그라운드에 드래그 텍스트 전달
    chrome.runtime.sendMessage({
      action: "drag_action",
      text: selectedText,
      type: type
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn("NanoBot: Message sending failed.", chrome.runtime.lastError.message);
      }
      removeTooltip();
    });
  } catch (err) {
    console.warn("NanoBot: Failed to send action due to context invalidation.", err);
    removeTooltip();
  }
}

// 공통 Content Script에서 호출하여 기동하는 엔트리포인트 함수
export function initDragActionTooltip() {
  document.addEventListener("mouseup", (e: MouseEvent) => {
    // 컨텍스트 무효화 상태면 무시
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
      return;
    }

    // 툴팁 내부를 클릭한 경우 무시
    if (tooltipContainer && tooltipContainer.contains(e.target as Node)) {
      return;
    }

    // 약간의 딜레이를 주어 선택 동작이 완료되도록 함
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";

      if (text && text.length > 2) {
        selectedText = text;
        
        // 툴팁 위치 계산 (선택 영역 하단 중앙)
        try {
          const range = selection!.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // 스크롤 높이 보정
          const x = rect.left + window.scrollX + (rect.width / 2) - 50; // 대략 가로 중앙 정렬
          const y = rect.bottom + window.scrollY;
          
          createTooltip(x, y);
        } catch (err) {
          // Range 획득 실패 시 마우스 커서 위치 기반으로 그리기
          createTooltip(e.pageX - 50, e.pageY + 10);
        }
      } else {
        removeTooltip();
      }
    }, 10);
  });

  document.addEventListener("mousedown", (e: MouseEvent) => {
    // 컨텍스트 무효화 상태면 무시
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
      return;
    }

    // 툴팁 밖을 누르면 제거
    if (tooltipContainer && !tooltipContainer.contains(e.target as Node)) {
      removeTooltip();
    }
  });
}
