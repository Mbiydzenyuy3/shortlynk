//Header component
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <>
      <header className="header">
        <Link to="/" className="text-xl font-bold">
          <h1 className="logo">
            <span>🔗</span>Shortlynk
          </h1>
        </Link>
        {/* <Link to="/urls" className="all-urls">
          All Urls
        </Link> */}

        <div className="space-x-4">
          <Link to="/" className="hover:underline">
            <button className="btn login">Logout</button>
          </Link>
        </div>
      </header>
    </>
  );
}
