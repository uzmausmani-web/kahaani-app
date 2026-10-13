import { useState, ChangeEvent, KeyboardEvent, useRef, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  sender: 'You' | 'AI';
  text: string;
  hinglishHelp?: {
    hinglish: string;
    devanagari: string;
  };
}

interface VaultItem {
  hinglish: string;
  english: string;
}

interface VocabWord {
  hinglish: string;
  english: string;
  devanagari: string;
}

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  const [xp, setXp] = useState(0);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [scenario, setScenario] = useState('Grandparents');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const practiceRecRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scenarios: Record<string, { title: string, mission: string, vocab: VocabWord[], grammarTemplate: string, grammarEnglish: string, greetings: string[], prompt: string }> = {
    Grandparents: {
      title: 'Dada/Dadi 👵🏽👴🏽',
      mission: 'Tell them about your robotics team and how hard you are working on a project.',
      vocab: [
        { hinglish: 'Mehnat', english: 'Hard work', devanagari: 'मेहनत' },
        { hinglish: 'Banana', english: 'To build/make', devanagari: 'बनाना' },
        { hinglish: 'Koshish', english: 'Attempt/Effort', devanagari: 'कोशिश' }
      ],
      grammarTemplate: '"Main ek robot [ build ] ki [ attempt ] kar rahi hoon, ismein bahut [ hard work ] lag rahi hai."',
      grammarEnglish: '"I am making an [ attempt ] to [ build ] a robot, it requires a lot of [ hard work ]."',
      greetings: [
        'बेटा, आज का दिन कैसा था? | Beta, aaj ka din kaisa tha? | (How was your day today?)',
        'सुना है तुम रोबोटिक्स में बहुत अच्छा कर रही हो! | Suna hai tum robotics mein bahut achcha kar rahi ho! | (I heard you are doing very well in robotics!)'
      ],
      prompt: 'You are a loving Indian grandparent talking to your teen grandchild. Keep replies to 1-2 friendly, warm sentences. Focus on affection (using terms like Beta). Do NOT use religious greetings.'
    },
    Cousin: {
      title: 'Cousin in Delhi 📱',
      mission: 'Complain about how much homework you have and ask what shows they are watching.',
      vocab: [
        { hinglish: 'Bekaar', english: 'Useless/Boring', devanagari: 'बेकार' },
        { hinglish: 'Badhiya', english: 'Great/Good', devanagari: 'बढ़िया' },
        { hinglish: 'Pareshani', english: 'Trouble/Problem', devanagari: 'परेशानी' }
      ],
      grammarTemplate: '"Yeh homework bahut [ useless/boring ] hai, aur roz nayi [ trouble/problem ] hoti hai. Tum koi [ great/good ] show dekh rahe ho?"',
      grammarEnglish: '"This homework is very [ useless/boring ], and every day there is a new [ trouble/problem ]. Are you watching any [ great/good ] show?"',
      greetings: [
        'और बता, क्या चल रहा है आज कल? | Aur bata, kya chal raha hai aaj kal? | (Tell me, what is up these days?)',
        'कोई नई फनी रील देखी? | Koi nayi funny reel dekhi? | (Did you see any new funny reel?)'
      ],
      prompt: 'You are a cool, 20-something cousin living in Delhi chatting on WhatsApp with your American cousin. Keep it casual and conversational, 1-2 sentences.'
    },
    Shopkeeper: {
      title: 'Street Vendor 🛒',
      mission: 'Negotiate the price of a blue dupatta down by 50 rupees.',
      vocab: [
        { hinglish: 'Mehenga', english: 'Expensive', devanagari: 'महंगा' },
        { hinglish: 'Sahi daam', english: 'Right/Fair price', devanagari: 'सही दाम' },
        { hinglish: 'Kam karna', english: 'To reduce', devanagari: 'कम करना' }
      ],
      grammarTemplate: '"Bhaiya yeh bahut [ expensive ] hai. Iska [ fair price ] bataiye, thoda [ reduce ] padega."',
      grammarEnglish: '"Brother this is very [ expensive ]. Tell me the [ fair price ], you will have to [ reduce ] it a bit."',
      greetings: [
        'आइए आइए! बोलिए क्या चाहिए आपको? | Aaiye aaiye! Boliye kya chahiye aapko? | (Come in! Tell me, what do you need?)',
        'अस्सलाम वालेकुम जी, बताइए। | Assalamualaikum ji, bataiye. | (Peace be upon you, tell me.)'
      ],
      prompt: 'You are a busy but polite street vendor or shopkeeper in North India chatting with a young customer. Keep it to 1-2 sentences.'
    }
  };

  const getRandomGreeting = (scenKey: string) => {
    const greets = scenarios[scenKey].greetings;
    return greets[Math.floor(Math.random() * greets.length)];
  };

  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

    const savedKey = localStorage.getItem('gemini_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySet(true);
      setMessages([{ sender: 'AI', text: getRandomGreeting('Grandparents') }]);
    }
    
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'hi-IN';
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputText(currentTranscript);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);

      practiceRecRef.current = new SpeechRecognitionAPI();
      practiceRecRef.current.continuous = false;
      practiceRecRef.current.interimResults = false;
      practiceRecRef.current.lang = 'hi-IN';
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, statusMessage]);

  const saveKey = () => {
    if (apiKey.trim().length > 10) {
      localStorage.setItem('gemini_key', apiKey);
      setIsKeySet(true);
      setMessages([{ sender: 'AI', text: getRandomGreeting(scenario) }]);
    }
  };

  const changeScenario = (newScenario: string) => {
    setScenario(newScenario);
    setMessages([{ sender: 'AI', text: getRandomGreeting(newScenario) }]);
  };

  const getDisplayText = (text: string) => {
    const parts = text.split('|');
    if (parts.length >= 2) {
      return `${parts[1].trim()} ${parts[2] ? parts[2].trim() : ''}`;
    }
    return text;
  };

  const speakText = (devanagariText: string) => {
    window.speechSynthesis.cancel(); 
    const parts = devanagariText.split('|');
    let hindiPart = parts.length > 1 ? parts[0].trim() : devanagariText.replace(/\(.*\)/g, '').trim();
    hindiPart = hindiPart.replace(/,/g, '... ').replace(/\?/g, ' ?');
    
    const utterance = new SpeechSynthesisUtterance(hindiPart);
    utterance.lang = 'hi-IN'; 
    utterance.rate = 0.85; 
    
    const voices = window.speechSynthesis.getVoices();
    const hindiVoices = voices.filter(voice => voice.lang.includes('hi-IN') || voice.lang.includes('hi'));
    if (hindiVoices.length > 0) {
      const premiumVoice = hindiVoices.find(v => v.name.includes('Premium') || v.name.includes('Lekha') || v.name.includes('Rishi'));
      utterance.voice = premiumVoice || hindiVoices[0];
    }
    utteranceRef.current = utterance; 
    window.speechSynthesis.speak(utterance);
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInputText('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const addToVault = (hinglish: string, english: string) => {
    if (!vault.find(v => v.hinglish === hinglish)) {
      setVault([...vault, { hinglish, english }]);
      setXp(prev => prev + 15); 
      setStatusMessage('Saved to Vault! +15 XP 📦');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const practicePronunciation = (targetHinglish: string) => {
    setStatusMessage(`Listening... say "${targetHinglish}"`);
    
    practiceRecRef.current.onresult = (event: any) => {
      const spoken = event.results[0][0].transcript.toLowerCase();
      if (spoken.length > 2) {
        setStatusMessage(`Nailed it! +30 XP 🔥`);
        setXp(prev => prev + 30);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage(`Try again! ❌`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    };
    
    practiceRecRef.current.onerror = () => {
      setStatusMessage('Could not hear you well enough.');
      setTimeout(() => setStatusMessage(null), 3000);
    };

    practiceRecRef.current.start();
  };

  const generateAIResponse = async (userText: string, usedVoice: boolean) => {
    setIsLoading(true);
    
    const currentVocab = scenarios[scenario].vocab;
    const lowerUserText = userText.toLowerCase();
    const wordsUsed = currentVocab.filter(v => lowerUserText.includes(v.hinglish.toLowerCase()));
    
    let bonusXp = 0;
    if (wordsUsed.length > 0) {
      bonusXp = wordsUsed.length * 50; 
      setStatusMessage(`Vocab Combo! +${bonusXp} XP 🚀`);
      setTimeout(() => setStatusMessage(null), 4000);
    }
    
    const isEnglish = /^[a-zA-Z\s.,?!'"]+$/.test(userText) && userText.split(' ').length > 2 && wordsUsed.length === 0;
    if (usedVoice) setXp(prev => prev + 20 + bonusXp); 
    else if (!isEnglish) setXp(prev => prev + 10 + bonusXp); 
    else setXp(prev => prev + 2 + bonusXp); 
    
    const personaPrompt = scenarios[scenario].prompt;
    const currentScenarioName = scenarios[scenario].title;
    
    const structuredPrompt = `
You are the core language engine of "Kahaani", a coaching app helping an Indian-American teenager learn natural North Indian spoken Hinglish.
The user just sent this message: "${userText}"

Role for Reply: ${personaPrompt}
Current Scenario: ${currentScenarioName}

Task 1: USER TRANSLATION
Translate the user's input into natural, everyday spoken Hinglish. 
CRITICAL: Adjust pronouns and verbs based on the Scenario (Grandparents = Aap, Cousin = Tum/Tu, Shopkeeper = Aap/Bhaiya).

Task 2: PERSONA REPLY
Respond in character. Ensure the reply keeps the conversation flowing based on the active mission.

Return ONLY valid JSON:
{
  "userHinglish": "Natural Hinglish version of user input",
  "userDevanagari": "देवनागरी script of the natural user input",
  "replyDevanagari": "देवनागरी script of reply",
  "replyHinglish": "Hinglish transliteration of reply",
  "replyEnglish": "English translation of reply"
}
`;

    try {
      // Reverted back to flash-lite-latest but kept the JSON lock
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=" + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: structuredPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "API Key restricted.");
      
      const rawText = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(rawText);

      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].sender === 'You') {
          updated[lastIndex] = {
            ...updated[lastIndex],
            hinglishHelp: {
              hinglish: parsed.userHinglish,
              devanagari: parsed.userDevanagari
            }
          };
        }

        const aiFormattedMessage = `${parsed.replyDevanagari} | ${parsed.replyHinglish} | (${parsed.replyEnglish})`;
        updated.push({ sender: 'AI', text: aiFormattedMessage });
        return updated;
      });

      if (autoSpeak) speakText(parsed.replyDevanagari);
      
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'AI', text: "Google API Error: " + (error as Error).message }]);
    }
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (inputText.trim() === '') return;
    const wasListening = isListening;
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    
    const userText = inputText;
    setMessages(prev => [...prev, { sender: 'You', text: userText }]);
    setInputText('');
    
    await generateAIResponse(userText, wasListening);
  };

  // LOGIN SCREEN
  if (!isKeySet) {
    return (
      <div className="min-h-screen bg-violet-200 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-md w-full">
          <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">Kahaani <span className="text-violet-500">⚡</span></h1>
          <p className="text-slate-600 mb-8 font-bold">Plug in the AI engine to start.</p>
          <input 
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste Gemini API Key here..."
            className="w-full px-5 py-4 rounded-xl border-4 border-slate-900 focus:outline-none focus:bg-violet-50 font-bold mb-6 text-lg transition-colors"
          />
          <button 
            onClick={saveKey} 
            className="w-full bg-violet-500 hover:bg-violet-400 text-white px-6 py-4 rounded-xl font-black text-xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] transition-all"
          >
            START HACKING 🚀
          </button>
        </div>
      </div>
    );
  }

  // MAIN APP SCREEN
  return (
    <div className="min-h-screen bg-violet-100 font-sans p-2 md:p-8 flex justify-center items-center relative overflow-hidden">
      
      {/* Vault Modal Overlay */}
      {isVaultOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 flex justify-end backdrop-blur-sm">
          <div className="w-full max-w-sm bg-yellow-300 h-full border-l-4 border-slate-900 p-6 overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">VAULT ⭐</h2>
              <button onClick={() => setIsVaultOpen(false)} className="bg-white border-4 border-slate-900 px-3 py-1 rounded-full font-black text-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all">X</button>
            </div>
            {vault.length === 0 ? (
              <div className="bg-white border-4 border-slate-900 p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-center">
                <p className="font-bold text-slate-600">Tap the ⭐ on translation cards to save phrases here!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {vault.map((v, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <p className="font-black text-xl text-violet-600 mb-1">{v.hinglish}</p>
                    <p className="text-sm font-bold text-slate-500">{v.english}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Phone Wrapper */}
      <div className="w-full max-w-[420px] h-[95vh] md:h-[850px] bg-slate-50 rounded-[2.5rem] flex flex-col overflow-hidden border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        
        {/* Header HUD */}
        <div className="bg-white p-4 border-b-4 border-slate-900 z-10 sticky top-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kahaani<span className="text-emerald-500">.</span></h1>
            </div>
            <div className="flex gap-2">
              <div className="bg-yellow-300 border-2 border-slate-900 px-3 py-1 rounded-full text-slate-900 font-black text-sm shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                {xp} XP
              </div>
              <button onClick={() => setIsVaultOpen(true)} className="bg-violet-300 border-2 border-slate-900 px-3 py-1 rounded-full font-black text-sm text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all">
                ⭐ {vault.length}
              </button>
            </div>
          </div>
          
          {/* Persona Selector */}
          <div className="flex gap-3 overflow-x-auto pb-2 w-full no-scrollbar">
            {Object.keys(scenarios).map(scen => (
              <button 
                key={scen}
                onClick={() => changeScenario(scen)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-black border-2 border-slate-900 transition-all ${scenario === scen ? 'bg-slate-900 text-white shadow-[4px_4px_0px_0px_#8b5cf6] translate-y-[-2px]' : 'bg-white text-slate-600 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none'}`}
              >
                {scenarios[scen].title}
              </button>
            ))}
          </div>

          {/* Mission Card */}
          <div className="mt-4 bg-emerald-300 border-4 border-slate-900 rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative">
            <div className="absolute -top-3 -right-3 bg-white border-2 border-slate-900 rounded-full w-8 h-8 flex items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">🎯</div>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Current Mission</p>
            <p className="text-sm font-black text-slate-900 leading-snug mb-3">{scenarios[scenario].mission}</p>
            
            <div className="border-t-2 border-slate-900/20 pt-3">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">Use Words For Max XP:</p>
              <div className="flex flex-wrap gap-2">
                {scenarios[scenario].vocab.map((v, i) => (
                  <div key={i} className="bg-white px-2 py-1.5 rounded-lg text-xs border-2 border-slate-900 flex items-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] font-bold">
                    <span className="text-emerald-600">{v.hinglish}</span>
                    <span className="text-slate-400 ml-1">({v.english})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Status Notification */}
        {statusMessage && (
          <div className="absolute top-[320px] left-1/2 -translate-x-1/2 bg-yellow-300 border-4 border-slate-900 text-slate-900 font-black px-6 py-3 rounded-full text-md shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] animate-bounce z-50">
            {statusMessage}
          </div>
        )}

        {/* Chat Stream */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-6 no-scrollbar pb-10">
          {messages.map((msg, idx) => (
            <div key={idx} className={`max-w-[85%] relative ${msg.sender === 'You' ? 'self-end' : 'self-start'}`}>
              
              {/* Main Bubble */}
              <div className={`p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] ${msg.sender === 'You' ? 'bg-violet-500 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'}`}>
                <p className="text-[10px] opacity-60 mb-1 font-black uppercase tracking-widest">{msg.sender === 'AI' ? scenarios[scenario].title.split(' ')[0] : 'YOU'}</p>
                <p className="leading-relaxed font-bold text-[15px]">{msg.sender === 'AI' ? getDisplayText(msg.text) : msg.text}</p>
                
                {/* AI Audio Button */}
                {msg.sender === 'AI' && !msg.text.includes('Google API Error') && (
                  <button onClick={() => speakText(msg.text)} className="absolute -left-3 -bottom-3 w-10 h-10 rounded-full bg-yellow-300 border-2 border-slate-900 text-slate-900 hover:bg-yellow-400 transition-colors shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center font-black">🔊</button>
                )}
              </div>

              {/* Secret Learning Card */}
              {msg.hinglishHelp && (
                <div className="mt-2 bg-slate-900 p-4 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(139,92,246,1)] w-[110%] relative right-[10%]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-violet-400 uppercase tracking-widest text-[10px]">Actual Translation</span>
                    <button onClick={() => addToVault(msg.hinglishHelp!.hinglish, msg.text)} className="text-xl bg-white border-2 border-slate-900 rounded-full w-8 h-8 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(139,92,246,1)] active:translate-y-1 active:shadow-none transition-all" title="Save to Vault">⭐</button>
                  </div>
                  <span className="font-black text-white text-lg block mb-4 leading-tight">{msg.hinglishHelp.hinglish}</span>
                  
                  <div className="flex gap-2">
                    <button onClick={() => speakText(msg.hinglishHelp!.devanagari)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-black text-xs border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
                      🔊 LISTEN
                    </button>
                    <button onClick={() => practicePronunciation(msg.hinglishHelp!.hinglish)} className="flex-1 py-2 bg-violet-500 hover:bg-violet-400 rounded-lg text-white font-black text-xs border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
                      🎤 TEST
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="bg-white border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] self-start p-4 rounded-2xl rounded-tl-none">
              <div className="flex gap-1 items-center">
                <span className="w-3 h-3 bg-violet-500 rounded-full animate-bounce"></span>
                <span className="w-3 h-3 bg-violet-500 rounded-full animate-bounce delay-75"></span>
                <span className="w-3 h-3 bg-violet-500 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Lower Command Deck */}
        <div className="bg-white border-t-4 border-slate-900 flex flex-col z-10 relative p-4 gap-4 shadow-[0px_-4px_0px_0px_rgba(15,23,42,0.05)]">
          
          {/* Blueprint Header */}
          <div className="bg-sky-200 border-4 border-slate-900 rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex gap-3 items-start">
             <span className="text-2xl bg-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] shrink-0 mt-1">💡</span>
             <div className="flex-1">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-0.5">Blueprint</p>
                <p className="text-xs font-bold text-slate-800 leading-tight mb-1">{scenarios[scenario].grammarTemplate}</p>
                <p className="text-[10px] font-bold text-slate-600 leading-tight italic border-t border-slate-900/10 pt-1">Meaning: {scenarios[scenario].grammarEnglish}</p>
             </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Legend & Toggles */}
            <div className="flex justify-between items-center px-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                 <span className="text-emerald-500">+10 XP</span> Text <span className="text-violet-500 ml-2">+20 XP</span> Voice
               </span>
               <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-black cursor-pointer">
                  <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="accent-violet-500 w-4 h-4 cursor-pointer" />
                  Auto-Audio
                </label>
            </div>
            
            {/* Input Row */}
            <div className="flex gap-2">
              {recognitionRef.current && (
                <button 
                  onClick={toggleListen} 
                  className={`p-4 rounded-xl font-black border-4 border-slate-900 shrink-0 transition-all ${isListening ? 'bg-rose-400 text-slate-900 shadow-none translate-y-1 animate-pulse' : 'bg-white text-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none'}`} 
                >
                  {isListening ? '🛑' : '🎤'}
                </button>
              )}
              <input 
                type="text" 
                value={inputText}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
                placeholder={isListening ? "Listening for bonus XP..." : "Type here..."}
                className="flex-1 px-4 py-3 rounded-xl border-4 border-slate-900 focus:outline-none focus:bg-violet-50 font-bold text-slate-900 transition-colors"
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !isLoading && handleSend()}
                disabled={isLoading || isListening}
              />
              <button 
                onClick={handleSend} 
                disabled={isLoading} 
                className="bg-violet-500 hover:bg-violet-400 text-white px-5 py-3 rounded-xl font-black border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
              >
                SEND
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
