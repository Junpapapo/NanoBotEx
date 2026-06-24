# 다국어 리소스 가이드 (i18n Resource Guide)

본 디렉토리(`frontend/public/locales/`)는 **NanoBot 챗봇 컴포넌트**의 다국어 리소스를 보관하는 공간입니다.  
새로운 언어 리소스를 추가할 때 코드 빌드 없이 JSON 추가 및 메타데이터 갱신만으로 런타임에 즉시 다국어가 확장되도록 설계되었습니다.

---

## 🚀 새로운 언어 추가 방법 (How to add a new language)

새로운 국가의 언어를 추가하려면 아래 2개의 단계를 진행합니다.

### 1단계: `languages.json`에 메타데이터 등록
`public/locales/languages.json` 파일을 열고, 아래와 같이 신규 언어 코드(Key)와 화면에 노출될 명칭(Value)을 추가합니다.
```json
{
  "en": "English",
  "ko": "한국어",
  "ja": "日本語"  // <-- 추가 예시
}
```

### 2단계: 신규 언어 번역 JSON 파일 작성
`public/locales/[언어코드].json` 형식으로 파일을 만들고, 기존 `en.json`에 정의된 번역 키 구조와 1:1 매핑되도록 번역문을 입력합니다.
* 예: `public/locales/ja.json` 생성

---

## 📌 주요 언어/국가 코드 표준 일람 (ISO 639-1)

언어 코드는 기본적으로 **ISO 639-1 (소문자 2자리)** 표준 규격을 사용합니다. 브라우저 감지 시 해당 언어와 매칭됩니다.

| 언어 코드 (Locale Code) | 대상 언어 / 국가 (Language / Region) | 예시 명칭 (Display Name) |
| :---: | :--- | :--- |
| **`ko`** | 한국어 (Korean) | 한국어 |
| **`en`** | 영어 (English) | English |
| **`ja`** | 일본어 (Japanese) | 日本語 |
| **`zh`** | 중국어 - 일반 (Chinese) | 中文 |
| **`zh-CN`** | 중국어 - 간체 (Simplified Chinese) | 简体中文 |
| **`zh-TW`** | 중국어 - 번체 (Traditional Chinese) | 繁體中文 |
| **`es`** | 스페인어 (Spanish) | Español |
| **`fr`** | 프랑스어 (French) | Français |
| **`de`** | 독일어 (German) | Deutsch |
| **`vi`** | 베트남어 (Vietnamese) | Tiếng Việt |
| **`th`** | 태국어 (Thai) | ไทย |
| **`id`** | 인도네시아어 (Indonesian) | Bahasa Indonesia |
| **`ru`** | 러시아어 (Russian) | Русский |
| **`pt`** | 포르투갈어 (Portuguese) | Português |
| **`it`** | 이탈리아어 (Italian) | Italiano |

> 💡 **브라우저 인식 작동 방식**:
> 최초 접속 시 `navigator.language`를 감지하여 브라우저 환경이 `ko-*`이면 자동으로 **`ko`**를 선택하고, 그 외에는 기본 베이스인 **`en`**을 적용합니다.

---

## 🔑 번역 JSON 데이터 규격 및 설명

번역 파일 구조는 `chatbot`(대화 흐름 및 제어 관련) 영역과 `settings`(설정 창 관련) 영역으로 대칭 구성됩니다.

```json
{
  "chatbot": {
    "closeConfirm": {
      "title": "대화 종료 확인 타이틀",
      "desc": "대화 종료 시 초기화 안내 메시지",
      "cancel": "취소 버튼 라벨",
      "confirm": "종료 버튼 라벨"
    },
    "status": {
      "writing": "AI 답변 생성 중 노출 텍스트",
      "localReady": "로컬 AI 준비 완료 텍스트",
      "fallbackActive": "백엔드 프록시 작동 시 텍스트"
    },
    "tooltips": {
      "collapse": "우측 툴바 접기 툴팁",
      "expand": "우측 툴바 펼치기 툴팁",
      "minimize": "최소화 버튼 툴팁",
      "maximize": "최대화 버튼 툴팁",
      "restore": "이전 크기로 복원 버튼 툴팁",
      "close": "챗봇 닫기 버튼 툴팁"
    },
    "dragMenu": {
      "send": "드래그 텍스트 입력창 연동 버튼",
      "summary": "드래그 텍스트 요약 버튼",
      "translate": "드래그 텍스트 번역 버튼",
      "explain": "드래그 텍스트 상세 설명 버튼"
    }
  },
  "settings": {
    "language": "언어 설정 섹션 타이틀",
    "position": "플로팅 런처 위치 섹션 타이틀",
    "positions": {
      "topLeft": "좌상단 라벨",
      "topRight": "우상단 라벨",
      "bottomLeft": "좌하단 라벨",
      "bottomRight": "우하단 라벨"
    },
    "size": "버튼 크기 섹션 타이틀",
    "sizes": {
      "small": "소 크기 라벨",
      "medium": "중 크기 라벨",
      "large": "대 크기 라벨",
      "original": "원본 크기 라벨",
      "custom": "커스텀 크기 라벨"
    },
    "customInput": "크기 직접 입력 라벨",
    "customRange": "입력 범위 안내문",
    "tooltip": "툴팁 호버 문구 섹션 타이틀",
    "tooltipPlaceholder": "텍스트 미입력 시 플레이스홀더",
    "tooltipStyle": "툴팁 스타일 섹션 타이틀",
    "tooltipStyles": {
      "standard": "기본형 라벨",
      "glow": "네온형 라벨",
      "modern": "모던형 라벨",
      "speech": "말풍선형 라벨"
    },
    "icon": "벡터 아이콘 선택 섹션 타이틀",
    "icons": {
      "message": "말풍선",
      "bot": "로봇",
      "cpu": "CPU",
      "sparkles": "별빛",
      "custom": "커스텀 이미지"
    },
    "imagePath": "커스텀 이미지 업로드 경로 라벨",
    "defaultImage": "기본 상태 이미지 라벨",
    "hoverImage": "마우스 오버 이미지 라벨",
    "attach": "파일 첨부 버튼",
    "emptyDefault": "공백 시 안내문",
    "preview": "미리보기 라벨",
    "hoverPreview": "호버 확인 라벨",
    "notSet": "미설정 상태 표시어",
    "recommendedSize": "추천 챗 윈도우 사이즈 섹션 타이틀",
    "recommendedSizeDesc": "사이즈 클릭 안내문",
    "recommendedSizes": {
      "minimal": "최소 크기 라벨",
      "standard": "기본 크기 라벨",
      "wide": "넓은 크기 라벨"
    }
  }
}
```
