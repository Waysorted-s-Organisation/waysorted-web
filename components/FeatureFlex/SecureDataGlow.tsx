export default function SecureDataGlow() {
  return (
    <div className="glow-icon glow--md glow--green">{/* add glow--luminous on dark bg only */}
      <span className="glow-ring r1" />
      <span className="glow-ring r2" />
      <span className="glow-ring r3" />
      <span className="glow-ring r4" />
      <svg className="glow-svg" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Secure Data">
        <path d="M0 12C0 5.37258 5.37258 0 12 0H42C48.6274 0 54 5.37258 54 12V42C54 48.6274 48.6274 54 42 54H12C5.37258 54 0 48.6274 0 42V12Z" fill="#01A04E"/>
        <path d="M36.6875 20L23.5625 33.125L17 26.5625" stroke="white" fill="none" strokeWidth="3.28125" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}