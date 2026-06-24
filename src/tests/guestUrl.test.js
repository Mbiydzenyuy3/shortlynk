import request from 'supertest';
import app from '../../app.js';

describe('POST /api/shorten/guest', () => {
  it('returns 201 with shortened_URL for a valid URL', async () => {
    const res = await request(app)
      .post('/api/shorten/guest')
      .send({ longUrl: 'https://example.com/some/very/long/path' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('shortened_URL');
    expect(res.body.shortened_URL).toMatch(/^https?:\/\//);
  });

  it('returns 400 for a missing longUrl', async () => {
    const res = await request(app)
      .post('/api/shorten/guest')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid URL', async () => {
    const res = await request(app)
      .post('/api/shorten/guest')
      .send({ longUrl: 'not-a-url' });

    expect(res.status).toBe(400);
  });

  it('does not require Authorization header', async () => {
    const res = await request(app)
      .post('/api/shorten/guest')
      .set('Authorization', '')
      .send({ longUrl: 'https://example.com' });

    expect(res.status).toBe(201);
  });
});
