//Footer component
export default function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="footer-div">
          <p>© {new Date().getFullYear()} Shortlynk - A simple URL shortener</p>
        </div>
      </footer>
    </>
  );
}
