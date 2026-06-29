# NanoBot - On-Device AI Chatbot (Chrome Extension)

A lightweight utility that brings a customized AI assistant directly onto your browser. This project is built as a Chrome Extension (Manifest V3) and utilizes Google Chrome's experimental on-device AI model (Gemini Nano) or connects directly to external LLM API endpoints.

> [!NOTE]
> This extension is optimized for lightweight on-device AI tasks, quick memos, bookmarks, and basic workflow scripting.

## Features

- **On-Device LLM (Gemini Nano)**: Runs local inference inside your browser. No external API calling required when configured correctly.
- **External LLM Bypass**: Optional connection to standard OpenAI-compatible API endpoints for more complex queries.
- **Floating Widget & Sidepanel UI**: Run the chatbot as a floating widget on any web page (via Shadow DOM to prevent CSS leaks) or inside the browser's sidepanel.
- **Buddy (Private Persona Chat & Diary)**:
  - **Secure Local Storage**: Conversations and diaries are encrypted and password-protected to safeguard private data.
  - **10 Unique Personalities**: Select from 10 curated personality presets (Motivator, Tsundere, Bard, Aristocrat, Cyberpunk, Grandma, Gen Z, Conspiracy Theorist, Zen Cat, Corporate Executive).
  - **Dynamic Avatar Matching**: Choosing a personality preset places its specific dedicated avatar (`buddy-preset-01` to `10.webp`) at the front of the avatar list and auto-selects it.
  - **Custom TTS Parameters**: Presets are pre-configured with customized speech rate and pitch settings to optimize Text-to-Speech alignment.
  - **Calendar-Based Diary**: Write a daily log of conversations and visualize your emotional statistics based on the chatbot personalities you interacted with.
- **Memos & Global Bookmarks**: 
  - Save quick notes and tasks directly in the panel.
  - Organized with 8 major global shortcuts (GitHub, Hugging Face, Google, ChatGPT, Stack Overflow, YouTube, Reddit, Wikipedia) with automatic legacy migration.
- **Compact & Intuitive Popup Dashboard**:
  - Compact `350px` width layout optimized for fast access.
  - Profile customization featuring random avatar toggles, instant avatar image shuffling, and custom bot name editing.
  - Quick support settings icon linking directly to GitHub Discussions and Issue tracking.
  - Real-time Local AI Engine check button (`AI ON`).
- **Chrome Web Store Policy Compliant Tools**:
  - Built-in **Smart Calculator & Unit Converter** (Pyung/㎡ & Temperature).
  - Fully compliant with Web Store security guidelines (zero dynamic code execution; mathematical evaluations run through a secure custom tokenizer instead of unsafe `eval()`).
- **Premium Reminders & Alarms**:
  - Set schedule reminders directly from memo panels or AI chat conversations with a ⏰ icon.
  - Features system OS notifications via background service worker alarms, paired with interactive in-app toast alerts when the sidepanel is active.
  - Dedicated alarm management subpanel for listing, toggling, and deleting scheduled alarms.
- **Active Browser Integration**:
  - **Inline Selection Drag & Action**: Drag text on any web page to evoke a floating Quick Action tooltip (Summarize/Translate) which automatically triggers processing.
  - **1-Click Active Tab Summarization**: Click the document icon in the chat header to scrape and summarize the active tab in 3 lines.
- **Micro-Interactions & Premium UI Animations**:
  - Smooth spring physical layout transitions on chat messages.
  - **Aurora Glow Borders**: Neon multi-color gradient border rotation animation on the text input container during local model generation.
  - Elastic spring hover bounce reactions on bot and buddy avatars.
- **Multilingual Support**: Supports English, Korean (한국어), and Japanese (日本語).
- **Modern Responsive Design**: Premium dark-mode-first aesthetic with dynamic CSS skin mode (Dark/Light) and customizable theme color accents.
- **Auto-Focus on Reply**: The text input area automatically regains focus after the AI finishes generating a response, enabling seamless continuous conversation without extra clicks.
- **Auto Session Recovery**: If the Chrome Service Worker is unloaded due to inactivity (a known Manifest V3 limitation), the AI session is automatically re-initialized before the next message is sent, preventing silent "stuck" states.
- **Dual-Pass Safety Guardrails**: Before any user message reaches the main AI model, it is evaluated by a dedicated, short-lived safety classifier session. Requests containing sexual, violent, illegal, hateful, or jailbreak-attempt content are blocked immediately and the user is notified with a clear message. The safety classifier is entirely separate from the main conversation session to ensure context integrity.

## Setup Requirements

To use the local on-device AI (Gemini Nano), you must configure Chrome experimental flags:

1. **Chrome Flags Setup**:
   - Navigate to `chrome://flags/#prompt-api-for-gemini-nano` -> Set to **Enabled**.
   - Navigate to `chrome://flags/#optimization-guide-on-device-model` -> Set to **Enabled BypassPerfRequirement**.
   - Restart the Chrome browser.
2. **Components Download**:
   - Navigate to `chrome://components` and search for **Optimization Guide On Device Model**.
   - Click **Check for update** and wait for the model to download (approx. 3.5GB) until status is **Up-to-date**.

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** (top-left button) and select the `dist` folder generated after running the build.

## Build

To build the extension from source:

```bash
npm install
npm run build
```

The compiled extension files will be created in the `dist` directory.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Privacy Policy

Please see the [Privacy Policy](PRIVACY.md) file for details on data processing and user privacy.

## Contact & Support

If you have any questions, suggestions, or bug reports, please use the following channels:

* [GitHub Issues](https://github.com/Junpapapo/NanoBotEx/issues): For bug reports and feature requests.
* [GitHub Discussions](https://github.com/Junpapapo/NanoBotEx/discussions): For general questions and community discussion.
* Email: [junpapapo@gmail.com](mailto:junpapapo@gmail.com)
