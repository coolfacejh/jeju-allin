import { useI18n } from '../i18n';
export default function SourceLanguageNote() {
  const { lang } = useI18n();
  return lang === 'en' ? <p className="text-xs text-sub px-2" role="note">Official English names and descriptions load for visible places when available. Korean names and addresses remain alongside English for navigation. Fields without an English source keep their Korean original.</p> : null;
}
