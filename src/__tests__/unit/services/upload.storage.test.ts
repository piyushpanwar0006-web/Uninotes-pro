/**
 * Unit tests for Storage service layer
 *
 * Tests uploadToStorage, getSignedUrl, deleteFromStorage.
 * Supabase client is mocked.
 */
import { uploadToStorage, getSignedUrl, deleteFromStorage } from '@/services/upload';
import { createMockSupabaseClient, mockPDFFile } from '../../__mocks__/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock uuid to return a predictable string
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

describe('Storage Service Layer', () => {
  describe('uploadToStorage()', () => {
    it('uploads file and returns expected storage path on success', async () => {
      const mockClient = createMockSupabaseClient();
      const file = mockPDFFile();
      const userId = 'user-123';

      const result = await uploadToStorage(mockClient as unknown as SupabaseClient, file, userId);

      expect(result.storagePath).toBe('user-123/mocked-uuid.pdf');
      expect(result.error).toBeNull();
      expect(mockClient.storage.from).toHaveBeenCalledWith('papers');
      expect(mockClient._storage.upload).toHaveBeenCalledWith(
        'user-123/mocked-uuid.pdf',
        expect.any(Buffer),
        { contentType: 'application/pdf', upsert: false }
      );
    });

    it('returns error when storage upload fails', async () => {
      const mockClient = createMockSupabaseClient();
      mockClient._storage.upload.mockResolvedValueOnce({ error: { message: 'Upload failed' } });
      const file = mockPDFFile();

      const result = await uploadToStorage(mockClient as unknown as SupabaseClient, file, 'user-123');

      expect(result.storagePath).toBe('');
      expect(result.error).toBe('Upload failed');
    });
  });

  describe('getSignedUrl()', () => {
    it('returns signed URL on success', async () => {
      const mockClient = createMockSupabaseClient();

      const result = await getSignedUrl(mockClient as unknown as SupabaseClient, 'test/path.pdf', 3600);

      expect(result.signedUrl).toBe('https://storage.example.com/signed-url');
      expect(result.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // starts with ISO date
      expect(result.error).toBeNull();
      expect(mockClient._storage.createSignedUrl).toHaveBeenCalledWith('test/path.pdf', 3600);
    });

    it('returns error when signed URL generation fails', async () => {
      const mockClient = createMockSupabaseClient();
      mockClient._storage.createSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: 'URL generation failed' },
      });

      const result = await getSignedUrl(mockClient as unknown as SupabaseClient, 'test/path.pdf', 3600);

      expect(result.signedUrl).toBe('');
      expect(result.error).toBe('URL generation failed');
    });
  });

  describe('deleteFromStorage()', () => {
    it('calls remove on the correct bucket and path', async () => {
      const mockClient = createMockSupabaseClient();

      await deleteFromStorage(mockClient as unknown as SupabaseClient, 'test/path.pdf');

      expect(mockClient.storage.from).toHaveBeenCalledWith('papers');
      expect(mockClient._storage.remove).toHaveBeenCalledWith(['test/path.pdf']);
    });
  });
});
