import { PDFDocument } from 'pdf-lib';

/**
 * Encrypt an existing PDF buffer with a user password using pdf-lib.
 * Returns a new buffer with AES-256 encryption applied.
 */
export async function encryptPdfBuffer(
  pdfBuffer: Buffer,
  userPassword: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const encryptedBytes = await pdfDoc.save({
    userPassword,
    ownerPassword: userPassword,
    permissions: {
      modifying: false,
      copying: false,
      printing: 'lowResolution',
    },
  });

  return Buffer.from(encryptedBytes);
}
