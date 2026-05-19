export type SupportedLanguage = "en" | "hi" | "kn" | "te" | "ta";

export interface LanguageConfigDetail {
  code: string;
  label: string;
  nativeLabel: string;
  placeholder: string;
  readyLabel: string;
  listeningLabel: string;
  processingLabel: string;
  speakingLabel: string;
  stopLabel: string;
  speakLabel: string;
  demoLabel: string;
  demoRunningLabel: string;
  assistantTitle: string;
  aiThinking: string;
  terminalHeader: string;
  muteLabel: string;
  unmuteLabel: string;
  enableLabel: string;
  disableLabel: string;
  suggestionsHeader: string;
  voiceStandby: string;
  receivingStream: string;
  synthesizingAudio: string;
  analyzingPattern: string;
  suggestions: string[];
  commands: {
    upload: string;
    showAccounts: string;
    explainRing: string;
    generateReport: string;
    freezeAssets: string;
  };
  errorMsg: string;
  unsupportedBrowserMsg: string;
  noMicPermissionMsg: string;
  offlineNotice: string;
}

export const languageConfig: Record<SupportedLanguage, LanguageConfigDetail> = {
  en: {
    code: "en-US",
    label: "English",
    nativeLabel: "English",
    placeholder: "Ask about suspicious transactions...",
    readyLabel: "READY",
    listeningLabel: "LISTENING...",
    processingLabel: "PROCESSING...",
    speakingLabel: "SPEAKING...",
    stopLabel: "STOP",
    speakLabel: "SPEAK",
    demoLabel: "DEMO WALKTHROUGH",
    demoRunningLabel: "DEMO RUNNING...",
    assistantTitle: "CYBERSHIELD ASSISTANT",
    aiThinking: "AI is thinking...",
    terminalHeader: "CYBERSHIELD DIALOG LOG",
    muteLabel: "Mute",
    unmuteLabel: "Unmute",
    enableLabel: "Enable",
    disableLabel: "Disable",
    suggestionsHeader: "— Suggestions / सुझाव —",
    voiceStandby: "Voice Engine Standby",
    receivingStream: "Receiving Stream...",
    synthesizingAudio: "Synthesizing Audio...",
    analyzingPattern: "Analyzing Pattern...",
    suggestions: [
      "Upload file",
      "Show suspicious accounts",
      "Explain this fraud ring",
      "Generate case report",
      "Freeze suspicious assets"
    ],
    commands: {
      upload: "upload file",
      showAccounts: "show suspicious accounts",
      explainRing: "explain this fraud ring",
      generateReport: "generate case report",
      freezeAssets: "freeze suspicious assets"
    },
    errorMsg: "Sorry, I encountered an error. Please try again.",
    unsupportedBrowserMsg: "Web Speech API is not supported in this browser. Try Chrome or Edge.",
    noMicPermissionMsg: "Microphone access denied. Please check your browser settings.",
    offlineNotice: "CyberShield offline intelligence system active. "
  },
  hi: {
    code: "hi-IN",
    label: "Hindi",
    nativeLabel: "हिंदी",
    placeholder: "संदिग्ध लेनदेन के बारे में पूछें...",
    readyLabel: "तैयार",
    listeningLabel: "सुन रहा हूँ...",
    processingLabel: "प्रसंस्करण...",
    speakingLabel: "बोल रहा हूँ...",
    stopLabel: "रुकें",
    speakLabel: "बोलें",
    demoLabel: "डेमो वॉकथ्रू",
    demoRunningLabel: "डेमो चल रहा है...",
    assistantTitle: "साइबरशील्ड सहायक",
    aiThinking: "एआई सोच रहा है...",
    terminalHeader: "साइबरशील्ड संवाद लॉग",
    muteLabel: "म्यूट करें",
    unmuteLabel: "अनम्यूट करें",
    enableLabel: "सक्रिय करें",
    disableLabel: "निष्क्रिय करें",
    suggestionsHeader: "— सुझाव —",
    voiceStandby: "आवाज इंजन तैयार है",
    receivingStream: "आवाज प्राप्त हो रही है...",
    synthesizingAudio: "आवाज बनाई जा रही है...",
    analyzingPattern: "पैटर्न का विश्लेषण...",
    suggestions: [
      "फ़ाइल अपलोड करें",
      "संदिग्ध खाते दिखाएं",
      "इस फ्रॉड रिंग को समझाएं",
      "केस रिपोर्ट बनाएं",
      "संदिग्ध संपत्ति फ्रीज़ करें"
    ],
    commands: {
      upload: "फ़ाइल अपलोड करें",
      showAccounts: "संदिग्ध खाते दिखाएं",
      explainRing: "इस फ्रॉड रिंग को समझाएं",
      generateReport: "केस रिपोर्ट बनाएं",
      freezeAssets: "संदिग्ध संपत्ति फ्रीज़ करें"
    },
    errorMsg: "क्षमा करें, मुझे एक त्रुटि मिली। कृपया पुनः प्रयास करें।",
    unsupportedBrowserMsg: "इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। क्रोम या एज का उपयोग करें।",
    noMicPermissionMsg: "माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया। कृपया अनुमति दें।",
    offlineNotice: "डैशबोर्ड का स्थानीय इंटेलिजेंस सक्रिय है। "
  },
  kn: {
    code: "kn-IN",
    label: "Kannada",
    nativeLabel: "ಕನ್ನಡ",
    placeholder: "ಸಂದೇಹಾಸ್ಪದ ವಹಿವಾಟುಗಳ ಬಗ್ಗೆ ಕೇಳಿ...",
    readyLabel: "ಸಿದ್ಧ",
    listeningLabel: "ಕೇಳಿಸಿಕೊಳ್ಳಲಾಗುತ್ತಿದೆ...",
    processingLabel: "ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...",
    speakingLabel: "ಮಾತನಾಡಲಾಗುತ್ತಿದೆ...",
    stopLabel: "ನಿಲ್ಲಿಸಿ",
    speakLabel: "ಮಾತನಾಡಿ",
    demoLabel: "ಡೆಮೊ ಪರಿಚಯ",
    demoRunningLabel: "ಡೆಮೊ ಚಾಲನೆಯಲ್ಲಿದೆ...",
    assistantTitle: "ಸೈಬರ್‌ಶೀಲ್ಡ್ ಸಹಾಯಕ",
    aiThinking: "ಎಐ ಯೋಚಿಸುತ್ತಿದೆ...",
    terminalHeader: "ಸೈಬರ್‌ಶೀಲ್ಡ್ ಸಂವಾದ ಲಾಗ್",
    muteLabel: "ಮೌನಗೊಳಿಸು",
    unmuteLabel: "ಧ್ವನಿ ಸಕ್ರಿಯಗೊಳಿಸು",
    enableLabel: "ಸಕ್ರಿಯಗೊಳಿಸು",
    disableLabel: "ನಿಷ್ಕ್ರಿಯಗೊಳಿಸು",
    suggestionsHeader: "— ಸಲಹೆಗಳು —",
    voiceStandby: "ಧ್ವನಿ ಎಂಜಿನ್ ಸಿದ್ಧವಾಗಿದೆ",
    receivingStream: "ಧ್ವನಿ ಸ್ವೀಕರಿಸಲಾಗುತ್ತಿದೆ...",
    synthesizingAudio: "ಧ್ವನಿ ರಚಿಸಲಾಗುತ್ತಿದೆ...",
    analyzingPattern: "ವಿನ್ಯಾಸ ವಿಶ್ಲೇಷಣೆ...",
    suggestions: [
      "ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
      "ಸಂದೇಹಾಸ್ಪದ ಖಾತೆಗಳನ್ನು ತೋರಿಸಿ",
      "ಈ ವಂಚನೆ ಜಾಲವನ್ನು ವಿವರಿಸಿ",
      "ಕೇಸ್ ವರದಿ ರಚಿಸಿ",
      "ಸಂದೇಹಾಸ್ಪದ ಸ್ವತ್ತುಗಳನ್ನು ಫ್ರೀಜ್ ಮಾಡಿ"
    ],
    commands: {
      upload: "ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
      showAccounts: "ಸಂದೇಹಾಸ್ಪದ ಖಾತೆಗಳನ್ನು ತೋರಿಸಿ",
      explainRing: "ಈ ವಂಚನೆ ಜಾಲವನ್ನು ವಿವರಿಸಿ",
      generateReport: "ಕೇಸ್ ವರದಿ ರಚಿಸಿ",
      freezeAssets: "ಸಂದೇಹಾಸ್ಪದ ಸ್ವತ್ತುಗಳನ್ನು ಫ್ರೀಜ್ ಮಾಡಿ"
    },
    errorMsg: "ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
    unsupportedBrowserMsg: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸ್ಪೀಚ್ ರೆಕಗ್ನಿಷನ್ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ಕ್ರೋಮ್ ಅಥವಾ ಎಡ್ಜ್ ಬಳಸಿ.",
    noMicPermissionMsg: "ಮೈಕ್ರೊಫೋನ್ ಪ್ರವೇಶವನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಅನುಮತಿ ನೀಡಿ.",
    offlineNotice: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನ ಆಫ್‌ಲೈನ್ ವಿಶ್ಲೇಷಕ ಸಕ್ರಿಯವಾಗಿದೆ. "
  },
  te: {
    code: "te-IN",
    label: "Telugu",
    nativeLabel: "తెలుగు",
    placeholder: "అనుమానాస్పద లావాదేవీల గురించి అడగండి...",
    readyLabel: "సిద్ధం",
    listeningLabel: "వింటున్నారు...",
    processingLabel: "ప్రక్రియ జరుగుతోంది...",
    speakingLabel: "మాట్లాడుతున్నారు...",
    stopLabel: "ఆపండి",
    speakLabel: "మాట్లాడండి",
    demoLabel: "డెమో వివరణ",
    demoRunningLabel: "డెమో నడుస్తోంది...",
    assistantTitle: "సైబర్‌శీల్డ్ సహాయకుడు",
    aiThinking: "ఏఐ ఆలోచిస్తోంది...",
    terminalHeader: "సైబర్‌శీల్డ్ డైలాగ్ లాగ్",
    muteLabel: "మ్యూట్ చేయి",
    unmuteLabel: "అన్‌మ్యూట్ చేయి",
    enableLabel: "ప్రారంభించు",
    disableLabel: "నిలిపివేయి",
    suggestionsHeader: "— సూచనలు —",
    voiceStandby: "వాయిస్ ఇంజిన్ సిద్ధంగా ఉంది",
    receivingStream: "వాయిస్ స్ట్రీమ్ స్వీకరిస్తోంది...",
    synthesizingAudio: "ఆడియోను సృష్టిస్తోంది...",
    analyzingPattern: "నమూనా విశ్ಲೇషణ...",
    suggestions: [
      "ఫైల్‌ను అప్‌లోడ్ చేయండి",
      "అనుమానాస్పద ఖాతాలను చూపించండి",
      "ఈ మోసపు వలయాన్ని వివరించండి",
      "కేసు నివేదికను రూపొందించండి",
      "అనుమానాస్పద ఆస్తులను ఫ్రీజ్ చేయండి"
    ],
    commands: {
      upload: "ఫైల్‌ను అప్‌లోడ్ చేయండి",
      showAccounts: "అనుమానాస్పద ఖాతాలను చూపించండి",
      explainRing: "ఈ మోసపు వలయాన్ని వివరించండి",
      generateReport: "కేసు నివేదికను రూపొందించండి",
      freezeAssets: "అనుమానాస్పద ఆస్తులను ఫ్రీజ్ చేయండి"
    },
    errorMsg: "క్షమించండి, ఒక లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    unsupportedBrowserMsg: "ఈ బ్రౌజర్‌లో స్పీచ్ రికగ్నిషన్ సపోర్ట్ లేదు. క్రోమ్ లేదా ఎడ్జ్ ఉపయోగించండి.",
    noMicPermissionMsg: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి అనుమతించండి.",
    offlineNotice: "ఆఫ్-లైన్ విశ్లేషణ వ్యవస్థ యాక్టివ్‌గా ఉంది. "
  },
  ta: {
    code: "ta-IN",
    label: "Tamil",
    nativeLabel: "தமிழ்",
    placeholder: "சந்தேகத்திற்கிடமான பரிவர்த்தனைகள் பற்றி கேளுங்கள்...",
    readyLabel: "தயார்",
    listeningLabel: "கேட்கிறது...",
    processingLabel: "செயலாக்கப்படுகிறது...",
    speakingLabel: "பேசுகிறது...",
    stopLabel: "நிறுத்து",
    speakLabel: "பேசு",
    demoLabel: "டெமோ விளக்கம்",
    demoRunningLabel: "டெமோ இயங்குகிறது...",
    assistantTitle: "சைபர்ஷீல்ட் உதவியாளர்",
    aiThinking: "ஏஐ சிந்திக்கிறது...",
    terminalHeader: "சைபர்ஷீல்ட் உரையாடல் பதிவு",
    muteLabel: "ஒலியை நிறுத்து",
    unmuteLabel: "ஒலியை இயக்கு",
    enableLabel: "செயல்படுத்து",
    disableLabel: "முடக்கு",
    suggestionsHeader: "— பரிந்துரைகள் —",
    voiceStandby: "குரல் எஞ்சின் தயார்",
    receivingStream: "குரல் பெறப்படுகிறது...",
    synthesizingAudio: "குரல் உருவாக்கப்படுகிறது...",
    analyzingPattern: "வடிவமைப்பு பகுப்பாய்வு...",
    suggestions: [
      "கோப்பை பதிவேற்றுக",
      "சந்தேகத்திற்குரிய கணக்குகளை காட்டு",
      "இந்த மோசடி வலையை விளக்கு",
      "வழக்கு அறிக்கை உருவாக்கு",
      "சந்தேகத்திற்குரிய சொத்துக்களை முடக்கு"
    ],
    commands: {
      upload: "கோப்பை பதிவேற்றுக",
      showAccounts: "சந்தேகத்திற்குரிய கணக்குகளை காட்டு",
      explainRing: "இந்த மோசடி வலையை விளக்கு",
      generateReport: "வழக்கு அறிக்கை உருவாக்கு",
      freezeAssets: "சந்தேகத்திற்குரிய சொத்துக்களை முடக்கு"
    },
    errorMsg: "மன்னிக்கவும், ஒரு பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
    unsupportedBrowserMsg: "இந்த உலாவியில் பேச்சு அங்கீகாரம் ஆதரிக்கப்படவில்லை. Chrome அல்லது Edge ஐப் பயன்படுத்தவும்.",
    noMicPermissionMsg: "ஒலிவாங்கி அனுமதி மறுக்கப்பட்டது. அமைப்புகளைச் சரிபார்க்கவும்.",
    offlineNotice: "ஆஃப்லைன் பகுப்பாய்வி செயலில் உள்ளது. "
  }
};
