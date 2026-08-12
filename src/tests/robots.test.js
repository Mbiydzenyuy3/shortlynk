import request from 'supertest'
import app from '../../app.js'

describe('robots hygiene', () => {
  it('serves a blanket-disallow robots.txt', async () => {
    const res = await request(app).get('/robots.txt')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/plain/)
    expect(res.text).toContain('Disallow: /')
  })

  it('marks short-link redirects noindex', async () => {
    const res = await request(app).get('/s/definitely-not-a-real-code')
    expect(res.headers['x-robots-tag']).toBe('noindex')
  })
})
