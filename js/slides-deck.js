(function () {
  const track = document.querySelector('.deck-track');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.slide'));
  const total = slides.length;
  const counter = document.querySelector('.deck-counter');
  const progress = document.querySelector('.deck-progress .bar');
  const prevBtn = document.querySelector('.deck-nav .prev');
  const nextBtn = document.querySelector('.deck-nav .next');

  const setIndex = (i) => {
    const idx = Math.max(0, Math.min(total - 1, i));
    track.scrollTo({ left: idx * window.innerWidth, behavior: 'smooth' });
  };

  const currentIndex = () => Math.round(track.scrollLeft / window.innerWidth);

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

  document.addEventListener('keydown', (e) => {
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
})();
