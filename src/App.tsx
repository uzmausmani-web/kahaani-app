import { useState, ChangeEvent, KeyboardEvent, useRef, useEffect } from 'react';

interface Message {
  sender: 'You' | 'AI';
  text: string;
}

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [scenario, setScenario] = useState('Grandparents');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scenarios: Record<string, { title: string, greeting: string, prompt: string }> = {
    Grandparents: {
      title: 'Dada/Dadi 👵🏽👴🏽',
      greeting: 'Beta, aaj ka din kaisa tha? (How was your day today?)',
      prompt: 'You are a loving Indian grandparent talking to your American teen grandchild. Speak in natural Hinglish (mix of Hindi/Urdu/English). Keep responses to 1-2 friendly sentences. Always include the English translation in parentheses at the end.'
    },
    Cousin: {
      title: 'Cousin in Delhi 📱',
      greeting: 'Aur bata, kya chal raha hai aaj kal? (Tell me, what is up these days?)',
      prompt: 'You are a cool, 20-something cousin living in Delhi chatting on WhatsApp with your American cousin. Use modern Hinglish slang. Keep it casual, 1-2 sentences. Always include the English translation in parentheses at the end.'
    },
    Shopkeeper: {
      title: 'Street Vendor 🛒',
      greeting: 'Aaiye aaiye! Boliye kya chahiye aapko? (Come in! Tell me, what do you need?)',
      prompt: 'You are a busy but polite street vendor or shopkeeper in North India. The user is a customer. Speak in everyday Hinglish. Keep it to 1-2 sentences. Always include the English translation in parentheses at the end.'
    }
  };

  // Load key from local storage so you don't have to re-enter it
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySet(true);
      setMessages([{ sender: 'AI', text: scenarios['Grandparents'].greeting }]);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveKey = () => {
    if (apiKey.trim().length > 10) {
      localStorage.setItem('gemini_key', apiKey);
      setIsKeySet(true);
      setMessages([{ sender: 'AI', text: scenarios[scenario].greeting }]);
    }
  };

  const changeScenario = (newScenario: string) => {
    setScenario(newScenario);
    setMessages([{ sender: 'AI', text: scenarios[newScenario].greeting }]);
  };

    const generateAIResponse = async (userText: string) => {
    setIsLoading(true);
    const systemPrompt = scenarios[scenario].prompt;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser says: ${userText}` }] }
          ]
        })
      });
      
      const data = await response.json();
      
      // This will catch the exact error Google sends back
      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP Error ${response.status}`);
      }
      
      const aiText = data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { sender: 'AI', text: aiText }]);
    } catch (error: any) {
      // This prints the actual error message to the chat screen
      setMessages(prev => [...prev, { sender: 'AI', text: `Google API Error: ${error.message}` }]);
    }
    setIsLoading(false);
  };


  const handleSend = async () => {
    if (inputText.trim() === '') return;
    
    const userText = inputText;
    setMessages(prev => [...prev, { sender: 'You', text: userText }]);
    setInputText('');
    
    await generateAIResponse(userText);
  };

  // Setup Screen if API Key is missing
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

  // Main Chat App
  return (
    <div className="min-h-screen bg-orange-50 font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto flex flex-col h-[90vh]">
        
        {/* Header & Scenarios */}
        <div className="bg-white p-6 rounded-t-2xl shadow-sm border border-orange-100 z-10">
          <h1 className="text-2xl font-bold text-orange-800 mb-4">Kahaani 💬</h1>
          <div className="flex gap-2 overflow-x-auto pb-2">
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
        </div>

        {/* Chat History Area */}
        <div className="flex-1 bg-gray-50 p-6 overflow-y-auto border-x border-orange-100 flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`max-w-[85%] p-4 rounded-2xl ${msg.sender === 'You' ? 'bg-orange-500 text-white self-end rounded-tr-none' : 'bg-white shadow-sm border border-gray-200 text-gray-800 self-start rounded-tl-none'}`}>
              <p className="text-xs opacity-75 mb-1 font-bold">{msg.sender === 'AI' ? scenarios[scenario].title.split(' ')[0] : 'You'}</p>
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          ))}
          {isLoading && (
            <div className="bg-white shadow-sm border border-gray-200 text-gray-800 self-start rounded-tl-none max-w-[85%] p-4 rounded-2xl">
              <p className="text-sm opacity-75 animate-pulse">Typing...</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 rounded-b-2xl shadow-sm border border-orange-100 flex gap-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
            placeholder="Type your reply (English or Hinglish)..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500"
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !isLoading && handleSend()}
            disabled={isLoading}
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
