import { API_BASE_URL } from "./chatbot-constants";

export interface StockSuggestion {
  code: string;
  name: string;
  market: string;
  price: number;
  currency?: string;
}

export async function searchSymbols(query: string, market: "KR" | "US"): Promise<any[]> {
  try {
    const endpoint = market === "US" ? "/api/us/symbols" : "/api/kr/symbols";
    const res = await fetch(`${API_BASE_URL}${endpoint}?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.status === "success" ? (data.data || []) : [];
  } catch (e) {
    console.error("Symbol search error:", e);
    return [];
  }
}

export async function getStockInfo(code: string, market: string): Promise<any> {
  try {
    const endpoint =
      market === "US"
        ? `/api/us/info/${code}`
        : market === "JP"
          ? `/api/jp/info/${code}`
          : `/api/kr/info/${code}`;
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.status === "success" ? data.data : null;
  } catch (e) {
    console.error("Stock info fetch error:", e);
    return null;
  }
}

export async function getStockNews(code: string, market: string): Promise<any[]> {
  try {
    const endpoint =
      market === "US"
        ? `/api/us/news/${code}`
        : market === "JP"
          ? `/api/jp/news/${code}`
          : `/api/kr/news/${code}`;
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.status === "success" ? (data.data || []) : [];
  } catch (e) {
    console.error("Stock news fetch error:", e);
    return [];
  }
}

export async function optimizePortfolio(tickers: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/us/portfolio/optimize?tickers=${encodeURIComponent(tickers)}&years=3`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.status === "success" ? data : null;
  } catch (e) {
    console.error("Portfolio optimization error:", e);
    return null;
  }
}

export async function runTPocketRAG(prompt: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/global/proxy/tpocket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, feature: "NANO_AI_RAG" })
    });
    if (!res.ok) throw new Error(`Server returned status ${res.status}`);
    const data = await res.json();
    return data.response || "";
  } catch (e: any) {
    console.error("TPocket RAG proxy error:", e);
    throw e;
  }
}

export async function scrapeWebPage(url: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chatbot/web/scrape?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
      const errorData = await res.json();
      return { status: "error", message: errorData.detail || "Failed to scrape page" };
    }
    return await res.json();
  } catch (e: any) {
    console.error("Web page scrape error:", e);
    return { status: "error", message: e.message || "Network error" };
  }
}
