// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api.js'
import ShortenForm from '../components/ShortenInput.jsx'
import Header from '../components/Header.jsx'
import UrlList from '../components/UrlList.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const [urls, setUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUrls = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/api/shorten/my-urls')

      if (data.urls.length >= 3) {
        setUrls([]) // Clear the dashboard
      } else {
        setUrls(data.urls)
      }
    } catch (err) {
      console.error('Error fetching URLs:', err)
      setError('Failed to fetch URLs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) navigate('/login')
    else fetchUrls()
  }, [])

  return (
    <div className="shorturl-container">
      <Header />
      <ShortenForm onShortened={fetchUrls} />

      {loading && <p>Loading URLs...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && urls.length === 0 && (
        <p>No shortened URLs yet. Create one above!</p>
      )}
      {loading && urls.length > 0 && <UrlList urls={urls} />}
      <ul className="ul">
        {urls.map((u) => (
          <li key={u.short_code} className="li">
            <p>
              <strong>Long:</strong> {u.long_url}
            </p>
            <p>
              <strong>Short:</strong>{' '}
              <a href={u.short_url} target="_blank" rel="noreferrer">
                {u.short_url}
              </a>
            </p>
            <p>
              <strong>Clicks:</strong> {u.click_count} |{' '}
              <strong>Expires:</strong> {u.expire_at || 'Never'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
