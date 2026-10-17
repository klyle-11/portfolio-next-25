import { openExternal, resolveSiteUrl } from '../site';

export default function SiteFooter({ siteUrl }) {
  const site = resolveSiteUrl(siteUrl);
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} khalil abdellah</span>
      <span>blog admin · runs only on this machine</span>
      <a href={site} onClick={e => { e.preventDefault(); openExternal(site); }}>{site.replace(/^https?:\/\//, '')} ↗</a>
    </footer>
  );
}
