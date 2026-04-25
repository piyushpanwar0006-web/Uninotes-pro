/**
 * API Route tests for GET /api/notes
 */
import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '@/app/api/notes/route';
import { createMockSupabaseClient, mockPaper } from '../__mocks__/supabase';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const getAppHandler = (url: string) => {
  return {
    ...appHandler,
    GET: (req: Request) => appHandler.GET(new Request(url) as any),
  } as any;
};

describe('GET /api/notes', () => {
  let mockServerClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockServerClient = createMockSupabaseClient();
    jest.mocked(createClient).mockResolvedValue(mockServerClient as any);
  });

  it('returns 401 when unauthenticated', async () => {
    mockServerClient._auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth failed' } });

    await testApiHandler({
      appHandler: getAppHandler('http://localhost:3000/api/notes?subjectCode=CS101'),
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      },
    });
  });

  it('returns 400 when subjectCode is missing', async () => {
    await testApiHandler({
      appHandler: getAppHandler('http://localhost:3000/api/notes'),
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(400);
      },
    });
  });

  it('returns 200 with notes when valid request is made', async () => {
    const mockData = [mockPaper()];
    mockServerClient._queryBuilder.range.mockResolvedValueOnce({
      data: mockData,
      count: 1,
      error: null,
    });

    await testApiHandler({
      appHandler: getAppHandler('http://localhost:3000/api/notes?subjectCode=CS101'),
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.data.notes).toHaveLength(1);
      },
    });
  });
});
