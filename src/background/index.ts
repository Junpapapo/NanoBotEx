let activeAISession: any = null;

// 백그라운드 AI 지원 여부 체크 헬퍼
async function getAIModel() {
  try {
    const glob = globalThis as any;
    let lm = glob.ai?.languageModel;
    if (!lm && glob.chrome?.ai?.languageModel) {
      lm = glob.chrome.ai.languageModel;
    }
    if (!lm && glob.chrome?.aiOriginTrial?.languageModel) {
      lm = glob.chrome.aiOriginTrial.languageModel;
    }
    if (!lm && typeof glob.LanguageModel !== "undefined") {
      lm = glob.LanguageModel;
    }
    if (!lm || typeof lm.create !== "function") return null;
    return lm;
  } catch {
    return null;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("NanoBot Extension installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "open_sidepanel") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.sidePanel.open({ tabId })
          .then(() => sendResponse({ success: true }))
          .catch((err) => {
            console.error("Failed to open sidepanel:", err);
            sendResponse({ success: false, error: err.message });
          });
      } else {
        sendResponse({ success: false, error: "No active tab found" });
      }
    });
    return true; // asynchronous response key
  }

  if (message.action === "check_ai_support") {
    getAIModel().then((lm) => {
      sendResponse({ supported: !!lm });
    }).catch(() => {
      sendResponse({ supported: false });
    });
    return true;
  }

  if (message.action === "diagnose_ai_support") {
    const glob = globalThis as any;
    sendResponse({
      hasWindowAI: !!glob.ai,
      hasLanguageModel: !!glob.ai?.languageModel,
      hasChromeLanguageModel: !!glob.chrome?.ai?.languageModel,
      hasChromeAiOriginTrial: !!glob.chrome?.aiOriginTrial?.languageModel,
      hasLanguageModelClass: typeof glob.LanguageModel !== "undefined",
      hasAssistant: !!glob.ai?.assistant
    });
    return false;
  }

  if (message.action === "init_ai_session") {
    initBackgroundAISession(message.systemPrompt, message.temperature)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message || String(err) }));
    return true;
  }

  if (message.action === "prompt_ai") {
    if (!activeAISession) {
      sendResponse({ success: false, error: "Session not initialized" });
      return;
    }
    activeAISession.prompt(message.promptText)
      .then((res: string) => sendResponse({ success: true, result: res }))
      .catch((err: any) => sendResponse({ success: false, error: err.message || String(err) }));
    return true;
  }

  if (message.action === "destroy_ai_session") {
    destroyBackgroundSession();
    sendResponse({ success: true });
    return;
  }
});

async function initBackgroundAISession(systemPrompt?: string, temperature?: number) {
  destroyBackgroundSession();
  const lm = await getAIModel();
  if (!lm) throw new Error("Local AI is not available in background context");

  const runCreate = async (opts: any) => {
    return await lm.create(opts);
  };

  // 점진적 Fallback 구현 ( expectedOutputs 에서 'ko' 제거 반영 )
  try {
    const opts: any = {
      expectedOutputs: [{ type: "text", languages: ["en", "ja"] }],
      topK: 3
    };
    if (temperature !== undefined) opts.temperature = temperature;
    if (systemPrompt) opts.systemPrompt = systemPrompt;
    activeAISession = await runCreate(opts);
  } catch (err1) {
    try {
      const opts: any = {};
      if (temperature !== undefined) opts.temperature = temperature;
      if (systemPrompt) opts.systemPrompt = systemPrompt;
      activeAISession = await runCreate(opts);
    } catch (err2) {
      try {
        const opts: any = {};
        if (systemPrompt) opts.systemPrompt = systemPrompt;
        activeAISession = await runCreate(opts);
      } catch (err3) {
        activeAISession = await runCreate({});
      }
    }
  }
}

function destroyBackgroundSession() {
  if (activeAISession) {
    try {
      if (typeof activeAISession.destroy === "function") activeAISession.destroy();
      else if (typeof activeAISession.close === "function") activeAISession.close();
    } catch (e) {
      console.warn("Failed to destroy bg session:", e);
    }
    activeAISession = null;
  }
}

// 스트리밍 포트 통신 수신
chrome.runtime.onConnect.addListener((port) => {
  if (port.name.startsWith("ai-stream-")) {
    port.onMessage.addListener((msg) => {
      if (msg.action === "stream_prompt") {
        if (!activeAISession) {
          port.postMessage({ type: "error", error: "Session not initialized" });
          return;
        }
        
        if (typeof activeAISession.promptStreaming === "function") {
          const stream = activeAISession.promptStreaming(msg.promptText);
          (async () => {
            try {
              for await (const chunk of stream) {
                port.postMessage({ type: "chunk", chunk });
              }
              port.postMessage({ type: "done" });
            } catch (err: any) {
              port.postMessage({ type: "error", error: err.message || String(err) });
            }
          })();
        } else {
          // fallback to standard prompt
          activeAISession.prompt(msg.promptText)
            .then((res: string) => {
              port.postMessage({ type: "chunk", chunk: res });
              port.postMessage({ type: "done" });
            })
            .catch((err: any) => {
              port.postMessage({ type: "error", error: err.message || String(err) });
            });
        }
      }
    });
  }
});
