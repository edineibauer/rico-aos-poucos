(function () {
  const track = document.querySelector('.deck-track');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.slide'));
  const total = slides.length;
  const counter = document.querySelector('.deck-counter');
  const progress = document.querySelector('.deck-progress .bar');
  const prevBtn = document.querySelector('.deck-nav .prev');
  const nextBtn = document.querySelector('.deck-nav .next');

  // Largura efetiva do slide. Standalone usa 100vw; inline usa largura do
  // container (offsetWidth do próprio track).
  const slideWidth = () => {
    if (slides[0]) return slides[0].getBoundingClientRect().width || track.clientWidth;
    return track.clientWidth || window.innerWidth;
  };

  const setIndex = (i) => {
    const idx = Math.max(0, Math.min(total - 1, i));
    track.scrollTo({ left: idx * slideWidth(), behavior: 'smooth' });
  };

  const currentIndex = () => Math.round(track.scrollLeft / slideWidth());

  const update = () => {
    const idx = currentIndex();
    if (counter) counter.textContent = `${idx + 1} / ${total}`;
    if (progress) progress.style.width = `${((idx + 1) / total) * 100}%`;
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
  };

  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => setIndex(currentIndex()));

  if (prevBtn) prevBtn.addEventListener('click', () => setIndex(currentIndex() - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => setIndex(currentIndex() + 1));

  // Painel de slides está visível? (Inline: data-panel="slides" sem hidden.
  // Standalone: não tem .view-panel — sempre ativo.)
  const isVisible = () => {
    const panel = track.closest('.view-panel');
    if (!panel) return true;
    return !panel.hasAttribute('hidden');
  };

  document.addEventListener('keydown', (e) => {
    if (!isVisible()) return;
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      setIndex(currentIndex() + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      setIndex(currentIndex() - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setIndex(total - 1);
    } else if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
  });

  update();

  // API pública para article-tabs.js chamar quando o painel ficar visível
  // (recalcula scroll/contador depois que o layout estabilizou).
  window.SlidesDeck = {
    refresh() {
      // Aguarda 1 frame para CSS aplicar `display`, depois recalcula
      requestAnimationFrame(() => {
        track.scrollTo({ left: currentIndex() * slideWidth(), behavior: 'auto' });
        update();
      });
    },
    next() { setIndex(currentIndex() + 1); },
    prev() { setIndex(currentIndex() - 1); },
    goTo(i) { setIndex(i); },
  };
})();
