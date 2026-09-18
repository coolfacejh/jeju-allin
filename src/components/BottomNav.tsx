import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import { useI18n } from '../i18n';

const items = [
  { to: '/onboarding', key: 'nav.taste', icon: 'tune' },
  { to: '/home', key: 'nav.curation', icon: 'explore' },
  { to: '/my-trip', key: 'nav.mytrip', icon: 'favorite' },
];

export default function BottomNav({ savedCount = 0 }: { savedCount?: number }) {
  const { t } = useI18n();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/85 backdrop-blur-xl border-t border-line shadow-[0_-4px_20px_rgba(30,41,59,0.05)]">
      <div className="app-shell mx-auto h-[4.25rem] px-4 grid grid-cols-3 items-center">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `group flex flex-col items-center justify-center gap-1 h-12 rounded-full transition-all active:scale-95 ${
                isActive ? 'text-primary font-bold' : 'text-muted hover:text-sub'
              }`
            }
          >
            <div className="relative">
              <Icon name={it.icon} className="text-[24px]" />
              {it.to === '/my-trip' && savedCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] leading-4 flex items-center justify-center font-bold">
                  {savedCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-wide">{t(it.key)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
