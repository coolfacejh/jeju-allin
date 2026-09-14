// 브라우저 음성합성(Web Speech API) 기반 음성 안내 — 외부 API 불필요
export function speak(text: string, lang: string, onEnd?: () => void): boolean {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return false;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 1;
    u.pitch = 1;
    if (onEnd) {
      u.onend = onEnd;
      u.onerror = onEnd;
    }
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeak(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
