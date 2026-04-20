import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User, Bot } from 'lucide-react';

interface ChatSupportProps {
  onClose: () => void;
  highContrast: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

function getAutomatedResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('schedule') || lower.includes('time'))
    return 'You can view bus schedules by selecting a specific route from the filter menu. Each bus shows real-time ETA to the next stop.';
  if (lower.includes('delay') || lower.includes('late'))
    return "I see you're experiencing a delay. Our system shows real-time bus locations. If you notice a significant delay, please report it using the incident reporting feature.";
  if (lower.includes('route'))
    return 'We currently operate multiple routes. You can filter by route to see specific buses and stops.';
  if (lower.includes('occupancy') || lower.includes('crowded'))
    return 'Bus occupancy levels are shown in real-time: Low (green), Medium (yellow), and High (red). This helps you plan which bus to take.';
  if (lower.includes('report') || lower.includes('issue') || lower.includes('problem'))
    return 'To report an issue, please provide details about the bus number, route, and the nature of the problem. Your feedback helps us improve service quality.';
  return 'Thank you for your message. A support representative will review your inquiry. In the meantime, you can check our live bus tracking map for real-time updates.';
}

export default function ChatSupport({ onClose, highContrast }: ChatSupportProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1', sender: 'bot',
    message: 'Hello! How can I help you today? You can ask about bus schedules, report issues, or get route information.',
    timestamp: new Date(),
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', message: inputMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const captured = inputMessage;
    setInputMessage('');
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), sender: 'bot',
        message: getAutomatedResponse(captured), timestamp: new Date(),
      }]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div className={`pointer-events-auto w-full max-w-md rounded-lg shadow-2xl ${highContrast ? 'bg-black border-2 border-white' : 'bg-white'} flex flex-col max-h-[600px]`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${highContrast ? 'border-white bg-gray-900' : 'border-gray-200 bg-blue-600'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${highContrast ? 'bg-white text-black' : 'bg-white/20'} flex items-center justify-center`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Support Chat</h3>
              <p className={`text-xs ${highContrast ? 'text-gray-400' : 'text-blue-100'}`}>Online now</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${highContrast ? 'hover:bg-gray-800' : 'hover:bg-white/20'} transition-colors`} aria-label="Close chat">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.sender === 'user'
                    ? highContrast ? 'bg-white text-black' : 'bg-blue-600 text-white'
                    : highContrast ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div>
                  <div className={`rounded-lg px-4 py-2 ${
                    msg.sender === 'user'
                      ? highContrast ? 'bg-white text-black' : 'bg-blue-600 text-white'
                      : highContrast ? 'bg-gray-800 text-white border border-gray-600' : 'bg-gray-100 text-gray-900'
                  }`}>{msg.message}</div>
                  <div className={`text-xs mt-1 text-gray-500 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className={`px-4 py-2 border-t ${highContrast ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-2 flex-wrap">
            {['Route Schedules', 'Report Delay', 'Occupancy Info'].map(label => (
              <button
                key={label}
                onClick={() => setInputMessage(label === 'Route Schedules' ? 'What are the route schedules?' : label === 'Report Delay' ? 'Report a delay' : 'Check bus occupancy')}
                className={`px-3 py-1 rounded-full text-xs ${highContrast ? 'bg-gray-800 border border-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${highContrast ? 'border-white' : 'border-gray-200'}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className={`flex-1 px-4 py-2 rounded-lg border ${
                highContrast ? 'bg-gray-900 border-white text-white placeholder-gray-500' : 'border-gray-300 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button onClick={handleSendMessage} className={`px-4 py-2 rounded-lg ${highContrast ? 'bg-white text-black' : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors`} aria-label="Send message">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
