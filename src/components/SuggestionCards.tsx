import React from "react";
import { useLanguage } from "../hooks/useLanguage";

export interface SuggestionCardsProps {
  onSelect: (phrase: string) => void;
  disabled?: boolean;
}

export const SuggestionCards: React.FC<SuggestionCardsProps> = ({ onSelect, disabled }) => {
  const { config } = useLanguage();

  return (
    <div className="flex flex-col gap-2 mt-1">
      <div className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground text-center">
        {config.suggestionsHeader}
      </div>
      <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1 select-none">
        {config.suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => onSelect(sug)}
            disabled={disabled}
            className="w-full text-left px-3 py-2 rounded text-[11px] font-mono transition-all duration-200 hover:pl-4 bg-muted/20 border border-border/10 text-foreground hover:bg-primary/5 hover:border-primary/30 disabled:opacity-40 disabled:hover:pl-3"
          >
            <span className="text-primary font-bold mr-1.5">&gt;</span>
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
};
export default SuggestionCards;
