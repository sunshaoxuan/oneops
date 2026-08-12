import type { LocaleKey } from "./i18n";
import type { NavigationKey } from "./portal-navigation";

const helpDocumentPaths: Partial<Record<NavigationKey, string>> = {
  consulting: "/help/inquiry-support.html",
  aiAssistant: "/help/ai-assistant.html",
  builder: "/help/product-builder.html",
  masterData: "/help/basic-master.html",
};

const helpLabels: Record<LocaleKey, string> = {
  "ja-JP": "この画面のヘルプを開く",
  "zh-CN": "打开当前画面的帮助",
  "en-US": "Open help for this page",
};

export function contextualHelpPath(
  navigation: NavigationKey,
): string | undefined {
  return helpDocumentPaths[navigation];
}

export function contextualHelpLabel(locale: LocaleKey): string {
  return helpLabels[locale];
}
