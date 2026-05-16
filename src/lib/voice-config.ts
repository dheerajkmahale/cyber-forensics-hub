export interface LanguageConfig {
  code: string;
  label: string;
  voice: string;
}

export const LANGUAGES: LanguageConfig[] = [
  { code: "en", label: "English", voice: "en-IN" },
  { code: "hi", label: "Hindi", voice: "hi-IN" },
  { code: "te", label: "Telugu", voice: "te-IN" },
  { code: "ta", label: "Tamil", voice: "ta-IN" },
  { code: "kn", label: "Kannada", voice: "kn-IN" }
];

export const VOICE_UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    ready: "Ready",
    listening: "Listening...",
    processing: "Processing...",
    speaking: "Speaking...",
    pressMic: "Press the mic and ask:",
    stop: "STOP",
    speak: "SPEAK",
    demo: "DEMO WALKTHROUGH",
    demoRunning: "DEMO RUNNING...",
    error: "Sorry, I encountered an error. Please try again.",
    noProcess: "I couldn't process that. Please try again.",
    analysisComplete: "Analysis complete. Found {suspicious} suspicious accounts and {rings} fraud rings across {total} total accounts.",
    quickCsvFormat: "CSV format?",
    quickHowToUpload: "How to upload?",
    quickColumns: "What columns are needed?",
    quickExplainNodes: "Explain suspicious nodes",
    quickSummarize: "Summarize findings",
    quickFanIn: "What is fan-in pattern?",
    quickHowManyRings: "How many fraud rings?",
    demoStep1: "Introduce this Money Muling Detection Engine app.",
    demoStep2: "Explain how fraud detection algorithms work here.",
    demoStep3_result: "Highlight the top suspicious accounts found.",
    demoStep3_noResult: "How do I upload a CSV file for analysis?",
    demoStep4: "Demonstrate your multilingual support by saying hello in {lang}.",
  },
  hi: {
    ready: "तैयार",
    listening: "सुन रहा हूँ...",
    processing: "प्रसंस्करण हो रहा है...",
    speaking: "बोल रहा हूँ...",
    pressMic: "माइक दबाएं और पूछें:",
    stop: "रुकें",
    speak: "बोलें",
    demo: "डेमो वॉकथ्रू",
    demoRunning: "डेमो चल रहा है...",
    error: "क्षमा करें, एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
    noProcess: "मैं उसे समझ नहीं सका। कृपया पुनः प्रयास करें।",
    analysisComplete: "विश्लेषण पूरा हुआ। {total} खातों में से {suspicious} संदिग्ध खाते और {rings} धोखाधड़ी रिंग मिले।",
    quickCsvFormat: "CSV प्रारूप?",
    quickHowToUpload: "कैसे अपलोड करें?",
    quickColumns: "कौन से कॉलम चाहिए?",
    quickExplainNodes: "संदिग्ध नोड्स समझाएं",
    quickSummarize: "निष्कर्षों का सारांश दें",
    quickFanIn: "फैन-इन पैटर्न क्या है?",
    quickHowManyRings: "कितने धोखाधड़ी रिंग हैं?",
    demoStep1: "इस मनी म्यूलिंग डिटेक्शन इंजन ऐप का परिचय दें।",
    demoStep2: "समझाएं कि यहां धोखाधड़ी का पता लगाने वाले एल्गोरिदम कैसे काम करते हैं।",
    demoStep3_result: "शीर्ष संदिग्ध खातों को हाइलाइट करें।",
    demoStep3_noResult: "मैं विश्लेषण के लिए CSV फ़ाइल कैसे अपलोड करूँ?",
    demoStep4: "{lang} में नमस्ते कहकर अपने बहुभाषी समर्थन का प्रदर्शन करें।",
  },
  te: {
    ready: "సిద్ధం",
    listening: "వింటున్నాను...",
    processing: "ప్రాసెస్ చేయబడుతోంది...",
    speaking: "మాట్లాడుతున్నాను...",
    pressMic: "మైక్ నొక్కి అడగండి:",
    stop: "ఆపు",
    speak: "మాట్లాడు",
    demo: "డెమో వాక్‌త్రూ",
    demoRunning: "డెమో రన్ అవుతోంది...",
    error: "క్షమించండి, ఒక లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
    noProcess: "నేను దానిని ప్రాసెస్ చేయలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.",
    analysisComplete: "విశ్లేషణ పూర్తయింది. {total} ఖాతాలలో {suspicious} అనుమానాస్పద ఖాతాలు మరియు {rings} మోసపూరిత రింగ్‌లు కనుగొనబడ్డాయి.",
    quickCsvFormat: "CSV ఫార్మాట్?",
    quickHowToUpload: "ఎలా అప్‌లోడ్ చేయాలి?",
    quickColumns: "ఏ నిలువు వరుసలు అవసరం?",
    quickExplainNodes: "అనుమానాస్పద నోడ్‌లను వివరించండి",
    quickSummarize: "కనుగొన్న విషయాలను సంగ్రహించండి",
    quickFanIn: "ఫ్యాన్-ఇన్ ప్యాటర్న్ అంటే ఏమిటి?",
    quickHowManyRings: "ఎన్ని ఫ్రాడ్ రింగ్‌లు ఉన్నాయి?",
    demoStep1: "ఈ మనీ మ్యూలింగ్ డిటెక్షన్ ఇంజిన్ యాప్‌ని పరిచయం చేయండి.",
    demoStep2: "ఇక్కడ ఫ్రాడ్ డిటెక్షన్ అల్గారిథమ్‌లు ఎలా పనిచేస్తాయో వివరించండి.",
    demoStep3_result: "కనుగొనబడిన అగ్ర అనుమానాస్పద ఖాతాలను హైలైట్ చేయండి.",
    demoStep3_noResult: "విశ్లేషణ కోసం నేను CSV ఫైల్‌ను ఎలా అప్‌లోడ్ చేయాలి?",
    demoStep4: "{lang}లో హలో చెప్పడం ద్వారా మీ బహుభాషా మద్దతును ప్రదర్శించండి.",
  },
  ta: {
    ready: "தயார்",
    listening: "கேட்கிறது...",
    processing: "செயலாக்கப்படுகிறது...",
    speaking: "பேசுகிறது...",
    pressMic: "மைக்கை அழுத்தி கேட்கவும்:",
    stop: "நிறுத்து",
    speak: "பேசு",
    demo: "டெமோ ஒத்திகை",
    demoRunning: "டெமோ இயங்குகிறது...",
    error: "மன்னிக்கவும், ஒரு பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
    noProcess: "எங்களால் அதைச் செயல்படுத்த முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    analysisComplete: "பகுப்பாய்வு முடிந்தது. {total} கணக்குகளில் {suspicious} சந்தேகத்திற்குரிய கணக்குகள் மற்றும் {rings} மோசடி வளையங்கள் கண்டறியப்பட்டுள்ளன.",
    quickCsvFormat: "CSV வடிவம்?",
    quickHowToUpload: "எப்படி பதிவேற்றுவது?",
    quickColumns: "என்ன நெடுவரிசைகள் தேவை?",
    quickExplainNodes: "சந்தேகத்திற்குரிய முனைகளை விளக்குக",
    quickSummarize: "கண்டுபிடிப்புகளை சுருக்கமாக கூறுக",
    quickFanIn: "ஃபேன்-இன் பேட்டர்ன் என்றால் என்ன?",
    quickHowManyRings: "எத்தனை மோசடி வளையங்கள் உள்ளன?",
    demoStep1: "இந்த மணி மியூலிங் கண்டறிதல் இயந்திர பயன்பாட்டை அறிமுகப்படுத்தவும்.",
    demoStep2: "மோசடி கண்டறிதல் வழிமுறைகள் இங்கு எவ்வாறு செயல்படுகின்றன என்பதை விளக்குக.",
    demoStep3_result: "கண்டறியப்பட்ட சிறந்த சந்தேகத்திற்குரிய கணக்குகளை முன்னிலைப்படுத்தவும்.",
    demoStep3_noResult: "பகுப்பாய்விற்கு CSV கோப்பை எவ்வாறு பதிவேற்றுவது?",
    demoStep4: "{lang} மொழியில் வணக்கம் கூறி உங்கள் பன்மொழி ஆதரவை வெளிப்படுத்துங்கள்.",
  },
  kn: {
    ready: "ಸಿದ್ಧವಾಗಿದೆ",
    listening: "ಆಲಿಸಲಾಗುತ್ತಿದೆ...",
    processing: "ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...",
    speaking: "ಮಾತನಾಡಲಾಗುತ್ತಿದೆ...",
    pressMic: "ಮೈಕ್ ಒತ್ತಿ ಕೇಳಿ:",
    stop: "ನಿಲ್ಲಿಸಿ",
    speak: "ಮಾತನಾಡಿ",
    demo: "ಡೆಮೊ ವಾಕ್‌ಥ್ರೂ",
    demoRunning: "ಡೆಮೊ ರನ್ ಆಗುತ್ತಿದೆ...",
    error: "ಕ್ಷಮಿಸಿ, ದೋಷ ಉಂಟಾಗಿದೆ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.",
    noProcess: "ನನಗೆ ಅದನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.",
    analysisComplete: "ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. {total} ಖಾತೆಗಳಲ್ಲಿ {suspicious} ಅನುಮಾನಾಸ್ಪದ ಖಾತೆಗಳು ಮತ್ತು {rings} ವಂಚನೆ ರಿಂಗ್‌ಗಳು ಕಂಡುಬಂದಿವೆ.",
    quickCsvFormat: "CSV ಫಾರ್ಮ್ಯಾಟ್?",
    quickHowToUpload: "ಹೇಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡುವುದು?",
    quickColumns: "ಯಾವ ಕಾಲಮ್‌ಗಳು ಬೇಕು?",
    quickExplainNodes: "ಅನುಮಾನಾಸ್ಪದ ನೋಡ್‌ಗಳನ್ನು ವಿವರಿಸಿ",
    quickSummarize: "ಶೋಧನೆಗಳನ್ನು ಸಾರಾಂಶಗೊಳಿಸಿ",
    quickFanIn: "ಫ್ಯಾನ್-ಇನ್ ಪ್ಯಾಟರ್ನ್ ಎಂದರೇನು?",
    quickHowManyRings: "ಎಷ್ಟು ವಂಚನೆ ರಿಂಗ್‌ಗಳಿವೆ?",
    demoStep1: "ಈ ಮನಿ ಮ್ಯೂಲಿಂಗ್ ಡಿಟೆಕ್ಷನ್ ಎಂಜಿನ್ ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ಪರಿಚಯಿಸಿ.",
    demoStep2: "ವಂಚನೆ ಪತ್ತೆ ಅಲ್ಗಾರಿದಮ್‌ಗಳು ಇಲ್ಲಿ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ ಎಂಬುದನ್ನು ವಿವರಿಸಿ.",
    demoStep3_result: "ಕಂಡುಬಂದ ಪ್ರಮುಖ ಅನುಮಾನಾಸ್ಪದ ಖಾತೆಗಳನ್ನು ಹೈಲೈಟ್ ಮಾಡಿ.",
    demoStep3_noResult: "ವಿಶ್ಲೇಷಣೆಗಾಗಿ ನಾನು CSV ಫೈಲ್ ಅನ್ನು ಹೇಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡುವುದು?",
    demoStep4: "{lang} ನಲ್ಲಿ ಹಲೋ ಹೇಳುವ ಮೂಲಕ ನಿಮ್ಮ ಬಹುಭಾಷಾ ಬೆಂಬಲವನ್ನು ಪ್ರದರ್ಶಿಸಿ.",
  }
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
  const lang = LANGUAGES.find(l => l.code === langCode);
  const targetLocale = lang?.voice || "en-IN";
  
  // 1. Try exact match for locale (e.g., hi-IN)
  let voice = voices.find(v => v.lang === targetLocale || v.lang.replace("_", "-") === targetLocale);
  
  // 2. Try match for language prefix (e.g., hi)
  if (!voice) {
    voice = voices.find(v => v.lang.startsWith(langCode));
  }
  
  // 3. Fallback to any Indian voice if available
  if (!voice && targetLocale.endsWith("-IN")) {
    voice = voices.find(v => v.lang.endsWith("-IN"));
  }
  
  return voice || null;
};
