import React, { useState, useMemo } from "react";
import * as Icons from "lucide-react";
import { icons } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 검색 키워드가 맵핑된 이모지 목록
const emojiList = [
  { char: "🚀", name: "rocket 우주선 로켓 시작 start launch 스타트" },
  { char: "📈", name: "chart 챠트 상승 up grow price 시세 주가 주식" },
  { char: "📉", name: "chart 챠트 하락 down fall price 시세 주가 주식" },
  { char: "📊", name: "chart 챠트 분석 bar data 데이터 통계" },
  { char: "📰", name: "news 뉴스 신문 소식 paper 정보 속보" },
  { char: "💡", name: "idea 아이디어 생각 light bulb 팁 힌트" },
  { char: "💻", name: "computer 컴퓨터 개발 pc laptop 코딩" },
  { char: "📱", name: "phone 폰 모바일 mobile 스마트폰" },
  { char: "🔋", name: "battery 배터리 충전 power 전력 에너지" },
  { char: "🤖", name: "robot 로봇 ai chatbot 챗봇 제미니 머신" },
  { char: "🛸", name: "ufo 유에프오 외계인 space 우주" },
  { char: "🎓", name: "education 교육 학업 졸업 study 공부 배움" },
  { char: "💼", name: "portfolio 포트폴리오 가방 business work 직장 회사" },
  { char: "📁", name: "folder 폴더 파일 file archive 보관" },
  { char: "📂", name: "folder 폴더 열림 file open 오픈" },
  { char: "📅", name: "calendar 달력 일정 date schedule 스케줄 날짜" },
  { char: "⏰", name: "time 시간 알람 clock alert 시계 타이머" },
  { char: "🛠️", name: "tool 도구 설정 fix build 수리 툴" },
  { char: "⚙️", name: "settings 설정 기어 gear config 제어" },
  { char: "🔍", name: "search 검색 돋보기 find 찾기 조회" },
  { char: "🔑", name: "key 키 열쇠 비밀번호 auth 인증" },
  { char: "🔒", name: "lock 잠금 보안 security 패스워드" },
  { char: "🎨", name: "design 디자인 미술 art color 색상 팔레트" },
  { char: "✍️", name: "write 쓰기 메모 edit pencil 연필 작성" },
  { char: "✉️", name: "mail 메일 편지 이메일 email 수신" },
  { char: "📢", name: "notice 공지 확성기 announce broadcast 알림" },
  { char: "💬", name: "chat 대화 챗 message talk 메신저" },
  { char: "💭", name: "thought 생각 대화 챗 bubble 말풍선" },
  { char: "🧠", name: "brain 브레인 ai 생각 mind 지능" },
  { char: "⚡", name: "thunder 번개 스피드 fast zap 신속" },
  { char: "🌟", name: "star 별 즐겨찾기 favorite 스타 인기" },
  { char: "✨", name: "sparkles 반짝 sparkles 신규 새 new 효과" },
  { char: "🔥", name: "fire 불 핫 인기 hot trend 트렌드 추천" },
  { char: "🏆", name: "trophy 트로피 우승 1등 rank 순위" },
  { char: "💎", name: "diamond 다이아몬드 보석 premium 고급 보물" },
  { char: "💵", name: "money 돈 달러 cash usd 현금 현찰" },
  { char: "🪙", name: "coin 코인 동전 crypto 화폐 암호화폐" },
  { char: "🌐", name: "web 웹 글로벌 world earth 지구 네트워크" },
  { char: "🧭", name: "compass 나침반 가이드 guide navigation 방향" },
  { char: "🏠", name: "home 홈 집 main 메인 화면" },
  { char: "🎰", name: "slot 슬롯 럭키 lucky 대박 배당" },
  { char: "🧩", name: "puzzle 퍼즐 연계 block 블록 조각" },
  { char: "♟️", name: "chess 체스 전략 strategy 기획" },
  { char: "🎯", name: "target 타겟 목표 goal 타점 과녁" },
  { char: "🔬", name: "science 과학 분석 lab test 실험 연구" },
  { char: "🔭", name: "telescope 망원경 미래 관측 watch 전망" },
  { char: "🧬", name: "dna 유전자 분석 science 생명 바이오" }
];

// 검색 키워드가 맵핑된 추천 Lucide 아이콘 목록
const recommendedIcons = [
  { key: "TrendingUp", name: "trendingup 상승 챠트 그래프 차트 grow up 시세 주식" },
  { key: "Globe", name: "globe 지구 웹 세계 글로벌 world global 인터넷" },
  { key: "Coins", name: "coins 동전 코인 돈 money cash crypto 자산" },
  { key: "ArrowUpDown", name: "arrowupdown 정렬 오름차순 내림차순 수급 sort 거래" },
  { key: "PieChart", name: "piechart 원형 챠트 포트폴리오 비중 chart 분배" },
  { key: "Newspaper", name: "newspaper 뉴스 신문 소식 paper info 속보" },
  { key: "Zap", name: "zap 번개 신속 빠른 fast quick speed 스피드" },
  { key: "Cpu", name: "cpu 인공지능 프로세서 연산 ai chip 칩 컴퓨터" },
  { key: "Activity", name: "activity 심박수 진단 분석 활성 status 액티비티" },
  { key: "Calendar", name: "calendar 일정 달력 날짜 schedule date 캘린더" },
  { key: "Sparkles", name: "sparkles 반짝 sparkles 신규 새 new 스파클" },
  { key: "Settings", name: "settings 설정 톱니바퀴 config control 옵션" },
  { key: "HelpCircle", name: "helpcircle 도움말 질문가이드 faq info 물음표" },
  { key: "Info", name: "info 정보 도움말 안내 인포메이션" },
  { key: "Lock", name: "lock 보안 잠금 비밀번호 security 자물쇠" },
  { key: "User", name: "user 사용자 프로필 개인 profile 마이페이지" },
  { key: "Search", name: "search 검색 돋보기 찾기 find 돋보기" },
  { key: "MessageSquare", name: "messagesquare 대화 챗 대화방 chat talk 메시지" },
  { key: "Folder", name: "folder 폴더 보관 보관함 file 서류" },
  { key: "Briefcase", name: "briefcase 가방 서류가방 포트폴리오 work job 업무" },
  { key: "FileText", name: "filetext 문서 텍스트 레포트 paper report 보고서" },
  { key: "LayoutDashboard", name: "layoutdashboard 대시보드 메인 레이아웃 board 대시" },
  { key: "Lightbulb", name: "lightbulb 전구 아이디어 팁 tip 전등" },
  { key: "Bell", name: "bell 알림 종 공지 alert notice 알람" },
  { key: "BookOpen", name: "bookopen 책 가이드 교육 도서 study read 매뉴얼" },
  { key: "Heart", name: "heart 하트 좋아요 관심 즐겨찾기 love 애정" },
  { key: "Star", name: "star 별 즐겨찾기 메인 favorite 인기 북마크" },
  { key: "Cloud", name: "cloud 클라우드 구름 서버 날씨 날씨구름" },
  { key: "Database", name: "database 데이터베이스 서버 db 저장 디비" },
  { key: "Terminal", name: "terminal 터미널 개발 쉘 shell cmd 명령어" },
  { key: "Code", name: "code 코드 개발 소스 프로그래밍 dev 코딩" },
  { key: "Share2", name: "share 공유하기 보내기 링크 전달" },
  { key: "Sliders", name: "sliders 필터 세부설정 조정 control filter 제어" },
  { key: "Shield", name: "shield 방패 보안 안전 인증 safe guard 보호" },
  { key: "Play", name: "play 재생 실행 시작 start 플레이" },
  { key: "Volume2", name: "volume 소리 음량 볼륨 audio 스피커" },
  { key: "Video", name: "video 비디오 동영상 녹화 camera media 카메라" }
];

const allLucideKeys = Object.keys(icons);

export interface EmojiIconPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function EmojiIconPicker({ value, onChange, className = "" }: EmojiIconPickerProps) {
  const [activeTab, setActiveTab] = useState<"emoji" | "icon">(
    value && value.startsWith("lucide:") ? "icon" : "emoji"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const currentValue = useMemo(() => {
    if (!value) return "";
    if (value.startsWith("emoji:")) return value.replace("emoji:", "");
    if (value.startsWith("lucide:")) return value.replace("lucide:", "");
    if (value.startsWith("Num")) return value.replace("Num", "");
    return value;
  }, [value]);

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return emojiList;
    const query = searchQuery.toLowerCase();
    return emojiList.filter((e) => e.name.includes(query));
  }, [searchQuery]);

  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return recommendedIcons.map((ri) => ri.key);
    }
    const query = searchQuery.toLowerCase();

    const matchedRecommended = recommendedIcons
      .filter((ri) => ri.name.includes(query))
      .map((ri) => ri.key);

    const matchedAllKeys = allLucideKeys.filter(
      (key) => key.toLowerCase().includes(query) && !matchedRecommended.includes(key)
    );

    return [...matchedRecommended, ...matchedAllKeys].slice(0, 80);
  }, [searchQuery]);

  return (
    <div className={`w-full bg-slate-950/70 border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3.5 select-none ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-white/[0.04] self-start shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("emoji")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "emoji"
                ? "bg-indigo-650 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Emoji
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("icon")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "icon"
                ? "bg-indigo-650 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Icon
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Icons.Search size={13} />
          </span>
          <input
            type="text"
            placeholder={activeTab === "emoji" ? "이모지 검색 (예: 로켓, 차트)" : "아이콘 검색 (예: 상승, bell, user)"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/[0.05] focus:border-indigo-500/60 text-[11px] text-white rounded-xl pl-9 pr-3.5 py-1.5 outline-none transition-all placeholder-slate-500 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white cursor-pointer"
            >
              <Icons.X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="h-44 overflow-y-auto custom-scrollbar pr-0.5 border border-white/[0.03] bg-slate-950/40 rounded-xl p-2.5">
        <AnimatePresence mode="wait">
          {activeTab === "emoji" ? (
            <motion.div
              key="emoji-grid"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-7 gap-1.5 justify-items-center"
            >
              {filteredEmojis.length > 0 ? (
                filteredEmojis.map((e) => {
                  const isSelected = currentValue === e.char;
                  return (
                    <button
                      key={e.char}
                      type="button"
                      onClick={() => onChange(`emoji:${e.char}`)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-200 hover:scale-110 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/30 border border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)] text-white scale-105"
                          : "hover:bg-white/[0.04] border border-transparent text-slate-300"
                      }`}
                      title={e.name.split(" ")[0]}
                    >
                      {e.char}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-7 py-10 text-center text-slate-500 text-[10px] font-medium">
                  일치하는 이모지가 없습니다.
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="icon-grid"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-7 gap-1.5 justify-items-center"
            >
              {filteredIcons.length > 0 ? (
                filteredIcons.map((key) => {
                  const isSelected = currentValue === key;
                  const IconComp = (icons as any)[key] || Icons.Sparkles;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange(`lucide:${key}`)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/30 border border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)] text-indigo-300 scale-105"
                          : "hover:bg-white/[0.04] border border-transparent text-slate-500 hover:text-slate-300"
                      }`}
                      title={key}
                    >
                      <IconComp size={15} />
                    </button>
                  );
                })
              ) : (
                <div className="col-span-7 py-10 text-center text-slate-500 text-[10px] font-medium">
                  일치하는 아이콘이 없습니다.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-1.5 py-1 bg-white/[0.02] border border-white/[0.03] rounded-xl text-[10px] text-slate-400 font-bold shrink-0">
        <span>선택된 심볼:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-slate-900 border border-white/[0.08] flex items-center justify-center">
            {value ? (
              value.startsWith("emoji:") ? (
                <span className="text-xs">{value.replace("emoji:", "")}</span>
              ) : value.startsWith("lucide:") ? (
                (() => {
                  const name = value.replace("lucide:", "");
                  const IconComp = (icons as any)[name] || Icons.Sparkles;
                  return <IconComp size={11} className="text-indigo-400" />;
                })()
              ) : (
                (() => {
                  if (value.startsWith("Num")) {
                    const num = value.replace("Num", "");
                    return <span className="text-[9px] font-black text-indigo-400">{num}</span>;
                  }
                  const IconComp = (icons as any)[value] || Icons.Sparkles;
                  return <IconComp size={11} className="text-indigo-400" />;
                })()
              )
            ) : (
              <Icons.Sparkles size={11} className="text-slate-600" />
            )}
          </div>
          <span className="text-[9px] text-indigo-400 font-mono tracking-tight">
            {value || "선택 안 됨"}
          </span>
        </div>
      </div>
    </div>
  );
}
