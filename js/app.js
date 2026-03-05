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
  
  // Adicionar listener para o toggle de filtros de preço
  const priceToggleBtn = document.querySelector('[data-price-filters-toggle]');
  if (priceToggleBtn) {
    priceToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const panel = document.querySelector('[data-price-filters-panel]');
      if (panel instanceof HTMLElement) {
        const isHidden = panel.hasAttribute('hidden');
        if (isHidden) {
          panel.removeAttribute('hidden');
          priceToggleBtn.setAttribute('aria-expanded', 'true');
        } else {
          panel.setAttribute('hidden', '');
          priceToggleBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }
});

document.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  const priceToggle = target.closest('[data-price-filters-toggle]');
  if (priceToggle instanceof HTMLElement) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

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
});

(() => {
  const query = new URLSearchParams(window.location.search);
  const selectedCategory = (query.get('cat') || 'all').toLowerCase();
  const searchTerm = (query.get('q') || '').trim().toLowerCase();

  const productCards = Array.from(document.querySelectorAll('[data-product]'));
  const categoryLinks = Array.from(document.querySelectorAll('.category-list a'));
  const minPriceInput = document.querySelector('[data-filter-price-min]');
  const maxPriceInput = document.querySelector('[data-filter-price-max]');
  const petTypeChecks = Array.from(document.querySelectorAll('[data-filter-pet-type]'));
  const clearFiltersButton = document.querySelector('[data-filter-clear]');

  const parseCategories = (value) =>
    String(value || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

  const getCardPrice = (card) => {
    // Pega o preço promocional se existir, senão pega o preço normal
    const priceContainer = card.querySelector('.product-price-promo') || card.querySelector('.product-price');
    const priceText = priceContainer?.querySelector('.price-value')?.textContent || '0';
    const normalized = priceText.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    return Number(normalized) || 0;
  };

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

  const matchesSidebarFilters = (card) => {
    const minPrice = Number(minPriceInput?.value || 0);
    const maxPrice = Number(maxPriceInput?.value || 0);
    const cardPrice = getCardPrice(card);
    const categories = parseCategories(card.dataset.category);
    const selectedPetTypes = petTypeChecks
      .filter((check) => check instanceof HTMLInputElement && check.checked)
      .map((check) => check.value.toLowerCase());

    if (minPrice > 0 && cardPrice < minPrice) {
      return false;
    }

    if (maxPrice > 0 && cardPrice > maxPrice) {
      return false;
    }

    if (selectedPetTypes.length > 0) {
      return categories.some((category) => selectedPetTypes.includes(category));
    }

    return true;
  };

  const applyFilters = () => {
    productCards.forEach((card) => {
      const visible = matchesCategory(card) && matchesSearch(card) && matchesSidebarFilters(card);
      card.style.display = visible ? '' : 'none';
    });
  };

  applyFilters();

  const onSidebarFilterChange = () => {
    applyFilters();
  };

  if (minPriceInput) minPriceInput.addEventListener('input', onSidebarFilterChange);
  if (maxPriceInput) maxPriceInput.addEventListener('input', onSidebarFilterChange);
  petTypeChecks.forEach((check) => check.addEventListener('change', onSidebarFilterChange));

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', () => {
      if (minPriceInput) minPriceInput.value = '';
      if (maxPriceInput) maxPriceInput.value = '';
      petTypeChecks.forEach((check) => {
        if (check instanceof HTMLInputElement) {
          check.checked = false;
        }
      });
      applyFilters();
    });
  }

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
    if (!badge) return;
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

  const FAVORITES_STORAGE_KEY = 'favoriteItems';

  const getFavorites = () => JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)) || [];

  const saveFavorites = (favorites) => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  };

  const updateFavoriteBadge = () => {
    const badges = document.querySelectorAll('[data-favorite-badge]');
    if (!badges.length) return;

    const favoritesCount = getFavorites().length;
    badges.forEach((badge) => {
      if (favoritesCount > 0) {
        badge.textContent = favoritesCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });
  };

  const parsePriceText = (priceText) => {
    const normalized = String(priceText || '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const extractBackgroundImageUrl = (element) => {
    const bgValue = element?.style?.backgroundImage || '';
    const matched = bgValue.match(/url\(["']?(.*?)["']?\)/i);
    return matched ? matched[1] : '';
  };

  const getProductDataFromCard = (card) => {
    if (!card) return null;

    const productId = card.id || card.dataset.productId;
    const title = card.querySelector('.product-title, .card-title')?.textContent?.trim() || '';
    const description = card.querySelector('.product-desc, .card-text')?.textContent?.trim() || '';
    
    // Pega o preço promocional se existir, senão pega o preço normal
    const priceContainer = card.querySelector('.product-price-promo') || card.querySelector('.product-price');
    const priceValue = priceContainer?.querySelector('.price-value')?.textContent || card.dataset.price || '';
    
    const image = extractBackgroundImageUrl(card.querySelector('.product-media'));

    if (!productId || !title) {
      return null;
    }

    return {
      id: productId,
      name: title,
      desc: description,
      price: parsePriceText(priceValue),
      image
    };
  };

  const renderFavoritesPage = () => {
    const listContainer = document.querySelector('[data-favorites-list]');
    if (!listContainer) return;

    const favorites = getFavorites();

    if (!favorites.length) {
      listContainer.innerHTML = `
        <article class="product-card" style="width: 100%; max-width: 100%; grid-column: 1 / -1;">
          <div class="product-body" style="padding: 40px 20px; text-align: center;">
            <h4 class="product-title">Nenhum item favoritado</h4>
            <p class="product-desc">Clique no coração dos produtos para salvá-los aqui.</p>
          </div>
        </article>
      `;
      return;
    }

    listContainer.innerHTML = favorites.map((product) => `
      <article class="product-card" data-product data-product-id="${product.id}" data-price="${product.price}" id="${product.id}">
        <div class="product-media" style="background-image:url('${product.image}')"></div>
        <div class="product-body">
          <button class="fav-btn is-favorito" type="button" data-favorito aria-label="Remover de favoritos"><img src="images/favorite.png" alt="Favoritar"></button>
          <h4 class="product-title">${product.name}</h4>
          <p class="product-desc">${product.desc || 'Item salvo para compra futura.'}</p>
          <div class="product-price"><span class="price-currency">R$</span> <span class="price-value">${product.price.toFixed(2).replace('.', ',')}</span></div>
          <div class="product-actions">
            <button class="btn primary" type="button" data-carrinho>COMPRAR</button>
          </div>
        </div>
      </article>
    `).join('');
  };

  const syncFavoriteButtons = () => {
    const favoriteIds = new Set(getFavorites().map((item) => item.id));
    document.querySelectorAll('.fav-btn[data-favorito]').forEach((button) => {
      const card = button.closest('[data-product]');
      const productId = card?.id;
      button.classList.toggle('is-favorito', Boolean(productId && favoriteIds.has(productId)));
    });
  };

  const toggleFavorite = (product) => {
    const favorites = getFavorites();
    const existingIndex = favorites.findIndex((item) => item.id === product.id);

    if (existingIndex >= 0) {
      favorites.splice(existingIndex, 1);
      saveFavorites(favorites);
      return false;
    }

    favorites.push(product);
    saveFavorites(favorites);
    return true;
  };

  const addToCart = (productId, fallbackProduct = null) => {
    const card = document.querySelector(`[data-product][id="${productId}"]`);
    const cardProduct = getProductDataFromCard(card);
    const productData = cardProduct || fallbackProduct;
    if (!productData) return;
    
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({ 
        id: productId, 
        name: productData.name,
        price: productData.price,
        quantity: 1 
      });
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartBadge();
  };

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
    if (!currentWeightProduct || !weightInputKg || !weightTotalPrice || !weightInputKg.value) return;
    
    const weight = parseFloat(weightInputKg.value) || 0;
    const pricePerKg = parseFloat(currentWeightProduct.dataset.pricePerKg) || 0;
    const totalPrice = weight * pricePerKg;
    
    weightTotalPrice.textContent = formatPrice(totalPrice);
  };

  const calculateFromPrice = () => {
    if (!currentWeightProduct || !weightInputPrice || !weightTotalWeight || !weightInputPrice.value) return;
    
    const price = parseFloat(weightInputPrice.value) || 0;
    const pricePerKg = parseFloat(currentWeightProduct.dataset.pricePerKg) || 0;
    const weight = pricePerKg > 0 ? price / pricePerKg : 0;
    
    weightTotalWeight.textContent = formatWeight(weight) + ' kg';
  };

  const openWeightModal = (productCard) => {
    if (!weightModal || !weightProductName || !pricePerKgDisplay || !weightInputKg || !weightInputPrice || !weightTabBtns.length || !weightTabContents.length) {
      return;
    }

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
    if (!weightModal) return;
    weightModal.classList.remove('active');
    currentWeightProduct = null;
  };

  if (weightInputKg) weightInputKg.addEventListener('input', calculateFromWeight);
  if (weightInputPrice) weightInputPrice.addEventListener('input', calculateFromPrice);

  if (weightModalClose) weightModalClose.addEventListener('click', closeWeightModal);
  if (weightModalCancel) weightModalCancel.addEventListener('click', closeWeightModal);

  if (weightModal) {
    weightModal.addEventListener('click', (e) => {
      if (e.target === weightModal) {
        closeWeightModal();
      }
    });
  }

  if (weightModalAddCart) weightModalAddCart.addEventListener('click', () => {
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

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const favoriteButton = target.closest('[data-favorito]');
    if (favoriteButton instanceof HTMLElement) {
      event.preventDefault();
      const card = favoriteButton.closest('[data-product]');
      const product = getProductDataFromCard(card);
      if (!product) return;

      const wasAdded = toggleFavorite(product);

      if (favoriteButton.classList.contains('fav-btn')) {
        favoriteButton.classList.toggle('is-favorito', wasAdded);
        // Se está removendo na página de favoritos, animar saída do card
        const favoritesListContainer = document.querySelector('[data-favorites-list]');
        if (!wasAdded && card && favoritesListContainer) {
          card.classList.add('removing');
          setTimeout(() => {
            renderFavoritesPage();
          }, 350);
        }
      }

      syncFavoriteButtons();
      updateFavoriteBadge();
      showToast(wasAdded ? `❤ ${product.name} adicionado aos favoritos!` : `✕ ${product.name} removido dos favoritos.`);
      return;
    }

    const cartButton = target.closest('[data-carrinho]');
    if (cartButton instanceof HTMLElement) {
      event.preventDefault();
      const card = cartButton.closest('[data-product]');
      const product = getProductDataFromCard(card);
      if (!product) return;

      // Feedback visual: animar botão
      const originalText = cartButton.textContent;
      cartButton.style.opacity = '0.6';
      cartButton.disabled = true;
      cartButton.textContent = '✓ Adicionado';
      
      addToCart(product.id, product);
      showToast(`✓ ${product.name} adicionado ao carrinho!`);
      
      // Restaurar botão após 2s
      setTimeout(() => {
        cartButton.textContent = originalText;
        cartButton.style.opacity = '1';
        cartButton.disabled = false;
      }, 2000);
      return;
    }

    const weighButton = target.closest('[data-pesar]');
    if (weighButton instanceof HTMLElement) {
      event.preventDefault();
      const card = weighButton.closest('[data-product]');
      if (card) {
        openWeightModal(card);
      }
    }
  });

  renderFavoritesPage();
  syncFavoriteButtons();
  updateFavoriteBadge();

  updateUserArea();
  updateCartBadge();
})();
