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
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  const [scenario, setScenario] = useState('Grandparents');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const recognitionRef = useRef<any>(null);

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

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySet(true);
      setMessages([{ sender: 'AI', text: scenarios['Grandparents'].greeting }]);
    }
    
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
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
      setMessages([{ sender: 'AI', text: scenarios[scenario].greeting }]);
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
    setMessages([{ sender: 'AI', text: scenarios[newScenario].greeting }]);
  };

  const speakText = (text: string) => {
    const hindiPart = text.replace(/\(.*\)/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(hindiPart);
    utterance.lang = 'hi-IN'; 
    utterance.rate = 0.9; 
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
    const systemPrompt = scenarios[scenario].prompt;
    
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + "\n\nUser says: " + userText }] }
          ]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "API Key restricted or
