'use client';

import React, { useState, useRef, useEffect } from 'react';
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

    // Blur input to dismiss keyboard
    inputRef.current?.blur();

    // After message is sent, scroll to show the last message
    if (messagesContainerRef.current) {
      const lastMessage = messagesContainerRef.current.lastElementChild;
      lastMessage?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const visibleMessages = messages.filter(
    message => message.role === 'user' || message.chatbot === activeChatbot
  );

  return (
    <div className="fixed inset-0 flex justify-center bg-white/60 bg-[url('/bg-triple.png')] bg-repeat bg-[size:425px_371px]">
      <div className="w-full flex justify-center bg-white/80">
        <div className="w-full max-w-[720px] flex flex-col bg-white/80">
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
              <div className="p-4 space-y-4">
                {visibleMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}
                  >
                    <div
                      className={`${message.role === 'user'
                        ? 'bg-blue-500 text-white max-w-[80%]'
                        : 'bg-gray-100 text-black w-full'
                        } rounded-lg p-4`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-slate prose-pre:bg-slate-800 prose-pre:text-slate-50 max-w-none">
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
            )}
          </div>

          <div className="sticky bottom-0 w-full bg-white border-t">
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

            <form
              onSubmit={handleSubmit}
              className="p-4"
            >
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Type your message..."
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}