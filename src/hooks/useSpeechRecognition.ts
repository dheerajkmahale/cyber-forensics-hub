import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "./useLanguage";

export interface UseSpeechRecognitionProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const useSpeechRecognition = ({ onResult, onError }: UseSpeechRecognitionProps) => {
  const { language, config } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(config.unsupportedBrowserMsg);
      return;
    }

    console.log("Language:", language);
    console.log("Initializing SpeechRecognition instance...");
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = config.code;

    rec.onstart = () => {
      console.log("Mic started");
      console.log("Recognition locale:", rec.lang);
      setIsListening(true);
      isStartedRef.current = true;
      setError(null);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current = Array.from(event.results).map((r: any) => r[0].transcript).join("");
      setTranscript(current);

      if (event.results[event.results.length - 1].isFinal) {
        console.log("Speech recognition final result:", current);
        setTranscript("");
        onResult(current);
        setIsListening(false);
        isStartedRef.current = false;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      let errMsg = config.errorMsg;
      if (event.error === "not-allowed") {
        errMsg = config.noMicPermissionMsg;
      }
      setError(errMsg);
      setIsListening(false);
      isStartedRef.current = false;
      if (onError) onError(errMsg);
    };

    rec.onend = () => {
      console.log("Mic stopped");
      setIsListening(false);
      isStartedRef.current = false;
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.onstart = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch (e) {
        // ignore
      }
    };
  }, [language, config.code, onResult, onError]);

  // Update language dynamically on the active instance
  useEffect(() => {
    if (recognitionRef.current) {
      console.log("Recognition locale updated dynamically:", config.code);
      recognitionRef.current.lang = config.code;
    }
  }, [config.code]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isStartedRef.current) {
      console.warn("SpeechRecognition already started");
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.warn("Speech recognition stop error:", e);
    }
    setIsListening(false);
    isStartedRef.current = false;
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isSupported: typeof window !== "undefined" && 
      (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition)
  };
};
