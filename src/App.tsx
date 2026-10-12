import { useState, ChangeEvent, KeyboardEvent } from 'react';

// This tells TypeScript exactly what a "message" should look like
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

  const topics = ['School', 'Food', 'Health', 'Hobbies'];

  const sentenceStarter = {
    Subject: ['Main (I)', 'Aap (You - respectful)'],
    Object: ['khana (food)', 'school', 'dost (friends)'],
    Verb: ['kha raha hoon (eating)', 'gaya tha (went)', 'mile (met)']
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;
    
    const newMessages: Message[] = [
      ...messages,
      { sender: 'You', text: inputText },
      { sender: 'Dada/Dadi', text: 'Arre wah! Achha laga sun kar. (Oh wow! Good to hear that.)' }
    ];
    setMessages(newMessages);
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-orange-50 font-sans p-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
            <h1 className="text-2xl font-bold text-orange-800 mb-2">Kahaani 💬</h1>
            <p className="text-gray-600 mb-4">Practice talking with your grandparents in full sentences.</p>
            
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
          <h2 className="text-lg font-bold text-orange-800 mb-4">Sentence Builder 🛠️</h2>
          <p className="text-sm text-gray-600 mb-6">Hindi/Urdu sentence structure is usually <strong>Subject + Object + Verb</strong>.</p>
          
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">1. Subject (Who)</h3>
              <div className="flex flex-wrap gap-2">
                {sentenceStarter.Subject.map(word => <span key={word} className="bg-white text-blue-900 text-sm px-2 py-1 rounded shadow-sm">{word}</span>)}
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">2. Object (What/Where)</h3>
              <div className="flex flex-wrap gap-2">
                {sentenceStarter.Object.map(word => <span key={word} className="bg-white text-green-900 text-sm px-2 py-1 rounded shadow-sm">{word}</span>)}
              </div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2">3. Verb (Action)</h3>
              <div className="flex flex-wrap gap-2">
                {sentenceStarter.Verb.map(word => <span key={word} className="bg-white text-purple-900 text-sm px-2 py-1 rounded shadow-sm">{word}</span>)}
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-orange-100 rounded-lg text-sm text-orange-900 italic">
            <strong>Example:</strong> "Main (1) khana (2) kha raha hoon (3)." = I am eating food.
          </div>
        </div>

      </div>
    </div>
  );
}
