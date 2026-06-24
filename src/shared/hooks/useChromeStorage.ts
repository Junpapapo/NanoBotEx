import { useState, useEffect } from "react";

export function useChromeStorage<T>(
  key: string,
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 최초 1회 저장된 데이터 로드
  useEffect(() => {
    chrome.storage.local.get([key], (result) => {
      if (result[key] !== undefined) {
        setStoredValue(result[key]);
      }
    });
  }, [key]);

  // 다른 창(사이드패널 <-> 위젯 <-> 팝업)에서 데이터 수정 시 실시간 상태 동기화 리스너
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === "local" && changes[key]) {
        setStoredValue(changes[key].newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [key]);

  // 데이터 업데이트 함수 (함수형 업데이트 대응 및 로컬 스토리지 보관)
  const setValue = (value: T | ((prev: T) => T)) => {
    setStoredValue((prevVal) => {
      const valueToStore = value instanceof Function ? value(prevVal) : value;
      chrome.storage.local.set({ [key]: valueToStore });
      return valueToStore;
    });
  };

  return [storedValue, setValue];
}
