/**
 * PDF encryption placeholder.
 * pdf-lib does not natively support password encryption in its save() options.
 * Returns the PDF buffer as-is. For production password protection,
 * consider adding a dedicated encryption library.
 */
export async function encryptPdfBuffer(
  pdfBuffer: Buffer,
  _userPassword: string
): Promise<Buffer> {
  return pdfBuffer;
}
