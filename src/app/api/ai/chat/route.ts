/**
 * AI Chat API Route
 * משתמש ב-Groq (Llama 3.3) לתשובות פיננסיות חכמות וחינוכיות
 */

import { NextResponse } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTopic, getDefaultTopic } from '@/lib/ai/topics';

interface ChatRequest {
  message: string;
  context?: {
    topicId?: string;
    description: string;
    data?: Record<string, unknown>;
  };
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const BASE_SYSTEM_PROMPT = `אתה יועץ פיננסי חינוכי בשם "עוזר פיננסי".
המטרה שלך היא להסביר מושגים פיננסיים בצורה פשוטה, ברורה וידידותית.

כללים חשובים:
1. ענה תמיד בעברית תקנית וברורה
2. השתמש בשפה פשוטה - הימנע ממונחים מסובכים
3. תן דוגמאות מספריות כשאפשר
4. השתמש בסימוני פורמט: כותרות, רשימות, הדגשות
5. היה תמציתי אבל מקיף
6. אם יש נתונים זמינים (JSON), השתמש בהם לחישובים מדויקים
7. כשמחשב הלוואות, השתמש בנוסחת שפיצר: PMT = P × [r(1+r)^n] / [(1+r)^n - 1]
8. הצג מספרים בפורמט קריא עם פסיקים
9. אל תציע ייעוץ השקעות ספציפי - רק מידע חינוכי כללי

אתה כאן כדי ללמד ולהסביר - לא לתת המלצות אישיות.`;

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { message, context, history } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'הודעה ריקה' }, { status: 400 });
    }

    // Get topic-specific educational context
    const topic = context?.topicId ? getTopic(context.topicId) : null;
    const educationalContext = topic?.educationalContext || getDefaultTopic().educationalContext;

    // Build context string
    let contextString = `\n\n--- הקשר חינוכי ---\n${educationalContext}`;
    
    if (context?.description) {
      contextString += `\n\n--- מיקום במסך ---\n${context.description}`;
    }
    
    if (context?.data && Object.keys(context.data).length > 0) {
      contextString += `\n\n--- נתונים זמינים (JSON) ---\n${JSON.stringify(context.data, null, 2)}`;
    }

    // Build conversation history for Vercel AI SDK format
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    // Add history if exists
    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Generate response using Groq with Llama 3.3
    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: BASE_SYSTEM_PROMPT + contextString,
      messages,
    });

    return NextResponse.json({ response: result.text });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    
    // Check for rate limit error
    if (error?.message?.includes('429') || error?.message?.includes('rate')) {
      return NextResponse.json(
        { error: 'חרגת ממגבלת הבקשות היומית. נסה שוב מחר או המתן מספר דקות.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'שגיאה בעיבוד הבקשה' },
      { status: 500 }
    );
  }
}
