const chatWidget = document.getElementById('chatWidget');
const chatWidgetBtn = document.getElementById('chatWidgetBtn');
const chatCloseBtn = document.getElementById('chatCloseBtn');
const consultarBtn = document.getElementById('consultarBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');

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
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isBot ? 'bot' : 'user'}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // Adicionar texto como parágrafo
  const textP = document.createElement('p');
  textP.style.margin = '0 0 10px 0';
  textP.textContent = text;
  contentDiv.appendChild(textP);

  // Adicionar opções dentro da contentDiv se existirem
  if (isBot && options && options.length > 0) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'chat-options';

    options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = option.text;
      btn.onclick = () => handleOptionClick(option.value, option.text);
      optionsDiv.appendChild(btn);
    });

    contentDiv.appendChild(optionsDiv);
  }

  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleOptionClick(value, displayText) {
  addMessage(displayText, false);
  processUserInput(value);
}

function processUserInput(input) {
  const lowerInput = input.toLowerCase().trim();

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
    const products = filterProducts();
    if (products.length > 0) {
      showRecommendations(products);
    } else {
      addMessage('Desculpe, não encontrei produtos que correspondam aos seus critérios. Gostaria de ajustar algo?', true, [
        { text: 'Recomeçar', value: 'restart' }
      ]);
    }
  }, 1500);
}

function filterProducts() {
  const allProducts = document.querySelectorAll('[data-product]');
  const candidates = [];

  allProducts.forEach(card => {
    const category = card.dataset.category;
    
    // Verificar se o tipo de pet corresponde
    if (category !== userPreferences.petType && userPreferences.petType !== 'outros') {
      // Se não é 'outros', verifica se a categoria corresponde
      if (userPreferences.petType === 'todos') return;
    }

    // Pegar o preço
    const priceContainer = card.querySelector('.product-price-promo') || card.querySelector('.product-price');
    const priceText = priceContainer?.querySelector('.price-value')?.textContent || '0';
    const price = parseFloat(priceText.replace(/\./g, '').replace(',', '.'));

    // Verificar faixa de preço
    if (price >= userPreferences.minPrice && price <= userPreferences.maxPrice) {
      candidates.push({
        id: card.id,
        title: card.querySelector('.product-title')?.textContent || 'Produto',
        price: price,
        image: card.querySelector('.product-media')?.style.backgroundImage
      });
    }
  });

  return candidates.slice(0, 3); // Retorna até 3 produtos
}

function showRecommendations(products) {
  addMessage(`Encontrei ${products.length} produtos! Selecione quais deseja:`, true);

  // Criar contêiner para produtos
  const productsContainer = document.createElement('div');
  productsContainer.className = 'message bot products-selection';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
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
  
  sendBtn.addEventListener('click', () => {
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
        title: product.title,
        price: product.price,
        quantity: product.quantity || 1
      });
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cart));
    
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
  if (input === 'goCart') {
    addMessage('Redirecionando para o carrinho...', false);
    setTimeout(() => {
      window.location.href = 'carrinho.html';
    }, 1000);
  } else if (input === 'addToCart') {
    addMessage('Ótimo! Redirecionando para o carrinho...', false);
    setTimeout(() => {
      window.location.href = 'principal.html';
    }, 1000);
  } else if (input === 'restart') {
    conversationState = 'greeting';
    userPreferences = {
      productType: null,
      petType: null,
      minPrice: 0,
      maxPrice: 999999
    };
    chatMessages.innerHTML = '';
    addMessage('Olá! Bem-vindo ao Pet Advisor. Vou ajudá-lo a encontrar o produto perfeito para seu pet.', true);
    setTimeout(() => {
      handleGreeting('');
    }, 1000);
  } else if (input === 'done') {
    addMessage('Tudo bem! Volte quando precisar.', true);
  } else {
    addMessage('Obrigado por usar o Pet Advisor! Qualquer dúvida, estou aqui.', true);
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
  addMessage('Olá! 👋 Bem-vindo ao Pet Advisor Bot! Vou ajudá-lo a encontrar o produto perfeito para seu pet.', true);
  setTimeout(() => {
    handleGreeting('');
  }, 1000);
});
