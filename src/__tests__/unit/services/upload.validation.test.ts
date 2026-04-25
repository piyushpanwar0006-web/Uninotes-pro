/**
 * Unit tests for validatePDF()
 *
 * Tests all validation branches: valid file, wrong type, too large, empty.
 * No mocking needed — pure synchronous logic.
 */
import { validatePDF } from '@/services/upload';
import { MAX_FILE_SIZE_BYTES } from '@/types/upload';
import { mockPDFFile } from '../../__mocks__/supabase';

describe('validatePDF()', () => {
  it('returns null for a valid PDF file (with %PDF header)', async () => {
    // PDF magic bytes: %PDF
    const content = new TextEncoder().encode('%PDF-1.4\n...');
    const file = new File([content], 'test.pdf', { type: 'application/pdf' });
    const result = await validatePDF(file);
    expect(result).toBeNull();
  });

  it('rejects a file with wrong MIME type', async () => {
    const file = mockPDFFile({ type: 'image/png', name: 'image.png' });
    const result = await validatePDF(file);
    expect(result).not.toBeNull();
    expect(result!.field).toBe('file');
    expect(result!.message).toContain('Only PDF files are allowed');
  });

  it('rejects a file that exceeds the 10MB limit', async () => {
    const overLimit = MAX_FILE_SIZE_BYTES + 1;
    const file = mockPDFFile({ size: overLimit, type: 'application/pdf' });
    const result = await validatePDF(file);
    expect(result).not.toBeNull();
    expect(result!.field).toBe('file');
    expect(result!.message).toContain('exceeds');
  });

  it('rejects an empty file (0 bytes)', async () => {
    const file = mockPDFFile({ size: 0, type: 'application/pdf' });
    const result = await validatePDF(file);
    expect(result).not.toBeNull();
    expect(result!.message).toBe('File is empty.');
  });

  it('rejects a file without %PDF magic bytes', async () => {
    const content = new TextEncoder().encode('Not a PDF really');
    const file = new File([content], 'fake.pdf', { type: 'application/pdf' });
    const result = await validatePDF(file);
    expect(result).not.toBeNull();
    expect(result!.message).toContain('corrupt or spoofed');
  });
});
