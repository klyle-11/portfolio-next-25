import { useEffect, useState } from 'react';
import { openExternal, resolveSiteUrl } from '../site';

// Mirrors components/Header.js on the site, plus a nav row for the admin.
export default function SiteHeader({ siteUrl }) {
  const [now, setNow] = useState(() => new Date());
  const site = resolveSiteUrl(siteUrl);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/New_York' }).format(now);
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' }).format(now);

  const external = url => e => { e.preventDefault(); openExternal(url); };

  return (
    <div className="site-spacers">
      <div className="site-header">
        <ul className="site-headerul">
          <li>khalil abdellah</li>
          <li><a href="mailto:khalil.mktg@gmail.com" onClick={external('mailto:khalil.mktg@gmail.com')}>khalil.mktg@gmail.com</a></li>
          <li><a href={`${site}/resume`} onClick={external(`${site}/resume`)}>resume</a></li>
        </ul>
        <nav className="site-nav" aria-label="Admin">
          <ul className="site-headerul">
            <li><a href="/" className="active" aria-current="page">blog admin</a></li>
            <li><a href={site} onClick={external(site)}>view site ↗</a></li>
            <li><a href={`${site}/#blog`} onClick={external(`${site}/#blog`)}>live posts ↗</a></li>
          </ul>
        </nav>
        <ul className="site-construction">
          <li>{date}</li>
          <li>{time} EST</li>
        </ul>
        <div className="site-socials">
          <a href="https://linkedin.com/in/khalilabdellah" onClick={external('https://linkedin.com/in/khalilabdellah')}>
            <img src="/linkedin.png" alt="Khalil Abdellah's LinkedIn page" />
          </a>
          <a href="https://github.com/cv-net" onClick={external('https://github.com/cv-net')}>
            <img src="/github.png" alt="Khalil Abdellah's GitHub page" />
          </a>
        </div>
      </div>
    </div>
  );
}
