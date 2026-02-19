/**
 * File Test Helpers
 *
 * Utilities for creating test files and testing file operations.
 */

export {
  createPDFBuffer,
  createMaliciousPDFBuffer,
  createPDFWithLaunch,
  createJPEGBuffer,
  createPNGBuffer,
  createFakeJPEGBuffer,
  createPathTraversalFilename,
} from '../factories/document';

/**
 * Create a fake Excel file (XLSX) buffer.
 * Uses the XLSX magic bytes (PK ZIP header).
 */
export function createXLSXBuffer(): Buffer {
  // PK\x03\x04 – ZIP archive header (XLSX is a ZIP)
  return Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Array(100).fill(0)]);
}

/**
 * Create a legacy Excel (XLS) buffer.
 * Uses the OLE compound document header.
 */
export function createXLSBuffer(): Buffer {
  // D0 CF 11 E0 – OLE compound document
  return Buffer.from([0xd0, 0xcf, 0x11, 0xe0, ...Array(100).fill(0)]);
}

/**
 * Create an HTML-based "Excel" file (common from Israeli banks).
 */
export function createHTMLExcelBuffer(content = '<html><body><table><tr><td>Test</td></tr></table></body></html>'): Buffer {
  return Buffer.from(content);
}

/**
 * Create a buffer with formula injection content.
 */
export function createFormulaInjectionContent(): string[] {
  return [
    '=CMD("calc")',
    '+CMD("calc")',
    '-CMD("calc")',
    '@SUM(A1:A10)',
    '=HYPERLINK("http://evil.com","Click")',
    '\tformula',
    '\rformula',
  ];
}

/**
 * Create a buffer of a specific size (for size limit testing).
 */
export function createBufferOfSize(sizeInBytes: number): Buffer {
  return Buffer.alloc(sizeInBytes, 'A');
}

/**
 * Create a Word document (DOCX) with VBA macros (should be blocked).
 */
export function createDocxWithMacros(): Buffer {
  // Simulated ZIP with vbaProject.bin entry name in the content
  const content = 'PK\x03\x04vbaProject.bin';
  return Buffer.from(content);
}

