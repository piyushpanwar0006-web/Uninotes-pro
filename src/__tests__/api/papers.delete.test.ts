/**
 * API Route tests for DELETE /api/papers/[id]
 */
import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '@/app/api/papers/[id]/route';
import { createMockSupabaseClient, mockPaper } from '../__mocks__/supabase';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

describe('DELETE /api/papers/[id]', () => {
  let mockServerClient: ReturnType<typeof createMockSupabaseClient>;
  let mockAdminClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockServerClient = createMockSupabaseClient();
    mockAdminClient = createMockSupabaseClient();
    jest.mocked(createClient).mockResolvedValue(mockServerClient as any);
    jest.mocked(createAdminClient).mockReturnValue(mockAdminClient as any);
  });

  it('returns 401 when unauthenticated', async () => {
    mockServerClient._auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth failed' } });

    await testApiHandler({
      appHandler: appHandler as any,
      params: { id: 'paper-123' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'DELETE' });
        expect(res.status).toBe(401);
      },
    });
  });

  it('returns 200 when paper does not exist (idempotency)', async () => {
    mockAdminClient._queryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await testApiHandler({
      appHandler: appHandler as any,
      params: { id: 'paper-123' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'DELETE' });
        expect(res.status).toBe(200);
      },
    });
  });

  it('returns 403 when user is neither owner nor admin', async () => {
    // 1. Fetch paper (owned by user-A)
    mockAdminClient._queryBuilder.maybeSingle.mockResolvedValueOnce({
      data: mockPaper({ uploaded_by: 'user-A' }),
      error: null,
    });

    // 2. Fetch profile (user-B, role: authenticated)
    mockAdminClient._queryBuilder.maybeSingle.mockResolvedValueOnce({
      data: { role: 'authenticated' },
      error: null,
    });

    await testApiHandler({
      appHandler: appHandler as any,
      params: { id: 'paper-123' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'DELETE' });
        const data = await res.json();
        expect(res.status).toBe(403);
        expect(data.code).toBe('FORBIDDEN');
      },
    });
  });

  it('returns 200 when user is owner', async () => {
    // 1. Fetch paper (owned by the mock user)
    mockAdminClient._queryBuilder.maybeSingle.mockResolvedValueOnce({
      data: mockPaper({ uploaded_by: 'mock-user-id', storage_path: 'path.pdf' }),
      error: null,
    });

    // 2. Fetch profile (role: authenticated)
    mockAdminClient._queryBuilder.maybeSingle.mockResolvedValueOnce({
      data: { role: 'authenticated' },
      error: null,
    });

    // 3. DB delete
    mockAdminClient._queryBuilder.maybeSingle.mockResolvedValueOnce({
      data: { id: 'paper-123' },
      error: null,
    });

    await testApiHandler({
      appHandler: appHandler as any,
      params: { id: 'paper-123' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'DELETE' });
        expect(res.status).toBe(200);

        // Verify storage remove was NOT called
        expect(mockAdminClient._storage.remove).not.toHaveBeenCalled();
        // Verify DB update was called (soft delete)
        expect(mockAdminClient._queryBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({ deleted_at: expect.any(String) })
        );
      },
    });
  });

  it('returns 200 when user is admin (even if not owner)', async () => {
    // 1. Fetch paper (owned by user-A)
    mockAdminClient._queryBuilder.maybeSingle.mockResolvedValueOnce({
      data: mockPaper({ uploaded_by: 'user-A' }),
      error: null,
    });

    // 2. Fetch profile (user is admin)
    mockAdminClient._queryBuilder.maybeSingle.mockResolvedValueOnce({
      data: { role: 'admin' },
      error: null,
    });

    // 3. DB delete
    mockAdminClient._queryBuilder.maybeSingle.mockResolvedValueOnce({
      data: { id: 'paper-123' },
      error: null,
    });

    await testApiHandler({
      appHandler: appHandler as any,
      params: { id: 'paper-123' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'DELETE' });
        expect(res.status).toBe(200);
      },
    });
  });
});
