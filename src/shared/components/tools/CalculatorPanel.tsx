import React, { useState } from "react";
import { Delete, Calculator } from "lucide-react";

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

export function CalculatorPanel({ t, theme }: { t: any; theme: any }) {
  const [display, setDisplay] = useState<string>("0");
  const [equation, setEquation] = useState<string>("");
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  // 단위 변환기 상태 (양방향 반응형 데이터 바인딩)
  const [pyungVal, setPyungVal] = useState<string>("0");
  const [m2Val, setM2Val] = useState<string>("");

  const [celsiusVal, setCelsiusVal] = useState<string>("");
  const [fahrenheitVal, setFahrenheitVal] = useState<string>("");

  const [cmVal, setCmVal] = useState<string>("");
  const [inchVal, setInchVal] = useState<string>("");

  const [cm2Val, setCm2Val] = useState<string>("");
  const [ftVal, setFtVal] = useState<string>("");

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

  // 양방향 단위 변환 처리 핸들러들
  const handleAreaChange = (val: string, isPyung: boolean) => {
    if (isPyung) {
      setPyungVal(val);
      const num = parseFloat(val);
      if (isNaN(num)) {
        setM2Val("");
      } else {
        setM2Val((num * 3.30578).toFixed(2));
      }
    } else {
      setM2Val(val);
      const num = parseFloat(val);
      if (isNaN(num)) {
        setPyungVal("");
      } else {
        setPyungVal((num * 0.3025).toFixed(2));
      }
    }
  };

  const handleTempChange = (val: string, isCelsius: boolean) => {
    if (isCelsius) {
      setCelsiusVal(val);
      const num = parseFloat(val);
      if (isNaN(num)) {
        setFahrenheitVal("");
      } else {
        setFahrenheitVal(((num * 9) / 5 + 32).toFixed(1));
      }
    } else {
      setFahrenheitVal(val);
      const num = parseFloat(val);
      if (isNaN(num)) {
        setCelsiusVal("");
      } else {
        setCelsiusVal((((num - 32) * 5) / 9).toFixed(1));
      }
    }
  };

  const handleCmInchChange = (val: string, isCm: boolean) => {
    if (isCm) {
      setCmVal(val);
      const num = parseFloat(val);
      if (isNaN(num)) {
        setInchVal("");
      } else {
        setInchVal((num / 2.54).toFixed(2));
      }
    } else {
      setInchVal(val);
      const num = parseFloat(val);
      if (isNaN(num)) {
        setCmVal("");
      } else {
        setCmVal((num * 2.54).toFixed(2));
      }
    }
  };

  const handleCmFtChange = (val: string, isCm: boolean) => {
    if (isCm) {
      setCm2Val(val);
      const num = parseFloat(val);
      if (isNaN(num)) {
        setFtVal("");
      } else {
        setFtVal((num / 30.48).toFixed(2));
      }
    } else {
      setFtVal(val);
      const num = parseFloat(val);
      if (isNaN(num)) {
        setCm2Val("");
      } else {
        setCm2Val((num * 30.48).toFixed(2));
      }
    }
  };

  // UI 테마 설정 검진
  const isLight = theme.bgSub.includes("bg-white") || theme.bgSub.includes("bg-slate-50") || theme.bgSub.includes("bg-gray-50");

  // 공통 버튼 기본 클래스 (입체감과 클릭 리액션 지원)
  const btnBase = "h-9 rounded-xl transition-all duration-100 flex items-center justify-center cursor-pointer relative active:translate-y-[1px] select-none text-xs font-sans";

  // 1. 숫자패드 버튼 스타일 (단순하고 깔끔한 미니멀 디자인)
  const numClass = `${btnBase} font-medium text-[13.5px] ` + (isLight 
    ? "bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 border-b-[2.5px] border-b-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)] active:border-b active:bg-slate-100" 
    : "bg-slate-800/40 hover:bg-slate-800/75 text-slate-200 border border-slate-700/50 border-b-[2.5px] border-b-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.12)] active:border-b active:bg-slate-800");

  // 2. 사칙연산 버튼 스타일 (눈에 잘 띄는 세련된 인디고 계열)
  const opClass = `${btnBase} font-bold text-[15px] ` + (isLight
    ? "bg-indigo-50/70 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/50 border-b-[2.5px] border-b-indigo-300/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] active:border-b active:bg-indigo-100/50"
    : "bg-indigo-600/18 hover:bg-indigo-600/32 text-indigo-300 border border-indigo-500/20 border-b-[2.5px] border-b-indigo-950 shadow-[0_1px_2px_rgba(0,0,0,0.12)] active:border-b active:bg-indigo-600/10");

  // 3. 클리어 버튼 스타일 (로즈 컬러 포인트)
  const clearClass = `${btnBase} font-bold text-[13.5px] ` + (isLight
    ? "bg-rose-50/70 hover:bg-rose-100 text-rose-600 border border-rose-200/50 border-b-[2.5px] border-b-rose-300/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] active:border-b active:bg-rose-100/50"
    : "bg-rose-600/18 hover:bg-rose-600/32 text-rose-300 border border-rose-500/20 border-b-[2.5px] border-b-rose-950 shadow-[0_1px_2px_rgba(0,0,0,0.12)] active:border-b active:bg-rose-600/10");

  // 4. 백스페이스 버튼 스타일 (슬레이트 컬러 포인트)
  const backspaceClass = `${btnBase} ` + (isLight
    ? "bg-slate-100 hover:bg-slate-200/70 text-slate-500 border border-slate-200 border-b-[2.5px] border-b-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)] active:border-b active:bg-slate-200"
    : "bg-slate-700/30 hover:bg-slate-700/55 text-slate-300 border border-slate-650/40 border-b-[2.5px] border-b-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.12)] active:border-b active:bg-slate-700/40");

  // 5. 등호 (=) 버튼 스타일 (풍부한 그라데이션 광택)
  const equalClass = `${btnBase} font-black text-[16px] row-span-2 h-full bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white border border-indigo-400/20 border-b-[3px] border-b-indigo-950 shadow-[0_3px_6px_rgba(99,102,241,0.25)] active:border-b-[1px] active:translate-y-[1.5px] active:shadow-none`;

  // 6. 디스플레이 표시창 글래스모피즘 효과 (투명한 흐린 유리 느낌)
  const displayClass = `w-full border rounded-xl p-2.5 text-right text-lg font-mono font-bold tracking-tight overflow-x-auto min-h-[46px] flex items-center justify-end backdrop-blur-md ` + (isLight
    ? "bg-slate-100/35 text-slate-800 border-white/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)]"
    : "bg-slate-950/45 text-slate-100 border-slate-700/30 shadow-[inset_0_2px_6px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.03)]");

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
      <div className={`p-3 rounded-xl border ${theme.borderMuted} ${theme.bgSub} flex flex-col space-y-2.5 mt-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}>
        <div className="flex justify-between items-center select-none">
          <span className={`text-[10px] font-bold ${theme.textSub} tracking-wider`}>{t("tools.calc.title", "일반 계산기")}</span>
          <span className={`text-[10px] font-mono ${theme.textSub} truncate max-w-[150px]`}>{equation}</span>
        </div>
        
        {/* 디스플레이 */}
        <div className={displayClass}>
          {display}
        </div>

        {/* 그리드 패드 */}
        <div className="grid grid-cols-4 gap-2 text-xs font-mono font-bold">
          <button type="button" onClick={handleClear} className={clearClass}>C</button>
          <button type="button" onClick={handleBackspace} className={backspaceClass}><Delete size={13} /></button>
          <button type="button" onClick={() => handleOpClick("/")} className={opClass}><span className="text-[14px] leading-none">÷</span></button>
          <button type="button" onClick={() => handleOpClick("*")} className={opClass}><span className="text-[14px] leading-none">×</span></button>

          {["7", "8", "9"].map((num) => (
            <button key={num} type="button" onClick={() => handleNumClick(num)} className={numClass}>{num}</button>
          ))}
          <button type="button" onClick={() => handleOpClick("-")} className={opClass}><span className="text-[14px] leading-none">-</span></button>

          {["4", "5", "6"].map((num) => (
            <button key={num} type="button" onClick={() => handleNumClick(num)} className={numClass}>{num}</button>
          ))}
          <button type="button" onClick={() => handleOpClick("+")} className={opClass}><span className="text-[14px] leading-none">+</span></button>

          {["1", "2", "3"].map((num) => (
            <button key={num} type="button" onClick={() => handleNumClick(num)} className={numClass}>{num}</button>
          ))}
          <button type="button" onClick={handleCalculate} className={equalClass}>=</button>

          <button type="button" onClick={() => handleNumClick("0")} className={`col-span-2 ${numClass}`}>0</button>
          <button type="button" onClick={() => handleNumClick(".")} className={numClass}>.</button>
        </div>
      </div>

      {/* 단위 변환기 섹션 */}
      <div className={`p-3 rounded-xl border ${theme.borderMuted} ${theme.bgSub} flex flex-col space-y-4 mt-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}>
        <div className="flex justify-between items-center select-none border-b border-slate-700/40 pb-1.5">
          <span className={`text-[10px] font-black ${theme.textSub} tracking-wider uppercase`}>{t("tools.calc.converterTitle", "스마트 단위 변환기")}</span>
        </div>
 
        {/* 모든 변환기를 세로로 스택 배치 및 실시간 양방향 반응형 바인딩 */}
        <div className="flex flex-col space-y-4 text-xs">
          {/* 1. 면적 변환기 (평 ↔ ㎡) */}
          <div className="flex flex-col space-y-1">
            <span className={`text-[8.5px] ${theme.textSub} font-black uppercase tracking-wide`}>{t("tools.calc.areaTitle", "면적 (Area)")}</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[8px] ${theme.textSub} font-bold`}>{t("tools.calc.pyung", "평 (Pyung)")}</span>
                <input
                  type="number"
                  placeholder={t("tools.calc.valInput", "값 입력")}
                  value={pyungVal}
                  onChange={(e) => handleAreaChange(e.target.value, true)}
                  className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1 outline-none font-mono text-[10.5px] ${theme.textMain} ${theme.focusBorder}`}
                />
              </div>
              <span className={`text-slate-500 font-bold self-end mb-1 text-[10px]`}>↔</span>
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[8px] ${theme.textSub} font-bold`}>{t("tools.calc.m2", "제곱미터 (㎡)")}</span>
                <input
                  type="number"
                  placeholder={t("tools.calc.valInput", "값 입력")}
                  value={m2Val}
                  onChange={(e) => handleAreaChange(e.target.value, false)}
                  className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1 outline-none font-mono text-[10.5px] ${theme.textMain} ${theme.focusBorder}`}
                />
              </div>
            </div>
          </div>

          {/* 2. 온도 변환기 (섭씨 ↔ 화씨) */}
          <div className="flex flex-col space-y-1">
            <span className={`text-[8.5px] ${theme.textSub} font-black uppercase tracking-wide`}>{t("tools.calc.tempTitle", "온도 (Temperature)")}</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[8px] ${theme.textSub} font-bold`}>{t("tools.calc.celsius", "섭씨 (°C)")}</span>
                <input
                  type="number"
                  placeholder={t("tools.calc.valInput", "값 입력")}
                  value={celsiusVal}
                  onChange={(e) => handleTempChange(e.target.value, true)}
                  className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1 outline-none font-mono text-[10.5px] ${theme.textMain} ${theme.focusBorder}`}
                />
              </div>
              <span className={`text-slate-500 font-bold self-end mb-1 text-[10px]`}>↔</span>
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[8px] ${theme.textSub} font-bold`}>{t("tools.calc.fahrenheit", "화씨 (°F)")}</span>
                <input
                  type="number"
                  placeholder={t("tools.calc.valInput", "값 입력")}
                  value={fahrenheitVal}
                  onChange={(e) => handleTempChange(e.target.value, false)}
                  className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1 outline-none font-mono text-[10.5px] ${theme.textMain} ${theme.focusBorder}`}
                />
              </div>
            </div>
          </div>

          {/* 3. 길이 변환기 (cm ↔ inch) */}
          <div className="flex flex-col space-y-1">
            <span className={`text-[8.5px] ${theme.textSub} font-black uppercase tracking-wide`}>{t("tools.calc.lengthCmInchTitle", "길이 (cm ↔ inch)")}</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[8px] ${theme.textSub} font-bold`}>{t("tools.calc.cm", "센티미터 (cm)")}</span>
                <input
                  type="number"
                  placeholder={t("tools.calc.valInput", "값 입력")}
                  value={cmVal}
                  onChange={(e) => handleCmInchChange(e.target.value, true)}
                  className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1 outline-none font-mono text-[10.5px] ${theme.textMain} ${theme.focusBorder}`}
                />
              </div>
              <span className={`text-slate-500 font-bold self-end mb-1 text-[10px]`}>↔</span>
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[8px] ${theme.textSub} font-bold`}>{t("tools.calc.inch", "인치 (inch)")}</span>
                <input
                  type="number"
                  placeholder={t("tools.calc.valInput", "값 입력")}
                  value={inchVal}
                  onChange={(e) => handleCmInchChange(e.target.value, false)}
                  className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1 outline-none font-mono text-[10.5px] ${theme.textMain} ${theme.focusBorder}`}
                />
              </div>
            </div>
          </div>

          {/* 4. 길이 변환기 (cm ↔ ft) */}
          <div className="flex flex-col space-y-1">
            <span className={`text-[8.5px] ${theme.textSub} font-black uppercase tracking-wide`}>{t("tools.calc.lengthCmFtTitle", "길이 (cm ↔ ft)")}</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[8px] ${theme.textSub} font-bold`}>{t("tools.calc.cm", "센티미터 (cm)")}</span>
                <input
                  type="number"
                  placeholder={t("tools.calc.valInput", "값 입력")}
                  value={cm2Val}
                  onChange={(e) => handleCmFtChange(e.target.value, true)}
                  className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1 outline-none font-mono text-[10.5px] ${theme.textMain} ${theme.focusBorder}`}
                />
              </div>
              <span className={`text-slate-500 font-bold self-end mb-1 text-[10px]`}>↔</span>
              <div className="flex-1 flex flex-col space-y-1">
                <span className={`text-[8px] ${theme.textSub} font-bold`}>{t("tools.calc.ft", "피트 (ft)")}</span>
                <input
                  type="number"
                  placeholder={t("tools.calc.valInput", "값 입력")}
                  value={ftVal}
                  onChange={(e) => handleCmFtChange(e.target.value, false)}
                  className={`w-full ${theme.bgInput} border ${theme.borderMuted} rounded-lg px-2.5 py-1 outline-none font-mono text-[10.5px] ${theme.textMain} ${theme.focusBorder}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
