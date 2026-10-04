import { useI18n } from '../i18n';
export default function SourceLanguageNote() {
  const { lang } = useI18n();
  return lang === 'en' ? <p className="text-xs text-sub px-2" role="note">Menus and guidance are in English. Place names, addresses and tourism-provider descriptions may remain in their original Korean.</p> : null;
}
