import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
import { useI18n } from '../i18n';
import { translateUiText } from '../lib/uiTranslations';

// Translate only rendered UI text, never stored data, URLs, values or event handlers.
// React owns the translated tree: no DOM mutation and no remount on language changes.
export default function Localize({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  function visit(node: ReactNode): ReactNode {
    if (typeof node === 'string') return translateUiText(node, lang);
    if (Array.isArray(node)) return Children.map(node, visit);
    if (!isValidElement(node)) return node;
    const element = node as ReactElement<Record<string, unknown>>;
    if (element.props.translate === 'no' || ['script', 'style', 'textarea'].includes(String(element.type))) return node;
    const props: Record<string, unknown> = {};
    for (const attr of ['title', 'aria-label', 'alt', 'placeholder']) {
      if (typeof element.props[attr] === 'string') props[attr] = translateUiText(element.props[attr] as string, lang);
    }
    if (element.props.children !== undefined) props.children = visit(element.props.children as ReactNode);
    return cloneElement(element, props);
  }
  return <>{visit(children)}</>;
}
