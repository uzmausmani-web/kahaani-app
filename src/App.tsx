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

  const scenarios: Record<string, { title: string, mission: string, vocab: VocabWord[], grammarTemplate: string, greetings: string[], prompt: string }> = {
    Grandparents: {
      title: 'Dada/Dadi 👵🏽👴🏽',
      mission: 'Tell them about your robotics team and how hard you are working on a project.',
      vocab: [
        { hinglish: 'Mehnat', english: 'Hard work', devanagari: 'मेहनत' },
        { hinglish: 'Banana', english: 'To build/make', devanagari: 'बनाना' },
        { hinglish: 'Koshish', english: 'Attempt/Effort', devanagari: 'कोशिश' }
      ],
      grammarTemplate: '"Main ek robot [ build ] ki [ attempt ] kar rahi hoon, ismein bahut [ hard work ] lag rahi hai."',
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
      setStatusMessage('Saved to Vault! +15 XP');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const practicePronunciation = (targetHinglish: string) => {
    setStatusMessage(`Listening... say "${targetHinglish}"`);
    
    practiceRecRef.current.onresult = (event: any) => {
      const spoken = event.results[0][0].transcript.toLowerCase();
      if (spoken.length > 2) {
        setStatusMessage(`Nailed it! +30 XP`);
        setXp(prev => prev + 30);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage(`Try again!`);
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
      setStatusMessage(`Vocab Bonus! +${bonusXp} XP 🔥`);
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
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=" + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: structuredPrompt }] }]
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "API Key restricted.");
      
      const rawText = data.candidates[0].content.parts[0].text;
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

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

  if (!isKeySet) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100 max-w-md w-full">
          <h1 className="text-3xl font-bold text-orange-800 mb-2">Kahaani 🎯</h1>
          <p className="text-gray-600 mb-6 text-sm font-medium">Connect the API to start the language engine.</p>
          <input 
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste Gemini API Key here..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500 mb-4"
          />
          <button onClick={saveKey} className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">Start Coaching</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 font-sans p-2 md:p-8 relative">
      {isVaultOpen && (
        <div className="absolute inset-0 z-50 bg-black/40 flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-orange-800">Your Vault ⭐</h2>
              <button onClick={() => setIsVaultOpen(false)} className="text-gray-500 hover:text-black font-bold">Close X</button>
            </div>
            {vault.length === 0 ? (
              <p className="text-gray-500 text-sm">Tap the ⭐ on any translation card to save phrases here.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {vault.map((v, i) => (
                  <div key={i} className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="font-bold text-orange-800">{v.hinglish}</p>
                    <p className="text-xs text-gray-600">{v.english}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto flex flex-col h-[95vh] bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
        
        <div className="bg-white p-4 border-b border-orange-100 z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-orange-800">Kahaani 💬</h1>
              <div className="bg-orange-100 px-3 py-1 rounded-full text-orange-800 font-black text-sm">
                XP: {xp}
              </div>
            </div>
            <button onClick={() => setIsVaultOpen(true)} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-bold text-sm hover:bg-yellow-200 transition-colors">
              Vault ⭐ ({vault.length})
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
              {Object.keys(scenarios).map(scen => (
                <button 
                  key={scen}
                  onClick={() => changeScenario(scen)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${scenario === scen ? 'bg-orange-500 text-white shadow-md' : 'bg-orange-50 text-orange-800 hover:bg-orange-100'}`}
                >
                  {scenarios[scen].title}
                </button>
              ))}
            </div>
            
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-500 font-black cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <input 
                type="checkbox" 
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="accent-orange-600 w-4 h-4 cursor-pointer"
              />
              Auto-Speak
            </label>
          </div>

          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xl">🎯</span>
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Active Mission</p>
                <p className="text-sm font-bold text-blue-900">{scenarios[scenario].mission}</p>
              </div>
            </div>
            
            <div className="border-t border-blue-200/50 pt-2">
              <p className="text-[10px] font-bold text-blue-500 uppercase mb-1 tracking-wider">Target Vocabulary (+50 XP Each)</p>
              <div className="flex flex-wrap gap-2">
                {scenarios[scenario].vocab.map((v, i) => (
                  <div key={i} className="bg-white px-2 py-1 rounded-md text-xs border border-blue-100 flex items-center shadow-sm">
                    <span className="font-bold text-blue-800">{v.hinglish}</span>
                    <span className="text-gray-500 ml-1">({v.english})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 p-4 overflow-y-auto flex flex-col gap-5 relative">
          {messages.map((msg, idx) => (
            <div key={idx} className={`max-w-[90%] p-4 rounded-2xl ${msg.sender === 'You' ? 'bg-orange-500 text-white self-end rounded-tr-none' : 'bg-white shadow-sm border border-gray-200 text-gray-800 self-start rounded-tl-none relative group'}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="w-full">
                  <p className="text-[10px] opacity-75 mb-1 font-black uppercase tracking-widest">{msg.sender === 'AI' ? scenarios[scenario].title.split(' ')[0] : 'You'}</p>
                  <p className="leading-relaxed font-medium text-[15px]">{msg.sender === 'AI' ? getDisplayText(msg.text) : msg.text}</p>
                  
                  {msg.hinglishHelp && (
                    <div className="mt-3 pt-3 border-t border-orange-400/30">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-orange-100 uppercase tracking-widest text-[10px]">How to say it</span>
                        <button onClick={() => addToVault(msg.hinglishHelp!.hinglish, msg.text)} className="text-lg hover:scale-110 transition-transform" title="Save to Vault">⭐</button>
                      </div>
                      <span className="font-bold text-white text-md block mb-3">{msg.hinglishHelp.hinglish}</span>
                      
                      <div className="flex gap-2">
                        <button onClick={() => speakText(msg.hinglishHelp!.devanagari)} className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors">
                          🔊 Listen
                        </button>
                        <button onClick={() => practicePronunciation(msg.hinglishHelp!.hinglish)} className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 shadow-inner rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors">
                          🎤 Practice
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {msg.sender === 'AI' && !msg.text.includes('Google API Error') && (
                  <button onClick={() => speakText(msg.text)} className="p-2 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors shrink-0">🔊</button>
                )}
              </div>
            </div>
          ))}
          
          {statusMessage && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-100 border border-green-300 text-green-800 font-bold px-4 py-2 rounded-full text-sm shadow-lg animate-bounce z-20">
              {statusMessage}
            </div>
          )}
          {isLoading && (
            <div className="bg-white shadow-sm border border-gray-200 text-gray-800 self-start max-w-[85%] p-4 rounded-2xl rounded-tl-none">
              <p className="text-sm font-bold text-gray-400 animate-pulse">Typing...</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="bg-white border-t border-orange-100 flex flex-col">
          
          <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex gap-3 items-center">
             <span className="text-xl">💡</span>
             <div>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">Sentence Blueprint</p>
                <p className="text-sm font-medium text-orange-900 italic">{scenarios[scenario].grammarTemplate}</p>
             </div>
          </div>

          <div className="p-4 flex flex-col gap-2">
            <div className="flex justify-between px-2">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type English (+2 XP) or Hinglish (+10 XP)</span>
               <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">🎙️ Speak Hinglish (+20 XP)</span>
            </div>
            <div className="flex gap-2">
              {recognitionRef.current && (
                <button onClick={toggleListen} className={`p-4 rounded-xl font-bold transition-all shrink-0 ${isListening ? 'bg-red-500 text-white shadow-lg scale-105 animate-pulse' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`} title="Speak for Max XP!">
                  {isListening ? '🛑' : '🎤'}
                </button>
              )}
              <input 
                type="text" 
                value={inputText}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
                placeholder={isListening ? "Listening for bonus XP..." : "Fill in the blueprint..."}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-orange-500 font-medium transition-colors"
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !isLoading && handleSend()}
                disabled={isLoading || isListening}
              />
              <button onClick={handleSend} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-6 py-3 rounded-xl font-black transition-colors shadow-md">
                Send
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
