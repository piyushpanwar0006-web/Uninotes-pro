/**
 * API Route tests for POST /api/upload
 */
import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '@/app/api/upload/route';
import { createMockSupabaseClient, mockUser } from '../__mocks__/supabase';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

// Mock uuid so file name generation is predictable
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

describe('POST /api/upload', () => {
  let mockServerClient: ReturnType<typeof createMockSupabaseClient>;
  let mockAdminClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockServerClient = createMockSupabaseClient();
    mockAdminClient = createMockSupabaseClient();
    jest.mocked(createClient).mockResolvedValue(mockServerClient as any);
    jest.mocked(createAdminClient).mockReturnValue(mockAdminClient as any);
  });

  function createFormData(fileData = '%PDF-1.4 mock content') {
    const formData = new FormData();
    const blob = new Blob([fileData], { type: 'application/pdf' });
    formData.append('file', blob, 'test.pdf');
    formData.append('subjectId', '123e4567-e89b-12d3-a456-426614174000');
    formData.append('title', 'Test Paper');
    formData.append('description', 'A test description');
    return formData;
  }

  it('returns 401 when unauthenticated', async () => {
    mockServerClient._auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth failed' } });

    await testApiHandler({
      appHandler: appHandler as any,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST', body: createFormData() });
        const data = await res.json();
        expect(res.status).toBe(401);
        expect(data.error).toBe('Unauthorized. Please log in.');
      },
    });
  });

  it('returns 400 when file is missing', async () => {
    await testApiHandler({
      appHandler: appHandler as any,
      test: async ({ fetch }) => {
        const formData = new FormData();
        formData.append('subjectId', '123e4567-e89b-12d3-a456-426614174000');
        formData.append('title', 'Test Title');

        const res = await fetch({ method: 'POST', body: formData });
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.code).toBe('MISSING_FILE');
      },
    });
  });

  it('returns 400 when form fields are invalid', async () => {
    await testApiHandler({
      appHandler: appHandler as any,
      test: async ({ fetch }) => {
        const formData = createFormData();
        formData.set('subjectId', 'invalid-uuid'); // Invalid UUID

        const res = await fetch({ method: 'POST', body: formData });
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.code).toBe('VALIDATION_ERROR');
      },
    });
  });

  it('returns 201 on successful upload', async () => {
    // 1. Mock valid subject lookup
    mockServerClient._queryBuilder.single.mockResolvedValueOnce({ data: { id: 'subject-id' }, error: null });

    // 2. Storage upload is mocked successfully by default
    // 3. DB insert
    mockServerClient._queryBuilder.single.mockResolvedValueOnce({ data: { id: 'new-paper-id' }, error: null });

    await testApiHandler({
      appHandler: appHandler as any,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST', body: createFormData() });
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.paperId).toBe('new-paper-id');
        expect(data.data.signedUrl).toBe('https://storage.example.com/signed-url');

        // Verify Storage was called with admin client
        expect(mockAdminClient._storage.upload).toHaveBeenCalledWith(
          'mock-user-id/mocked-uuid.pdf',
          expect.any(Buffer),
          expect.any(Object)
        );
      },
    });
  });

  it('cleans up storage and returns 500 when DB insert fails', async () => {
    mockServerClient._queryBuilder.single.mockResolvedValueOnce({ data: { id: 'subject-id' }, error: null });

    // Force DB insert to fail
    mockServerClient._queryBuilder.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Insert failed' },
    });

    await testApiHandler({
      appHandler: appHandler as any,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST', body: createFormData() });
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.code).toBe('DB_ERROR');

        // Storage cleanup should have been called
        expect(mockAdminClient._storage.remove).toHaveBeenCalledWith(['mock-user-id/mocked-uuid.pdf']);
      },
    });
  });
});
