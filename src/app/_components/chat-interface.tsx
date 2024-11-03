'use client';

import React, { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '~/types';

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

    try {
      // Make parallel requests to both AIs
      const [claudeResponse, chatgptResponse] = await Promise.all([
        fetchAIResponse({ message: input, chatbot: 'claude' }),
        fetchAIResponse({ message: input, chatbot: 'chatgpt' }),
      ]);

      if ('error' in claudeResponse || 'error' in chatgptResponse) {
        throw new Error('One or both AI responses contained an error');
      }

      // Add both AI responses
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
      scrollToBottom();
    }
  };

  const visibleMessages = messages.filter(
    message => message.role === 'user' || message.chatbot === activeChatbot
  );

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {visibleMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-black'
                  }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                ) : (
                  message.text
                )}
              </div>
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
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex-shrink-0 border-t bg-white">
        <div className="flex border-b">
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

        <div className="p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}