/**
 * Admin Inbox API - Send reply to a message
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { isValidSenderAddress, getSenderDisplay, generateThreadId, extractEmailAddress } from '@/lib/inbox/constants';
import { config } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, replyFromAddress } = body;

    if (!content || !replyFromAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: content, replyFromAddress' },
        { status: 400 }
      );
    }

    if (!isValidSenderAddress(replyFromAddress)) {
      return NextResponse.json(
        { error: 'Invalid sender address' },
        { status: 400 }
      );
    }

    if (!config.resendApiKey) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      );
    }

    // Get the original message
    const originalMessage = await prisma.inboxMessage.findUnique({
      where: { id },
    });

    if (!originalMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Determine who to reply to
    const replyToEmail = originalMessage.direction === 'inbound'
      ? originalMessage.fromEmail
      : originalMessage.to[0]; // If replying to our own outbound, reply to the original recipient

    if (!replyToEmail) {
      return NextResponse.json({ error: 'No recipient email found' }, { status: 400 });
    }

    // Build the reply HTML with quoted original
    const replyHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Nunito', Arial, sans-serif; direction: rtl;">
  <div>${content}</div>
  <br>
  <div style="border-right: 2px solid #ccc; padding-right: 12px; margin-top: 16px; color: #666;">
    <p style="font-size: 12px; color: #999;">
      ב-${new Date(originalMessage.createdAt).toLocaleString('he-IL')}, ${originalMessage.from} כתב/ה:
    </p>
    <div style="font-size: 14px;">
      ${originalMessage.htmlBody || originalMessage.textBody?.replace(/\n/g, '<br>') || ''}
    </div>
  </div>
</body>
</html>`;

    const replySubject = originalMessage.subject.startsWith('Re:')
      ? originalMessage.subject
      : `Re: ${originalMessage.subject}`;

    // Send via Resend
    const resend = new Resend(config.resendApiKey);
    const result = await resend.emails.send({
      from: getSenderDisplay(replyFromAddress),
      to: replyToEmail,
      subject: replySubject,
      html: replyHtml,
      replyTo: replyFromAddress,
    });

    if (result.error) {
      console.error('[Inbox Reply] Resend error:', result.error);
      return NextResponse.json(
        { error: result.error.message || 'Failed to send reply' },
        { status: 500 }
      );
    }

    // Calculate threadId
    const threadId = originalMessage.threadId ||
      generateThreadId(originalMessage.subject, extractEmailAddress(originalMessage.from));

    // Save outbound reply to DB
    const savedReply = await prisma.inboxMessage.create({
      data: {
        resendEmailId: result.data?.id || null,
        from: getSenderDisplay(replyFromAddress),
        fromEmail: replyFromAddress,
        to: [replyToEmail],
        cc: [],
        bcc: [],
        subject: replySubject,
        htmlBody: content, // Store just the reply content, not the quoted original
        textBody: null,
        direction: 'outbound',
        parentId: id,
        threadId,
        replyFromAddress,
        isRead: true,
        isStarred: false,
        isArchived: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: savedReply,
      resendId: result.data?.id,
    });
  } catch (error) {
    console.error('[Inbox Reply] Error:', error);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}

