import ReactMarkdown from 'react-markdown';
import type { Message } from '~/types';

export function MessageBubble({ message }: { message: Message }) {
    return (
        <div
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start w-full'
                }`}
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
    );
} 