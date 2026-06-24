import React from "react";
import ReactDOM from "react-dom/client";
import { ChatbotWidget } from "./ChatbotWidget";

function checkAndMountWidget() {
  chrome.storage.local.get(["user_settings"], (result) => {
    const settings = result.user_settings;
    const isWidgetMode = settings?.nano_launcher_mode === "widget";
    let widgetRoot = document.getElementById("nanobot-widget-root");

    if (isWidgetMode) {
      if (!widgetRoot) {
        widgetRoot = document.createElement("div");
        widgetRoot.id = "nanobot-widget-root";
        document.body.appendChild(widgetRoot);

        const shadowRoot = widgetRoot.attachShadow({ mode: "open" });
        const container = document.createElement("div");
        container.id = "nanobot-widget-container";
        shadowRoot.appendChild(container);

        const linkEl = document.createElement("link");
        linkEl.rel = "stylesheet";
        linkEl.href = chrome.runtime.getURL("index.css"); // CRXJS 빌드 index.css 경로 매핑
        shadowRoot.appendChild(linkEl);

        const root = ReactDOM.createRoot(container);
        root.render(
          <React.StrictMode>
            <ChatbotWidget />
          </React.StrictMode>
        );
      }
    } else {
      if (widgetRoot) {
        widgetRoot.remove();
      }
    }
  });
}

checkAndMountWidget();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.user_settings) {
    checkAndMountWidget();
  }
});
