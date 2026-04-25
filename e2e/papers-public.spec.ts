import { test, expect } from '@playwright/test';

test.describe('Public Access', () => {
  test('/api/papers is accessible without authentication', async ({ request }) => {
    // 1. Fetch papers directly from API
    const response = await request.get('/api/papers?limit=1');

    // 2. Verify response
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('papers');
    expect(Array.isArray(body.data.papers)).toBe(true);
  });
});
