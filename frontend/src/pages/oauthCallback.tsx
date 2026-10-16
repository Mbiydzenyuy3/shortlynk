import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Seo from '../components/Seo';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [location, navigate]);

  return (
    <>
      <Seo title="Signing In — Shortlynk" description="Completing sign-in." noindex />
      <p>Processing login with Google...</p>
    </>
  );
}
