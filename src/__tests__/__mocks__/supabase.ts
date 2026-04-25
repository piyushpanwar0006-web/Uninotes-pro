/**
 * Reusable Supabase mock factory.
 *
 * Returns a chainable mock that matches the Supabase JS client API.
 * Every method returns `this` so chains like:
 *   supabase.from('papers').select('id').eq('id', x).maybeSingle()
 * all resolve correctly.
 *
 * Usage:
 *   const mockClient = createMockSupabaseClient({ data: myData, error: null });
 *   jest.mocked(createAdminClient).mockReturnValue(mockClient as any);
 */

export interface MockResult {
  data?: unknown;
  error?: { message: string; details?: string } | null;
  count?: number;
}

export function createMockSupabaseClient(defaultResult: MockResult = { data: null, error: null }) {
  // Terminal methods — these return the actual result
  const terminalMethods = {
    single: jest.fn().mockResolvedValue(defaultResult),
    maybeSingle: jest.fn().mockResolvedValue(defaultResult),
    execute: jest.fn().mockResolvedValue(defaultResult),
  };

  // Chainable query builder — every method returns the builder itself
  // except terminal methods which resolve the promise
  const queryBuilder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue(defaultResult), // pagination endpoint
    limit: jest.fn().mockReturnThis(),
    ...terminalMethods,
    // Make the builder itself awaitable (for .insert().select())
    then: undefined, // not a promise by default
  };

  // Storage mock
  const storageBucket = {
    upload: jest.fn().mockResolvedValue({ error: null }),
    remove: jest.fn().mockResolvedValue({ error: null }),
    createSignedUrl: jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed-url' },
      error: null,
    }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/public-url' },
    }),
  };

  const storage = {
    from: jest.fn().mockReturnValue(storageBucket),
  };

  // Auth mock
  const auth = {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'mock-user-id', email: 'test@test.com' } },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  };

  const client = {
    from: jest.fn().mockReturnValue(queryBuilder),
    storage,
    auth,
    // Expose internals for per-test overrides
    _queryBuilder: queryBuilder,
    _storage: storageBucket,
    _auth: auth,
  };

  return client;
}

/**
 * Creates a mock auth user object.
 */
export function mockUser(overrides: Partial<{ id: string; email: string; role: string }> = {}) {
  return {
    id: overrides.id ?? 'user-uuid-123',
    email: overrides.email ?? 'student@example.com',
    role: overrides.role ?? 'authenticated',
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
  };
}

/**
 * Creates a mock paper object.
 */
export function mockPaper(overrides: Partial<{
  id: string;
  uploaded_by: string;
  storage_path: string;
  title: string;
  status: string;
}> = {}) {
  return {
    id: overrides.id ?? 'paper-uuid-456',
    uploaded_by: overrides.uploaded_by ?? 'user-uuid-123',
    storage_path: overrides.storage_path ?? 'user-uuid-123/file-uuid.pdf',
    title: overrides.title ?? 'Test Paper',
    status: overrides.status ?? 'ready',
    size_bytes: 102400,
    created_at: '2026-01-01T00:00:00Z',
  };
}

/**
 * Creates a mock File object (PDF).
 */
export function mockPDFFile(overrides: Partial<{
  name: string;
  size: number;
  type: string;
}> = {}): File {
  const content = new Uint8Array(overrides.size ?? 1024);
  return new File([content], overrides.name ?? 'test.pdf', {
    type: overrides.type ?? 'application/pdf',
  });
}
