# NanoBot - On-Device AI Chatbot (Chrome Extension)

A lightweight utility that brings a customized AI assistant directly onto your browser. This project is built as a Chrome Extension (Manifest V3) and utilizes Google Chrome's experimental on-device AI model (Gemini Nano) or connects directly to external LLM API endpoints.

> [!NOTE]
> This extension is optimized for lightweight on-device AI tasks, quick memos, bookmarks, and basic workflow scripting.

## 📺 Usage Video

<p align="center">
  <a href="https://youtu.be/O2WZoL0ilo0" target="_blank">
    <img src="https://img.youtube.com/vi/O2WZoL0ilo0/0.jpg" alt="NanoBot Usage Video" width="600" />
  </a>
</p>

## Our Mission: Why NanoBot & SLM?

While modern AI advances at an unprecedented pace, accessing massive large language models (LLMs) often requires expensive subscription plans or high-end GPU hardware. As a result, users on budget hardware like Chromebooks, students, or communities in developing regions frequently find themselves in the "AI shadow," unable to utilize these modern tools.

**NanoBot** was built to address this digital divide and support **"AI for Everyone"**:
- **Accessible & Budget-Friendly**: Utilizing Small Language Models (SLMs) running locally inside the browser lowers the entry barrier. You don't need expensive paid API keys or high-end servers to perform daily micro-tasks.
- **Eco-Friendly & Sustainable**: Running inference locally on the device bypasses the massive energy demands and carbon footprints associated with routing requests through giant cloud data centers. It represents a green, energy-efficient approach to AI.
- **Privacy-Preserving**: Since the data stays on your machine, your private inputs never leave your local environment.

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
- **Lingo Tutor (Daily Language Learning 🎓)**:
  - **Multilingual Learning Support**: Set target language (English, Korean, Japanese, Chinese, Spanish, French, German, Vietnamese) and study customized expressions.
  - **Age/Difficulty Level Optimization**: Tailor the difficulty (Beginner, Intermediate, Advanced) and assistant's tone (Kids, Teens, Adults) to suit your learning stage.
  - **Lingo Card UI**: Displays expressions, pronunciations, vocabulary badges, and encouraging teacher notes in a clean emerald-glow card layout.
  - **2-Tier Smart Icon Control**: Clicking the Cap icon in the sidebar instantly triggers a card, while clicking the small settings cog opens the configurations panel without interrupting your query.
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
- **AI Document Viewer & Editor**:
  - **On-Device Refinement**: Supplement lacking details and polish formatting using local Gemini Nano, with automatic layout/context structuring.
  - **Interactive Markdown & HTML Preview**: Seamlessly render standard markdown formatting, custom styling, tables, blockquotes, and HTML snippets.
  - **Shared Editor Sync**: Full double-sided state sync preventing content loss or reverting upon layout re-rendering.
  - **Multi-Format Export**: One-click download as Markdown (.md), HTML (.html), Text (.txt), or print to PDF with customizable font sizing (S / M / L).
  - **Integrated History Bar**: Stores up to 15 refined documents locally for instant recovery.
- **Upgraded Memo Sync**:
  - **Dual-Mode Editor (View/Edit)**: Read memos as clean parsed markdown by default. Click the memo body to instantly trigger interactive editing with auto-focus, and auto-restore to the visual preview on blur.
  - **Instant Save-to-Memo**: Relays active documents straight to your memo vault with one-click synchronization.
- **Real-Time Web Search & Summarization**:
  - **Live Search Toggle (🌐)**: Toggle real-time search with a dedicated globe icon at the bottom-right of the chat input area.
  - **Dynamic URL Redirection**: Automatically updates the active tab's URL to Google Search and securely scrapes the rendered DOM (bypassing bot filters and CAPTCHAs).
  - **On-Device Search Summarization**: The local AI analyzes live search content (such as real-time stock prices or news) and answers with reference cards.
  - **1-Click Search View Return (↗)**: Instantly refocus and jump back to the search page using the `[Go to Google Search Result ↗]` button.
  - **Intelligent Skip Rules**: System actions like drag-to-summarize, page summary, and active site analysis automatically skip web search to prevent redundant redirection.
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
- **Dual-Pass Safety Guardrails (Optional)**: Before any user message reaches the main AI model, it can be evaluated by a dedicated, short-lived safety classifier session. Requests containing sexual, violent, illegal, hateful, or jailbreak-attempt content are blocked immediately. This feature is configurable via developer flags (`ENABLE_CHAT_SAFETY` and `ENABLE_BUDDY_SAFETY` in `premium-config.ts`) and is disabled by default to maximize response speed, as the built-in Gemini Nano model already performs primary safety filtering.

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
