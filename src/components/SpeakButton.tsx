import { useEffect, useState } from 'react';
import Icon from './Icon';
import { speak, stopSpeak, speechSupported } from '../lib/speech';
import { useI18n } from '../i18n';

// 음성 안내 토글 버튼 (접근성)
export default function SpeakButton({
  getText,
  className = '',
  compact = false,
}: {
  getText: () => string;
  className?: string;
  compact?: boolean;
}) {
  const { lang, t } = useI18n();
  const [on, setOn] = useState(false);

  useEffect(() => () => stopSpeak(), []);

  if (!speechSupported()) return null;

  function toggle() {
    if (on) {
      stopSpeak();
      setOn(false);
      return;
    }
    const text = getText();
    // 한글이 포함되면 한국어 음성으로 읽음(콘텐츠가 한국어인 경우 대응)
    const speakLang = /[가-힣]/.test(text) ? 'ko-KR' : lang === 'en' ? 'en-US' : 'ko-KR';
    const ok = speak(text, speakLang, () => setOn(false));
    if (ok) setOn(true);
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      aria-label={on ? t('speak.stop') : t('speak.play')}
      className={
        className ||
        `flex items-center gap-1 rounded-full font-bold active:scale-95 ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        } ${on ? 'bg-accent text-white' : 'bg-white shadow-card text-primary'}`
      }
    >
      <Icon name={on ? 'stop_circle' : 'volume_up'} className={compact ? 'text-[15px]' : 'text-[16px]'} fill={on} />
      {on ? t('speak.stop') : t('speak.play')}
    </button>
  );
}
