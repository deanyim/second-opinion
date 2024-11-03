// src/lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/env.mjs';

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export async function getClaudeResponse(prompt: string) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error('Failed to get response from Claude');
  }
}

// src/lib/ai/chatgpt.ts
import OpenAI from 'openai';
import { env } from '@/env.mjs';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function getChatGPTResponse(prompt: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('ChatGPT API Error:', error);
    throw new Error('Failed to get response from ChatGPT');
  }
}

// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    ANTHROPIC_API_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
});
