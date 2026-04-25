/**
 * API Route tests for GET /api/papers
 */
import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '@/app/api/papers/route';
import { createMockSupabaseClient, mockPaper } from '../__mocks__/supabase';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

// Provide a fake NextRequest URL implementation required by next-test-api-route-handler
// when using App Router search params.
const getAppHandler = (url: string) => {
  return {
    ...appHandler,
    GET: (req: Request) => appHandler.GET(new Request(url) as any),
  } as any;
};

describe('GET /api/papers', () => {
  let mockAdminClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockAdminClient = createMockSupabaseClient();
    jest.mocked(createAdminClient).mockReturnValue(mockAdminClient as any);
  });

  it('returns papers array and pagination on success', async () => {
    const mockData = [mockPaper(), mockPaper()];
    mockAdminClient._queryBuilder.range.mockResolvedValueOnce({
      data: mockData,
      count: 2,
      error: null,
    });

    await testApiHandler({
      appHandler: getAppHandler('http://localhost:3000/api/papers?page=1&limit=10'),
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.papers).toHaveLength(2);
        expect(data.data.pagination.total).toBe(2);
      },
    });
  });

  it('returns 400 when limit is invalid', async () => {
    await testApiHandler({
      appHandler: getAppHandler('http://localhost:3000/api/papers?limit=1000'), // max is 50
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(400);
      },
    });
  });

  it('returns 500 when DB query fails', async () => {
    mockAdminClient._queryBuilder.range.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database failure' },
    });

    await testApiHandler({
      appHandler: getAppHandler('http://localhost:3000/api/papers'),
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(500);
      },
    });
  });
});
