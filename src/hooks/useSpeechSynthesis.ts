import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "./useLanguage";
import { getPhoneticText } from "../config/responseConfig";

export const useSpeechSynthesis = () => {
  const { language, config } = useLanguage();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      if (synthRef.current) {
        setVoices(synthRef.current.getVoices());
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const findVoice = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    let activeVoices = voices;
    if (activeVoices.length === 0 && typeof window !== "undefined" && window.speechSynthesis) {
      activeVoices = window.speechSynthesis.getVoices();
    }

    if (activeVoices.length === 0) return null;

    // Direct match for exact locale (e.g., hi-IN, kn-IN, te-IN, ta-IN)
    const exactMatch = activeVoices.find(
      v => v.lang === langCode || v.lang.replace("_", "-") === langCode
    );
    if (exactMatch) return exactMatch;

    // Start-prefix match (e.g., starts with 'hi', 'kn', etc.)
    const prefix = langCode.split("-")[0];
    const prefixMatch = activeVoices.find(v => v.lang.startsWith(prefix));
    if (prefixMatch) return prefixMatch;

    // Fallbacks
    if (prefix !== "en") {
      const enInMatch = activeVoices.find(v => v.lang === "en-IN" || v.lang.replace("_", "-") === "en-IN");
      if (enInMatch) return enInMatch;
    }

    const enUsMatch = activeVoices.find(v => v.lang.startsWith("en"));
    return enUsMatch || activeVoices[0] || null;
  }, [voices]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    
    try {
      synthRef.current.cancel();
    } catch (e) {
      console.warn("Speech synthesis cancel failed:", e);
    }

    const targetVoice = findVoice(config.code);
    console.log("Voice selected:", targetVoice);

    let speakText = text;
    const isEnVoice = targetVoice ? targetVoice.lang.startsWith("en") : true;
    const isEnConfig = language === "en";

    if (isEnVoice && !isEnConfig) {
      // If we fall back to an English voice engine for an Indian script query,
      // dynamically transliterate the output text to Romanized phonetics so the English voice speaks fluent Indian syllables!
      speakText = getPhoneticText(language, text);
      console.log("SpeechSynthesis: Transliterating to Romanized phonetic text:", speakText);
    }

    const utterance = new SpeechSynthesisUtterance(speakText);
    utteranceRef.current = utterance; // Prevent garbage collection
    
    if (targetVoice) {
      utterance.voice = targetVoice;
      utterance.lang = targetVoice.lang;
    } else {
      utterance.lang = config.code;
    }

    // Slow down Indian language/accented articulation rate (default = 1.0) so regional scripts sound articulate and clear.
    const isIndianLang = !language.startsWith("en") || (targetVoice && targetVoice.lang === "en-IN");
    utterance.rate = isIndianLang ? 0.76 : 0.94;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    synthRef.current.speak(utterance);
  }, [language, config.code, findVoice]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch (e) {
        // ignore
      }
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, []);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    voices
  };
};
