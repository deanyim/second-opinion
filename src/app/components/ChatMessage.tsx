import ReactMarkdown from 'react-markdown';

interface Message {
    content: string;
}

export function ChatMessage({ message }: { message: Message }) {
    return (
        <div className="message">
            <ReactMarkdown>
                {message.content}
            </ReactMarkdown>
        </div>
    );
} 