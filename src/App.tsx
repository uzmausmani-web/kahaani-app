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

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  const [scenario, setScenario] = useState('Grandparents');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scenarios: Record<string, { title: string, greetings: string[], prompt: string }> = {
    Grandparents: {
      title: 'Dada/Dadi 👵🏽👴🏽',
      greetings: [
        'बेटा, आज का दिन कैसा था? | Beta, aaj ka din kaisa tha? | (How was your day today?)',
        'खाना खा लिया तुमने? | Khaana khaa liya tumne? | (Did you eat your food?)',
        'क्या कर रहे हो, बेटा? | Kya kar rahe ho, beta? | (What are you doing, child?)',
        'सुना है तुम रोबोटिक्स में बहुत अच्छा कर रही हो! | Suna hai tum robotics mein bahut achcha kar rahi ho! | (I heard you are doing very well in robotics!)',
        'आज स्कूल में क्या हुआ? | Aaj school mein kya hua? | (What happened in school today?)'
      ],
      prompt: 'You are a loving Indian grandparent talking to your American teen grandchild. Keep replies to 1-2 friendly, warm sentences. Focus on affection (using terms like Beta). Do NOT use religious greetings.'
    },
    Cousin: {
      title: 'Cousin in Delhi 📱',
      greetings: [
        'और बता, क्या चल रहा है आज कल? | Aur bata, kya chal raha hai aaj kal? | (Tell me, what is up these days?)',
        'सलाम यार, क्या सीन है आज का? | Salaam yaar, kya scene hai aaj ka? | (Peace buddy, what\'s the plan for today?)',
        'बिजी है क्या? | Busy hai kya? | (Are you busy?)',
        'कोई नई फनी रील देखी? | Koi nayi funny reel dekhi? | (Did you see any new funny reel?)',
        'और यार, सब ठीक? | Aur yaar, sab theek? | (And buddy, everything good?)'
      ],
      prompt: 'You are a cool, 20-something cousin living in Delhi chatting on WhatsApp with your American cousin. Keep it casual and conversational, 1-2 sentences.'
    },
    Shopkeeper: {
      title: 'Street Vendor 🛒',
      greetings: [
        'आइए आइए! बोलिए क्या चाहिए आपको? | Aaiye aaiye! Boliye kya chahiye aapko? | (Come in! Tell me, what do you need?)',
        'अस्सलाम वालेकुम जी, बताइए। | Assalamualaikum ji, bataiye. | (Peace be upon you, tell me.)',
        'आदाब! आज क्या दिखाऊँ आपको? | Adaab! Aaj kya dikhaun aapko? | (Greetings! What should I show you today?)',
        'नमस्कार जी, बोलिए। | Namaskar ji, boliye. | (Hello, tell me.)'
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
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };

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

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error: ", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveKey = () => {
    if (apiKey.trim().length > 10) {
      localStorage.setItem('gemini_key', apiKey);
      setIsKeySet(true);
      setMessages([{ sender: 'AI', text: getRandomGreeting(scenario) }]);
    }
  };

  const clearKey = () => {
    localStorage.removeItem('gemini_key');
    setApiKey('');
    setIsKeySet(false);
    setMessages([]);
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

  const generateAIResponse = async (userText: string) => {
    setIsLoading(true);
    const personaPrompt = scenarios[scenario].prompt;
    const currentScenarioName = scenarios[scenario].title;
    
    const structuredPrompt = `
You are the core language engine of "Kahaani", a coaching app helping an Indian-American teenager learn natural North Indian spoken Hinglish (a rich blend of Hindi and Urdu).
The user just sent this message: "${userText}"

Role for Reply: ${personaPrompt}
Current Scenario: ${currentScenarioName}

Task 1: USER TRANSLATION (CRITICAL INSTRUCTION)
Translate the user's input into natural, everyday spoken Hinglish. DO NOT translate literally.
Reflect a natural North Indian vocabulary that freely mixes Hindi and Urdu (e.g., using "Shukriya", "Badi meherbani" alongside traditional Hindi). 

CRITICAL TONE ADJUSTMENT: You MUST adjust pronouns and verb endings based on the Current Scenario:
- If talking to Grandparents: Use respectful "Aap" and formal verbs (e.g., "Aap kaise hain?", "Aur aap bataiye", "Kya main aa sakti hoon?"). NEVER use "Tu" or "Tum".
- If talking to Cousin: Use casual "Tum" or "Tu" and informal verbs (e.g., "Kaisa hai?", "Aur bata", "Kya scene hai?"). NEVER use "Aap".
- If talking to Street Vendor: Use polite "Bhaiya" / "Aap" (e.g., "Bhaiya, kitne ka hai?", "Aap mujhe yeh de dijiye").

Task 2: PERSONA REPLY
Respond in character to the user's message, maintaining the appropriate conversational tone.

Return ONLY valid JSON in this exact structure with no Markdown wrapping:
{
  "userHinglish": "Natural Hinglish version of user input (applying the correct Aap/Tum tone rules)",
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
          contents: [
            { role: 'user', parts: [{ text: structuredPrompt }] }
          ]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "API Key restricted or invalid.");
      }
      
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

      if (autoSpeak) {
        speakText(parsed.replyDevanagari);
      }
      
    } catch (error) {
      const e = error as Error;
      setMessages(prev => [...prev, { sender: 'AI', text: "Google API Error: " + e.message }]);
    }
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (inputText.trim() === '') return;
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    
    const userText = inputText;
    setMessages(prev => [...prev, { sender: 'You', text: userText }]);
    setInputText('');
    
    await generateAIResponse(userText);
  };

  if (!isKeySet) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100 max-w-md w-full">
          <h1 className="text-2xl font-bold text-orange-800 mb-4">Unlock the AI Brain 🧠</h1>
          <p className="text-gray-600 mb-6 text-sm">To make the conversations dynamic, you need a free Google Gemini API key. This acts as the engine for the app.</p>
          <input 
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste API Key here..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500 mb-4"
          />
          <button 
            onClick={saveKey}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Start App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto flex flex-col h-[90vh]">
        
        {/* Header & Scenarios */}
        <div className="bg-white p-6 rounded-t-2xl shadow-sm border border-orange-100 z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-orange-800">Kahaani 💬</h1>
            <button onClick={clearKey} className="text-xs font-bold text-gray-400 hover:text-orange-600 underline">
              Reset API Key
            </button>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
              {Object.keys(scenarios).map(scen => (
                <button 
                  key={scen}
                  onClick={() => changeScenario(scen)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${scenario === scen ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'}`}
                >
                  {scenarios[scen].title}
                </button>
              ))}
            </div>
            
            <label className="flex items-center gap-2 text-sm text-gray-700 font-bold cursor-pointer bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
              <input 
                type="checkbox" 
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="accent-orange-600 w-4 h-4 cursor-pointer"
              />
              Auto-Speak Reply
            </label>
          </div>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 bg-gray-50 p-6 overflow-y-auto border-x border-orange-100 flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`max-w-[85%] p-4 rounded-2xl ${msg.sender === 'You' ? 'bg-orange-500 text-white self-end rounded-tr-none' : 'bg-white shadow-sm border border-gray-200 text-gray-800 self-start rounded-tl-none relative group'}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="w-full">
                  <p className="text-xs opacity-75 mb-1 font-bold">{msg.sender === 'AI' ? scenarios[scenario].title.split(' ')[0] : 'You'}</p>
                  <p className="leading-relaxed">{msg.sender === 'AI' ? getDisplayText(msg.text) : msg.text}</p>
                  
                  {msg.hinglishHelp && (
                    <div className="mt-3 pt-2 border-t border-orange-400/50 flex items-center justify-between text-xs bg-orange-600/30 px-3 py-2 rounded-xl">
                      <div>
                        <span className="font-semibold block text-orange-100 uppercase tracking-wider text-[10px]">How to say it:</span>
                        <span className="font-medium text-white text-sm">{msg.hinglishHelp.hinglish}</span>
                      </div>
                      <button 
                        onClick={() => speakText(msg.hinglishHelp!.devanagari)}
                        className="ml-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0"
                        title="Hear how to say this"
                      >
                        🔊
                      </button>
                    </div>
                  )}
                </div>

                {msg.sender === 'AI' && !msg.text.includes('Google API Error') && (
                  <button 
                    onClick={() => speakText(msg.text)}
                    className="p-2 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors shrink-0"
                    title="Listen"
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="bg-white shadow-sm border border-gray-200 text-gray-800 self-start rounded-tl-none max-w-[85%] p-4 rounded-2xl">
              <p className="text-sm opacity-75 animate-pulse">Translating & replying...</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 rounded-b-2xl shadow-sm border border-orange-100 flex gap-2">
          {recognitionRef.current && (
            <button 
              onClick={toggleListen}
              className={`p-3 rounded-xl font-bold transition-colors shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}
              title="Voice Typing"
            >
              {isListening ? '🛑' : '🎤'}
            </button>
          )}
          <input 
            type="text" 
            value={inputText}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type in English or Hinglish..."}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500"
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !isLoading && handleSend()}
            disabled={isLoading || isListening}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}
