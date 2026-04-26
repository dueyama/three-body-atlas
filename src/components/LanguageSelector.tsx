"use client";

import { Languages } from "lucide-react";
import { useUiText, type LocalePreference } from "@/lib/i18n";

const languageOptions: LocalePreference[] = ["auto", "ja", "en", "zh"];

export function LanguageSelector() {
  const { preference, setPreference, t } = useUiText();
  const labels: Record<LocalePreference, string> = {
    auto: t.languageAuto,
    ja: t.languageJapanese,
    en: t.languageEnglish,
    zh: t.languageChinese,
  };

  return (
    <div className="languageSelector" aria-label={t.languageLabel}>
      <div className="languageSelectorLabel">
        <Languages size={16} />
        <span>{t.languageLabel}</span>
      </div>
      <div className="languageSelectorOptions" role="group">
        {languageOptions.map((option) => (
          <button
            aria-pressed={preference === option}
            className={preference === option ? "active" : ""}
            key={option}
            type="button"
            onClick={() => setPreference(option)}
          >
            {labels[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
