import React from "react";
import { useLanguage } from "../hooks/useLanguage";
import { SupportedLanguage } from "../config/languageConfig";

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const options: { value: SupportedLanguage; label: string }[] = [
    { value: "en", label: "English" },
    { value: "hi", label: "हिन्दी" },
    { value: "kn", label: "ಕನ್ನಡ" },
    { value: "te", label: "తెలుగు" },
    { value: "ta", label: "தமிழ்" },
  ];

  return (
    <div className="grid grid-cols-5 gap-1 bg-card/40 p-1 rounded border border-border/20 backdrop-blur-md">
      {options.map((opt) => {
        const active = language === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setLanguage(opt.value)}
            className="py-1 text-[9px] font-mono font-bold rounded transition-all duration-200 hover:scale-[1.05]"
            style={{
              background: active
                ? "linear-gradient(135deg, hsl(155 100% 40% / 0.2), hsl(185 100% 45% / 0.2))"
                : "transparent",
              border: active ? "1px solid hsl(155 100% 40%)" : "1px solid transparent",
              color: active ? "hsl(155 100% 40%)" : "hsl(150 15% 55%)",
              boxShadow: active ? "0 0 10px hsl(155 100% 50% / 0.15)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
export default LanguageSwitcher;
