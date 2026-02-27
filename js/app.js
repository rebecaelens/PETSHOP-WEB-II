const sidebar = document.querySelector("[data-sidebar]");
const sidebarToggles = Array.from(document.querySelectorAll("[data-sidebar-toggle]"));
const overlay = document.querySelector('[data-overlay]');

function openSidebar() {
  if (!sidebar) return;
  sidebar.classList.add('open');
  if (overlay) overlay.classList.add('active');
  document.body.classList.add('sidebar-open');
}

function closeSidebar() {
  if (!sidebar) return;
  sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
  document.body.classList.remove('sidebar-open');
}

sidebarToggles.forEach(btn => btn.addEventListener('click', () => {
  if (!sidebar) return;
  if (sidebar.classList.contains('open')) closeSidebar(); else openSidebar();
}));

if (overlay) {
  overlay.addEventListener('click', closeSidebar);
}

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

window.addEventListener('load', () => {
  const logoImg = document.querySelector('.logo-img');
  const badge = document.querySelector('.logo-badge');
  if (logoImg && badge) {
    if (logoImg.naturalWidth && logoImg.naturalHeight) {
      badge.style.display = 'none';
    }
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

(() => {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(carousel.querySelectorAll('.slide'));
  const prev = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  const dotsWrap = carousel.querySelector('.carousel-dots');
  
  const MIN_ITEMS_FOR_CAROUSEL = 6;
  const shouldCarousel = slides.length >= MIN_ITEMS_FOR_CAROUSEL;
  
  let index = 0;
  let interval = null;
  const delay = 4000;

  function go(i) {
    if (!shouldCarousel) return;
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
    if (shouldCarousel) {
      updateDots();
      dotsWrap.classList.add('show');
    }
  }

  function start() {
    if (!shouldCarousel || interval) return;
    interval = setInterval(() => go(index + 1), delay);
  }

  function stop() {
    if (!interval) return;
    clearInterval(interval);
    interval = null;
  }

  function restart() { 
    if (!shouldCarousel) return;
    stop(); 
    start(); 
  }

  if (shouldCarousel) {
    if (prev) prev.classList.add('show');
    if (next) next.classList.add('show');
  }

  if (prev) prev.addEventListener('click', () => { go(index - 1); restart(); });
  if (next) next.addEventListener('click', () => { go(index + 1); restart(); });

  if (shouldCarousel) {
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

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
  }

  createDots();
  if (shouldCarousel) {
    go(0);
    start();
  }
})();

(() => {
  const updateUserArea = () => {
    const userName = document.querySelector('[data-user-name]');
    const authLink = document.querySelector('[data-auth-link]');
    const userAuth = document.querySelector('.user-auth');
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
      userName.textContent = currentUser;
      authLink.textContent = 'Sair';
      authLink.href = '#';
      authLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('cartItems');
        updateUserArea();
        updateCartBadge();
      });
    } else {
      userName.textContent = 'Entre ou cadastre-se';
      authLink.textContent = 'Entrar';
      authLink.href = 'login.html';
    }
  };

  const updateCartBadge = () => {
    const badge = document.querySelector('[data-cart-badge]');
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const itemCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    
    if (itemCount > 0) {
      badge.textContent = itemCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  };

  const showToast = (message) => {
    let toast = document.querySelector('.toast');
    if (toast) toast.remove();
    
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };

  const addToCart = (productId) => {
    const card = document.querySelector(`[data-product][id="${productId}"]`);
    if (!card) return;
    
    const titleEl = card.querySelector('.product-title');
    const priceEl = card.querySelector('.price-value');
    const productName = titleEl.textContent;
    const productPrice = parseFloat(priceEl.textContent);
    
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({ 
        id: productId, 
        name: productName,
        price: productPrice,
        quantity: 1 
      });
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartBadge();
  };

  const carrinhoButtons = document.querySelectorAll('[data-carrinho]');
  carrinhoButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('[data-product]');
      if (card) {
        const productId = card.id;
        const productName = card.querySelector('.product-title').textContent;
        addToCart(productId);
        showToast(`✓ ${productName} adicionado ao carrinho!`);
      }
    });
  });

  updateUserArea();
  updateCartBadge();
})();
