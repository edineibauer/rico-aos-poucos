(function () {
  const exportBtn = document.querySelector('[data-export-png]');
  if (!exportBtn) return;

  const status = document.querySelector('[data-export-status]');
  const cards = Array.from(document.querySelectorAll('.ig-card'));

  const ensureLib = () => new Promise((resolve, reject) => {
    if (window.htmlToImage) return resolve(window.htmlToImage);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js';
    s.onload = () => resolve(window.htmlToImage);
    s.onerror = () => reject(new Error('Falha ao carregar html-to-image'));
    document.head.appendChild(s);
  });

  const download = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const slug = (document.body.dataset.slug || 'carrossel').replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    if (status) status.textContent = 'Carregando biblioteca de export…';
    try {
      const lib = await ensureLib();
      for (let i = 0; i < cards.length; i++) {
        if (status) status.textContent = `Renderizando slide ${i + 1} de ${cards.length}…`;
        const card = cards[i];
        // Renderiza em 1080x1350 (4:5) — aspect ratio do carrossel IG.
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
        download(dataUrl, `${slug}-${String(i + 1).padStart(2, '0')}.png`);
        await new Promise((r) => setTimeout(r, 120));
      }
      if (status) status.textContent = `${cards.length} imagens baixadas. Suba no Instagram como carrossel.`;
    } catch (err) {
      console.error(err);
      if (status) status.textContent = `Erro: ${err.message}. Tente novamente ou tire screenshot manual.`;
    } finally {
      exportBtn.disabled = false;
    }
  });
})();
