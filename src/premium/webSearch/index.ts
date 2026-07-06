import { SearchResult } from "../../shared/chatbot-types";

export const performWebSearch = async (keyword: string): Promise<{ results: SearchResult[]; tabId: number }> => {
  let tempTabId = 0;
  let originalTabId = 0;
  const results: SearchResult[] = [];
  console.log("[NanoBot] performWebSearch start. Keyword:", keyword);
  
  try {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.scripting) {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentTab && currentTab.id) {
        originalTabId = currentTab.id;
      }

      const trimmedKeyword = keyword.trim();
      const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i.test(trimmedKeyword);

      if (isUrl) {
        // ──────────────────────────────────────────────
        // 1. 직접 URL 입력 시: 해당 사이트로 백그라운드 직접 탭 생성하여 스크래핑
        // ──────────────────────────────────────────────
        const url = trimmedKeyword.startsWith("http") ? trimmedKeyword : `https://${trimmedKeyword}`;
        console.log("[NanoBot] Directly scraping URL:", url);
        const tempTab = await chrome.tabs.create({ url, active: false });
        tempTabId = tempTab.id || 0;
      } else {
        // ──────────────────────────────────────────────
        // 2. 검색어인 경우: 브라우저 기본 검색엔진 활용 (chrome.search.query)
        // ──────────────────────────────────────────────
        console.log("[NanoBot] Querying browser default search engine for keyword:", trimmedKeyword);

        if (chrome.search && chrome.search.query) {
          // 새 탭이 열릴 때 ID 가로채기를 위한 리스너 등록
          const tabCreatedPromise = new Promise<number>((resolve) => {
            const listener = (tab: chrome.tabs.Tab) => {
              chrome.tabs.onCreated.removeListener(listener);
              resolve(tab.id || 0);
            };
            chrome.tabs.onCreated.addListener(listener);
            
            // 3초 타임아웃
            setTimeout(() => {
              chrome.tabs.onCreated.removeListener(listener);
              resolve(0);
            }, 3000);
          });

          // 기본 검색엔진 쿼리 실행 (브라우저 설정 연동)
          await chrome.search.query({ text: trimmedKeyword, disposition: "NEW_TAB" });
          tempTabId = await tabCreatedPromise;

          // 사용자가 기존에 보던 원본 탭으로 포커스를 신속하게 복원하여 화면 튐 차단
          if (tempTabId && originalTabId) {
            await chrome.tabs.update(originalTabId, { active: true });
            console.log("[NanoBot] Successfully restored focus to original tab:", originalTabId);
          }
        } else {
          // chrome.search API 미지원 시 구글 검색을 백그라운드로 대체 실행 (폴백)
          const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmedKeyword)}`;
          console.log("[NanoBot] chrome.search API not available. Falling back to Google in background:", fallbackUrl);
          const tempTab = await chrome.tabs.create({ url: fallbackUrl, active: false });
          tempTabId = tempTab.id || 0;
        }
      }

      if (tempTabId) {
        // 3. 탭 로딩 상태 대기 (최대 7초)
        const tabInfo = await chrome.tabs.get(tempTabId);
        if (tabInfo.status !== "complete") {
          await new Promise<void>((resolve) => {
            const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
              if (updatedTabId === tempTabId && changeInfo.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
            
            setTimeout(() => {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }, 7000);
          });
        }

        // 4. 범용 DOM 파서를 통한 핵심 텍스트 스크래핑 (광고/메뉴 등 제외)
        const finalTabInfo = await chrome.tabs.get(tempTabId);
        const actualSearchUrl = finalTabInfo.url || (isUrl ? (trimmedKeyword.startsWith("http") ? trimmedKeyword : `https://${trimmedKeyword}`) : `https://www.google.com/search?q=${encodeURIComponent(trimmedKeyword)}`);

        const execResults = await chrome.scripting.executeScript({
          target: { tabId: tempTabId },
          func: () => {
            // 광고, 헤더, 푸터, 네비게이션 요소 일체 삭제하여 스크래핑 효율화
            const excludeSelectors = [
              "nav", "footer", "header", "aside", ".ads", "#ads", 
              ".ad-unit", "#header", "#footer", ".navigation", ".menu", ".sidebar"
            ];
            excludeSelectors.forEach(sel => {
              try {
                document.querySelectorAll(sel).forEach(el => el.remove());
              } catch (e) {}
            });

            // 일반 페이지의 article이나 main 콘텐츠가 있다면 우선 타겟팅
            const articleEl = document.querySelector("article") || document.querySelector("main") || document.querySelector("#content");
            if (articleEl && articleEl.innerText.trim().length > 200) {
              return articleEl.innerText;
            }

            return document.body.innerText;
          }
        });

        if (execResults && execResults[0] && typeof execResults[0].result === "string") {
          const rawText = execResults[0].result;
          const cleanedText = rawText
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 3500); // 3,500자 컨텍스트 한도 준수
          
          if (cleanedText) {
            results.push({
              title: isUrl ? `웹 사이트 직접 수집: "${trimmedKeyword}"` : `실시간 기본 검색 결과: "${trimmedKeyword}"`,
              url: isUrl ? (trimmedKeyword.startsWith("http") ? trimmedKeyword : `https://${trimmedKeyword}`) : actualSearchUrl,
              snippet: cleanedText
            });
          }
        }
      }
    }
  } catch (tabErr: any) {
    console.warn("[NanoBot] performWebSearch error:", tabErr);
    results.push({
      title: "⚠️ 스크래핑 에러 디버그 정보",
      url: "chrome://error-details",
      snippet: `에러 내용: ${tabErr?.message || tabErr}`
    });
  } finally {
    // 5. 사용이 완료된 임시 검색 탭은 반드시 강제 닫기 수행 (메모리 누수 차단)
    if (tempTabId) {
      try {
        await chrome.tabs.remove(tempTabId);
        console.log("[NanoBot] Safely removed temporary tab:", tempTabId);
      } catch (removeErr) {
        console.warn("[NanoBot] Failed to remove temporary tab:", removeErr);
      }
    }
  }

  console.log("[NanoBot] performWebSearch end. Found:", results.length, "results:", results);
  return { results, tabId: originalTabId };
};
