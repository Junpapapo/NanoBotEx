import React, { useState, useEffect } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";

export interface Rates {
  USD: number;
  JPY: number;
  EUR: number;
  CNY: number;
  KRW: number;
}

const FALLBACK_RATES: Rates = {
  USD: 1,
  JPY: 158.0,
  EUR: 0.93,
  CNY: 7.25,
  KRW: 1385.0
};

export function ExchangePanel({ t, theme, locale }: { t: any; theme: any; locale?: string }) {
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(t("tools.exchange.offline", "기본값(오프라인)"));

  // 환산용 상태
  const [sourceCurrency, setSourceCurrency] = useState<keyof Rates>("USD");
  const [sourceAmount, setSourceAmount] = useState<string>("1");
  const [convertedAmounts, setConvertedAmounts] = useState<Record<string, number>>({});

  const handleFetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      if (data && data.rates) {
        const r = data.rates;
        const newRates: Rates = {
          USD: 1,
          JPY: r.JPY || FALLBACK_RATES.JPY,
          EUR: r.EUR || FALLBACK_RATES.EUR,
          CNY: r.CNY || FALLBACK_RATES.CNY,
          KRW: r.KRW || FALLBACK_RATES.KRW
        };
        setRates(newRates);
        const timeLocale = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";
        const dateStr = new Date().toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastUpdated(dateStr);
      } else {
        throw new Error("Invalid format");
      }
    } catch (e) {
      console.warn("Failed to fetch rates, fallback used:", e);
      setRates(FALLBACK_RATES);
      setLastUpdated(t("tools.exchange.errorFallback", "오류 (백업 환율 적용)"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchRates();
  }, []);

  // 환산 계산
  useEffect(() => {
    const amount = parseFloat(sourceAmount);
    if (isNaN(amount) || amount <= 0) {
      setConvertedAmounts({});
      return;
    }
    const usdVal = amount / rates[sourceCurrency];
    setConvertedAmounts({
      KRW: usdVal * rates.KRW,
      USD: usdVal,
      JPY: usdVal * rates.JPY,
      EUR: usdVal * rates.EUR,
      CNY: usdVal * rates.CNY
    });
  }, [sourceAmount, sourceCurrency, rates]);

  const symbolMap: Record<keyof Rates, string> = {
    USD: t("tools.exchange.currencies.USD", "$ (달러)"),
    KRW: t("tools.exchange.currencies.KRW", "₩ (원)"),
    JPY: t("tools.exchange.currencies.JPY", "¥ (엔)"),
    EUR: t("tools.exchange.currencies.EUR", "€ (유로)"),
    CNY: t("tools.exchange.currencies.CNY", "¥ (위안)")
  };

  const usdToKrw = rates.KRW;
  const jpyToKrw = (rates.KRW / rates.JPY) * 100;
  const eurToKrw = rates.KRW / rates.EUR;
  const cnyToKrw = rates.KRW / rates.CNY;

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit p-4 overflow-y-auto custom-scrollbar">
      {/* 헤더 */}
      <div className={`flex justify-between items-center select-none border-b ${theme.borderMuted} pb-3 pr-16`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          <TrendingUp size={15} className="text-emerald-400" />
          {t("panel.titles.exchange", "실시간 환율 변환")}
        </span>
      </div>

      {/* 실시간 기준 환율 정보판 */}
      <div className={`p-3.5 rounded-xl border ${theme.borderMuted} ${theme.bgSub} flex flex-col gap-3`}>
        <div className="flex justify-between items-center select-none">
          <span className={`text-xs font-bold ${theme.textSub} uppercase tracking-wider flex items-center gap-1.5`}>
            {t("tools.exchange.info", "환율 정보")}
          </span>
          <button
            type="button"
            onClick={handleFetchRates}
            disabled={loading}
            className={`w-6 h-6 rounded-lg hover:${theme.bgHover} ${theme.textSub} hover:${theme.textMain} flex items-center justify-center cursor-pointer transition disabled:opacity-50`}
            title={t("tools.exchange.refresh", "새로고침")}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* 주요 통화 간이 테이블 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`flex justify-between p-2 rounded-lg ${theme.bgInput} border ${theme.borderMuted}`}>
            <span className={`${theme.textSub} font-bold`}>🇺🇸 1 USD</span>
            <span className={`font-mono ${theme.textMain} font-black`}>{usdToKrw.toFixed(1)} KRW</span>
          </div>
          <div className={`flex justify-between p-2 rounded-lg ${theme.bgInput} border ${theme.borderMuted}`}>
            <span className={`${theme.textSub} font-bold`}>🇯🇵 100 JPY</span>
            <span className={`font-mono ${theme.textMain} font-black`}>{jpyToKrw.toFixed(1)} KRW</span>
          </div>
          <div className={`flex justify-between p-2 rounded-lg ${theme.bgInput} border ${theme.borderMuted}`}>
            <span className={`${theme.textSub} font-bold`}>🇪🇺 1 EUR</span>
            <span className={`font-mono ${theme.textMain} font-black`}>{eurToKrw.toFixed(1)} KRW</span>
          </div>
          <div className={`flex justify-between p-2 rounded-lg ${theme.bgInput} border ${theme.borderMuted}`}>
            <span className={`${theme.textSub} font-bold`}>🇨🇳 1 CNY</span>
            <span className={`font-mono ${theme.textMain} font-black`}>{cnyToKrw.toFixed(1)} KRW</span>
          </div>
        </div>

        <div className={`text-[10px] text-right ${theme.textSub} font-mono font-bold`}>
          Update: {lastUpdated}
        </div>
      </div>

      {/* 대화형 환율 계산기 */}
      <div className={`p-3.5 rounded-xl border ${theme.borderMuted} ${theme.bgSub} flex flex-col gap-3`}>
        <span className={`text-xs font-bold ${theme.textSub} uppercase tracking-wider select-none`}>
          {t("tools.exchange.calculatorTitle", "금액 직접 계산")}
        </span>

        {/* 원본 금액 입력 */}
        <div className="flex gap-2">
          <select
            value={sourceCurrency}
            onChange={(e) => setSourceCurrency(e.target.value as keyof Rates)}
            className={`w-28 ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-1.5 py-1 text-xs ${theme.textMain} outline-none font-bold cursor-pointer`}
          >
            {Object.keys(symbolMap).map((curr) => (
              <option key={curr} value={curr} className={theme.textMain === "text-slate-800" ? "bg-white text-slate-800" : "bg-slate-950 text-white"}>
                {symbolMap[curr as keyof Rates]}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder={t("tools.exchange.valInput", "금액 입력")}
            value={sourceAmount}
            onChange={(e) => setSourceAmount(e.target.value)}
            className={`flex-1 ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1 text-xs ${theme.textMain} outline-none font-mono font-bold ${theme.focusBorder}`}
          />
        </div>

        {/* 변환 결과 표시 목록 */}
        <div className={`space-y-2 pt-2 border-t ${theme.borderMuted}`}>
          {Object.entries(symbolMap)
            .filter(([curr]) => curr !== sourceCurrency)
            .map(([curr, name]) => {
              const val = convertedAmounts[curr];
              return (
                <div key={curr} className={`flex justify-between items-center text-xs py-1 border-b ${theme.borderMuted}`}>
                  <span className={`${theme.textSub} font-semibold`}>{name}</span>
                  <span className={`font-mono ${theme.textMain} font-extrabold`}>
                    {val !== undefined ? val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : "-"}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
