import React, { useState } from "react";
import { Delete, ArrowUpDown, Calculator } from "lucide-react";

interface CalculatorPanelProps {
  t: any;
}

// 안전한 사칙연산 평가기 (Chrome Web Store 정책 준수를 위해 eval 사용 전면 배제)
function safeEvaluate(fn: string): number {
  const tokens = fn.replace(/\s+/g, "").match(/\d+(\.\d+)?|[+\-*/()]/g);
  if (!tokens) return 0;

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = (expected?: string) => {
    const t = tokens[pos];
    if (expected && t !== expected) {
      throw new Error(`Unexpected token: ${t}`);
    }
    pos++;
    return t;
  };

  const parsePrimary = (): number => {
    const t = peek();
    if (t === "(") {
      consume("(");
      const val = parseExpression();
      consume(")");
      return val;
    }
    if (t === "-") {
      consume("-");
      return -parsePrimary();
    }
    if (t === "+") {
      consume("+");
      return parsePrimary();
    }
    if (/^\d+(\.\d+)?$/.test(t)) {
      return parseFloat(consume());
    }
    throw new Error(`Invalid token: ${t}`);
  };

  const parseMultiplicative = (): number => {
    let val = parsePrimary();
    while (true) {
      const op = peek();
      if (op === "*" || op === "/") {
        consume();
        const nextVal = parsePrimary();
        if (op === "*") {
          val *= nextVal;
        } else {
          if (nextVal === 0) throw new Error("Division by zero");
          val /= nextVal;
        }
      } else {
        break;
      }
    }
    return val;
  };

  const parseExpression = (): number => {
    let val = parseMultiplicative();
    while (true) {
      const op = peek();
      if (op === "+" || op === "-") {
        consume();
        const nextVal = parseMultiplicative();
        if (op === "+") {
          val += nextVal;
        } else {
          val -= nextVal;
        }
      } else {
        break;
      }
    }
    return val;
  };

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new Error("Invalid expression");
  }
  return result;
}

// 헬퍼 수식 계산 로직
function evaluateExpression(equation: string, display: string): string {
  try {
    const fullExpression = equation + display;
    // 사칙연산 기호와 숫자, 공백 등만 허용하는 검증 필터
    const cleanExpr = fullExpression.replace(/[^0-9+\-*/().\s]/g, "");
    if (!cleanExpr) return "0";
    
    const result = safeEvaluate(cleanExpr);
    return Number(result.toFixed(8)).toString();
  } catch (e) {
    return "Error";
  }
}

// 평 ↔ 제곱미터(㎡) 단위 변환
function convertArea(val: string, toSquareMeter: boolean): string {
  const num = parseFloat(val);
  if (isNaN(num)) return "";
  
  if (toSquareMeter) {
    return (num * 3.30578).toFixed(2);
  } else {
    return (num * 0.3025).toFixed(2);
  }
}

// 섭씨(°C) ↔ 화씨(°F) 온도 단위 변환
function convertTemperature(val: string, toFahrenheit: boolean): string {
  const num = parseFloat(val);
  if (isNaN(num)) return "";
  
  if (toFahrenheit) {
    return ((num * 9) / 5 + 32).toFixed(1);
  } else {
    return (((num - 32) * 5) / 9).toFixed(1);
  }
}

export function CalculatorPanel({ t, theme }: { t: any; theme: any }) {
  const [display, setDisplay] = useState<string>("0");
  const [equation, setEquation] = useState<string>("");
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  // 단위 변환기 상태
  const [unitMode, setUnitMode] = useState<"area" | "temp">("area");
  const [inputVal, setInputVal] = useState<string>("");
  const [outputVal, setOutputVal] = useState<string>("");
  
  const [dirArea, setDirArea] = useState<boolean>(true); // true: 평->㎡, false: ㎡->평
  const [dirTemp, setDirTemp] = useState<boolean>(true); // true: C->F, false: F->C

  // 계산기 클릭 핸들러
  const handleNumClick = (num: string) => {
    if (display === "0" || isCalculated) {
      setDisplay(num);
      setIsCalculated(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOpClick = (op: string) => {
    setEquation(display + " " + op + " ");
    setDisplay("0");
    setIsCalculated(false);
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setIsCalculated(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleCalculate = () => {
    if (!equation) return;
    const result = evaluateExpression(equation, display);
    setDisplay(result);
    setEquation("");
    setIsCalculated(true);
  };

  // 단위 변환기 연산
  const handleUnitConvert = (val: string, mode: "area" | "temp", direction: boolean) => {
    setInputVal(val);
    if (mode === "area") {
      const converted = convertArea(val, direction);
      setOutputVal(converted);
    } else {
      const converted = convertTemperature(val, direction);
      setOutputVal(converted);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-inherit p-4 overflow-y-auto custom-scrollbar">
      {/* 헤더 */}
      <div className={`flex justify-between items-center select-none border-b ${theme.borderMuted} pb-3 pr-16`}>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.textMain}`}>
          <Calculator size={15} className="text-indigo-400" />
          {t("tools.calculator.title", "스마트 계산기 & 변환기")}
        </span>
      </div>

      {/* 계산기 섹션 */}
      <div className={`p-3 rounded-xl border ${theme.borderMuted} ${theme.bgSub} flex flex-col space-y-2`}>
        <div className="flex justify-between items-center select-none">
          <span className={`text-[10px] font-bold ${theme.textSub} tracking-wider`}>{t("tools.calc.title", "일반 계산기")}</span>
          <span className={`text-[10px] font-mono ${theme.textSub} truncate max-w-[150px]`}>{equation}</span>
        </div>
        
        {/* 디스플레이 */}
        <div className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg p-2.5 text-right text-lg font-mono font-bold tracking-tight ${theme.textMain} overflow-x-auto min-h-[46px] flex items-center justify-end`}>
          {display}
        </div>

        {/* 그리드 패드 */}
        <div className="grid grid-cols-4 gap-1.5 text-xs font-mono font-bold">
          <button type="button" onClick={handleClear} className="h-8 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/25 hover:bg-rose-600/30 flex items-center justify-center transition-all cursor-pointer">C</button>
          <button type="button" onClick={handleBackspace} className={`h-8 rounded-lg ${theme.bgInput} border ${theme.borderMuted} ${theme.textMain} hover:${theme.bgHover} flex items-center justify-center transition-all cursor-pointer`}><Delete size={13} /></button>
          <button type="button" onClick={() => handleOpClick("/")} className={`h-8 rounded-lg ${theme.bgInput} border ${theme.borderMuted} ${theme.text} hover:${theme.bgHover} flex items-center justify-center transition-all cursor-pointer`}>÷</button>
          <button type="button" onClick={() => handleOpClick("*")} className={`h-8 rounded-lg ${theme.bgInput} border ${theme.borderMuted} ${theme.text} hover:${theme.bgHover} flex items-center justify-center transition-all cursor-pointer`}>×</button>

          {["7", "8", "9"].map((num) => (
            <button key={num} type="button" onClick={() => handleNumClick(num)} className={`h-8 rounded-lg ${theme.bgSub} border ${theme.borderMuted} ${theme.textMain} hover:${theme.bgHover} flex items-center justify-center transition-all cursor-pointer`}>{num}</button>
          ))}
          <button type="button" onClick={() => handleOpClick("-")} className={`h-8 rounded-lg ${theme.bgInput} border ${theme.borderMuted} ${theme.text} hover:${theme.bgHover} flex items-center justify-center transition-all cursor-pointer`}>-</button>

          {["4", "5", "6"].map((num) => (
            <button key={num} type="button" onClick={() => handleNumClick(num)} className={`h-8 rounded-lg ${theme.bgSub} border ${theme.borderMuted} ${theme.textMain} hover:${theme.bgHover} flex items-center justify-center transition-all cursor-pointer`}>{num}</button>
          ))}
          <button type="button" onClick={() => handleOpClick("+")} className={`h-8 rounded-lg ${theme.bgInput} border ${theme.borderMuted} ${theme.text} hover:${theme.bgHover} flex items-center justify-center transition-all cursor-pointer`}>+</button>

          {["1", "2", "3"].map((num) => (
            <button key={num} type="button" onClick={() => handleNumClick(num)} className={`h-8 rounded-lg ${theme.bgSub} border ${theme.borderMuted} ${theme.textMain} hover:${theme.bgHover} flex items-center justify-center transition-all cursor-pointer`}>{num}</button>
          ))}
          <button type="button" onClick={handleCalculate} className={`row-span-2 h-17 rounded-lg ${theme.primary} text-white flex items-center justify-center transition-all cursor-pointer shadow-md font-extrabold text-sm hover:opacity-90`}>=</button>

          <button type="button" onClick={() => handleNumClick("0")} className={`col-span-2 h-8 rounded-lg ${theme.bgSub} border ${theme.borderMuted} ${theme.textMain} hover:${theme.bgHover} flex items-center justify-center transition-all cursor-pointer`}>0</button>
          <button type="button" onClick={() => handleNumClick(".")} className={`h-8 rounded-lg ${theme.bgSub} border ${theme.borderMuted} ${theme.textMain} hover:${theme.bgHover} flex items-center justify-center transition-all cursor-pointer`}>.</button>
        </div>
      </div>

      {/* 단위 변환기 섹션 */}
      <div className={`p-3 rounded-xl border ${theme.borderMuted} ${theme.bgSub} flex flex-col space-y-2.5`}>
        <div className="flex justify-between items-center select-none">
          <span className={`text-[10px] font-bold ${theme.textSub} tracking-wider`}>{t("tools.calc.converterTitle", "스마트 단위 변환기")}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setUnitMode("area"); setInputVal(""); setOutputVal(""); }}
              className={`text-[9px] px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${unitMode === "area" ? `${theme.primary} text-white` : `${theme.textSub} hover:${theme.textMain}`}`}
            >
              {t("tools.calc.pyung", "평")}/{t("tools.calc.m2", "㎡")}
            </button>
            <button
              type="button"
              onClick={() => { setUnitMode("temp"); setInputVal(""); setOutputVal(""); }}
              className={`text-[9px] px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${unitMode === "temp" ? `${theme.primary} text-white` : `${theme.textSub} hover:${theme.textMain}`}`}
            >
              {t("tools.calc.temp", "온도")}
            </button>
          </div>
        </div>
 
        {/* 변환 폼 */}
        <div className="flex flex-col space-y-2 text-xs">
          {unitMode === "area" ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[9px] ${theme.textSub} font-bold`}>{dirArea ? t("tools.calc.pyung", "평 (Pyung)") : t("tools.calc.m2", "제곱미터 (㎡)")}</span>
                <input
                  type="number"
                  placeholder={t("tools.calc.valInput", "값 입력")}
                  value={inputVal}
                  onChange={(e) => handleUnitConvert(e.target.value, "area", dirArea)}
                  className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1.5 outline-none font-mono ${theme.textMain} ${theme.focusBorder}`}
                />
              </div>
              <button
                type="button"
                onClick={() => { setDirArea(!dirArea); setInputVal(""); setOutputVal(""); }}
                className={`w-7 h-7 rounded-lg ${theme.bgInput} hover:${theme.bgHover} border ${theme.borderMuted} flex items-center justify-center mt-3.5 cursor-pointer ${theme.textMain} transition`}
                title={t("tools.calc.exchange", "단위 교환")}
              >
                <ArrowUpDown size={12} />
              </button>
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[9px] ${theme.textSub} font-bold`}>{dirArea ? t("tools.calc.m2", "제곱미터 (㎡)") : t("tools.calc.pyung", "평 (Pyung)")}</span>
                <div className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1.5 font-mono min-h-[33px] flex items-center ${theme.textMain} select-text`}>
                  {outputVal || "-"}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[9px] ${theme.textSub} font-bold`}>{dirTemp ? t("tools.calc.celsius", "섭씨 (°C)") : t("tools.calc.fahrenheit", "화씨 (°F)")}</span>
                <input
                  type="number"
                  placeholder={t("tools.calc.valInput", "값 입력")}
                  value={inputVal}
                  onChange={(e) => handleUnitConvert(e.target.value, "temp", dirTemp)}
                  className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1.5 outline-none font-mono ${theme.textMain} ${theme.focusBorder}`}
                />
              </div>
              <button
                type="button"
                onClick={() => { setDirTemp(!dirTemp); setInputVal(""); setOutputVal(""); }}
                className={`w-7 h-7 rounded-lg ${theme.bgInput} hover:${theme.bgHover} border ${theme.borderMuted} flex items-center justify-center mt-3.5 cursor-pointer ${theme.textMain} transition`}
                title={t("tools.calc.exchange", "단위 교환")}
              >
                <ArrowUpDown size={12} />
              </button>
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[9px] ${theme.textSub} font-bold`}>{dirTemp ? t("tools.calc.fahrenheit", "화씨 (°F)") : t("tools.calc.celsius", "섭씨 (°C)")}</span>
                <div className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1.5 font-mono min-h-[33px] flex items-center ${theme.textMain} select-text`}>
                  {outputVal || "-"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
