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
      navMenu.classList.remove('active');
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
});

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
