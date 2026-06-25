import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../config/db.js', () => ({
  pool: { query: mockQuery },
}));

const { updateUrl, deleteUrl } = await import('../controllers/urlUpdate.controller.js');

function makeRes() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => mockQuery.mockReset());

// ── PATCH updateUrl ──────────────────────────────────────────────────────────

describe('updateUrl', () => {
  it('returns 200 with updated row on success', async () => {
    const row = {
      short_code: 'abc123', short_url: 'https://shrt.ly/abc123',
      long_url: 'https://example.com', expire_at: '2026-07-01T00:00:00Z',
      click_count: 2, created_at: new Date().toISOString(),
    };
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [row] });

    const req = { params: { shortCode: 'abc123' }, body: { expireAt: '2026-07-01' }, user: { id: 'user-1' } };
    const res = makeRes();
    await updateUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: row });
  });

  it('returns 404 when shortCode not found or not owned', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const req = { params: { shortCode: 'abc123' }, body: { expireAt: '2026-07-01' }, user: { id: 'user-1' } };
    const res = makeRes();
    await updateUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'URL not found.' });
  });

  it('passes null to DB when expireAt is null (clears expiry)', async () => {
    const row = { short_code: 'abc123', expire_at: null };
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [row] });

    const req = { params: { shortCode: 'abc123' }, body: { expireAt: null }, user: { id: 'user-1' } };
    const res = makeRes();
    await updateUrl(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE urls'),
      [null, 'abc123', 'user-1']
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── DELETE deleteUrl ─────────────────────────────────────────────────────────

describe('deleteUrl', () => {
  it('returns 200 on successful delete', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    const req = { params: { shortCode: 'abc123' }, user: { id: 'user-1' } };
    const res = makeRes();
    await deleteUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'URL deleted.' });
  });

  it('returns 404 when shortCode not found or not owned', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0 });

    const req = { params: { shortCode: 'abc123' }, user: { id: 'user-1' } };
    const res = makeRes();
    await deleteUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'URL not found.' });
  });
});
