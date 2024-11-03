export type ChatRequest = {
    message: string;
    model: 'claude' | 'chatgpt';
};

export type ChatResponse = {
    response: string;
};

export type ChatError = {
    error: string;
}; 