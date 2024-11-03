import ReactMarkdown from 'react-markdown';

function ChatMessage({ message }) {
    return (
        <div className="message">
            <ReactMarkdown>
                {message.content}
            </ReactMarkdown>
        </div>
    );
} 