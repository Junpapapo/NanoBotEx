// Content Script - 드래그 텍스트 감지 및 플로팅 툴팁 제공

let tooltipContainer: HTMLDivElement | null = null;
let selectedText = "";

function createTooltip(x: number, y: number) {
  removeTooltip();

  tooltipContainer = document.createElement("div");
  tooltipContainer.id = "nanobot-floating-tooltip";
  
  // 인라인 스타일로 스타일 고정 (외부 CSS 오염 방지)
  Object.assign(tooltipContainer.style, {
    position: "absolute",
    left: `${x}px`,
    top: `${y + 10}px`,
    zIndex: "999999",
    display: "flex",
    gap: "4px",
    padding: "4px 6px",
    backgroundColor: "#0c122c",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)",
    pointerEvents: "auto",
    userSelect: "none"
  });

  // 요약 버튼
  const sumBtn = document.createElement("button");
  sumBtn.innerText = "📝 요약";
  styleButton(sumBtn, "#6366f1");
  sumBtn.addEventListener("click", () => {
    sendAction("summarize");
  });

  // 번역 버튼
  const transBtn = document.createElement("button");
  transBtn.innerText = "🌐 번역";
  styleButton(transBtn, "#10b981");
  transBtn.addEventListener("click", () => {
    sendAction("translate");
  });

  tooltipContainer.appendChild(sumBtn);
  tooltipContainer.appendChild(transBtn);
  document.body.appendChild(tooltipContainer);
}

function styleButton(btn: HTMLButtonElement, color: string) {
  Object.assign(btn.style, {
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: color,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "opacity 0.2s",
    outline: "none"
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
  
  // 백그라운드에 드래그 텍스트 전달
  chrome.runtime.sendMessage({
    action: "drag_action",
    text: selectedText,
    type: type
  }, () => {
    removeTooltip();
  });
}

document.addEventListener("mouseup", (e: MouseEvent) => {
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
  // 툴팁 밖을 누르면 제거
  if (tooltipContainer && !tooltipContainer.contains(e.target as Node)) {
    removeTooltip();
  }
});
