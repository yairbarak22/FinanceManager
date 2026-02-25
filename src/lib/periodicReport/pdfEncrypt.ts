import { PDFDocument } from 'pdf-lib-with-encrypt';

/**
 * Encrypt a PDF buffer with a user password using pdf-lib-with-encrypt.
 * The user must enter the password to open the PDF.
 */
export async function encryptPdfBuffer(
  pdfBuffer: Buffer,
  userPassword: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  await pdfDoc.encrypt({
    userPassword,
    ownerPassword: userPassword,
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
    },
  });

  const encryptedBytes = await pdfDoc.save();

  return Buffer.from(encryptedBytes);
}
