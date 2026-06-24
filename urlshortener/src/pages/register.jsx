// src/pages/Register.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api.js'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await apiFetch('/api/oauth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      navigate('/login')
    } catch (err) {
      alert('Registration failed: ' + err.message)
    }
  }

  return (
    <div className="form">
      <form onSubmit={handleSubmit} className="p-4 register-form">
        <h2 className="text-xl font-bold mb-2">Register</h2>
        <input
          className="input"
          placeholder="Username"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="email"
          className="input"
          placeholder="email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          className="w-full p-2 border mb-2"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="cta">Register</button>
        <div className="option">
          <p>Already have an account? </p>
          <a href="/login" className="create-account">
            Login
          </a>
        </div>
      </form>
    </div>
  )
}
