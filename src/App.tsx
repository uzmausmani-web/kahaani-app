import { useState, ChangeEvent, KeyboardEvent } from 'react';

interface Message {
  sender: string;
  text: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'Dada/Dadi', text: 'Beta, aaj ka din kaisa tha? (How was your day today?)' }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('School');
  const [lookupWord, setLookupWord] = useState('');

  const topics = ['School', 'Food', 'Health', 'Hobbies'];

  // Topic-specific cheat sheet with conversational translations
  const quickTranslations: Record<string, {en: string, hi: string}[]> = {
    School: [
      { en: "My day was good.", hi: "Mera din achha tha." },
      { en: "College is going well.", hi: "College achha chal raha hai." },
      { en: "I have a lot of homework.", hi: "Mujhe bahut homework mila hai." }
    ],
    Food: [
      { en: "I am hungry.", hi: "Mujhe bhookh lagi hai." },
      { en: "I ate dinner already.", hi: "Maine khana kha liya hai." },
      { en: "The food was delicious.", hi: "Khana bahut mazedar tha." }
    ],
    Health: [
      { en: "I am a little tired.", hi: "Main thodi thak gayi hoon." },
      { en: "I feel great today.", hi: "Main aaj bahut achha feel kar rahi hoon." },
      { en: "I didn't sleep well.", hi: "Main theek se so nahi payi." }
    ],
    Hobbies: [
      { en: "I am hanging out with friends.", hi: "Main doston ke saath hoon." },
      { en: "I was working on robotics.", hi: "Main robotics par kaam kar rahi thi." },
      { en: "I am listening to music.", hi: "Main gaane sun rahi hoon." }
    ]
  };

  // Mini live dictionary for common words
  const liveDictionary: Record<string, string> = {
    "i": "main", "you": "aap", "good": "achha", "bad": "kharab",
    "food": "khana", "eat": "khana", "ate": "khaya", "water": "paani",
    "tired": "thak gayi", "happy": "khush", "sad": "udaas", "friend": "dost",
    "friends": "dost", "yes": "haan", "no": "nahi", "today": "aaj", 
    "tomorrow": "kal", "yesterday": "kal", "sleep": "sona", "school": "school"
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;
    
    const newMessages: Message[] = [
      ...messages,
      { sender: 'You', text: inputText },
      { sender: 'Dada/Dadi', text: 'Arre wah! Yeh sun kar achha laga. (Oh wow! Good to hear that.)' }
    ];
    setMessages(newMessages);
    setInputText('');
  };

  const handleLookup = (e: ChangeEvent<HTMLInputElement>) => {
    setLookupWord(e.target.value.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-orange-50 font-sans p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Chat Area */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
            <h1 className="text-2xl font-bold text-orange-800 mb-2">Kahaani 💬</h1>
            <p className="text-gray-600 mb-4">Select a topic and practice talking with your grandparents!</p>
            
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {topics.map(topic => (
                <button 
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedTopic === topic ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'}`}
                >
                  {topic}
                </button>
              ))}
            </div>

            <div className="bg-gray-50 h-80 rounded-xl p-4 overflow-y-auto flex flex-col gap-3 border border-gray-200">
              {messages.map((msg, idx) => (
                <div key={idx} className={`max-w-[80%] p-3 rounded-xl ${msg.sender === 'You' ? 'bg-orange-500 text-white self-end rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 self-start rounded-tl-none'}`}>
                  <p className="text-xs opacity-75 mb-1 font-bold">{msg.sender}</p>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input 
                type="text" 
                value={inputText}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
                placeholder="Type your reply in Hinglish..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500"
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Translation Helper */}
        <div className="flex flex-col gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex-1">
            <h2 className="text-lg font-bold text-orange-800 mb-2">Cheat Sheet 📝</h2>
            <p className="text-xs text-gray-500 mb-4">Click an English phrase to use it in the chat.</p>
            
            <div className="flex flex-col gap-3 mb-6">
              {quickTranslations[selectedTopic].map((item, i) => (
                <button 
                  key={i}
                  onClick={() => setInputText(item.hi)}
                  className="text-left bg-orange-50 hover:bg-orange-100 p-3 rounded-lg border border-orange-100 transition-colors"
                >
                  <p className="text-xs text-gray-500 font-medium mb-1">"{item.en}"</p>
                  <p className="text-sm text-orange-900 font-bold">{item.hi}</p>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h2 className="text-sm font-bold text-orange-800 mb-2">Word Translator 🔍</h2>
              <input 
                type="text"
                onChange={handleLookup}
                placeholder="Type an English word..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-orange-500 mb-2"
              />
              <div className="h-10 bg-gray-50 rounded-lg flex items-center px-3 border border-gray-200">
                <span className="text-sm text-gray-700 font-medium">
                  {lookupWord === '' ? 'Translation will appear here' : (liveDictionary[lookupWord] || 'Word not in demo dictionary yet!')}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
