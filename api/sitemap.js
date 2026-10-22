// /sitemap.xml: fixed pages + every blog article from Supabase (updates itself when you publish).
const { SB_URL, SB_KEY, SITE } = require('./_cfg');
module.exports = async (req, res) => {
  const pages = ['/', '/products', '/about', '/outreach', '/blog', '/faq', '/contact'];
  let posts = [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/posts?select=slug,created_at&order=id.desc`, { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
    if (r.ok) posts = await r.json();
  } catch (e) {}
  const u = (loc, d) => `<url><loc>${SITE}${loc}</loc>${d ? `<lastmod>${String(d).slice(0, 10)}</lastmod>` : ''}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((p) => u(p)).join('')}${posts.map((p) => u('/blog/' + encodeURIComponent(p.slug), p.created_at)).join('')}</urlset>`;
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};
