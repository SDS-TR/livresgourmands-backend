function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatPrice(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}

function wantsHtml(req) {
  const acceptsHeader = req.get('accept') || '';
  return acceptsHeader.includes('text/html');
}

function pageTemplate({ title, eyebrow, heading, intro, content }) {
  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          :root {
            --bg: #f6efe4;
            --panel: rgba(255, 250, 243, 0.94);
            --border: #e2cfb4;
            --text: #2f241d;
            --muted: #6f5a48;
            --accent: #a44a1d;
            --accent-soft: #f0d9be;
            --shadow: rgba(73, 46, 23, 0.08);
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            min-height: 100vh;
            font-family: Georgia, "Times New Roman", serif;
            color: var(--text);
            background:
              radial-gradient(circle at top left, rgba(228, 175, 114, 0.35), transparent 28%),
              radial-gradient(circle at bottom right, rgba(164, 74, 29, 0.18), transparent 24%),
              linear-gradient(160deg, #f7f1e8 0%, #f3e3cf 100%);
          }
          a {
            color: inherit;
            text-decoration: none;
          }
          .wrap {
            max-width: 1180px;
            margin: 0 auto;
            padding: 56px 24px 72px;
          }
          .hero {
            margin-bottom: 32px;
            padding: 28px;
            border: 1px solid var(--border);
            border-radius: 24px;
            background: var(--panel);
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 45px var(--shadow);
          }
          .eyebrow {
            margin: 0 0 8px;
            color: var(--accent);
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          h1 {
            margin: 0;
            font-size: clamp(2.2rem, 4vw, 4rem);
            line-height: 1.05;
          }
          .intro {
            max-width: 760px;
            margin: 14px 0 0;
            color: var(--muted);
            font-size: 1.05rem;
            line-height: 1.6;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
          }
          .card {
            padding: 24px;
            border: 1px solid var(--border);
            border-radius: 22px;
            background: var(--panel);
            box-shadow: 0 14px 32px var(--shadow);
          }
          .badge {
            display: inline-block;
            margin-bottom: 14px;
            padding: 6px 10px;
            border-radius: 999px;
            background: var(--accent-soft);
            color: var(--accent);
            font-size: 0.9rem;
            font-weight: 700;
          }
          .meta {
            color: var(--muted);
            font-size: 0.95rem;
            line-height: 1.5;
          }
          .empty {
            padding: 28px;
            border: 1px dashed var(--border);
            border-radius: 20px;
            background: rgba(255, 250, 243, 0.75);
            color: var(--muted);
          }
          .stack {
            display: grid;
            gap: 20px;
          }
          .section-title {
            margin: 0 0 12px;
            font-size: 1.4rem;
          }
          .list {
            display: grid;
            gap: 14px;
            padding: 0;
            margin: 0;
            list-style: none;
          }
          .list-item {
            padding: 18px 20px;
            border: 1px solid var(--border);
            border-radius: 18px;
            background: rgba(255, 250, 243, 0.92);
          }
          .cta {
            display: inline-block;
            margin-top: 18px;
            padding: 12px 18px;
            border-radius: 999px;
            background: var(--accent);
            color: #fff7f0;
            font-weight: 700;
          }
          .two-cols {
            display: grid;
            gap: 20px;
            grid-template-columns: 1.4fr 1fr;
          }
          @media (max-width: 820px) {
            .two-cols {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <main class="wrap">
          <section class="hero">
            <p class="eyebrow">${escapeHtml(eyebrow || '')}</p>
            <h1>${escapeHtml(heading || '')}</h1>
            <p class="intro">${escapeHtml(intro || '')}</p>
          </section>
          ${content}
        </main>
      </body>
    </html>
  `;
}

module.exports = {
  escapeHtml,
  formatDate,
  formatPrice,
  wantsHtml,
  pageTemplate,
};
