const sidebar = document.querySelector("[data-sidebar]");
const sidebarToggles = Array.from(document.querySelectorAll("[data-sidebar-toggle]"));
const overlay = document.querySelector('[data-overlay]');

function openSidebar() {
  if (!sidebar) return;
  sidebar.classList.add('open');
  if (overlay) overlay.classList.add('active');
}

function closeSidebar() {
  if (!sidebar) return;
  sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

sidebarToggles.forEach(btn => btn.addEventListener('click', () => {
  if (!sidebar) return;
  if (sidebar.classList.contains('open')) closeSidebar(); else openSidebar();
}));

if (overlay) {
  overlay.addEventListener('click', closeSidebar);
}

// ensure sidebar is closed on page load
document.addEventListener('DOMContentLoaded', () => {
  closeSidebar();
});

document.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.matches('.menu-item') || target.closest('.menu-item')) {
    const item = target.matches('.menu-item') ? target : target.closest('.menu-item');
    document.querySelectorAll('.menu-item').forEach((m) => m.classList.remove('active'));
    item.classList.add('active');
    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  }
  if (target.matches('[data-logout]') || target.closest('[data-logout]')) {
    e.preventDefault();
    localStorage.removeItem('auth');
    window.location.href = 'login.html';
  }
});

const currentPath = window.location.pathname.split("/").pop();
const menuItems = document.querySelectorAll(".menu-item");

menuItems.forEach((item) => {
  if (item.getAttribute("href") === currentPath) {
    item.classList.add("active");
  }
});

// if logo image exists hide the text badge fallback
window.addEventListener('load', () => {
  const logoImg = document.querySelector('.logo-img');
  const badge = document.querySelector('.logo-badge');
  if (logoImg && badge) {
    if (logoImg.naturalWidth && logoImg.naturalHeight) {
      badge.style.display = 'none';
    }
    // if image later loads (cached) ensure badge hidden
    logoImg.addEventListener('load', () => {
      if (logoImg.naturalWidth && logoImg.naturalHeight) badge.style.display = 'none';
    });
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.matches("[data-favorito]")) {
    if (target.classList.contains('fav-btn')) {
      target.classList.toggle('is-favorito');
      target.textContent = target.classList.contains('is-favorito') ? '♥' : '♡';
    } else {
      target.classList.toggle("is-favorito");
      target.textContent = target.classList.contains("is-favorito") ? "Favoritado" : "Favoritar";
    }
  }

  if (target.matches("[data-carrinho]")) {
    target.classList.toggle('in-cart');
    target.textContent = target.classList.contains('in-cart') ? 'ADICIONADO' : 'COMPRAR';
  }
});

/* Carousel behavior */
(() => {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(carousel.querySelectorAll('.slide'));
  const prev = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  const dotsWrap = carousel.querySelector('.carousel-dots');
  let index = 0;
  let interval = null;
  const delay = 4000;

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${ -index * 100 }%)`;
    updateDots();
  }

  function updateDots() {
    if (!dotsWrap) return;
    const dots = Array.from(dotsWrap.querySelectorAll('button'));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === index));
  }

  function createDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.addEventListener('click', () => {
        go(i);
        restart();
      });
      dotsWrap.appendChild(btn);
    });
    updateDots();
  }

  function start() {
    if (interval) return;
    interval = setInterval(() => go(index + 1), delay);
  }

  function stop() {
    if (!interval) return;
    clearInterval(interval);
    interval = null;
  }

  function restart() { stop(); start(); }

  if (prev) prev.addEventListener('click', () => { go(index - 1); restart(); });
  if (next) next.addEventListener('click', () => { go(index + 1); restart(); });

  let startX = 0;
  let deltaX = 0;
  track.addEventListener('pointerdown', (e) => {
    stop();
    startX = e.clientX;
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', (e) => {
    if (!startX) return;
    deltaX = e.clientX - startX;
  });
  track.addEventListener('pointerup', (e) => {
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) go(index + 1); else go(index - 1);
    }
    startX = 0; deltaX = 0; restart();
  });

  createDots();
  go(0);
  start();
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
})();
