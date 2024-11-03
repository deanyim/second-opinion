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
        const { message, model } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        let response;

        if (model === 'claude') {
            const completion = await anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1024,
                messages: [{ role: 'user', content: message }],
            });

            response = completion.content[0]?.text ?? 'No response generated';
        } else if (model === 'chatgpt') {
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: message }],
            });

            response = completion.choices[0]?.message?.content ?? 'No response generated';
        } else {
            return NextResponse.json(
                { error: 'Invalid model specified' },
                { status: 400 }
            );
        }

        return NextResponse.json({ response });
    } catch (error) {
        console.error('Error processing chat request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 