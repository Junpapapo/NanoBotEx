import { StockContext, ScenarioType, Message } from "../chatbot-types";
import { searchSymbols, getStockInfo, getStockNews, optimizePortfolio, scrapeWebPage, runTPocketRAG } from "../chatbot-api";
import { ChatbotModel } from "../chatbot-model";

const getNowString = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

/**
 * 텍스트에서 주식 종목을 감지하고 반환
 */
export async function searchAndDetectStock(
  text: string,
  activeStockContext: StockContext | null,
  t: (key: string, def: string) => string,
  onMultipleMatches: (suggestions: any[], messageContent: string) => void
): Promise<StockContext | null | "multiple"> {
  let keyword = "";
  const codeMatch = text.match(/\b\d{6}\b/);
  const tickerMatch = text.match(/\b[A-Za-z]{2,5}\b/);
  
  if (codeMatch) keyword = codeMatch[0];
  else if (tickerMatch) keyword = tickerMatch[0];
  else {
    const words = text.split(/[\s,?.!~:]+/).filter(w => w.length >= 2);
    const stopWords = ["뉴스", "주가", "시세", "분석", "정보", "검색", "추천", "차트", "실시간", "알려줘", "보여줘", "해줘", "어때", "종목", "삼성", "현대"];
    const searchCandidates = words.filter(w => !stopWords.includes(w));
    if (searchCandidates.length > 0) keyword = searchCandidates[0];
  }

  if (!keyword) return activeStockContext;

  // 한국 시장 검색
  const krSymbols = await searchSymbols(keyword, "KR");
  if (krSymbols && krSymbols.length > 0) {
    if (krSymbols.length > 1) {
      const suggestions = krSymbols.slice(0, 5).map((match: any) => ({
        code: match.code, name: match.name, price: match.close || 0, market: "KR", currency: "KRW"
      }));
      suggestions.push({ code: "ACTION_PLAIN_QUESTION", name: t("session.multipleMatch.plain", "일반대화"), price: 0, market: text, currency: "" });
      const msgContent = t("session.multipleMatch.kr", "**'{keyword}'** 관련 한국 종목이 여러 개 검색되었습니다. 아래에서 분석을 원하시는 종목을 선택해 주세요:").replace("{keyword}", keyword);
      onMultipleMatches(suggestions, msgContent);
      return "multiple";
    }
    const match = krSymbols[0];
    return { ticker: match.code, name: match.name, price: match.close || 0, market: "KR", currency: "KRW" };
  }

  // 미국 시장 검색
  const usSymbols = await searchSymbols(keyword, "US");
  if (usSymbols && usSymbols.length > 0) {
    if (usSymbols.length > 1) {
      const suggestions = usSymbols.slice(0, 5).map((match: any) => ({
        code: match.code, name: match.name, price: match.close || 0, market: "US", currency: "USD"
      }));
      suggestions.push({ code: "ACTION_PLAIN_QUESTION", name: t("session.multipleMatch.plain", "일반대화"), price: 0, market: text, currency: "" });
      const msgContent = t("session.multipleMatch.us", "**'{keyword}'** 관련 미국 종목이 여러 개 검색되었습니다. 아래에서 분석을 원하시는 종목을 선택해 주세요:").replace("{keyword}", keyword);
      onMultipleMatches(suggestions, msgContent);
      return "multiple";
    }
    const match = usSymbols[0];
    return { ticker: match.code, name: match.name, price: match.close || 0, market: "US", currency: "USD" };
  }

  return activeStockContext;
}

/**
 * 일반 시나리오 실행 (PRICE_CHECK, NEWS_CHECK, PORTFOLIO_OPT)
 */
export async function runStandardScenario(
  scenario: ScenarioType,
  text: string,
  activeStockContext: StockContext | null,
  t: (key: string, def: string) => string,
  onMultipleMatches: (suggestions: any[], content: string) => void,
  updateContent: (content: string) => void
): Promise<StockContext | null | "multiple"> {
  if (scenario === "PRICE_CHECK") {
    const detected = await searchAndDetectStock(text, activeStockContext, t, onMultipleMatches);
    if (!detected) {
      updateContent(t("session.priceCheck.notFound", "❌ **'{text}'**에 매칭되는 종목을 찾지 못했습니다.").replace("{text}", text));
      return null;
    }
    if (detected === "multiple") return "multiple";

    const info = await getStockInfo(detected.ticker, detected.market);
    if (info) {
      const currency = detected.market === "US" ? "USD" : "KRW";
      const changePct = info.change_pct ?? 0;
      const sign = changePct > 0 ? "+" : "";
      const changeIcon = changePct > 0 ? "🔺" : changePct < 0 ? "🔻" : "▫️";
      let content = t("session.priceCheck.header", "### 📊 **{name} ({ticker}) 실시간 시세**\n\n").replace("{name}", detected.name).replace("{ticker}", detected.ticker);
      content += `| ${t("session.priceCheck.type", "구분")} | ${t("session.priceCheck.valUnit", "정보 (단위: {unit})").replace("{unit}", currency)} |\n| :--- | :--- |\n`;
      content += `| **${t("session.priceCheck.price", "현재가")}** | **${info.close?.toLocaleString()} ${currency}** (${changeIcon} ${sign}${changePct}%) |\n`;
      content += `| **${t("session.priceCheck.ohlc", "시가 / 고가 / 저가")}** | ${info.open?.toLocaleString()} / ${info.high?.toLocaleString()} / ${info.low?.toLocaleString()} |\n`;
      content += `| **${t("session.priceCheck.volume", "당일 거래량")}** | ${info.volume?.toLocaleString()} 주 |\n`;
      content += t("session.priceCheck.footer", "\n--- \n*(조회 기준 시각: {time} | 실시간 API 즉시 연동 완료)*").replace("{time}", getNowString());
      updateContent(content);
    } else {
      updateContent(t("session.priceCheck.notFound", "❌ **'{text}'**의 정보를 가져오지 못했습니다.").replace("{text}", detected.name));
    }
    return detected;
  }

  if (scenario === "NEWS_CHECK") {
    const detected = await searchAndDetectStock(text, activeStockContext, t, onMultipleMatches);
    if (!detected) {
      updateContent(t("session.newsCheck.notFound", "❌ **'{text}'**에 매칭되는 종목을 찾지 못했습니다.").replace("{text}", text));
      return null;
    }
    if (detected === "multiple") return "multiple";

    const news = await getStockNews(detected.ticker, detected.market);
    const newsItems = news.slice(0, 5);
    let content = t("session.newsCheck.header", "### 📰 **[{name} ({ticker})] 최신 뉴스**\n\n").replace("{name}", detected.name).replace("{ticker}", detected.ticker);
    if (newsItems.length > 0) {
      newsItems.forEach((n: any, idx: number) => {
        let title = n.title;
        let site = n.site || n.source || t("session.newsCheck.news", "뉴스");
        const match = n.title.match(/^\[(.*?)\]\[(.*?)\]\s*(.*)$/);
        if (match) { site = match[2]; title = match[3]; }
        content += `${idx + 1}. **[${site}]** [${title}](${n.url || "#"})\n`;
      });
    } else {
      content += t("session.newsCheck.empty", "* 최근 관련 뉴스가 없습니다.\n");
    }
    content += t("session.newsCheck.footer", "\n--- \n*(수집 기준 시각: {time} | 실시간 크롤링 연동)*").replace("{time}", getNowString());
    updateContent(content);
    return detected;
  }

  if (scenario === "PORTFOLIO_OPT") {
    const result = await optimizePortfolio(text);
    if (result) {
      const w = result.weights || {};
      const perf = result.performance || {};
      let content = t("session.portfolioOpt.header", "### ⚖️ **미국 주식 포트폴리오 최적 배분율 (Sharpe Max)**\n\n#### **1. 최적 투자 비중 (Optimal Weights)**\n");
      Object.entries(w).forEach(([ticker, weight]: [string, any]) => {
        content += `* **${ticker}**: **${(weight * 100).toFixed(2)}%**\n`;
      });
      content += t("session.portfolioOpt.perfHeader", "\n#### **2. 포트폴리오 기대 성과 (3년 백테스트)**\n");
      content += `* **${t("session.portfolioOpt.expectedReturn", "연평균 기대수익률")}**: **${(perf.expected_return * 100).toFixed(2)}%**\n`;
      content += `* **${t("session.portfolioOpt.volatility", "포트폴리오 변동성")}**: **${(perf.volatility * 100).toFixed(2)}%**\n`;
      content += `* **${t("session.portfolioOpt.sharpe", "샤프 지수")}**: **${perf.sharpe_ratio?.toFixed(2)}**\n`;
      content += t("session.portfolioOpt.footer", "\n--- \n*(연산 분석 시각: {time} | 현대 포트폴리오 이론(MPT) 기반)*").replace("{time}", getNowString());
      updateContent(content);
    } else {
      updateContent(t("session.portfolioOpt.failed", "❌ **포트폴리오 최적화 실패**: 올바른 티커를 입력해 주세요."));
    }
    return null;
  }

  return null;
}

/**
 * 웹 스크레이핑 및 분석 진행 (PAGE_ANALYZE)
 */
export async function runWebScrapeAndAnalyze(
  url: string,
  t: (key: string, def: string) => string,
  session: any,
  apiMode: "local" | "api",
  updateContent: (text: string) => void,
  isAborted: () => boolean,
  contextLevel?: string
): Promise<void> {
  const trimmedText = url.trim();
  const isDirectScraped = trimmedText.startsWith("scraped-direct:");
  const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
  if (!isDirectScraped && !urlRegex.test(trimmedText)) {
    updateContent(t("session.webAnalyze.invalidUrl", "❌ **올바른 형식의 웹 페이지 주소(URL)를 입력해 주세요.** (http:// 또는 https:// 로 시작하는 주소)"));
    return;
  }

  const result = await scrapeWebPage(trimmedText);
  if (!result || result.status === "error") {
    updateContent(t("session.webAnalyze.failed", "❌ **웹 페이지 분석 실패**: 웹 페이지의 내용을 가져올 수 없습니다. URL을 확인하거나 나중에 다시 시도해 주세요."));
    return;
  }

  // 1. 답변길이(contextLevel)에 맞춘 원본 텍스트 물리적 슬라이싱 (인풋 토큰 한계 조율)
  const maxChars = contextLevel === "minimal" 
    ? 1500 
    : contextLevel === "detailed" 
      ? 8000 
      : 3500;
  
  const slicedText = result.text.substring(0, maxChars);

  let systemPrompt = "";
  const checkLang = t("session.webAnalyze.item", "구분");
  
  if (checkLang === "Item") {
    let engGuidelines = "";
    if (contextLevel === "minimal") {
      engGuidelines = `1. Core summary of the page (strictly 1 sentence).
2. List 3 key keywords.
- Keep it extremely short and compact. Omit detailed explanations.`;
    } else if (contextLevel === "detailed") {
      engGuidelines = `1. Detailed summary of the page core contents (5 sentences).
2. Comprehensive explanation of key concepts and main topics.
3. Draw 3 deep insights or take-aways with potential risks or opportunities.
- Provide a rich, thorough, and context-filled report.`;
    } else {
      engGuidelines = `1. Concise summary of the page core contents (3 sentences).
2. Explain the key concepts and main topics.
3. Draw 2 key insights or take-aways.`;
    }

    systemPrompt = `You are a professional Web Page Analyzer AI. Your task is to analyze the provided web page content and write a structured analysis report.
Guidelines:
${engGuidelines}
- Base your response 100% on the provided content. No hallucination.
Write the entire report in English.

[Web Page Title]: ${result.title}
[Web Page Content]:
${slicedText}`;
  } else if (checkLang === "区分") {
    let jpnGuidelines = "";
    if (contextLevel === "minimal") {
      jpnGuidelines = `1. ページの核心内容の要約（厳密に1文のみ）。
2. 主要なキーワード3つをリストアップ。
- 詳細な説明は省略し、極めて簡潔に作成してください。`;
    } else if (contextLevel === "detailed") {
      jpnGuidelines = `1. ページの核心内容の詳細な要約（5文程度）。
2. 主要な概念や主要トピックについての包括的かつ詳細な説明。
3. ユーザーのための深い洞察や要点・リスクなどを3つ抽出。
- 背景情報を含め、総合的で詳細なレポートを作成してください。`;
    } else {
      jpnGuidelines = `1. ページの核心内容の要約（3文程度）。
2. 主要な概念、主要なトピック、またはキーワードの説明。
3. ユーザーのための2つの重要な洞察または要点の抽出。`;
    }

    systemPrompt = `あなたは専門的なウェブページ分析AIです。提供されたウェブページの内容を分析し、構造化された分析レポートを作成してください。
ガイドライン：
${jpnGuidelines}
- 提供されたコンテンツに100％基づいて回答してください。
レポート全体を日本語で作成してください。

[ウェブページのタイトル]: ${result.title}
[ウェブコンテンツ]:
${slicedText}`;
  } else {
    let guidelines = "";
    if (contextLevel === "minimal") {
      guidelines = `[작성 가이드라인 - 짧은 요약 모드(S)]
1. 웹 페이지 핵심 내용 요약 (딱 1문장으로만 간결하게 요약)
2. 주요 키워드 3가지 나열
- 상세 정보 및 분석 포인트는 생략하고 최대한 콤팩트하게 작성하세요.`;
    } else if (contextLevel === "detailed") {
      guidelines = `[작성 가이드라인 - 상세 분석 모드(L)]
1. 웹 페이지 상세 요약 및 흐름 분석 (5문장 내외)
2. 주요 핵심 개념 및 키워드들에 대한 깊이 있는 상세 설명
3. 독자를 위한 금융/일반 관점의 세부 인사이트 및 리스크 포인트 3가지 도출
- 배경지식을 풍부하게 활용하여 종합적인 보고서 형태로 자세히 서술하세요.`;
    } else {
      guidelines = `[작성 가이드라인 - 표준 요약 모드(M)]
1. 웹 페이지 핵심 내용 요약 (3문장 내외)
2. 핵심 키워드 및 개념 설명
3. 독자를 위한 핵심 요약 포인트 2가지 도출`;
    }

    systemPrompt = `당신은 전문적인 웹 페이지 요약 및 분석 AI입니다. 아래 제공된 웹 페이지 본문 내용을 바탕으로 다음 작성 가이드라인에 맞추어 금융/일반 분석 보고서를 작성해 주세요.

${guidelines}
- 제공된 텍스트 본문 내용만을 100% 근거로 하여 사실만 작성하고, 절대 가상의 정보나 없는 사실을 지어내지 마세요.
- 전체 보고서는 한국어로 작성해 주세요.

[웹 페이지 제목]: ${result.title}
[웹 페이지 본문]:
${slicedText}`;
  }

  let aiAnalyzedText = "";
  const headerTemplate = t("session.webAnalyze.reportHeader", "### 📄 **{title} 요약 및 분석 보고서**\n\n").replace("{title}", result.title);
  
  const handleChunk = (chunk: string) => {
    if (isAborted()) return;
    aiAnalyzedText += chunk;
    updateContent(`${headerTemplate}${aiAnalyzedText}`);
  };

  if (session && typeof session.promptStreaming === "function" && apiMode === "local") {
    const stream = session.promptStreaming(systemPrompt);
    for await (const chunk of stream) {
      if (isAborted()) break;
      
      // 누적형(Cumulative)과 델타형(Delta) 청크 스펙 모두 완벽 호환되도록 지능형 누적 처리
      if (chunk) {
        if (chunk.startsWith(aiAnalyzedText)) {
          aiAnalyzedText = chunk;
        } else {
          aiAnalyzedText += chunk;
        }
      }
      updateContent(`${headerTemplate}${aiAnalyzedText}`);
    }
  } else {
    await ChatbotModel.streamExternalChat(
      [{ id: "1", role: "user", content: systemPrompt }],
      handleChunk,
      () => {},
      (err) => console.error(err)
    );
  }

  let dataContent = `\n\n#### **📊 ${t("session.webAnalyze.sourceInfo", "분석 근거 정보")}**\n`;
  dataContent += `| ${t("session.webAnalyze.item", "구분")} | ${t("session.webAnalyze.detail", "정보")} |\n| :--- | :--- |\n`;
  dataContent += `| **${t("session.webAnalyze.sourceUrl", "출처 URL")}** | [${result.title}](${result.url}) |\n`;
  dataContent += `| **${t("session.webAnalyze.charCount", "추출된 글자 수")}** | ${slicedText.length.toLocaleString()} 자 (원본 ${result.text.length.toLocaleString()} 자) |\n`;
  
  const footerTime = t("session.webAnalyze.footer", "분석 기준 시각: {time} | AI 웹 요약 및 분석").replace("{time}", getNowString());
  const finalContent = `${headerTemplate}${aiAnalyzedText}${dataContent}\n---\n*(${footerTime})*`;
  
  updateContent(finalContent);
}

/**
 * 실시간 검색 RAG 실행
 */
export async function runRAG(
  text: string,
  promptWithHistory: string,
  t: (key: string, def: string) => string,
  updateContent: (text: string) => void
): Promise<void> {
  updateContent(t("session.ragStart", "🔍 **선택하신 숏컷 프롬프트에 기반하여 실시간 검색 연동을 시작합니다.**"));
  const tags: string[] = [];
  Array.from(text.matchAll(/\*([^*]+)\*/g)).forEach(m => {
    tags.push(`[REALTIME_SEARCH:lite] *${m[1]}*`);
  });
  const finalPrompt = tags.length > 0 ? `${tags.join("\n")}\n\n${promptWithHistory}` : promptWithHistory;
  const responseText = await runTPocketRAG(finalPrompt);
  updateContent(responseText);
}
