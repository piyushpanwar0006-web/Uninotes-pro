/**
 * Unit tests for saveMetadata()
 *
 * Tests the DB insert branch: success path and DB error path.
 * Supabase client is fully mocked.
 */
import { saveMetadata } from '@/services/upload';
import { createMockSupabaseClient } from '../../__mocks__/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('saveMetadata()', () => {
  const baseParams = {
    subjectId: 'subject-uuid-001',
    userId: 'user-uuid-123',
    title: 'Algorithms Notes',
    storagePath: 'user-uuid-123/file-uuid.pdf',
    sizeBytes: 204800,
    description: 'Chapter 1-5 coverage',
  };

  it('returns paperId on successful insert', async () => {
    const mockClient = createMockSupabaseClient();
    // Mock the chain: .from().insert().select().single()
    mockClient._queryBuilder.single.mockResolvedValueOnce({
      data: { id: 'paper-uuid-789' },
      error: null,
    });

    const result = await saveMetadata({
      supabase: mockClient as unknown as SupabaseClient,
      ...baseParams,
    });

    expect(result.paperId).toBe('paper-uuid-789');
    expect(result.error).toBeNull();
    expect(mockClient.from).toHaveBeenCalledWith('papers');
    expect(mockClient._queryBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        subject_id: baseParams.subjectId,
        uploaded_by: baseParams.userId,
        title: baseParams.title,
        storage_path: baseParams.storagePath,
        size_bytes: baseParams.sizeBytes,
        status: 'ready',
      })
    );
  });

  it('returns error when DB insert fails', async () => {
    const mockClient = createMockSupabaseClient();
    mockClient._queryBuilder.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Foreign key constraint violation' },
    });

    const result = await saveMetadata({
      supabase: mockClient as unknown as SupabaseClient,
      ...baseParams,
    });

    expect(result.paperId).toBeNull();
    expect(result.error).toBe('Foreign key constraint violation');
  });

  it('returns error when insert returns no data', async () => {
    const mockClient = createMockSupabaseClient();
    mockClient._queryBuilder.single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await saveMetadata({
      supabase: mockClient as unknown as SupabaseClient,
      ...baseParams,
    });

    expect(result.paperId).toBeNull();
    expect(result.error).toBe('Failed to save metadata');
  });

  it('saves paper without optional description', async () => {
    const mockClient = createMockSupabaseClient();
    mockClient._queryBuilder.single.mockResolvedValueOnce({
      data: { id: 'paper-uuid-no-desc' },
      error: null,
    });

    const result = await saveMetadata({
      supabase: mockClient as unknown as SupabaseClient,
      ...baseParams,
      description: undefined,
    });

    expect(result.paperId).toBe('paper-uuid-no-desc');
    expect(mockClient._queryBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ description: null })
    );
  });
});
