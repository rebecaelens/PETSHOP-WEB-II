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
    } else {
      target.classList.toggle("is-favorito");
      target.textContent = target.classList.contains("is-favorito") ? "Favoritado" : "Favoritar";
    }
  }

  if (target.matches("[data-carrinho]")) {
    target.classList.toggle('in-cart');
    target.textContent = target.classList.contains('in-cart') ? 'ADICIONADO' : 'COMPRAR';
  }

  if (target.matches("[data-pesar]")) {
    const card = target.closest('[data-product]');
    if (card) {
      const productId = card.id;
      const productName = card.querySelector('.product-title').textContent;
      showToast(`⚖️ ${productName} - Abra a página de pesagem (a implementar)`);
    }
  }
});

(() => {
  const query = new URLSearchParams(window.location.search);
  const selectedCategory = (query.get('cat') || 'all').toLowerCase();
  const searchTerm = (query.get('q') || '').trim().toLowerCase();

  const productCards = Array.from(document.querySelectorAll('[data-product]'));
  const categoryLinks = Array.from(document.querySelectorAll('.category-list a'));

  const parseCategories = (value) =>
    String(value || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

  const matchesCategory = (card) => {
    if (selectedCategory === 'all') {
      return true;
    }

    if (selectedCategory === 'promocoes') {
      return card.dataset.promocao === 'true';
    }

    const categories = parseCategories(card.dataset.category);
    return categories.includes(selectedCategory);
  };

  const matchesSearch = (card) => {
    if (!searchTerm) {
      return true;
    }

    const title = card.querySelector('.product-title')?.textContent?.toLowerCase() || '';
    const desc = card.querySelector('.product-desc')?.textContent?.toLowerCase() || '';

    return `${title} ${desc}`.includes(searchTerm);
  };

  productCards.forEach((card) => {
    const visible = matchesCategory(card) && matchesSearch(card);
    card.style.display = visible ? '' : 'none';
  });

  categoryLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkCategory = (new URL(href, window.location.origin).searchParams.get('cat') || 'all').toLowerCase();
    link.classList.toggle('is-active', linkCategory === selectedCategory);
  });
})();

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
  const DEFAULT_AVATAR = 'images/pfpuser.png';

  const updateUserArea = () => {
    const userName = document.querySelector('[data-user-name]');
    const authLink = document.querySelector('[data-auth-link]');
    const avatarImage = document.querySelector('.avatar-img');
    const currentUser = localStorage.getItem('currentUser');
    const savedProfileImage = localStorage.getItem('userProfileImage');

    if (!userName || !authLink) {
      return;
    }
    
    if (currentUser) {
      userName.textContent = currentUser;
      if (avatarImage) {
        avatarImage.src = savedProfileImage || DEFAULT_AVATAR;
      }
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
      if (avatarImage) {
        avatarImage.src = DEFAULT_AVATAR;
      }
      authLink.textContent = 'Entrar';
      authLink.href = 'login.html';
    }
  };

  const updateCartBadge = () => {
    const badge = document.querySelector('[data-cart-badge]');
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const itemCount = cartItems.reduce((total, item) => {
      return total + (item.isWeightBased ? 1 : (item.quantity || 1));
    }, 0);
    
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

  // ========== WEIGHT MODAL LOGIC ==========
  const weightModal = document.getElementById('weightModalOverlay');
  const weightModalClose = document.getElementById('weightModalClose');
  const weightModalCancel = document.getElementById('weightModalCancel');
  const weightModalAddCart = document.getElementById('weightModalAddCart');
  const weightInputKg = document.getElementById('weightInputKg');
  const weightInputPrice = document.getElementById('weightInputPrice');
  const weightTotalPrice = document.getElementById('weightTotalPrice');
  const weightTotalWeight = document.getElementById('weightTotalWeight');
  const weightProductName = document.getElementById('weightProductName');
  const pricePerKgDisplay = document.getElementById('pricePerKg');

  const weightTabBtns = document.querySelectorAll('.weight-tab-btn');
  const weightTabContents = document.querySelectorAll('.weight-tab-content');

  let currentWeightProduct = null;
  let currentTab = 'by-weight';

  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatWeight = (value) => {
    return parseFloat(value).toFixed(2);
  };

  // Tab switching
  weightTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Remove active class from all buttons and contents
      weightTabBtns.forEach(b => b.classList.remove('active'));
      weightTabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      btn.classList.add('active');
      document.querySelector(`.weight-tab-content[data-tab="${tab}"]`).classList.add('active');
      
      currentTab = tab;
    });
  });

  const calculateFromWeight = () => {
    if (!currentWeightProduct || !weightInputKg.value) return;
    
    const weight = parseFloat(weightInputKg.value) || 0;
    const pricePerKg = parseFloat(currentWeightProduct.dataset.pricePerKg) || 0;
    const totalPrice = weight * pricePerKg;
    
    weightTotalPrice.textContent = formatPrice(totalPrice);
  };

  const calculateFromPrice = () => {
    if (!currentWeightProduct || !weightInputPrice.value) return;
    
    const price = parseFloat(weightInputPrice.value) || 0;
    const pricePerKg = parseFloat(currentWeightProduct.dataset.pricePerKg) || 0;
    const weight = pricePerKg > 0 ? price / pricePerKg : 0;
    
    weightTotalWeight.textContent = formatWeight(weight) + ' kg';
  };

  const openWeightModal = (productCard) => {
    currentWeightProduct = productCard;
    currentTab = 'by-weight';
    
    const productName = productCard.querySelector('.product-title').textContent;
    const pricePerKg = parseFloat(productCard.dataset.pricePerKg) || 0;
    
    weightProductName.textContent = productName;
    pricePerKgDisplay.textContent = `R$ ${pricePerKg.toFixed(2)} por kg`;
    
    // Reset form
    weightInputKg.value = '1';
    weightInputPrice.value = (pricePerKg * 1).toFixed(2);
    
    // Reset tabs
    weightTabBtns.forEach(b => b.classList.remove('active'));
    weightTabContents.forEach(c => c.classList.remove('active'));
    weightTabBtns[0].classList.add('active');
    weightTabContents[0].classList.add('active');
    
    calculateFromWeight();
    calculateFromPrice();
    
    weightModal.classList.add('active');
  };

  const closeWeightModal = () => {
    weightModal.classList.remove('active');
    currentWeightProduct = null;
  };

  weightInputKg.addEventListener('input', calculateFromWeight);
  weightInputPrice.addEventListener('input', calculateFromPrice);

  weightModalClose.addEventListener('click', closeWeightModal);
  weightModalCancel.addEventListener('click', closeWeightModal);

  weightModal.addEventListener('click', (e) => {
    if (e.target === weightModal) {
      closeWeightModal();
    }
  });

  weightModalAddCart.addEventListener('click', () => {
    if (!currentWeightProduct) return;

    const pricePerKg = parseFloat(currentWeightProduct.dataset.pricePerKg) || 0;
    const productId = currentWeightProduct.id;
    const productName = currentWeightProduct.querySelector('.product-title').textContent;

    let weight, totalPrice, purchaseMode;

    if (currentTab === 'by-weight') {
      weight = parseFloat(weightInputKg.value);
      totalPrice = weight * pricePerKg;
      purchaseMode = 'by-weight';

      if (!weight || weight <= 0) {
        showToast('Por favor, insira um peso válido (maior que 0)');
        return;
      }
    } else {
      totalPrice = parseFloat(weightInputPrice.value);
      weight = pricePerKg > 0 ? totalPrice / pricePerKg : 0;
      purchaseMode = 'by-price';

      if (!totalPrice || totalPrice <= 0) {
        showToast('Por favor, insira um valor válido (maior que 0)');
        return;
      }
    }

    // Add to cart with weight info
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    const cartItem = {
      id: productId,
      name: productName,
      price: totalPrice,
      quantity: 1,
      weight: weight,
      pricePerKg: pricePerKg,
      isWeightBased: true,
      purchaseMode: purchaseMode
    };

    cartItems.push(cartItem);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartBadge();

    showToast(`✓ ${formatWeight(weight)}kg de ${productName} (${formatPrice(totalPrice)}) adicionado ao carrinho!`);
    closeWeightModal();
  });

  // Pesar buttons handlers
  const pesarButtons = document.querySelectorAll('[data-pesar]');
  pesarButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('[data-product]');
      if (card) {
        openWeightModal(card);
      }
    });
  });

  updateUserArea();
  updateCartBadge();
})();
