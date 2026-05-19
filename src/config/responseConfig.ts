import { SupportedLanguage } from "./languageConfig";

export interface LocalizedResponseSet {
  fraudDetected: string;
  uploadSuccess: string;
  listening: string;
  speaking: string;
  errors: string;
  aiThinking: string;
  reportGeneration: string;
  freezeSuccess: string;
  smurfing: string;
  cycles: string;
  shellChains: string;
}

export const responseConfig: Record<SupportedLanguage, LocalizedResponseSet> = {
  en: {
    fraudDetected: "🚨 Forensic Scan complete. High-risk circular loops and organized smurfing chains detected on hot wallet networks.",
    uploadSuccess: "📥 Ledger ingestion successful! Building multi-hop transaction maps and computing ledger suspicion scores.",
    listening: "🎙️ Forensic micro-stream active. Speak your next investigation instruction.",
    speaking: "🔊 Broadcasting analyzed cyber forensics case summary.",
    errors: "⚠️ Connection failure or database limits reached. Initializing offline backup analysis model.",
    aiThinking: "⚡ Tracing graph vectors and running cycle-detection algorithms...",
    reportGeneration: "📄 Vector case report compiled. Exporting Law Enforcement intelligence dossier.",
    freezeSuccess: "🔒 SMART CONTRACT ENFORCED: Hot Wallet assets have been restricted and frozen successfully.",
    smurfing: "Smurfing splits large transactions into micro-transfers below thresholds. We detect this by tracking high-velocity fan-in or fan-out flows.",
    cycles: "Circular routing detected! Multiple accounts are routing money back to the source to layer transaction history.",
    shellChains: "Shell chains represent intermediate nodes carrying low transaction count to conceal the ultimate flow of funds."
  },
  hi: {
    fraudDetected: "🚨 फॉरेंसिक स्कैन पूरा हुआ। हॉट वॉलेट नेटवर्क पर उच्च जोखिम वाले चक्रीय लूप और संगठित स्मर्फिंग श्रृंखलाओं का पता चला है।",
    uploadSuccess: "📥 बहीखाता सफलतापूर्वक प्राप्त हुआ! मल्टी-हॉप लेनदेन मानचित्र बनाए जा रहे हैं और संदिग्ध स्कोर की गणना की जा रही है।",
    listening: "🎙️ फॉरेंसिक माइक्रो-स्ट्रीम सक्रिय है। अपने निर्देश बोलें।",
    speaking: "🔊 विश्लेषित साइबर फॉरेंसिक मामला विवरण प्रसारित किया जा रहा है।",
    errors: "⚠️ कनेक्शन विफलता या डेटाबेस सीमा समाप्त। स्थानीय इंटेलिजेंस बैकअप प्रणाली चालू की जा रही है।",
    aiThinking: "⚡ ग्राफ वैक्टरों की खोज की जा रही है और लूप का पता लगाने वाले एल्गोरिदम चलाए जा रहे हैं...",
    reportGeneration: "📄 केस रिपोर्ट तैयार की गई। कानून प्रवर्तन खुफिया डोजियर निर्यात किया जा रहा है।",
    freezeSuccess: "🔒 स्मार्ट अनुबंध लागू किया गया: हॉट वॉलेट संपत्तियों को सफलतापूर्वक लॉक और फ्रीज कर दिया गया है।",
    smurfing: "स्मर्फिंग के तहत बड़ी रकम को छोटी-छोटी राशियों में बांटकर भेजा जाता है ताकि सीमा से बचा जा सके। हम तीव्र गति से आने या जाने वाले प्रवाहों को ट्रैक करके इसका पता लगाते हैं।",
    cycles: "चक्रीय मार्ग (सर्कुलर राउटिंग) का पता चला है! लेन-देन के इतिहास को छिपाने के लिए कई खाते आपस में घूमकर मूल खाते में पैसा भेज रहे हैं।",
    shellChains: "शैल चेन का मतलब मध्यवर्ती खाते हैं जो धन के अंतिम गंतव्य को छिपाने के लिए बहुत कम मात्रा में लेनदेन करते हैं।"
  },
  kn: {
    fraudDetected: "🚨 ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ! ಹೆಚ್ಚಿನ ಅಪಾಯದ ವಂಚನೆ ಜಾಲಗಳು ಮತ್ತು ಸಕ್ರಿಯ ಮನಿ ಮ್ಯೂಲ್ ಲಿಂಕ್‌ಗಳನ್ನು ಗುರುತಿಸಲಾಗಿದೆ.",
    uploadSuccess: "📥 ಲೆಡ್ಜರ್ ಅಪ್‌ಲೋಡ್ ಯಶಸ್ವಿಯಾಗಿದೆ! ವಹಿವಾಟು ನಕ್ಷೆ ಮತ್ತು ಅಪಾಯದ ಅಂಕಗಳನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ.",
    listening: "🎙️ ಫೋರೆನ್ಸಿಕ್ ಆಡಿಯೋ ಸಕ್ರಿಯವಾಗಿದೆ. ನಿಮ್ಮ ಮುಂದಿನ ಸೂಚನೆಯನ್ನು ತಿಳಿಸಿ.",
    speaking: "🔊 ವಿಶ್ಲೇಷಿಸಲಾದ ಪ್ರಕರಣದ ಸಾರಾಂಶವನ್ನು ಪ್ರಸಾರ ಮಾಡಲಾಗುತ್ತಿದೆ.",
    errors: "⚠️ ಸಂಪರ್ಕ ದೋಷ! ಸ್ಥಳೀಯ ಬ್ಯಾಕಪ್ ವಿಶ್ಲೇಷಣಾ ವ್ಯವಸ್ಥೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲಾಗುತ್ತಿದೆ.",
    aiThinking: "⚡ ಗ್ರಾಫ್ ವೆಕ್ಟರ್‌ಗಳು ಮತ್ತು ಸೈಕಲ್ ಪತ್ತೆ ಹಚ್ಚುವ ಅಲ್ಗಾರಿದಮ್ ರನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    reportGeneration: "📄 ಅಧಿಕೃತ ಕೇಸ್ ವರದಿ ಸಿದ್ಧವಾಗಿದೆ. ಕಾನೂನು ಜಾರಿ ಇಲಾಖೆಯ ಇಂಟೆಲಿಜೆನ್ಸ್ ಡೋಸಿಯರ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.",
    freezeSuccess: "🔒 ಸ್ಮಾರ್ಟ್ ಒಪ್ಪಂದ ಜಾರಿಗೊಳಿಸಲಾಗಿದೆ: ಸಂದೇಹಾಸ್ಪದ ವ್ಯಾಲೆಟ್ ಸ್ವತ್ತುಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ.",
    smurfing: "ಸ್ಮರ್ಫಿಂಗ್ ಎಂದರೆ ಮಿತಿ ಮೀರುವುದನ್ನು ತಪ್ಪಿಸಲು ದೊಡ್ಡ ಮೊತ್ತದ ಹಣವನ್ನು ಸಣ್ಣ ವಹಿವಾಟುಗಳಾಗಿ ವಿಂಗಡಿಸುವುದು.",
    cycles: "ವರ್ತುಲ ರೂಟಿಂಗ್ ಪತ್ತೆಯಾಗಿದೆ! ಹಣದ ಮೂಲವನ್ನು ಮರೆಮಾಚಲು ಅನೇಕ ಖಾತೆಗಳ ಮೂಲಕ ಹಣವನ್ನು ತಿರುಗಿಸಲಾಗುತ್ತಿದೆ.",
    shellChains: "ಶೆಲ್ ಸರಪಳಿಗಳು ಎಂದರೆ ಹಣದ ನಿಜವಾದ ಮಾಲೀಕರನ್ನು ಮರೆಮಾಡಲು ಬಳಸಲಾಗುವ ಮಧ್ಯಂತರ ನಿಷ್ಕ್ರಿಯ ಖಾತೆಗಳು."
  },
  te: {
    fraudDetected: "🚨 ఫోరెన్సిక్ స్కాన్ పూర్తయింది! అధిక ముప్పు ఉన్న మోసపూరిత వలయాలు మరియు మనీ మ్యూల్ లింకులు కనుగొనబడ్డాయి.",
    uploadSuccess: "📥 లెడ్జర్ అప్‌లోడ్ విజయవంతమైంది! లావాదేవీల మ్యాప్ మరియు రిస్క్ స్కోర్ గణించబడుతోంది.",
    listening: "🎙️ ఫోరెన్సిక్ ఆడియో యాక్టివ్‌గా ఉంది. మీ తదుపరి ఆదేశాన్ని చెప్పండి.",
    speaking: "🔊 విశ్లేషించబడిన కేసు సారాంశాన్ని వినిపిస్తున్నాము.",
    errors: "⚠️ కనెక్షన్ వైఫల్యం! లోకల్ బ్యాకప్ విశ్లేషణ వ్యవస్థ ప్రారంభించబడింది.",
    aiThinking: "⚡ గ్రాఫ్ వెక్టర్స్ మరియు సైకిల్ డిటెక్షన్ అల్గారిథమ్స్ రన్ అవుతున్నాయి...",
    reportGeneration: "📄 కేసు నివేదిక సిద్ధమైంది. లా ఎన్‌ఫోర్స్‌మెంట్ ఇంటెలిజెన్స్ నివేదికను డౌన్‌లోడ్ చేయండి.",
    freezeSuccess: "🔒 స్మార్ట్ కాంట్రాక్ట్ అమలు చేయబడింది: అనుమానాస్పద వాలెట్ ఆస్తులు విజయవంతంగా ఫ్రీజ్ చేయబడ్డాయి.",
    smurfing: "స్మర్ఫింగ్ అంటే పరిమితుల నుండి తప్పించుకోవడానికి పెద్ద మొత్తాన్ని చిన్న లావాదేవీలుగా విభజించడం.",
    cycles: "సర్క్యులర్ రూటింగ్ కనుగొనబడింది! లావాదేవీల చరిత్రను దాచడానికి అనేక ఖాతాలు ఒకే ఖాతాకు డబ్బును మళ్లిస్తున్నాయి.",
    shellChains: "షెల్ గొలుసులు అంటే నిజమైన నిధుల ప్రవాహాన్ని దాచడానికి ఉపయోగపడే మధ్యంతర ఖాతాలు."
  },
  ta: {
    fraudDetected: "🚨 தடயவியல் ஆய்வு நிறைவடைந்தது! அதிக ஆபத்துள்ள மோசடி வளையங்கள் மற்றும் பண பரிமாற்ற இணைப்புகள் கண்டறியப்பட்டுள்ளன.",
    uploadSuccess: "📥 லெட்ஜர் பதிவேற்றம் வெற்றிகரமாக முடிந்தது! பரிவர்த்தனை வரைபடம் மற்றும் ஆபத்து மதிப்பெண்கள் கணக்கிடப்படுகின்றன.",
    listening: "🎙️ தடயவியல் ஒலிவாங்கி செயல்பாட்டில் உள்ளது. உங்கள் அடுத்த கட்டளையைக் கூறவும்.",
    speaking: "🔊 பகுப்பாய்வு செய்யப்பட்ட வழக்கின் சுருக்கம் ஒலிபரப்பப்படுகிறது.",
    errors: "⚠️ இணைப்பு தோல்வி! உள்ளூர் காப்பு பகுப்பாய்வு அமைப்பு செயல்படுத்தப்படுகிறது.",
    aiThinking: "⚡ வரைபட திசையன்கள் மற்றும் சுழற்சி கண்டறிதல் வழிமுறைகள் இயக்கப்படுகின்றன...",
    reportGeneration: "📄 வழக்கு அறிக்கை தயார். சட்ட அமலாக்க புலனாய்வு ஆவணத்தை பதிவிறக்கவும்.",
    freezeSuccess: "🔒 スマート ஒப்பந்தம் அமல்படுத்தப்பட்டது: சந்தேகத்திற்குரிய வாலட் சொத்துக்கள் வெற்றிகரமாக முடக்கப்பட்டன.",
    smurfing: "ஸ்மர்ஃபிங் என்பது வரம்புகளைத் தவிர்க்க பெரிய தொகையை சிறிய பரிவர்த்தனைகளாகப் பிரிப்பதாகும்.",
    cycles: "சுழற்சி வழித்தடம் கண்டறியப்பட்டது! பணப் பரிமாற்ற வரலாற்றை மறைக்க பல கணக்குகள் வழியாக பணம் சுழற்றப்படுகிறது.",
    shellChains: "ஷெல் சங்கிலிகள் என்பது பணத்தின் இறுதி இலக்கை மறைக்கப் பயன்படும் இடைநிலை கணக்குகளாகும்."
  }
};

export const romanizedResponseConfig: Record<Exclude<SupportedLanguage, "en">, LocalizedResponseSet> = {
  hi: {
    fraudDetected: "Forensic scan poora hua. High risk circular loops aur organized smurfing chains ka pata chala hai.",
    uploadSuccess: "Bahi khata safal-ta-poorvak prapt hua! Transaction maps banaye ja rahe hain.",
    listening: "Forensic micro stream active hai. Apne agle nirdesh bolein.",
    speaking: "Cyber forensic maamla vivaran prasaarit kiya ja raha hai.",
    errors: "Connection viphalta. Sthaniya intelligence backup pranali chalu ki ja rahi hai.",
    aiThinking: "Graph vectors ki khoj ki ja rahi hai aur algorithms chalaye ja rahe hain...",
    reportGeneration: "Case report taiyar ki gayi. Dossier export kiya ja raha hai.",
    freezeSuccess: "Smart contract laagu kiya gaya. Hot wallet sampattiyon ko safal-ta-poorvak freeze kar diya gaya hai.",
    smurfing: "Smurfing ke tehet badi rakam ko chhoti chhoti rashiyon mein baant kar bheja jata hai takki limit se bacha ja sake.",
    cycles: "Circular routing ka pata chala hai! Kai khaate aapas mein ghoom kar mool khaate mein paisa bhej rahe hain.",
    shellChains: "Shell chain ka matlab madhyavarti khaate hain jo dhan ke antim destination ko chhipane ke liye transactions karte hain."
  },
  kn: {
    fraudDetected: "Forensick scan poortiyagide! Hechina apayada vanchane jalagalu mathu money mule link-galannu gurutisalagide.",
    uploadSuccess: "Ledger upload yashasviyagide! Transaction map mathu risk score calculate madalaguttide.",
    listening: "Forensick audio active agide. Nimma mundina soochane thilisi.",
    speaking: "Visleshislada prakaranada saaramshavannu prasaara madalaguttide.",
    errors: "Connection error. Sthaniya backup system active agide.",
    aiThinking: "Graph vectors mathu cycle detection algorithms run madalaguttide...",
    reportGeneration: "Case report ready ide. Intelligence dossier download madi.",
    freezeSuccess: "Smart contract enforce madalagide. Suspicious wallet assets freeze agide.",
    smurfing: "Smurfing endare limit thappisalu dodda transaction-annu sanna sanna transaction-galagi vibhagisuvudu.",
    cycles: "Circular routing patteyagide! Kai khaategalu aapas-nalli transaction madi source-ge money kaluhisuttive.",
    shellChains: "Shell chains endare money flow chhipisalu madhyavarti khaategalannu use maduvudu."
  },
  te: {
    fraudDetected: "Forensick scan poorthi-ayindi. High risk fraud rings mariyu money mule links kanugonabaddayi.",
    uploadSuccess: "Ledger upload vijayavantham ayindi! Transaction map mariyu risk score ready avuthondi.",
    listening: "Forensick audio active ga undi. Mee nirdesham cheppandi.",
    speaking: "Analysis chesina case summary vinipisthunnam.",
    errors: "Connection failed. Local backup system active ga undi.",
    aiThinking: "Graph vectors mariyu cycle detection algorithms run avuthunnayi...",
    reportGeneration: "Case report ready ga undi. Law enforcement dossier download cheyandi.",
    freezeSuccess: "Smart contract apply ayindi. Suspicious wallet assets successfully freeze ayyayi.",
    smurfing: "Smurfing ante limits nundi thappinchukovadaniki pedda transaction-ni chinna chinna transactions-ga vibhajinchadam.",
    cycles: "Circular routing kanugonabaddadi. Transactions history daachadaniki chala accounts money routing chesthunnayi.",
    shellChains: "Shell chains ante intermediate accounts dwara transactions ni mask cheyadam."
  },
  ta: {
    fraudDetected: "Forensick aayv-u nirai-vadaithathu! Adhiga aabathulla moadsadi valai-gal matrum money mule link-gal kandupidikkapattullana.",
    uploadSuccess: "Ledger padhi-vetru vetri-karamaga mudindhathu! Transaction map matrum risk score kanakkidappadugirathu.",
    listening: "Forensick mic active-aga ullathu. Ungal adutha niredhesathai sollungal.",
    speaking: "Analysis seiyappatta case-in churukkam oli-parappappadugirathu.",
    errors: "Connection failure. Local backup system seiyalpada thodangiyath-u.",
    aiThinking: "Graph vectors matrum cycle detection vazhimuraigal iyakkappadugirana...",
    reportGeneration: "Case report thayar. Intelligence dossier-ai download seiyyalum.",
    freezeSuccess: "Smart contract amala-na-th-u. Suspicious wallet assets successfully freeze seiyyappatta-th-u.",
    smurfing: "Smurfing enbadhu limit thavirkka periya thogai-yai chiriya transactions-aga pirippadhu aagum.",
    cycles: "Circular routing kandupidikkappattath-u. Transactions history-yai maraikka pala accounts vazhi-yaga money chulalapadugirathu.",
    shellChains: "Shell chains enbadhu money-in ultimate destination maraikka intermediate accounts use seivadhu."
  }
};

export const getLocalResponse = (lang: SupportedLanguage, phrase: string): string | null => {
  const query = phrase.toLowerCase().trim();
  const set = responseConfig[lang];

  if (
    query.includes("smurf") ||
    query.includes("स्मर्फ") ||
    query.includes("ಸ್ಮರ್ಫಿಂಗ್") ||
    query.includes("స్మర్ఫింగ్") ||
    query.includes("ஸ்மர்பிங்")
  ) {
    return set.smurfing;
  }
  if (
    query.includes("cycle") ||
    query.includes("loop") ||
    query.includes("चक्र") ||
    query.includes("ring") ||
    query.includes("रिंग") ||
    query.includes("गैंग") ||
    query.includes("ಚಕ್ರ") ||
    query.includes("వలయం") ||
    query.includes("சுழற்சி") ||
    query.includes("வளையம்") ||
    query.includes("ರಿಂಗ್") ||
    query.includes("రింగ్")
  ) {
    return set.cycles;
  }
  if (
    query.includes("shell") ||
    query.includes("chain") ||
    query.includes("शैल") ||
    query.includes("ಶೆಲ್") ||
    query.includes("షెల్") ||
    query.includes("ஷெல்")
  ) {
    return set.shellChains;
  }
  if (
    query.includes("upload") ||
    query.includes("up load") ||
    query.includes("csv") ||
    query.includes("फ़ाइल") ||
    query.includes("अपलोड") ||
    query.includes("ಅಪ್ಲೋಡ್") ||
    query.includes("అప్‌లోడ్") ||
    query.includes("பதிவேற்ற")
  ) {
    return set.uploadSuccess;
  }
  if (
    query.includes("report") ||
    query.includes("रिपोर्ट") ||
    query.includes("pdf") ||
    query.includes("पीडीएफ") ||
    query.includes("ವರದಿ") ||
    query.includes("నివేదిక") ||
    query.includes("அறிக்கை")
  ) {
    return set.reportGeneration;
  }
  if (
    query.includes("freeze") ||
    query.includes("फ्रीज") ||
    query.includes("lock") ||
    query.includes("लॉक") ||
    query.includes("ಫ್ರೀಜ್") ||
    query.includes("ఫ్రీజ్") ||
    query.includes("ಮುಡಕ್") ||
    query.includes("முடக்கு")
  ) {
    return set.freezeSuccess;
  }
  if (
    query.includes("account") ||
    query.includes("suspect") ||
    query.includes("खाता") ||
    query.includes("संदिग्ध") ||
    query.includes("ಖಾತೆ") ||
    query.includes("ఖాతా") ||
    query.includes("கணக்கு")
  ) {
    return set.fraudDetected;
  }
  return null;
};

// Gets the Romanized text if active voice is an English voice engine.
export const getPhoneticText = (lang: SupportedLanguage, nativeText: string): string => {
  if (lang === "en") return nativeText;

  const query = nativeText.trim();
  const nativeSet = responseConfig[lang];
  const phoneticSet = romanizedResponseConfig[lang as Exclude<SupportedLanguage, "en">];

  // Try to exact match properties
  for (const key of Object.keys(nativeSet) as Array<keyof LocalizedResponseSet>) {
    if (nativeSet[key] === query) {
      return phoneticSet[key];
    }
  }

  // Fallback to searching substrings
  const queryLower = query.toLowerCase();
  if (
    queryLower.includes("smurf") ||
    queryLower.includes("स्मर्फ") ||
    queryLower.includes("ಸ್ಮರ್ಫಿಂಗ್") ||
    queryLower.includes("స్మర్ఫింగ్") ||
    queryLower.includes("ஸ்மர்பிங்")
  ) {
    return phoneticSet.smurfing;
  }
  if (
    queryLower.includes("cycle") ||
    queryLower.includes("loop") ||
    queryLower.includes("चक्र") ||
    queryLower.includes("ಚಕ್ರ") ||
    queryLower.includes("వలయం") ||
    queryLower.includes("சுழற்சி")
  ) {
    return phoneticSet.cycles;
  }
  if (
    queryLower.includes("shell") ||
    queryLower.includes("chain") ||
    queryLower.includes("शैल") ||
    queryLower.includes("ಶೆಲ್") ||
    queryLower.includes("షెల్") ||
    queryLower.includes("ஷெல்")
  ) {
    return phoneticSet.shellChains;
  }
  if (
    queryLower.includes("फॉरेंसिक स्कैन") ||
    queryLower.includes("ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ") ||
    queryLower.includes("పూర్తయింది") ||
    queryLower.includes("நிறைவடைந்தது")
  ) {
    return phoneticSet.fraudDetected;
  }
  if (
    queryLower.includes("बहीखाता") ||
    queryLower.includes("ಅಪ್‌ಲೋಡ್ ಯಶಸ್ವಿಯಾಗಿದೆ") ||
    queryLower.includes("విజయవంతమైంది") ||
    queryLower.includes("பதிவேற்றம் வெற்றிகரமாக")
  ) {
    return phoneticSet.uploadSuccess;
  }
  if (
    queryLower.includes("केस रिपोर्ट") ||
    queryLower.includes("ವರದಿ ಸಿದ್ಧವಾಗಿದೆ") ||
    queryLower.includes("సిద్ధమైంది") ||
    queryLower.includes("வழக்கு அறிக்கை தயார்")
  ) {
    return phoneticSet.reportGeneration;
  }
  if (
    queryLower.includes("फ्रीज") ||
    queryLower.includes("ಲಾಕ್ ಮಾಡಲಾಗಿದೆ") ||
    queryLower.includes("ఫ్రీజ్ చేయబడ్డాయి") ||
    queryLower.includes("முடக்கப்பட்டன")
  ) {
    return phoneticSet.freezeSuccess;
  }

  // Fallback
  return phoneticSet.errors;
};
