/**
 * Share Instagram — botão compartilhamento direto a partir do artigo/slides.
 *
 * Estratégia:
 * 1. Em mobile com Web Share API + suporte a files: gera PNGs e abre o
 *    sistema de share nativo (Instagram aparece na lista, abre direto a
 *    criação de carrossel).
 * 2. Fallback (desktop ou navegadores sem suporte): redireciona para a
 *    página -instagram.html que tem UI completa com botão de download
 *    em massa, OU baixa direto se a página instagram não existir.
 *
 * Usa html-to-image para renderizar os cards em PNG 1080x1350 (4:5 IG).
 *
 * Buscar cards: por padrão, espera elementos `.ig-card` na própria página.
 * Se não houver, abre a versão -instagram.html da página atual.
 */
(function () {
  const btn = document.querySelector('[data-share-instagram]');
  if (!btn) return;

  // Detecta se há cards na página atual; se não houver, navega para a versão IG.
  const cardsInPage = Array.from(document.querySelectorAll('.ig-card'));
  const igPageHref = btn.dataset.instagramPage || null; // ex.: "trxf11-...-instagram.html"

  const ensureLib = () => new Promise((resolve, reject) => {
    if (window.htmlToImage) return resolve(window.htmlToImage);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js';
    s.onload = () => resolve(window.htmlToImage);
    s.onerror = () => reject(new Error('Falha ao carregar html-to-image'));
    document.head.appendChild(s);
  });

  const dataUrlToFile = async (dataUrl, filename) => {
    const r = await fetch(dataUrl);
    const blob = await r.blob();
    return new File([blob], filename, { type: 'image/png' });
  };

  const download = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const slug = (document.body.dataset.slug
    || (location.pathname.split('/').pop() || '').replace(/\.html$/, '')
    || 'carrossel').replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  btn.addEventListener('click', async (ev) => {
    ev.preventDefault();

    // Caso 1: Há cards na própria página (ex: a página -instagram.html aberta direto)
    if (cardsInPage.length > 0) {
      await renderAndShare(cardsInPage);
      return;
    }

    // Caso 2: Estamos na página de artigo/slides — usar Web Share API com a URL
    // do site. Em mobile, isso já abre o seletor que inclui Instagram (compartilhar
    // como link). Para o caso "imagens prontas pra postar", redirecionamos para
    // a página -instagram.html, onde o user baixa os PNGs com 1 clique.
    if (igPageHref) {
      // Tenta share nativo se for mobile (compartilha o link do artigo)
      const canShareLink = navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (canShareLink) {
        try {
          await navigator.share({
            title: document.title || 'Rico aos Poucos',
            text: 'Veja a análise completa em formato carrossel para Instagram.',
            url: new URL(igPageHref, location.href).href,
          });
          return;
        } catch (e) {
          // user cancelou ou falhou — segue para o fallback
        }
      }
      // Desktop / sem share API → abre a página IG (com botão de download dos PNGs)
      location.href = igPageHref;
      return;
    }

    alert('Configuração ausente: data-instagram-page ou .ig-card.');
  });

  async function renderAndShare(cards) {
    btn.classList.add('loading');
    btn.disabled = true;
    try {
      const lib = await ensureLib();
      const files = [];
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const dataUrl = await lib.toPng(card, {
          width: 1080,
          height: 1350,
          pixelRatio: 1,
          style: {
            width: '1080px',
            height: '1350px',
            transform: 'scale(1)',
            transformOrigin: 'top left',
          },
          cacheBust: true,
          backgroundColor: '#0d1117',
        });
        const file = await dataUrlToFile(dataUrl, `${slug}-${String(i + 1).padStart(2, '0')}.png`);
        files.push(file);
        await new Promise((r) => setTimeout(r, 80));
      }

      // Tenta Web Share API com files (Android/iOS modernos)
      if (navigator.canShare && navigator.canShare({ files }) && navigator.share) {
        try {
          await navigator.share({
            title: 'Rico aos Poucos · Carrossel Instagram',
            files,
          });
          return;
        } catch (e) {
          // user cancelou — não é erro
          if (e && e.name !== 'AbortError') console.warn(e);
        }
      }

      // Fallback: download em massa (desktop)
      for (let i = 0; i < cards.length; i++) {
        const f = files[i];
        const reader = new FileReader();
        const dataUrl = await new Promise((res) => { reader.onload = () => res(reader.result); reader.readAsDataURL(f); });
        download(dataUrl, f.name);
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (err) {
      console.error(err);
      alert('Não foi possível gerar as imagens: ' + err.message);
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }
})();
