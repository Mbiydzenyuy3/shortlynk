import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ShowDialogBox from '../components/Dialoguebox'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')

    if (token) {
      localStorage.setItem('token', token)
      navigate('/dashboard')
    } else {
      // Show dialog and then redirect after a short delay
      setDialogMessage('Login failed. No token found.')
      setShowDialog(true)

      setTimeout(() => {
        setShowDialog(false)
        navigate('/login')
      }, 3000) // Wait 3 seconds before redirecting
    }
  }, [location, navigate])

  return (
    <>
      <p>Processing login with Google...</p>

      {showDialog && (
        <ShowDialogBox
          title="Form Error"
          message={dialogMessage}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  )
}
