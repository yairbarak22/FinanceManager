import OpenAI, { toFile } from 'openai';
import { prisma } from '@/lib/prisma';
import {
  getUserExpenseCategories,
  matchCategory,
} from './helpers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function downloadAudioBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download audio from ${url}: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const file = await toFile(audioBuffer, 'audio.wav', { type: 'audio/wav' });
  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'he',
  });
  return transcription.text.trim();
}

/**
 * Background job: download audio files, transcribe them, match category,
 * and create a transaction in the database.
 *
 * This function is fire-and-forget — it must never throw to the caller.
 */
export async function processExpenseBackground(params: {
  sessionId: string;
  userId: string;
  phoneNumber: string;
  amount: number;
  categoryAudioUrl: string;
  nameAudioUrl: string;
  isHaredi: boolean;
}): Promise<void> {
  const { sessionId, userId, amount, categoryAudioUrl, nameAudioUrl, isHaredi } = params;

  try {
    await prisma.ivrCallSession.update({
      where: { id: sessionId },
      data: { status: 'processing' },
    });

    // Download and transcribe both audio files in parallel
    const [categoryBuffer, nameBuffer] = await Promise.all([
      downloadAudioBuffer(categoryAudioUrl),
      downloadAudioBuffer(nameAudioUrl),
    ]);

    const [categoryText, descriptionText] = await Promise.all([
      transcribeAudio(categoryBuffer),
      transcribeAudio(nameBuffer),
    ]);

    // Match category against the user's available categories
    const userCategories = await getUserExpenseCategories(userId, isHaredi);
    const matchedCategoryId = matchCategory(categoryText, userCategories);

    const description = descriptionText || categoryText || 'הוצאה מ-IVR';

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'expense',
        amount,
        currency: 'ILS',
        category: matchedCategoryId,
        description,
        date: new Date(),
      },
    });

    await prisma.ivrCallSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        amount,
        category: matchedCategoryId,
        description,
        transactionId: transaction.id,
      },
    });

    console.log(
      `[IVR] Session ${sessionId} completed — tx ${transaction.id}, ` +
      `category=${matchedCategoryId}, amount=${amount}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[IVR] Session ${sessionId} failed:`, message);

    try {
      await prisma.ivrCallSession.update({
        where: { id: sessionId },
        data: { status: 'failed', errorMessage: message.slice(0, 500) },
      });
    } catch {
      console.error(`[IVR] Failed to update session ${sessionId} status`);
    }
  }
}
