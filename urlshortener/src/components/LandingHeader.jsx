//Header component
import { Link } from "react-router-dom";

export default function LandingHeader() {
  return (
    <>
      <header className="header">
        <Link to="/" className="text-xl font-bold">
          <h1 className="logo">🔗Short.ly</h1>
        </Link>
        <div className="space-x-4">
          <Link to="/register" className="hover:underline">
            <button className="btn register"> Register</button>
          </Link>
          <Link to="/login" className="hover:underline">
            <button className="btn login">Login</button>
          </Link>
        </div>
      </header>
    </>
  );
}
