/* eslint-disable @next/next/no-html-link-for-pages -- full document navigation is intentional for Sites compatibility. */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="/" aria-label="PAIR Assessment Tool home">
          <span className="brand-mark" aria-hidden="true">PAIR</span>
          <span><strong>PAIR Assessment Tool</strong><small>Physical AI Readiness</small></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/assessment">Assessment</a>
          <a href="/evidence">Evidence</a>
          <a href="/calibration">Calibration</a>
          <a href="/methodology">Methodology</a>
        </nav>
      </div>
    </header>
  );
}
