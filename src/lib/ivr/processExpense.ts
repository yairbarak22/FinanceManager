import OpenAI, { toFile } from 'openai';
import { prisma } from '@/lib/prisma';
import {
  getUserExpenseCategories,
  matchCategory,
} from './helpers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildYemotAudioUrl(relativePath: string): string {
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  const token = process.env.YEMOT_TOKEN;
  if (!token) {
    throw new Error('YEMOT_TOKEN environment variable is not set');
  }
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `https://www.call2all.co.il/ym/api/DownloadFile?token=${token}&path=ivr/${cleanPath}`;
}

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

  console.log(`[IVR] Starting processing for session ${sessionId}, userId=${userId}`);
  console.log(`[IVR] Audio URLs received: category=${categoryAudioUrl}, name=${nameAudioUrl}`);

  if (!categoryAudioUrl || !nameAudioUrl) {
    throw new Error(`Missing audio URLs: category=${categoryAudioUrl}, name=${nameAudioUrl}`);
  }

  try {
    await prisma.ivrCallSession.update({
      where: { id: sessionId },
      data: { status: 'processing' },
    });

    const categoryFullUrl = buildYemotAudioUrl(categoryAudioUrl);
    const nameFullUrl = buildYemotAudioUrl(nameAudioUrl);
    console.log(`[IVR] Downloading audio: category=${categoryFullUrl}, name=${nameFullUrl}`);

    const [categoryBuffer, nameBuffer] = await Promise.all([
      downloadAudioBuffer(categoryFullUrl),
      downloadAudioBuffer(nameFullUrl),
    ]);

    const [categoryText, descriptionText] = await Promise.all([
      transcribeAudio(categoryBuffer),
      transcribeAudio(nameBuffer),
    ]);

    console.log(`[IVR] Transcription: category="${categoryText}", description="${descriptionText}"`);

    const userCategories = await getUserExpenseCategories(userId, isHaredi);
    const matchedCategoryId = matchCategory(categoryText, userCategories);

    const description = descriptionText || categoryText || 'הוצאה מ-IVR';

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'expense',
        amount,
        currency: 'ILS',
        category: matchedCategoryId,
        description,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
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
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(`[IVR] Session ${sessionId} failed:`, message);
    if (stack) console.error(`[IVR] Stack trace:`, stack);

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
