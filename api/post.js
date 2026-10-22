// Serves /blog/<slug> with the article already in the HTML, so Google, WhatsApp and Facebook can read it.
const { SB_URL, SB_KEY, SITE } = require('./_cfg');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const yid = (u) => (String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/) || [])[1];

module.exports = async (req, res) => {
  const slug = String(req.query.slug || '').slice(0, 120);
  let post = null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/posts?select=*&slug=eq.${encodeURIComponent(slug)}`, { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
    if (r.ok) post = (await r.json())[0];
  } catch (e) {}
  const siteHost = new URL(SITE).host;
  const host = String(req.headers.host || '').toLowerCase();
  const origin = 'https://' + (host === siteHost || host === 'www.' + siteHost || /^[a-z0-9-]+\.vercel\.app$/.test(host) ? host : siteHost);
  let html = '';
  try { html = await (await fetch(origin + '/blog.html')).text(); } catch (e) { return res.status(502).send('Temporarily unavailable'); }
  if (!post) {
    res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html.replace('<head>', '<head><meta name="robots" content="noindex">'));
  }
  const url = `${SITE}/blog/${encodeURIComponent(post.slug)}`;
  const id = yid(post.video);
  const img = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : `${SITE}/images/hero4.jpg`;
  const paras = String(post.description || '').split('\n').filter(Boolean);
  const desc = (paras[0] || post.title).slice(0, 160);
  const title = `${post.title} | NJ Tulunde Urban Feeds`;
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: desc, image: img, datePublished: post.created_at, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'NJ Tulunde Urban Feeds' }, publisher: { '@type': 'Organization', name: 'NJ Tulunde Urban Feeds', logo: { '@type': 'ImageObject', url: SITE + '/images/logo.png' } } };
  html = html
    .replace(/<title>.*?<\/title>/, () => `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${esc(desc)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, () => `<meta property="og:title" content="${esc(post.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, () => `<meta property="og:description" content="${esc(desc)}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, () => `<meta property="og:image" content="${esc(img)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, () => `<meta property="og:url" content="${esc(url)}">`)
    .replace(/<meta property="og:type" content="[^"]*">/, () => '<meta property="og:type" content="article">')
    .replace(/<meta name="twitter:title" content="[^"]*">/, () => `<meta name="twitter:title" content="${esc(post.title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, () => `<meta name="twitter:description" content="${esc(desc)}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/, () => `<meta name="twitter:image" content="${esc(img)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, () => `<link rel="canonical" href="${esc(url)}">`)
    .replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, (m) => m.replace(/href="[^"]*"/, `href="${esc(url)}"`))
    .replace('</head>', () => `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script></head>`)
    .replace(/(<div id="blog"[^>]*>)<\/div>/, (m, open) => `${open}<h1>${esc(post.title)}</h1>${paras.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
  res.status(200).send(html);
};
