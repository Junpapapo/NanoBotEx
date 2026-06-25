# Privacy Policy for NanoBot AI

*Effective Date: June 25, 2026*

This Privacy Policy explains how **NanoBot AI** ("we", "our", or "the Extension") handles user information and data. We are highly committed to protecting user privacy and ensuring a transparent, secure browsing experience.

---

## 1. Information Collection and Use

**NanoBot AI** operates with a privacy-first, decentralized model. We do **NOT** run any database servers, telemetry trackers, or cloud analytics backends.

*   **API Keys & Chat Logs**: All API Keys (e.g., OpenAI API, Gemini API) and chat logs with the AI assistant are stored exclusively in your local browser storage (`chrome.storage.local`). We never collect, transmit, or share your API keys or chatbot conversations with our servers.
*   **Webpage Content (ActiveTab & Scripting)**: To summarize webpages or answer questions about your active tab, the Extension reads the text content of your currently active browser tab. This process occurs entirely on your device. The content is sent only to the AI engine of your choice (local Gemini Nano or your configured OpenAI API key endpoint) and is never sent to any third party.
*   **Local Gemini Nano Inference**: When using Google Chrome's built-in on-device AI, all calculations and processing take place locally on your computer. No data leaves your machine.

---

## 2. Third-Party Services

When you connect the Extension to an external LLM provider, your requests are processed according to the respective third-party provider's privacy policy:
*   **OpenAI API**: Subject to [OpenAI Privacy Policy](https://openai.com/policies/privacy-policy/).
*   **Google Gemini API**: Subject to [Google Privacy Policy](https://policies.google.com/privacy).

---

## 3. Data Security

We implement Chrome Extension development best practices to secure your stored configuration data. However, please ensure that you secure your local computer from unauthorized access, as your API keys are stored in your local browser environment.

---

## 4. Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted by updating the `PRIVACY.md` file in this repository.

---

## 5. Contact Us

If you have questions about this Privacy Policy, please open a ticket on our [GitHub Issues](https://github.com/Junpapapo/NanoBotEx/issues) page or reach out to us at: [junpapapo@gmail.com](mailto:junpapapo@gmail.com).

---

---

# 개인정보처리방침 (Privacy Policy)

*시행일자: 2026년 6월 25일*

본 개인정보처리방침은 **NanoBot AI**("이하 확장 프로그램")의 사용자 데이터 및 개인정보 처리 방식을 설명합니다.

## 1. 개인정보 수집 및 이용 목적
이 확장 프로그램은 어떠한 외부 데이터 수집 서버나 텔레메트리(분석용 추적) 수집 서버도 운영하지 않으며 사용자 정보를 수집하지 않습니다.

*   **API 키 및 대화 기록**: 사용자가 설정한 외부 API 키 및 챗봇과의 대화 내용은 전적으로 웹 브라우저의 로컬 저장소(`chrome.storage.local`)에만 암호화/저장됩니다. 개발자를 포함하여 외부 서버로 이 정보가 절대 유출되거나 전송되지 않습니다.
*   **웹 페이지 내용 읽기 (`activeTab` 및 `scripting` 권한)**: 활성 탭 본문 요약 기능을 활성화할 때, 현재 띄워져 있는 웹 페이지의 텍스트 본문(innerText)을 추출하여 사용자가 지정한 AI 엔진(로컬 Gemini Nano 또는 사용자가 연결한 외부 API)으로 직접 전송합니다. 이 정보는 일시적 계산을 위해 사용되며 영구히 기록에 남기거나 수집하지 않습니다.
*   **온디바이스 AI (Gemini Nano)**: 로컬 AI 구동 옵션을 이용할 경우 모든 추론과 수식 연산은 외부 인터넷망을 통하지 않고 전적으로 사용자 로컬 PC 장치 내부에서만 처리됩니다.

## 2. 제3자 제공 정책
사용자가 외부 API(OpenAI, Google Gemini API 등) 연동 옵션을 선택할 경우, 사용자가 작성한 프롬프트는 각각의 연동 업체로 직접 전송되며 각 업체의 개인정보 처리 약관을 따릅니다.

## 3. 개인정보 보호 문의
개인정보 처리 방침 또는 데이터 관리에 관한 질문이나 제안이 있으실 경우 공식 [GitHub Issues](https://github.com/Junpapapo/NanoBotEx/issues)를 통해 문의하시거나 [junpapapo@gmail.com](mailto:junpapapo@gmail.com)으로 연락해주시기 바랍니다.
