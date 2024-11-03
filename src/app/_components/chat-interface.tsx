import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const SAMPLE_RESPONSE = `Thank you for your message! Let me provide a detailed response that demonstrates text formatting and length:

## Key Points
1. This is a *formatted* response with markdown
2. It includes **multiple** paragraphs
3. And some code examples

Here's a simple code snippet:
\`\`\`python
def greet(name):
    return f"Hello, {name}!"
\`\`\`

### Additional Information
- The response streams in gradually
- It contains various formatting elements
- And it's long enough to demonstrate scrolling

This helps simulate the actual response you'd get from Claude or ChatGPT, showing how the interface handles longer, formatted content while maintaining a smooth user experience.`;

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('claude');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);
  const bottomRef = useRef(null);

  // Simulate message streaming
  const streamResponse = async (response) => {
    setIsTyping(true);
    // Add AI response after a short delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setMessages(prev => [...prev, { text: response, role: 'assistant' }]);
    setIsTyping(false);
  };

  const scrollToMessage = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll when new messages are added
  useEffect(() => {
    scrollToMessage();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Blur input to dismiss mobile keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const newMessage = { text: inputValue, role: 'user' };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Simulate AI response
    await streamResponse(SAMPLE_RESPONSE);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto bg-white">
      {/* Main chat area with scrolling */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <h1 className="text-2xl text-gray-600 text-center font-light">
              Hello there! How can we help you today?
            </h1>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      {message.text}
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Fixed bottom section */}
      <div className="border-t">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('claude')}
            className={`flex-1 p-4 flex items-center justify-center space-x-2 font-['Söhne'] ${
              activeTab === 'claude'
                ? 'bg-blue-50 text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <img 
              src="/api/placeholder/24/24"
              alt="Claude"
              className="w-6 h-6"
            />
            <span>Claude</span>
          </button>
          <button
            onClick={() => setActiveTab('chatgpt')}
            className={`flex-1 p-4 flex items-center justify-center space-x-2 font-['Söhne'] ${
              activeTab === 'chatgpt'
                ? 'bg-blue-50 text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <img 
              src="/api/placeholder/24/24"
              alt="ChatGPT"
              className="w-6 h-6"
            />
            <span>ChatGPT</span>
          </button>
        </div>

        {/* Input area */}
        <div className="p-4 bg-white">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
