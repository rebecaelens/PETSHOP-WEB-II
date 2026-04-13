(() => {
  const grid = document.querySelector('.grid.products');
  const api = window.PetshopApi || null;

  const formatPrice = (value) => {
    const number = Number(value) || 0;
    return number.toFixed(2).replace('.', ',');
  };

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const normalizeImageUrl = (value) => {
    const src = String(value || '').trim();
    if (!src) return 'images/cards.jpg';
    if (/^https?:\/\//i.test(src) || src.startsWith('data:') || src.startsWith('/')) {
      return src;
    }
    return src;
  };

  const getDisplayPrice = (product) => {
    if (product.promoPrice != null && product.promoPrice !== '') {
      return Number(product.promoPrice);
    }
    return Number(product.price) || 0;
  };

  const categoryLabel = (value) => {
    const key = String(value || '').toLowerCase();
    const labels = {
      cachorros: 'cachorros',
      gatos: 'gatos',
      peixes: 'peixes',
      passaros: 'pássaros',
      outros: 'outros pets'
    };
    return labels[key] || 'pets';
  };

  const buildDescription = (product) => {
    const original = String(product.description || '').trim();
    if (original) return original;

    const parts = [];
    parts.push(`Indicado para ${categoryLabel(product.category)}.`);

    if (Number(product.pricePerKg || 0) > 0) {
      parts.push(`Venda por peso: R$ ${formatPrice(product.pricePerKg)} por kg.`);
    } else {
      parts.push('Produto pronto para uso no dia a dia do seu pet.');
    }

    if (product.promoPrice != null && product.promoPrice !== '') {
      parts.push('Item em promoção por tempo limitado.');
    }

    return parts.join(' ');
  };

  const renderCard = (product) => {
    const price = getDisplayPrice(product);
    const hasPromo = Boolean(product.isPromo || product.promoPrice != null);
    const originalPrice = hasPromo && product.promoPrice != null ? Number(product.price) : null;
    const pricePerKg = Number(product.pricePerKg || 0);

    return `
      <article class="product-card" data-product data-category="${escapeHtml(product.category || '')}" data-promocao="${hasPromo ? 'true' : 'false'}" data-price-per-kg="${pricePerKg || ''}" id="${escapeHtml(product.id)}">
        <div class="product-media" style="background-image:url('${normalizeImageUrl(product.imageUrl)}')"></div>
        <div class="product-body">
          <button class="fav-btn" type="button" data-favorito aria-label="Favoritar"><img src="images/favorite.png" alt="Favoritar"></button>
          ${hasPromo ? '<img src="images/venda.png" alt="Promoção" class="sale-badge">' : ''}
          <h4 class="product-title">${escapeHtml(product.name)}</h4>
          <p class="product-desc">${escapeHtml(buildDescription(product))}</p>
          <div class="product-price-original${originalPrice == null ? ' is-placeholder' : ''}">
            <span class="price-currency">R$</span> <span class="price-value">${originalPrice != null ? formatPrice(originalPrice) : '0,00'}</span>
          </div>
          <div class="product-price${hasPromo ? ' product-price-promo' : ''}"><span class="price-currency">R$</span> <span class="price-value">${formatPrice(price)}</span></div>
          <div class="product-actions">
            ${pricePerKg > 0 ? '<button class="btn secondary" type="button" data-pesar>PESAR</button>' : ''}
            <button class="btn primary" type="button" data-carrinho>COMPRAR</button>
          </div>
        </div>
      </article>
    `;
  };

  const renderProducts = async () => {
    if (!grid) return;

    try {
      const products = api?.getProducts ? await api.getProducts() : (window.PetshopProducts?.fallbackProducts || []);
      const list = Array.isArray(products) ? products : [];

      if (!list.length) {
        grid.innerHTML = `
          <article class="product-card" style="width: 100%; max-width: 420px; grid-column: 1 / -1; margin: 0 auto;">
            <div class="product-body" style="padding: 40px 20px; text-align: center;">
              <h4 class="product-title">Nenhum produto disponível</h4>
              <p class="product-desc">A API não retornou itens agora. Recarregue a página em instantes.</p>
            </div>
          </article>
        `;
        return;
      }

      grid.innerHTML = list.map(renderCard).join('');
      document.dispatchEvent(new CustomEvent('petshop:products-rendered'));
    } catch (error) {
      grid.innerHTML = `
        <article class="product-card" style="width: 100%; max-width: 420px; grid-column: 1 / -1; margin: 0 auto;">
          <div class="product-body" style="padding: 40px 20px; text-align: center;">
            <h4 class="product-title">Falha ao carregar produtos</h4>
            <p class="product-desc">Verifique se o backend está rodando em http://localhost:3333.</p>
          </div>
        </article>
      `;
      document.dispatchEvent(new CustomEvent('petshop:products-rendered'));
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderProducts);
  } else {
    renderProducts();
  }
})();
