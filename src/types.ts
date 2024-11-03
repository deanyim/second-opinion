import { AIModel } from './models';

export type Message = {
    id: string;
    text: string;
    role: 'user' | 'assistant';
    model: AIModel;
}; 