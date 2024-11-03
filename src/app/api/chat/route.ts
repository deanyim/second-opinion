import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize API clients
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { message, chatbot } = await request.json() as {
            message: string;
            chatbot: 'claude' | 'chatgpt';
        };

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        let response;

        if (chatbot === 'claude') {
            try {
                const messages = [
                    { role: 'user' as const, content: message }
                ];

                const completion = await anthropic.messages.create({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1024,
                    messages: messages,
                });
                response = completion.content[0] && 'text' in completion.content[0]
                    ? completion.content[0].text
                    : 'No response generated';
            } catch (error: unknown) {
                if (error instanceof Anthropic.APIError) {
                    console.error('Claude API error:', error);
                    return NextResponse.json(
                        { error: error.message },
                        { status: error.status ?? 500 }
                    );
                }
            }
        } else if (chatbot === 'chatgpt') {
            try {
                const messages = [
                    { role: 'system' as const, content: 'Please format your responses using markdown.' },
                    { role: 'user' as const, content: message }
                ];

                const completion = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                });
                response = completion.choices[0]?.message?.content ?? 'No response generated';
            } catch (error: unknown) {
                if (error instanceof OpenAI.APIError) {
                    console.error('ChatGPT API error:', error);
                    return NextResponse.json(
                        { error: error.message },
                        { status: error.status }
                    );
                }
            }
        } else {
            return NextResponse.json(
                { error: 'Invalid chatbot specified' },
                { status: 400 }
            );
        }

        return NextResponse.json({ response });
    } catch (error) {
        console.error('General request error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 