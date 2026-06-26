/**
 * 사용자 입력의 안전성을 백그라운드 서비스 워커에 위임하여 판별합니다.
 * @returns true = 안전(safe), false = 위험(unsafe)
 */
export async function checkSafety(userInput: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        { action: "evaluate_safety", userInput },
        (res) => {
          // res가 성공이고 safe가 명시적으로 false인 경우에만 unsafe(false) 리턴
          if (res && res.success) {
            resolve(res.safe !== false);
          } else {
            resolve(true); // 판별 실패 시 기본 안전 통과
          }
        }
      );
    } catch (e) {
      console.warn("Safety check failed to send message, bypassing:", e);
      resolve(true); // 통신 실패 시 안전 통과
    }
  });
}
