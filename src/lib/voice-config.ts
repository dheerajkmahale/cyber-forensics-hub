export interface LanguageConfig {
  code: string;
  label: string;
  voice: string;
}

export const LANGUAGES: LanguageConfig[] = [
  { code: "en", label: "English", voice: "en-IN" },
  { code: "hi", label: "Hindi",   voice: "hi-IN" },
];

export const VOICE_UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Status
    ready: "Ready",
    listening: "Listening...",
    processing: "Processing...",
    speaking: "Speaking...",
    pressMic: "Press the mic or click a suggestion:",
    stop: "STOP",
    speak: "SPEAK",
    demo: "DEMO WALKTHROUGH",
    demoRunning: "DEMO RUNNING...",
    error: "Sorry, I encountered an error. Please try again.",
    noProcess: "I couldn't process that. Please try again.",
    analysisComplete: "Analysis complete. Found {suspicious} suspicious accounts and {rings} fraud rings across {total} total accounts.",
    // Upload screen quick commands
    quickCsvFormat: "CSV format?",
    quickHowToUpload: "How to upload?",
    quickColumns: "Required columns?",
    quickMaxRows: "Max file size?",
    quickSampleData: "Show sample CSV row",
    // Graph screen quick commands
    quickExplainNodes: "Explain suspicious nodes",
    quickWhatAreRings: "What are fraud rings?",
    quickShowSmurfing: "Explain smurfing patterns",
    quickHowToFilter: "How to filter the graph?",
    quickWhatRedMeans: "What does red mean?",
    // Summary screen quick commands
    quickSummarize: "Summarize findings",
    quickFanIn: "What is fan-in smurfing?",
    quickHowManyRings: "How many fraud rings?",
    quickTopSuspect: "Who is most suspicious?",
    quickShellChains: "What are shell chains?",
    // Demo steps
    demoStep1: "Introduce this Money Muling Detection Engine app.",
    demoStep2: "Explain how fraud detection algorithms work here.",
    demoStep3_result: "Highlight the top suspicious accounts found.",
    demoStep3_noResult: "How do I upload a CSV file for analysis?",
    demoStep4: "Demonstrate your multilingual support by saying hello in {lang}.",
    // Suggested phrases label
    suggestions: "Suggestions",
  },
  hi: {
    // Status
    ready: "तैयार",
    listening: "सुन रहा हूँ...",
    processing: "प्रसंस्करण हो रहा है...",
    speaking: "बोल रहा हूँ...",
    pressMic: "माइक दबाएं या सुझाव चुनें:",
    stop: "रुकें",
    speak: "बोलें",
    demo: "डेमो वॉकथ्रू",
    demoRunning: "डेमो चल रहा है...",
    error: "क्षमा करें, एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
    noProcess: "मैं उसे समझ नहीं सका। कृपया पुनः प्रयास करें।",
    analysisComplete: "विश्लेषण पूरा हुआ। {total} खातों में से {suspicious} संदिग्ध खाते और {rings} धोखाधड़ी रिंग मिले।",
    // Upload screen quick commands
    quickCsvFormat: "CSV प्रारूप?",
    quickHowToUpload: "कैसे अपलोड करें?",
    quickColumns: "कौन से कॉलम चाहिए?",
    quickMaxRows: "अधिकतम फ़ाइल आकार?",
    quickSampleData: "नमूना CSV पंक्ति दिखाएं",
    // Graph screen quick commands
    quickExplainNodes: "संदिग्ध नोड्स समझाएं",
    quickWhatAreRings: "धोखाधड़ी रिंग क्या हैं?",
    quickShowSmurfing: "स्मर्फिंग पैटर्न समझाएं",
    quickHowToFilter: "ग्राफ को फ़िल्टर कैसे करें?",
    quickWhatRedMeans: "लाल रंग का क्या मतलब है?",
    // Summary screen quick commands
    quickSummarize: "निष्कर्षों का सारांश दें",
    quickFanIn: "फैन-इन स्मर्फिंग क्या है?",
    quickHowManyRings: "कितने धोखाधड़ी रिंग हैं?",
    quickTopSuspect: "सबसे संदिग्ध खाता कौन सा है?",
    quickShellChains: "शेल चेन क्या होते हैं?",
    // Demo steps
    demoStep1: "इस मनी म्यूलिंग डिटेक्शन इंजन ऐप का परिचय दें।",
    demoStep2: "समझाएं कि यहां धोखाधड़ी का पता लगाने वाले एल्गोरिदम कैसे काम करते हैं।",
    demoStep3_result: "शीर्ष संदिग्ध खातों को हाइलाइट करें।",
    demoStep3_noResult: "मैं विश्लेषण के लिए CSV फ़ाइल कैसे अपलोड करूँ?",
    demoStep4: "{lang} में नमस्ते कहकर अपने बहुभाषी समर्थन का प्रदर्शन करें।",
    // Suggested phrases label
    suggestions: "सुझाव",
  },
};

export const getTranslation = (lang: string, key: string, params?: Record<string, string | number>) => {
  const dict = VOICE_UI_TRANSLATIONS[lang] || VOICE_UI_TRANSLATIONS.en;
  let text = dict[key] || VOICE_UI_TRANSLATIONS.en[key] || key;
  
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  
  return text;
};

export const findBestVoice = (langCode: string): SpeechSynthesisVoice | null => {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  if (langCode === "en") {
    // Prefer Indian English, then US, then GB, then any English
    return (
      voices.find(v => v.lang === "en-IN") ||
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang === "en-GB") ||
      voices.find(v => v.lang.startsWith("en")) ||
      null
    );
  }

  if (langCode === "hi") {
    // Prefer hi-IN, then any Hindi voice
    return (
      voices.find(v => v.lang === "hi-IN" || v.lang.replace("_", "-") === "hi-IN") ||
      voices.find(v => v.lang.startsWith("hi")) ||
      // Last resort: any Indian-English voice for Hindi text (TTS will still read Devanagari on some systems)
      voices.find(v => v.lang === "en-IN") ||
      null
    );
  }

  // Generic fallback (should not be reached with only en/hi, but kept for safety)
  const lang = LANGUAGES.find(l => l.code === langCode);
  const targetLocale = lang?.voice || "en-IN";
  return (
    voices.find(v => v.lang === targetLocale || v.lang.replace("_", "-") === targetLocale) ||
    voices.find(v => v.lang.startsWith(langCode)) ||
    null
  );
};
