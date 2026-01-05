/**
 * Rico aos Poucos - JavaScript Principal
 * ======================================
 */

document.addEventListener('DOMContentLoaded', function() {
  // Animação de fade-in nos elementos
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.card, .artigo-item, .summary-card').forEach(el => {
    observer.observe(el);
  });

  // Inicializa parallax background
  initParallaxBackground();

  // Inicializa breaking news slider
  initBreakingNewsSlider();
});

/**
 * Smooth scroll para âncoras
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

/**
 * Parallax Background Effect
 */
function initParallaxBackground() {
  const parallaxBg = document.querySelector('.parallax-bg');
  if (!parallaxBg) return;

  const layers = parallaxBg.querySelectorAll('.parallax-layer, .parallax-particles');
  if (layers.length === 0) return;

  let ticking = false;
  let lastScrollY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;

  // Parallax on scroll
  function updateParallax() {
    const scrollY = window.scrollY;

    layers.forEach(layer => {
      const speed = parseFloat(layer.dataset.speed) || 0.2;
      const yOffset = scrollY * speed;
      layer.style.transform = `translate3d(0, ${yOffset}px, 0)`;
    });

    ticking = false;
  }

  // Parallax on mouse move (subtle effect)
  function updateMouseParallax(e) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const mouseX = (e.clientX - centerX) / centerX;
    const mouseY = (e.clientY - centerY) / centerY;

    layers.forEach(layer => {
      const speed = parseFloat(layer.dataset.speed) || 0.2;
      const xOffset = mouseX * 20 * speed;
      const yOffset = mouseY * 20 * speed + (lastScrollY * speed);
      layer.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
    });
  }

  // Scroll listener
  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  // Mouse move listener (desktop only)
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', (e) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      requestAnimationFrame(() => updateMouseParallax(e));
    }, { passive: true });
  }
}

/**
 * Breaking News Horizontal Slider
 */
function initBreakingNewsSlider() {
  const slider = document.getElementById('newsSlider');
  if (!slider) return;

  const track = slider.querySelector('.news-track');
  if (!track) return;

  const items = track.querySelectorAll('.news-item');
  if (items.length === 0) return;

  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationId = null;
  let currentIndex = 0;

  // Calculate boundaries
  function getMaxTranslate() {
    const trackWidth = track.scrollWidth;
    const sliderWidth = slider.offsetWidth;
    return Math.max(0, trackWidth - sliderWidth);
  }

  // Set position with bounds checking
  function setPosition() {
    const maxTranslate = getMaxTranslate();
    currentTranslate = Math.max(-maxTranslate, Math.min(0, currentTranslate));
    track.style.transform = `translateX(${currentTranslate}px)`;
  }

  // Animation loop
  function animate() {
    setPosition();
    if (isDragging) {
      animationId = requestAnimationFrame(animate);
    }
  }

  // Touch events
  function touchStart(e) {
    isDragging = true;
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    prevTranslate = currentTranslate;
    slider.style.cursor = 'grabbing';
    track.style.transition = 'none';
    animationId = requestAnimationFrame(animate);
  }

  function touchMove(e) {
    if (!isDragging) return;
    const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX;
    currentTranslate = prevTranslate + diff;
  }

  function touchEnd() {
    isDragging = false;
    cancelAnimationFrame(animationId);
    slider.style.cursor = 'grab';
    track.style.transition = 'transform 0.3s ease-out';

    // Snap to boundaries
    const maxTranslate = getMaxTranslate();
    if (currentTranslate > 0) {
      currentTranslate = 0;
    } else if (currentTranslate < -maxTranslate) {
      currentTranslate = -maxTranslate;
    }
    setPosition();
  }

  // Mouse events
  slider.addEventListener('mousedown', touchStart);
  slider.addEventListener('mousemove', touchMove);
  slider.addEventListener('mouseup', touchEnd);
  slider.addEventListener('mouseleave', () => {
    if (isDragging) touchEnd();
  });

  // Touch events
  slider.addEventListener('touchstart', touchStart, { passive: true });
  slider.addEventListener('touchmove', touchMove, { passive: true });
  slider.addEventListener('touchend', touchEnd);

  // Prevent click after drag
  slider.addEventListener('click', (e) => {
    if (Math.abs(currentTranslate - prevTranslate) > 5) {
      e.preventDefault();
    }
  });

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const maxTranslate = getMaxTranslate();
      if (currentTranslate < -maxTranslate) {
        currentTranslate = -maxTranslate;
        setPosition();
      }
    }, 100);
  });

  // Auto scroll animation (optional - subtle)
  let autoScrollDirection = -1;
  let autoScrollPaused = false;

  function autoScroll() {
    if (autoScrollPaused || isDragging) {
      requestAnimationFrame(autoScroll);
      return;
    }

    const maxTranslate = getMaxTranslate();
    currentTranslate += autoScrollDirection * 0.3;

    if (currentTranslate <= -maxTranslate) {
      autoScrollDirection = 1;
      currentTranslate = -maxTranslate;
    } else if (currentTranslate >= 0) {
      autoScrollDirection = -1;
      currentTranslate = 0;
    }

    setPosition();
    requestAnimationFrame(autoScroll);
  }

  // Start auto-scroll after a delay
  setTimeout(() => {
    if (getMaxTranslate() > 0) {
      requestAnimationFrame(autoScroll);
    }
  }, 3000);

  // Pause auto-scroll on interaction
  slider.addEventListener('mouseenter', () => { autoScrollPaused = true; });
  slider.addEventListener('mouseleave', () => { autoScrollPaused = false; });
  slider.addEventListener('touchstart', () => { autoScrollPaused = true; }, { passive: true });
  slider.addEventListener('touchend', () => {
    setTimeout(() => { autoScrollPaused = false; }, 2000);
  });
}
