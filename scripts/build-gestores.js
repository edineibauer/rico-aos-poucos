#!/usr/bin/env node
/**
 * Build script: Generates gestora data JSONs, HTML shells, and updates FII links.
 *
 * Usage: node scripts/build-gestores.js
 *
 * Outputs:
 *   data/gestores/{slug}.json       – one per gestora
 *   data/gestores-index.json        – aggregated index for listing page
 *   gestores/{slug}/index.html      – HTML shell (skips existing pages)
 *   data/fiis/*.json                – updates gestora.link field
 *   sitemap.xml                     – appends new gestora URLs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIIS_DIR = path.join(ROOT, 'data', 'fiis');
const GESTORES_DATA_DIR = path.join(ROOT, 'data', 'gestores');
const GESTORES_HTML_DIR = path.join(ROOT, 'gestores');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');

// ──────────────────────────────────────────────────
// Normalization map: raw gestora name → { slug, display }
// ──────────────────────────────────────────────────
const NORMALIZATION = {
  // BTG Pactual variants (14 FIIs)
  'BTG Pactual': { slug: 'btg-pactual', display: 'BTG Pactual' },
  'BTG Pactual (Administrador)': { slug: 'btg-pactual', display: 'BTG Pactual' },
  'BTG Pactual (Administradora)': { slug: 'btg-pactual', display: 'BTG Pactual' },
  'BTG Pactual (Administração)': { slug: 'btg-pactual', display: 'BTG Pactual' },
  'BTG Pactual (Gestão Passiva)': { slug: 'btg-pactual', display: 'BTG Pactual' },
  'BTG Pactual Gestora de Recursos': { slug: 'btg-pactual', display: 'BTG Pactual' },
  'BTG Pactual Gestora': { slug: 'btg-pactual', display: 'BTG Pactual' },

  // Patria Investimentos variants (8 FIIs)
  'Patria Investimentos': { slug: 'patria-investimentos', display: 'Patria Investimentos' },
  'Pátria Investimentos': { slug: 'patria-investimentos', display: 'Patria Investimentos' },
  'Patria - VBI Securities': { slug: 'patria-investimentos', display: 'Patria Investimentos' },

  // Hedge Investments (7 FIIs)
  'Hedge Investments': { slug: 'hedge-investments', display: 'Hedge Investments' },

  // Alianza (3 FIIs)
  'Alianza Gestão de Recursos': { slug: 'alianza', display: 'Alianza Gestão de Recursos' },

  // Existing pages (preserved)
  'Guardian Gestora': { slug: 'guardian', display: 'Guardian Gestora' },
  'BlueMacaw Gestora de Recursos': { slug: 'bluemacaw', display: 'BlueMacaw Gestora' },
  'Mérito Investimentos': { slug: 'merito', display: 'Mérito Investimentos' },

  // Tivio Capital (3 FIIs)
  'Tivio Capital': { slug: 'tivio-capital', display: 'Tivio Capital' },

  // Caixa Asset variants (3 FIIs - excl Sequoia)
  'Caixa Asset': { slug: 'caixa-asset', display: 'Caixa Asset' },
  'Caixa Asset + Rio Bravo': { slug: 'caixa-asset', display: 'Caixa Asset' },

  // Devant Asset (2 FIIs)
  'Devant Asset': { slug: 'devant-asset', display: 'Devant Asset' },

  // Capitânia (2 FIIs)
  'Capitânia Investimentos': { slug: 'capitania', display: 'Capitânia Investimentos' },

  // Coinvalores (2 FIIs)
  'Coinvalores CCVM': { slug: 'coinvalores', display: 'Coinvalores CCVM' },

  // Galapagos Capital (2 FIIs)
  'Galapagos Capital': { slug: 'galapagos-capital', display: 'Galapagos Capital' },

  // Hectare Capital variants (2 FIIs)
  'Hectare Capital': { slug: 'hectare-capital', display: 'Hectare Capital' },
  'Hectare Capital Gestora de Recursos': { slug: 'hectare-capital', display: 'Hectare Capital' },

  // Unitas variants (2 FIIs)
  'Unitas Real Estate': { slug: 'unitas', display: 'Unitas Real Estate' },
  'Unitas Real Estate / BR-Capital': { slug: 'unitas', display: 'Unitas Real Estate' },

  // Names with extra info in parentheses or slashes
  'Caixa Economica Federal / Sequoia Properties': { slug: 'sequoia-properties', display: 'Sequoia Properties' },
  'Housi / Vortx': { slug: 'housi', display: 'Housi' },
  'JPP Capital / Fator ORE Asset': { slug: 'jpp-capital', display: 'JPP Capital' },
  'Navi Capital / BRL Trust DTVM': { slug: 'navi-capital', display: 'Navi Capital' },
  'Zagros Capital (GGR Gestão de Recursos)': { slug: 'zagros-capital', display: 'Zagros Capital' },
  'Zion Gestão de Recursos (Gestor) / Master S/A (Admin)': { slug: 'zion-gestao', display: 'Zion Gestão de Recursos' },
  'Open Capital Gestão de Ativos (Open Kapital)': { slug: 'open-capital', display: 'Open Capital' },
  'Patagonia Capital + Vortx': { slug: 'patagonia-capital', display: 'Patagonia Capital' },
  'Arch Capital (ex-Autonomy Investimentos)': { slug: 'arch-capital', display: 'Arch Capital' },
  'Rio Bravo Investimentos DTVM Ltda.': { slug: 'rio-bravo', display: 'Rio Bravo Investimentos' },
  'Banestes DTVM S.A.': { slug: 'banestes', display: 'Banestes DTVM' },
  'XP Vista Asset Management': { slug: 'xp-vista', display: 'XP Vista Asset' },
  'Oliveira Trust DTVM': { slug: 'oliveira-trust', display: 'Oliveira Trust' },
  'Bradesco Asset Management': { slug: 'bradesco-asset', display: 'Bradesco Asset' },
  'V2 Investimentos': { slug: 'v2-investimentos', display: 'V2 Investimentos' },
  'VBI Real Estate': { slug: 'vbi-real-estate', display: 'VBI Real Estate' },
};

// Existing HTML pages that should NOT be overwritten
const EXISTING_PAGES = new Set(['guardian', 'bluemacaw', 'merito']);

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

/** Generate a URL-safe slug from a name */
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Normalize a gestora name → { slug, display } */
function normalize(rawName) {
  if (NORMALIZATION[rawName]) return NORMALIZATION[rawName];
  // Fallback: generate from raw name
  return { slug: slugify(rawName), display: rawName };
}

/** Note label from numeric score */
function notaLabel(nota) {
  if (nota >= 8) return 'EXCELENTE';
  if (nota >= 6) return 'BOM';
  if (nota >= 4) return 'REGULAR';
  return 'RUIM';
}

/** Avaliacao (lowercase) from numeric score */
function avaliacao(nota) {
  if (nota >= 8) return 'excelente';
  if (nota >= 6) return 'bom';
  if (nota >= 4) return 'regular';
  return 'ruim';
}

/** Badge color class based on avaliação */
function badgeColor(av) {
  const map = { excelente: 'emerald', bom: 'blue', regular: 'amber', ruim: 'red' };
  return map[av] || 'slate';
}

/** Round to 1 decimal */
function round1(n) { return Math.round(n * 10) / 10; }

// ──────────────────────────────────────────────────
// Main build
// ──────────────────────────────────────────────────

function main() {
  console.log('=== Build Gestores ===\n');

  // 1. Read all FII JSONs
  const fiiFiles = fs.readdirSync(FIIS_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${fiiFiles.length} FII data files`);

  // 2. Group FIIs by normalized gestora
  const gestoraMap = {}; // slug → { display, fiis: [...] }

  for (const file of fiiFiles) {
    const filePath = path.join(FIIS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const ticker = file.replace('.json', '').toUpperCase();

    const gestoraRaw = data.gestora && data.gestora.nome;
    if (!gestoraRaw) {
      console.warn(`  SKIP ${ticker}: no gestora.nome`);
      continue;
    }

    const { slug, display } = normalize(gestoraRaw);

    if (!gestoraMap[slug]) {
      gestoraMap[slug] = { display, fiis: [] };
    }

    const nota = data.recomendacao ? data.recomendacao.nota : null;
    const segmento = data.meta ? data.meta.segmento : '';
    const sentimento = data.meta ? data.meta.sentimento : '';
    const dy = data.indicadores ? data.indicadores.dividendYield : null;
    const pvp = data.indicadores ? data.indicadores.pvp : null;
    const nome = data.meta ? data.meta.nome : ticker;

    gestoraMap[slug].fiis.push({
      ticker,
      nome,
      segmento,
      nota,
      notaLabel: nota !== null ? notaLabel(nota) : 'N/A',
      dividendYield: dy,
      pvp,
      sentimento,
      _filePath: filePath // for updating gestora.link later
    });
  }

  const slugs = Object.keys(gestoraMap).sort();
  console.log(`Grouped into ${slugs.length} gestoras\n`);

  // 3. Ensure output directories
  if (!fs.existsSync(GESTORES_DATA_DIR)) fs.mkdirSync(GESTORES_DATA_DIR, { recursive: true });

  const gestoresIndex = []; // for gestores-index.json
  const newSitemapEntries = []; // for sitemap update

  for (const slug of slugs) {
    const { display, fiis } = gestoraMap[slug];

    // Sort FIIs by nota descending
    fiis.sort((a, b) => (b.nota || 0) - (a.nota || 0));

    // Calculate average nota (exclude nulls/0)
    const validNotas = fiis.map(f => f.nota).filter(n => n !== null && n > 0);
    const avgNota = validNotas.length > 0
      ? round1(validNotas.reduce((a, b) => a + b, 0) / validNotas.length)
      : 0;

    // Unique segments
    const segmentos = [...new Set(fiis.map(f => f.segmento).filter(Boolean))];

    // Auto-generate summary
    const fundosText = fiis.length === 1 ? '1 fundo' : `${fiis.length} fundos`;
    const tickers = fiis.map(f => f.ticker).join(', ');
    const resumo = `Gestora com ${fundosText} analisados: ${tickers}. Nota média ${avgNota}/10 (${notaLabel(avgNota)}).`;

    const av = avaliacao(avgNota);
    const nl = notaLabel(avgNota);

    // Build gestora JSON
    const gestoraData = {
      slug,
      nome: display,
      nota: avgNota,
      notaLabel: nl,
      avaliacao: av,
      totalFundos: fiis.length,
      segmentos,
      resumo,
      seo: {
        title: `${display} - Análise da Gestora | Rico aos Poucos`,
        description: `Análise da gestora ${display}. ${fundosText} geridos com nota média ${avgNota}/10. Veja os FIIs: ${tickers}.`,
        ogTitle: `${display} - Análise da Gestora de FIIs`,
        ogDescription: `${display}: ${fundosText}, nota média ${avgNota}/10. Fundos: ${tickers}.`,
        twitterTitle: `${display} - Gestora de FIIs | Rico aos Poucos`,
        twitterDescription: `Análise da ${display}: ${fundosText}, nota ${avgNota}/10.`
      },
      fundos: fiis.map(f => ({
        ticker: f.ticker,
        nome: f.nome,
        segmento: f.segmento,
        nota: f.nota,
        notaLabel: f.notaLabel,
        dividendYield: f.dividendYield,
        pvp: f.pvp,
        sentimento: f.sentimento
      }))
    };

    // Write data JSON
    const jsonPath = path.join(GESTORES_DATA_DIR, `${slug}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(gestoraData, null, 2), 'utf-8');
    console.log(`  data/gestores/${slug}.json (${fiis.length} FIIs, nota ${avgNota})`);

    // Add to index
    gestoresIndex.push({
      slug,
      nome: display,
      nota: avgNota,
      notaLabel: nl,
      avaliacao: av,
      totalFundos: fiis.length,
      segmentos,
      resumo,
      tickers: fiis.map(f => f.ticker)
    });

    // Generate HTML shell (skip existing pages)
    const htmlDir = path.join(GESTORES_HTML_DIR, slug);
    if (!EXISTING_PAGES.has(slug)) {
      if (!fs.existsSync(htmlDir)) fs.mkdirSync(htmlDir, { recursive: true });
      const htmlPath = path.join(htmlDir, 'index.html');
      fs.writeFileSync(htmlPath, generateHTML(gestoraData), 'utf-8');
      console.log(`  gestores/${slug}/index.html`);
    } else {
      console.log(`  gestores/${slug}/ (PRESERVED - existing page)`);
    }

    // Track new sitemap entries
    newSitemapEntries.push(slug);

    // Update gestora.link in FII JSONs
    const gestoraLink = `../../gestores/${slug}/`;
    for (const fii of fiis) {
      const fiiData = JSON.parse(fs.readFileSync(fii._filePath, 'utf-8'));
      if (fiiData.gestora) {
        fiiData.gestora.link = gestoraLink;
        fs.writeFileSync(fii._filePath, JSON.stringify(fiiData, null, 2), 'utf-8');
      }
    }
  }

  // Sort index by nota descending
  gestoresIndex.sort((a, b) => b.nota - a.nota);

  // Write gestores-index.json
  const indexPath = path.join(ROOT, 'data', 'gestores-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(gestoresIndex, null, 2), 'utf-8');
  console.log(`\ndata/gestores-index.json (${gestoresIndex.length} gestoras)`);

  // Update sitemap
  updateSitemap(newSitemapEntries);

  console.log('\n=== Done! ===');
  console.log(`  ${slugs.length} gestoras processed`);
  console.log(`  ${fiiFiles.length} FII JSONs updated`);
}

// ──────────────────────────────────────────────────
// HTML Shell Generator
// ──────────────────────────────────────────────────

function generateHTML(data) {
  const { slug, nome, nota, notaLabel: nl, avaliacao: av } = data;
  const seo = data.seo;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seo.title}</title>
    <meta name="description" content="${seo.description}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://ricoaospoucos.com.br/gestores/${slug}/">

    <meta name="author" content="Rico aos Poucos">

    <meta property="og:title" content="${seo.ogTitle}">
    <meta property="og:description" content="${seo.ogDescription}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://ricoaospoucos.com.br/gestores/${slug}/">
    <meta property="og:image" content="https://ricoaospoucos.com.br/icon-512.png">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="Rico aos Poucos">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@ricoaospoucos">
    <meta name="twitter:title" content="${seo.twitterTitle}">
    <meta name="twitter:description" content="${seo.twitterDescription}">
    <meta name="twitter:image" content="https://ricoaospoucos.com.br/icon-512.png">

    <meta name="theme-color" content="#0d1117">

    <link rel="icon" type="image/png" sizes="192x192" href="../../icon-192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="../../icon-512.png">
    <link rel="icon" type="image/svg+xml" href="../../favicon.svg">
    <link rel="shortcut icon" href="../../icon-192.png">

    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="../../css/fii-page.css">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "${nome}",
        "description": "${seo.description}",
        "url": "https://ricoaospoucos.com.br/gestores/${slug}/"
    }
    </script>
</head>
<body class="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
    <div class="page-wrapper">

    <!-- Loading Skeleton -->
    <div id="gestora-loading" style="padding: 20px; max-width: 1280px; margin: 0 auto;">
        <div class="fii-skeleton" style="height: 60px; margin-bottom: 16px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
        <div class="fii-skeleton" style="height: 200px; margin-bottom: 24px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
            <div class="fii-skeleton" style="height: 100px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
            <div class="fii-skeleton" style="height: 100px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
            <div class="fii-skeleton" style="height: 100px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
        </div>
        <div class="fii-skeleton" style="height: 300px;"><div class="fii-skeleton-pulse" style="height: 100%;"></div></div>
    </div>

    <!-- Template renders here -->
    <div id="gestora-root" style="display: none;"></div>

    </div>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="../../js/gestora-template.js"></script>
    <script>GestoraTemplate.init({ dataUrl: '../../data/gestores/${slug}.json' });</script>
</body>
</html>`;
}

// ──────────────────────────────────────────────────
// Sitemap Update
// ──────────────────────────────────────────────────

function updateSitemap(slugs) {
  let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const today = new Date().toISOString().split('T')[0];

  // Find existing gestora URLs to avoid duplicates
  const existingGestores = new Set();
  const gestorRegex = /ricoaospoucos\.com\.br\/gestores\/([^/]+)\//g;
  let match;
  while ((match = gestorRegex.exec(sitemap)) !== null) {
    existingGestores.add(match[1]);
  }

  // Build new entries
  let newEntries = '';
  for (const slug of slugs) {
    if (existingGestores.has(slug)) continue;
    newEntries += `
  <!-- Gestor: ${slug} -->
  <url>
    <loc>https://ricoaospoucos.com.br/gestores/${slug}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }

  if (newEntries) {
    // Insert before closing </urlset>
    sitemap = sitemap.replace('</urlset>', newEntries + '\n</urlset>');
    fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf-8');
    const count = (newEntries.match(/<url>/g) || []).length;
    console.log(`\nSitemap: added ${count} new gestora URLs`);
  } else {
    console.log('\nSitemap: no new URLs needed');
  }
}

main();
