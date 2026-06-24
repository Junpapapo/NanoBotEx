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
});
