import { useState, useCallback } from 'react';

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2200);
  }, []);
  const node = msg ? (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-full bg-ink text-white text-sm shadow-xl flex items-center gap-2">
      <span>{msg}</span>
    </div>
  ) : null;
  return { show, node };
}
