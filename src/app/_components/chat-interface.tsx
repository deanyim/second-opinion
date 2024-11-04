'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '~/types';
import { MessageBubble } from './message-bubble';

type ChatRequest = {
  message: string;
  chatbot: Chatbot;
};

type ChatAPIResponse = {
  response: string;
  error?: string;
};

type Chatbot = 'claude' | 'chatgpt';

export function ChatInterface(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [activeChatbot, setActiveChatbot] = useState<Chatbot>('claude');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard and scroll behavior
  useEffect(() => {
    const handleResize = () => {
      // Scroll to bottom when keyboard appears
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (chatbot: Chatbot): void => {
    setActiveChatbot(chatbot);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  };

  const createMessage = (
    text: string,
    role: 'user' | 'assistant',
    chatbot: Chatbot,
    idPrefix = ''
  ): Message => ({
    id: `${idPrefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    role,
    chatbot,
  });

  const scrollToBottom = (): void => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAIResponse = async (
    request: ChatRequest
  ): Promise<ChatAPIResponse> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text) as ChatAPIResponse;
      if (!response.ok) throw new Error(data.error ?? 'Failed to get response');
      return data;
    } catch (e) {
      console.error('Failed to parse response:', text, e);
      throw new Error('Invalid response from server');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage = createMessage(input, 'user', activeChatbot);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Calculate scroll position and scroll immediately
    setTimeout(() => {
      const panels = document.querySelectorAll('.message-panel');
      panels.forEach(panel => {
        const messages = Array.from(panel.querySelectorAll('.message-bubble'));
        const scrollOffset = messages.slice(0, -1).reduce((total, msg, index) => {
          const height = msg.getBoundingClientRect().height;
          const spacing = index > 0 ? 16 : 0; // 16px is the space-y-4 value
          return total + height + spacing;
        }, 0);
        console.log('scrollOffset', scrollOffset);

        panel.scrollTo({
          top: scrollOffset,
          behavior: 'smooth'
        });
      });
    }, 0);

    try {
      const [claudeResponse, chatgptResponse] = await Promise.all([
        fetchAIResponse({ message: input, chatbot: 'claude' }),
        fetchAIResponse({ message: input, chatbot: 'chatgpt' }),
      ]);

      if ('error' in claudeResponse || 'error' in chatgptResponse) {
        throw new Error('One or both AI responses contained an error');
      }

      // Add both AI responses without scrolling
      setMessages(prev => [
        ...prev,
        createMessage(claudeResponse.response, 'assistant', 'claude'),
        createMessage(chatgptResponse.response, 'assistant', 'chatgpt'),
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        createMessage(
          'Sorry, there was an error processing your request.',
          'assistant',
          activeChatbot,
          'error-'
        ),
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center">
      <div className="w-full max-w-[1440px] flex flex-col">
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overscroll-none"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <h1 className="text-4xl text-gray-600 text-center px-4">
                Hi there! How can we help you today?
              </h1>
              <p className="mt-4 text-gray-400 text-lg">
                Ask ChatGPT & Claude at the same time
              </p>
            </div>

          ) : (
            <div className="flex flex-col md:flex-row md:space-x-4 h-full">
              {/* Claude Panel */}
              <div className={`w-full md:w-1/2 md:border-r ${activeChatbot !== 'claude' ? 'hidden md:block' : ''
                }`}>
                <div className="md:sticky md:top-0 bg-white p-3 border-b">
                  <h2 className="font-semibold text-lg">Claude</h2>
                </div>
                <div className="p-4 space-y-4 md:h-[calc(100vh-180px)] md:overflow-y-auto message-panel">
                  {messages
                    .filter(m => m.role === 'user' || m.chatbot === 'claude')
                    .map((message) => (
                      <div
                        key={message.id}
                        className="message-bubble"
                        data-role={message.role}
                      >
                        <MessageBubble message={message} />
                      </div>
                    ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className={`h-[80vh] ${messages.length > 0 ? 'mt-4' : ''}`} />
                </div>
              </div>

              {/* ChatGPT Panel */}
              <div className={`w-full md:w-1/2 ${activeChatbot !== 'chatgpt' ? 'hidden md:block' : ''
                }`}>
                <div className="md:sticky md:top-0 bg-white p-3 border-b">
                  <h2 className="font-semibold text-lg">ChatGPT</h2>
                </div>
                <div className="p-4 space-y-4 md:h-[calc(100vh-180px)] md:overflow-y-auto message-panel">
                  {messages
                    .filter(m => m.role === 'user' || m.chatbot === 'chatgpt')
                    .map((message) => (
                      <div
                        key={message.id}
                        className="message-bubble"
                        data-role={message.role}
                      >
                        <MessageBubble message={message} />
                      </div>
                    ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className={`h-[80vh] ${messages.length > 0 ? 'mt-4' : ''}`} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input container - visible on all screens */}
        <div className="sticky bottom-0 w-full bg-white border-t">
          {/* Tabs - only visible on mobile */}
          <div className="flex border-b md:hidden">
            {(['claude', 'chatgpt'] as const).map((chatbot) => (
              <button
                key={chatbot}
                onClick={() => handleTabChange(chatbot)}
                className={`flex-1 p-4 ${activeChatbot === chatbot
                  ? 'bg-blue-50 text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:bg-gray-50'
                  }`}
              >
                {chatbot.charAt(0).toUpperCase() + chatbot.slice(1)}
              </button>
            ))}
          </div>

          {/* Input form - visible on all screens */}
          <form
            onSubmit={handleSubmit}
            className="p-4"
          >
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                className="flex-1 p-2 border rounded-lg"
                placeholder="Type your message..."
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}