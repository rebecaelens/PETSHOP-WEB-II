const chatWidget = document.getElementById('chatWidget');
const chatWidgetBtn = document.getElementById('chatWidgetBtn');
const chatCloseBtn = document.getElementById('chatCloseBtn');
const consultarBtn = document.getElementById('consultarBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');

const BOT_NAME = 'BOLT';
const BOT_AVATAR = 'images/bolt.jpg';
const DEFAULT_USER_AVATAR = 'images/pfpuser.png';
const STORE_WHATSAPP_NUMBER = '5585998279694';
const api = window.PetshopApi || null;

const isAuthenticated = () => Boolean(api?.getAccessToken && api.getAccessToken());

const syncLocalCartFromApi = async () => {
  if (!isAuthenticated()) return;
  try {
    const data = await api.getCart();
    const mapped = (data.items || []).map((item) => {
      const isWeightBased = Number(item.product?.pricePerKg || 0) > 0;
      const weight = Number(item.grams || 0) / 1000;
      return {
        id: item.productId,
        name: item.product?.name || 'Produto',
        title: item.product?.name || 'Produto',
        desc: item.product?.description || '',
        image: item.product?.imageUrl || '',
        price: Number(item.totalPrice || 0),
        quantity: isWeightBased ? 1 : Number(item.quantity || 1),
        weight,
        pricePerKg: Number(item.product?.pricePerKg || 0),
        isWeightBased,
        purchaseMode: isWeightBased ? 'by-weight' : 'unit'
      };
    });
    localStorage.setItem('cartItems', JSON.stringify(mapped));
  } catch (_) {
    // Mantem fallback local.
  }
};

let conversationState = 'greeting';
let userPreferences = {
  productType: null,
  petType: null,
  minPrice: 0,
  maxPrice: 999999
};

const productCategories = {
  'racao': ['p2', 'p6', 'p11'],
  'acessorio': ['p4', 'p5', 'p7'],
  'brinquedo': ['p3', 'p9']
};

const petTypes = ['cachorros', 'gatos', 'peixes', 'passaros', 'outros'];
const STOP_WORDS = new Set([
  'quero', 'preciso', 'de', 'do', 'da', 'um', 'uma', 'pra', 'para', 'com', 'sem',
  'por', 'favor', 'me', 'mostrar', 'mostra', 'procuro', 'procurando', 'valor', 'preco', 'preco',
  'ate', 'entre', 'r', 'reais', 'real', 'conto', 'contos', 'pila', 'pilas', 'mango', 'mangos',
  'kg', 'kilo', 'quilo', 'tipo', 'pet', 'animal'
]);

let pendingRationBudgetOrder = null;

// Controlar abertura e fechamento do widget
function openChatWidget() {
  chatWidget.classList.add('open');
  chatWidgetBtn.classList.add('open');
  chatInput.focus();
}

function closeChatWidget() {
  chatWidget.classList.remove('open');
  chatWidgetBtn.classList.remove('open');
}

chatWidgetBtn.addEventListener('click', openChatWidget);
chatCloseBtn.addEventListener('click', closeChatWidget);

// Abrir chat pelo menu "Consultar"
if (consultarBtn) {
  consultarBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openChatWidget();
  });
}

function addMessage(text, isBot = true, options = null) {
  const userAvatar = localStorage.getItem('userProfileImage') || DEFAULT_USER_AVATAR;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isBot ? 'bot' : 'user'}`;

  const avatarImg = document.createElement('img');
  avatarImg.className = 'message-avatar';
  avatarImg.src = isBot ? BOT_AVATAR : userAvatar;
  avatarImg.alt = isBot ? `Avatar ${BOT_NAME}` : 'Avatar do usuário';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // Adicionar texto como parágrafo
  const textP = document.createElement('p');
  textP.style.margin = '0 0 10px 0';
  textP.textContent = text;
  contentDiv.appendChild(textP);

  // Adicionar opções dentro da contentDiv se existirem
  if (isBot && options && options.length > 0) {
    const hasHelpOption = options.some((option) => normalizeText(option.value) === 'helpwhatsapp');
    const optionsWithHelp = hasHelpOption
      ? options
      : [...options, { text: 'Preciso de ajuda', value: 'helpWhatsapp' }];

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'chat-options';

    optionsWithHelp.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = option.text;
      btn.onclick = () => handleOptionClick(option.value, option.text);
      optionsDiv.appendChild(btn);
    });

    contentDiv.appendChild(optionsDiv);
  }

  messageDiv.appendChild(avatarImg);
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function createBotMessageContainer(extraClass = '') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message bot ${extraClass}`.trim();

  const avatarImg = document.createElement('img');
  avatarImg.className = 'message-avatar';
  avatarImg.src = BOT_AVATAR;
  avatarImg.alt = `Avatar ${BOT_NAME}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  messageDiv.appendChild(avatarImg);
  messageDiv.appendChild(contentDiv);

  return { messageDiv, contentDiv };
}

function handleOptionClick(value, displayText) {
  addMessage(displayText, false);
  processUserInput(value);
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function parseCurrencyValue(rawValue) {
  if (rawValue == null) return null;
  const sanitized = String(rawValue).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const parsed = parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractBudgetValue(normalizedText) {
  const patterns = [
    /(\d+[\.,]?\d*)\s*r\$/,
    /(\d+[\.,]?\d*)r\$/,
    /r\$\s*(\d+[\.,]?\d*)/,
    /(\d+[\.,]?\d*)\s*(?:reais?|real|conto?s?|pila?s?|mango?s?|rs)\b/
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (!match) continue;
    const value = parseCurrencyValue(match[1]);
    if (value != null) return value;
  }

  return null;
}

function inferProductType(title, description, pricePerKg) {
  const text = normalizeText(`${title} ${description}`);
  if (pricePerKg || text.includes('racao')) return 'racao';
  if (text.includes('brinquedo') || text.includes('arranhador')) return 'brinquedo';
  return 'acessorio';
}

function extractImageUrl(backgroundImage) {
  const raw = String(backgroundImage || '');
  const match = raw.match(/url\(["']?(.*?)["']?\)/i);
  return match ? match[1] : '';
}

function getProductDataFromCard(card) {
  const title = card.querySelector('.product-title')?.textContent?.trim() || 'Produto';
  const description = card.querySelector('.product-desc')?.textContent?.trim() || '';
  const category = card.dataset.category || 'outros';
  const priceContainer = card.querySelector('.product-price-promo') || card.querySelector('.product-price');
  const priceText = priceContainer?.querySelector('.price-value')?.textContent || '0';
  const price = parseCurrencyValue(priceText) || 0;
  const pricePerKg = parseFloat(card.dataset.pricePerKg) || null;

  return {
    id: card.id,
    title,
    description,
    category,
    price,
    pricePerKg,
    image: extractImageUrl(card.querySelector('.product-media')?.style.backgroundImage),
    searchableText: normalizeText(`${title} ${description}`),
    productType: inferProductType(title, description, pricePerKg)
  };
}

function getAllProducts() {
  return Array.from(document.querySelectorAll('[data-product]')).map(getProductDataFromCard);
}

function parseIntentFromText(input) {
  const normalized = normalizeText(input);

  let productType = null;
  if (/(racao|racao seca|racao umida)/.test(normalized)) productType = 'racao';
  else if (/(brinquedo|arranhador)/.test(normalized)) productType = 'brinquedo';
  else if (/(acessorio|coleira|focinheira|guia|tapete|areia)/.test(normalized)) productType = 'acessorio';

  let petType = null;
  if (/\b(cachorro|cachorros|cao|caes)\b/.test(normalized)) petType = 'cachorros';
  else if (/\b(gato|gatos)\b/.test(normalized)) petType = 'gatos';
  else if (/\b(peixe|peixes)\b/.test(normalized)) petType = 'peixes';
  else if (/\b(passaro|passaros|ave|aves)\b/.test(normalized)) petType = 'passaros';
  else if (/\b(outro|outros)\b/.test(normalized)) petType = 'outros';

  let minPrice = 0;
  let maxPrice = 999999;

  const rangeMatch = normalized.match(/(?:de|entre)\s*(\d+[\.,]?\d*)\s*(?:reais?|real|conto?s?|pila?s?|mango?s?|r\$|rs)?\s*(?:a|e)\s*(\d+[\.,]?\d*)\s*(?:reais?|real|conto?s?|pila?s?|mango?s?|r\$|rs)?/);
  if (rangeMatch) {
    minPrice = parseCurrencyValue(rangeMatch[1]) || 0;
    maxPrice = parseCurrencyValue(rangeMatch[2]) || 999999;
  }

  const maxMatch = normalized.match(/(?:ate|no maximo|maximo|ate no maximo)\s*(\d+[\.,]?\d*)\s*(?:reais?|real|conto?s?|pila?s?|mango?s?|r\$|rs)?/);
  if (maxMatch) {
    maxPrice = parseCurrencyValue(maxMatch[1]) || maxPrice;
  }

  const budgetValue = extractBudgetValue(normalized);

  const queryTokens = normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token) && !/^\d+r$/.test(token));

  return {
    normalized,
    productType,
    petType,
    minPrice,
    maxPrice,
    budgetValue,
    queryTokens,
    hasCriteria: Boolean(productType || petType || budgetValue || rangeMatch || maxMatch || queryTokens.length)
  };
}

function filterProducts(criteria = {}) {
  const products = getAllProducts();

  const filtered = products.filter((product) => {
    if (criteria.productType && product.productType !== criteria.productType) {
      return false;
    }

    if (criteria.petType && criteria.petType !== 'outros' && product.category !== criteria.petType) {
      return false;
    }

    const min = Number.isFinite(criteria.minPrice) ? criteria.minPrice : 0;
    const max = Number.isFinite(criteria.maxPrice) ? criteria.maxPrice : 999999;
    if (product.price < min || product.price > max) {
      return false;
    }

    if (criteria.queryTokens && criteria.queryTokens.length) {
      const matches = criteria.queryTokens.every((token) => product.searchableText.includes(token));
      if (!matches) return false;
    }

    return true;
  });

  return filtered.slice(0, 3);
}

function addWeightBasedItemToCart(product, totalPrice, purchaseMode = 'by-price') {
  const pricePerKg = product.pricePerKg || 0;
  const weight = pricePerKg > 0 ? totalPrice / pricePerKg : 0;

  const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
  cartItems.push({
    id: product.id,
    name: product.title,
    title: product.title,
    desc: product.description,
    image: product.image,
    price: totalPrice,
    quantity: 1,
    weight,
    pricePerKg,
    isWeightBased: true,
    purchaseMode
  });
  localStorage.setItem('cartItems', JSON.stringify(cartItems));

  if (isAuthenticated()) {
    api.addCartItem({
      productId: product.id,
      grams: Math.round(weight * 1000)
    }).then(syncLocalCartFromApi).catch(() => {});
  }
}

function tryHandleRationByBudget(intent) {
  if (!intent.budgetValue || intent.productType !== 'racao') return false;

  const rationProducts = filterProducts({
    productType: 'racao',
    petType: intent.petType,
    minPrice: 0,
    maxPrice: 999999,
    queryTokens: intent.queryTokens
  }).filter((product) => Number.isFinite(product.pricePerKg) && product.pricePerKg > 0);

  if (!rationProducts.length) {
    addMessage('Não encontrei uma ração com esse nome/filtro. Tente digitar algo como: "10 reais de ração para gato".', true);
    return true;
  }

  const selected = rationProducts[0];
  const weight = intent.budgetValue / selected.pricePerKg;

  pendingRationBudgetOrder = {
    product: selected,
    totalPrice: intent.budgetValue,
    weight
  };

  addMessage(
    `Entendi seu pedido. Com R$ ${intent.budgetValue.toFixed(2).replace('.', ',')} você leva ${weight.toFixed(2).replace('.', ',')} kg de ${selected.title}. Quer que eu adicione ao carrinho?`,
    true,
    [
      { text: 'Adicionar ao carrinho', value: 'addBudgetRation' },
      { text: 'Ver outras opções', value: 'restart' }
    ]
  );

  conversationState = 'done';
  return true;
}

function tryHandleNaturalLanguage(input) {
  const intent = parseIntentFromText(input);
  if (!intent.hasCriteria) return false;

  if (tryHandleRationByBudget(intent)) {
    return true;
  }

  const criteria = {
    productType: intent.productType || userPreferences.productType,
    petType: intent.petType || userPreferences.petType,
    minPrice: intent.minPrice,
    maxPrice: intent.maxPrice,
    queryTokens: intent.queryTokens
  };

  const products = filterProducts(criteria);
  if (!products.length) {
    addMessage('Não encontrei produtos com esse pedido. Se quiser, me diga o tipo, animal e faixa de preço.', true, [
      { text: 'Recomeçar', value: 'restart' }
    ]);
    conversationState = 'done';
    return true;
  }

  userPreferences = {
    productType: criteria.productType,
    petType: criteria.petType,
    minPrice: criteria.minPrice,
    maxPrice: criteria.maxPrice
  };

  addMessage('Perfeito! Encontrei opções com base no que você digitou:', true);
  showRecommendations(products);
  conversationState = 'done';
  return true;
}

function processUserInput(input) {
  const lowerInput = input.toLowerCase().trim();

  if (normalizeText(lowerInput) === 'helpwhatsapp') {
    handleFinal('helpwhatsapp');
    return;
  }

  const structuredInputs = new Set([
    'racao', 'brinquedo', 'acessorio',
    'cachorros', 'gatos', 'peixes', 'passaros', 'outros',
    '0-50', '50-100', '100-200', '200-999999', '0-999999',
    'gocart', 'addtocart', 'restart', 'done', 'addbudgetration', 'helpwhatsapp'
  ]);

  if (!structuredInputs.has(lowerInput) && tryHandleNaturalLanguage(lowerInput)) {
    return;
  }

  if (conversationState === 'greeting') {
    handleGreeting(lowerInput);
  } else if (conversationState === 'askProductType') {
    handleProductType(lowerInput);
  } else if (conversationState === 'askPetType') {
    handlePetType(lowerInput);
  } else if (conversationState === 'askPrice') {
    handlePrice(lowerInput);
  } else if (conversationState === 'done') {
    handleFinal(lowerInput);
  }
}

function handleGreeting(input) {
  conversationState = 'askProductType';
  addMessage('O que você está procurando?', true, [
    { text: 'Ração', value: 'racao' },
    { text: 'Brinquedo', value: 'brinquedo' },
    { text: 'Acessório', value: 'acessorio' }
  ]);
}

function handleProductType(input) {
  if (['racao', 'brinquedo', 'acessorio'].includes(input)) {
    const productNames = {
      'racao': 'para ração',
      'brinquedo': 'para brinquedo',
      'acessorio': 'para acessório'
    };
    
    userPreferences.productType = input;
    conversationState = 'askPetType';
    
    addMessage(`Entendi! Você quer ${productNames[input]}. Para qual animal?`, true, [
      { text: 'Cachorro', value: 'cachorros' },
      { text: 'Gato', value: 'gatos' },
      { text: 'Peixe', value: 'peixes' },
      { text: 'Pássaro', value: 'passaros' },
      { text: 'Outros', value: 'outros' }
    ]);
  } else {
    addMessage('Desculpe, não entendi. Escolha uma das opções acima.', true);
  }
}

function handlePetType(input) {
  if (petTypes.includes(input)) {
    const petNames = {
      'cachorros': 'Cães',
      'gatos': 'Gatos',
      'peixes': 'Peixes',
      'passaros': 'Pássaros',
      'outros': 'Outros animais'
    };
    
    userPreferences.petType = input;
    conversationState = 'askPrice';
    
    addMessage(`Perfeito! Para ${petNames[input]}. Qual é sua faixa de preço?`, true, [
      { text: 'R$ 0 - R$ 50', value: '0-50' },
      { text: 'R$ 50 - R$ 100', value: '50-100' },
      { text: 'R$ 100 - R$ 200', value: '100-200' },
      { text: 'R$ 200+', value: '200-999999' },
      { text: 'Sem limite', value: '0-999999' }
    ]);
  } else {
    addMessage('Desculpe, não entendi. Escolha um tipo de animal.', true);
  }
}

function handlePrice(input) {
  let minPrice, maxPrice;
  
  if (input === '0-50') {
    minPrice = 0;
    maxPrice = 50;
  } else if (input === '50-100') {
    minPrice = 50;
    maxPrice = 100;
  } else if (input === '100-200') {
    minPrice = 100;
    maxPrice = 200;
  } else if (input === '200-999999') {
    minPrice = 200;
    maxPrice = 999999;
  } else if (input === '0-999999') {
    minPrice = 0;
    maxPrice = 999999;
  } else {
    addMessage('Desculpe, não entendi a faixa de preço. Escolha uma das opções.', true);
    return;
  }

  userPreferences.minPrice = minPrice;
  userPreferences.maxPrice = maxPrice;
  conversationState = 'done';

  addMessage(`Deixe-me buscar os melhores produtos para você...`, true);
  
  setTimeout(() => {
    const products = filterProducts(userPreferences);
    if (products.length > 0) {
      showRecommendations(products);
    } else {
      addMessage('Desculpe, não encontrei produtos que correspondam aos seus critérios. Gostaria de ajustar algo?', true, [
        { text: 'Recomeçar', value: 'restart' }
      ]);
    }
  }, 1500);
}

function showRecommendations(products) {
  addMessage(`Encontrei ${products.length} produtos! Selecione quais deseja:`, true);

  // Criar contêiner para produtos
  const { messageDiv: productsContainer, contentDiv } = createBotMessageContainer('products-selection');
  
  let selectedProducts = {};
  
  products.forEach((product, index) => {
    const productItem = document.createElement('div');
    productItem.style.marginBottom = '12px';
    productItem.style.padding = '10px';
    productItem.style.background = 'white';
    productItem.style.borderRadius = '8px';
    productItem.style.border = '1px solid #e0e0e0';
    
    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `product-${index}`;
    checkbox.value = product.id;
    checkbox.style.marginRight = '8px';
    
    // Label do produto
    const label = document.createElement('label');
    label.htmlFor = `product-${index}`;
    label.style.cursor = 'pointer';
    label.style.fontSize = '12px';
    label.style.fontWeight = '600';
    label.textContent = `${product.title} - R$ ${product.price.toFixed(2).replace('.', ',')}`;
    
    // Container de quantidade (apenas para ração)
    const qtyContainer = document.createElement('div');
    qtyContainer.style.marginTop = '8px';
    qtyContainer.style.marginLeft = '24px';
    qtyContainer.style.display = userPreferences.productType === 'racao' ? 'block' : 'none';
    
    const qtyLabel = document.createElement('label');
    qtyLabel.style.fontSize = '11px';
    qtyLabel.style.marginRight = '6px';
    qtyLabel.textContent = 'Qtd (kg):';
    
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '0.5';
    qtyInput.step = '0.5';
    qtyInput.value = '1';
    qtyInput.style.width = '50px';
    qtyInput.style.padding = '4px';
    qtyInput.style.borderRadius = '4px';
    qtyInput.style.border = '1px solid #ddd';
    qtyInput.style.fontSize = '11px';
    
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedProducts[product.id] = {
          title: product.title,
          desc: product.description,
          image: product.image,
          price: product.price,
          quantity: userPreferences.productType === 'racao' ? parseFloat(qtyInput.value) : 1
        };
        if (userPreferences.productType === 'racao') {
          qtyContainer.style.display = 'block';
        }
      } else {
        delete selectedProducts[product.id];
        if (userPreferences.productType === 'racao') {
          qtyContainer.style.display = 'none';
        }
      }
    });
    
    qtyInput.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedProducts[product.id].quantity = parseFloat(qtyInput.value);
      }
    });
    
    qtyContainer.appendChild(qtyLabel);
    qtyContainer.appendChild(qtyInput);
    
    productItem.appendChild(checkbox);
    productItem.appendChild(label);
    productItem.appendChild(qtyContainer);
    contentDiv.appendChild(productItem);
  });
  
  // Botão enviar para carrinho
  const sendBtn = document.createElement('button');
  sendBtn.className = 'option-btn';
  sendBtn.style.marginTop = '12px';
  sendBtn.style.width = '100%';
  sendBtn.style.background = '#840000';
  sendBtn.style.color = 'white';
  sendBtn.style.border = 'none';
  sendBtn.textContent = 'Enviar para carrinho';
  
  sendBtn.addEventListener('click', async () => {
    if (Object.keys(selectedProducts).length === 0) {
      addMessage('Selecione pelo menos um produto!', true);
      return;
    }
    
    // Adicionar ao carrinho
    let cart = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    for (const productId in selectedProducts) {
      const product = selectedProducts[productId];
      cart.push({
        id: productId,
        name: product.title,
        title: product.title,
        desc: product.desc,
        image: product.image,
        price: product.price,
        quantity: product.quantity || 1
      });

      if (isAuthenticated()) {
        try {
          const productPricePerKg = products.find((p) => p.id === productId)?.pricePerKg;
          if (Number(productPricePerKg) > 0) {
            await api.addCartItem({ productId, grams: Math.round((product.quantity || 1) * 1000) });
          } else {
            await api.addCartItem({ productId, quantity: Math.max(1, Math.round(product.quantity || 1)) });
          }
        } catch (_) {}
      }
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cart));
    if (isAuthenticated()) {
      await syncLocalCartFromApi();
    }
    
    addMessage('Produtos adicionados ao carrinho com sucesso!', true, [
      { text: 'Ir para o carrinho', value: 'goCart' },
      { text: 'Continuar comprando', value: 'restart' }
    ]);
    
    conversationState = 'done';
  });
  
  contentDiv.appendChild(sendBtn);
  productsContainer.appendChild(contentDiv);
  chatMessages.appendChild(productsContainer);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleFinal(input) {
  const action = normalizeText(input);

  if (action === 'helpwhatsapp') {
    const number = STORE_WHATSAPP_NUMBER.replace(/\D/g, '');
    const message = encodeURIComponent('Oi! Preciso de ajuda com meu pedido na Petshop.');
    const whatsappUrl = `https://wa.me/${number}?text=${message}`;

    addMessage('Claro! Vou te direcionar para o WhatsApp da loja.', true);
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 400);
    return;
  }

  if (action === 'addbudgetration' && pendingRationBudgetOrder) {
    addWeightBasedItemToCart(pendingRationBudgetOrder.product, pendingRationBudgetOrder.totalPrice, 'by-price');
    addMessage(
      `Pronto! Adicionei ${pendingRationBudgetOrder.weight.toFixed(2).replace('.', ',')} kg de ${pendingRationBudgetOrder.product.title} por R$ ${pendingRationBudgetOrder.totalPrice.toFixed(2).replace('.', ',')}.`,
      true,
      [
        { text: 'Ir para o carrinho', value: 'goCart' },
        { text: 'Continuar comprando', value: 'restart' }
      ]
    );
    pendingRationBudgetOrder = null;
    return;
  }

  if (action === 'gocart') {
    addMessage('Redirecionando para o carrinho...', false);
    setTimeout(() => {
      window.location.href = 'carrinho.html';
    }, 1000);
  } else if (action === 'addtocart') {
    addMessage('Ótimo! Redirecionando para o carrinho...', false);
    setTimeout(() => {
      window.location.href = 'principal.html';
    }, 1000);
  } else if (action === 'restart') {
    conversationState = 'greeting';
    userPreferences = {
      productType: null,
      petType: null,
      minPrice: 0,
      maxPrice: 999999
    };
    chatMessages.innerHTML = '';
    addMessage(`Olá! Eu sou o ${BOT_NAME}. Vou te ajudar a encontrar o produto perfeito para seu pet.`, true);
    setTimeout(() => {
      handleGreeting('');
    }, 1000);
  } else if (action === 'done') {
    addMessage('Tudo bem! Volte quando precisar.', true);
  } else {
    addMessage(`Obrigado por usar o ${BOT_NAME}! Qualquer dúvida, estou aqui.`, true);
  }
}

// Event listeners
chatSendBtn.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message) {
    addMessage(message, false);
    chatInput.value = '';
    setTimeout(() => {
      processUserInput(message);
    }, 300);
  }
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    chatSendBtn.click();
  }
});

// Iniciar conversa
document.addEventListener('DOMContentLoaded', () => {
  addMessage(`Olá! Eu sou o ${BOT_NAME}. Sou seu assistente virtual da Petshop e vou te ajudar a encontrar os melhores produtos para o seu pet.`, true);
  setTimeout(() => {
    handleGreeting('');
  }, 1000);
});
