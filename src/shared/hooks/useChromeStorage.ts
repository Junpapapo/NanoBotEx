import { useState, useEffect, useRef } from "react";

export function useChromeStorage<T>(
  key: string,
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const isLoadedRef = useRef<boolean>(false);

  // 최초 1회 저장된 데이터 로드
  useEffect(() => {
    chrome.storage.local.get([key], (result) => {
      if (result[key] !== undefined) {
        setStoredValue(result[key]);
      }
      isLoadedRef.current = true;
      setIsLoaded(true);
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
    // 최초 비동기 로딩이 완료되기 전에는 스토리지 덮어쓰기(Overwrite) 방지
    if (!isLoadedRef.current) {
      console.warn(`[useChromeStorage] Write operation ignored during initial load for key: ${key}`);
      return;
    }
    const nextValue = typeof value === "function"
      ? (value as (prev: T) => T)(storedValue)
      : value;
    chrome.storage.local.set({ [key]: nextValue });
    setStoredValue(nextValue);
  };

  return [storedValue, setValue, isLoaded];
}
