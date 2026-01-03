/**
 * Rico aos Poucos - JavaScript Principal
 * ======================================
 */

// Toggle Menu Mobile
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('nav ul');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }

  // Fecha menu ao clicar em um link (mobile)
  const navLinks = document.querySelectorAll('nav ul li a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu) navMenu.classList.remove('active');
    });
  });

  // Marca item ativo no menu baseado na URL atual
  const currentPath = window.location.pathname;
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (currentPath.includes(href) && href !== '/') {
      link.classList.add('active');
    } else if (currentPath === '/' && href === '/') {
      link.classList.add('active');
    }
  });

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

  document.querySelectorAll('.card, .artigo-item, .perfil-card').forEach(el => {
    observer.observe(el);
  });

  // Renderiza gráfico de pizza se existir
  renderPieChart();

  // Inicializa carrossel da home se existir
  initHomeCarousel();

  // Inicializa parallax background
  initParallaxBackground();

  // Inicializa breaking news slider
  initBreakingNewsSlider();
});

/**
 * Carrossel da Home Page
 */
function initHomeCarousel() {
  const carousel = document.querySelector('.spotlight-carousel');
  if (!carousel) return;

  const slides = carousel.querySelectorAll('.carousel-slide');
  const indicators = carousel.querySelectorAll('.indicator');
  const prevBtn = carousel.querySelector('.carousel-btn.prev');
  const nextBtn = carousel.querySelector('.carousel-btn.next');

  if (slides.length === 0) return;

  let currentIndex = 0;
  let autoplayInterval;
  const autoplayDelay = 6000; // 6 segundos

  // Função para ir para um slide específico
  function goToSlide(index) {
    // Remove classes de todos os slides
    slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev');
      if (i < index) {
        slide.classList.add('prev');
      }
    });

    // Atualiza indicadores
    indicators.forEach((indicator, i) => {
      indicator.classList.toggle('active', i === index);
    });

    // Ativa o slide atual
    slides[index].classList.add('active');
    currentIndex = index;
  }

  // Próximo slide
  function nextSlide() {
    const next = (currentIndex + 1) % slides.length;
    goToSlide(next);
  }

  // Slide anterior
  function prevSlide() {
    const prev = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(prev);
  }

  // Inicia autoplay
  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(nextSlide, autoplayDelay);
  }

  // Para autoplay
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  }

  // Event listeners para botões
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoplay(); // Reinicia o timer
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoplay(); // Reinicia o timer
    });
  }

  // Event listeners para indicadores
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      goToSlide(index);
      startAutoplay(); // Reinicia o timer
    });
  });

  // Pausa autoplay quando o mouse está sobre o carrossel
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  // Suporte a touch/swipe
  let touchStartX = 0;
  let touchEndX = 0;

  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    startAutoplay();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide(); // Swipe para esquerda = próximo
      } else {
        prevSlide(); // Swipe para direita = anterior
      }
    }
  }

  // Suporte a teclas de seta
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.home-page')) {
      if (e.key === 'ArrowRight') {
        nextSlide();
        startAutoplay();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
        startAutoplay();
      }
    }
  });

  // Inicia o carrossel
  goToSlide(0);
  startAutoplay();
}

/**
 * Renderiza gráfico de pizza em CSS/SVG
 */
function renderPieChart() {
  const chartContainer = document.querySelector('.pie-chart');
  if (!chartContainer) return;

  // Dados do gráfico vêm do data-attribute ou são padrão
  const dataStr = chartContainer.getAttribute('data-values');
  const colorsStr = chartContainer.getAttribute('data-colors');

  if (!dataStr) return;

  const values = dataStr.split(',').map(Number);
  const colors = colorsStr ? colorsStr.split(',') : [
    '#1a5f4a', '#2d8a6e', '#f4a261', '#e76f51', '#58a6ff', '#f0c14b'
  ];

  const total = values.reduce((a, b) => a + b, 0);
  let currentAngle = 0;

  let gradientParts = [];
  values.forEach((value, index) => {
    const percentage = (value / total) * 100;
    const nextAngle = currentAngle + (value / total) * 360;

    gradientParts.push(`${colors[index]} ${currentAngle}deg ${nextAngle}deg`);
    currentAngle = nextAngle;
  });

  chartContainer.style.background = `conic-gradient(${gradientParts.join(', ')})`;
}

/**
 * Formata data para exibição
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: months[date.getMonth()],
    year: date.getFullYear()
  };
}

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
 * Filtro de conteúdo por perfil de investidor
 */
function filterByPerfil(perfil) {
  const items = document.querySelectorAll('[data-perfil]');
  items.forEach(item => {
    if (perfil === 'todos' || item.dataset.perfil.includes(perfil)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });

  // Atualiza botões ativos
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === perfil) {
      btn.classList.add('active');
    }
  });
}

/**
 * Filtro de conteúdo por nível
 */
function filterByNivel(nivel) {
  const items = document.querySelectorAll('[data-nivel]');
  items.forEach(item => {
    if (nivel === 'todos' || item.dataset.nivel === nivel) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * Copia texto para clipboard
 */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Link copiado!');
  }).catch(err => {
    console.error('Erro ao copiar:', err);
  });
}

/**
 * Mostra toast notification
 */
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--primary);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Compartilhar página
 */
function sharePage() {
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: window.location.href
    }).catch(console.error);
  } else {
    copyToClipboard(window.location.href);
  }
}

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
