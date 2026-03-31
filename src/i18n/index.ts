import en from "./en-US.json";
import pt from "./pt-BR.json";

export type AppLanguage = "pt-BR" | "en-US";

type TranslationTree = Record<string, string | TranslationTree>;

const translations: Record<AppLanguage, TranslationTree> = {
  "pt-BR": pt as TranslationTree,
  "en-US": en as TranslationTree,
};

let currentLang: AppLanguage = "pt-BR";

function resolvePath(source: TranslationTree, path: string): string | undefined {
  const keys = path.split(".");
  let value: string | TranslationTree | undefined = source;

  for (const key of keys) {
    if (!value || typeof value === "string") {
      return undefined;
    }

    value = value[key];
  }

  return typeof value === "string" ? value : undefined;
}

export function setLanguage(lang: AppLanguage) {
  currentLang = lang;
}

export function getLanguage() {
  return currentLang;
}

export function t(path: string, params?: Record<string, string | number>): string {
  const template = resolvePath(translations[currentLang], path) ?? resolvePath(translations["pt-BR"], path) ?? path;

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), template);
}
