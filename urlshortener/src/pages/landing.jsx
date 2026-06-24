import LandingHeader from '../components/LandingHeader'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <div className="landing-page">
        <h1 className="main-heading">
          Welcome to shortening your long links with Shortlynk
        </h1>
        <div className="container">
          <p>
            Shortlynk is a free tool to shorten URLs and generate branded short
            links. Our service makes it easy to manage, track, and share your
            URLs across platforms.
          </p>
        </div>

        {/* Call to Action */}
        <div className="btns">
          <Link to="/register">
            <button className="btn register">Get Started</button>
          </Link>
        </div>

        {/* Features Section */}
        <div className="section-container">
          <div className="features-section">
            <h2 className="section-heading">Features</h2>
            <ul className="features-list">
              <li>🔗 Custom short links</li>
              <li>📈 Click analytics and tracking</li>
              <li>📁 Link history & management</li>
              <li>🔒 Secure and spam-protected URLs</li>
            </ul>
          </div>

          {/* How It Works Section */}
          <div className="how-it-works-section">
            <h2 className="section-heading">How It Works</h2>
            <ol className="how-it-works-list">
              <li>Paste your long URL into the input field.</li>
              <li>Click “Shorten” to generate a custom short link.</li>
              <li>Copy and share the new link anywhere you want.</li>
              <li>Track your link's performance from your dashboard.</li>
            </ol>
          </div>
        </div>
        {/* Why Choose Us Section */}
        <div className="why-us-section">
          <h2 className="section-heading">Why Choose Shortlynk?</h2>
          <p>
            We offer a lightweight, user-friendly experience with powerful tools
            for link management. Whether you're sharing links for business,
            education, or fun, Shortlynk has you covered.
          </p>
        </div>
      </div>

      <Footer />
    </>
  )
}
