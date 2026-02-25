import muhammara from 'muhammara';

/**
 * Encrypt an existing PDF buffer with a user password using muhammara.
 * Returns a new buffer with RC4-128 encryption applied.
 */
export async function encryptPdfBuffer(
  pdfBuffer: Buffer,
  userPassword: string
): Promise<Buffer> {
  const readStream = new muhammara.PDFRStreamForBuffer(pdfBuffer);
  const writeStream = new muhammara.PDFWStreamForBuffer();

  const writer = muhammara.createWriterToModify(readStream, writeStream, {
    userPassword,
    ownerPassword: userPassword,
    userProtectionFlag: 4,
  });

  writer.end();

  return writeStream.buffer as Buffer;
}
