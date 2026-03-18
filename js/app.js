/* ════════════════════════════════════════════
   Акварели Джульджи — App Logic
   ════════════════════════════════════════════ */

// ── State ────────────────────────────────────
let cart = [];
let currentFilter = 'all';

// ── DOM refs ─────────────────────────────────
const catalogGrid       = document.getElementById('catalog-grid');
const filterPills       = document.querySelectorAll('.filter-pill');

// Cart
const cartBtn           = document.getElementById('cart-btn');
const cartCountEl       = document.getElementById('cart-count');
const cartDrawer        = document.getElementById('cart-drawer');
const cartOverlay       = document.getElementById('cart-overlay');
const cartClose         = document.getElementById('cart-close');
const cartItemsEl       = document.getElementById('cart-items');
const cartTotalEl       = document.getElementById('cart-total');
const checkoutBtn       = document.getElementById('checkout-btn');

// Modal
const modalOverlay      = document.getElementById('modal-overlay');
const workModal         = document.getElementById('work-modal');
const modalClose        = document.getElementById('modal-close');
const modalCloseBtn     = document.getElementById('modal-close-btn');

// Checkout fields
const fieldPhone        = document.getElementById('field-phone');
const fieldTelegram     = document.getElementById('field-telegram');

// Checkout
const checkoutOverlay   = document.getElementById('checkout-overlay');
const checkoutDialog    = document.getElementById('checkout-dialog');
const checkoutClose     = document.getElementById('checkout-close');
const checkoutForm      = document.getElementById('checkout-form');
const deliveryContainer = document.getElementById('delivery-options');
const checkoutItemsList = document.getElementById('checkout-items-list');
const checkoutGrandTotal= document.getElementById('checkout-grand-total');

// Screens
const mainContent       = document.getElementById('main-content');
const paymentScreen     = document.getElementById('payment-screen');
const successScreen     = document.getElementById('success-screen');

// Toast container
const toastContainer    = document.getElementById('toast-container');

// Cart FAB
const cartFab           = document.getElementById('cart-fab');
const cartFabCount      = document.getElementById('cart-fab-count');

// ── Helpers ──────────────────────────────────
function formatPrice(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

// ── Catalog Render ───────────────────────────
function getStatusLabel(status) {
  return status === 'available' ? 'В наличии' : 'Под заказ';
}
function getStatusClass(status) {
  return status === 'available' ? 'badge-available' : 'badge-order';
}

function renderCatalog() {
  const filtered = currentFilter === 'all'
    ? WORKS
    : WORKS.filter(w => w.status === currentFilter);

  catalogGrid.innerHTML = '';
  filtered.forEach(work => {
    const card = document.createElement('article');
    card.className = 'work-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
      <div class="card-thumb">
        <img src="${work.image}" alt="${work.title}" loading="lazy">
        <span class="card-badge ${getStatusClass(work.status)}">${getStatusLabel(work.status)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${work.title}</h3>
        <p class="card-size">${work.size} · ${work.medium}</p>
        <p class="card-price">${formatPrice(work.price)}</p>
      </div>
    `;
    card.addEventListener('click', () => openModal(work));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(work); });
    catalogGrid.appendChild(card);
  });
}

// ── Filter Pills ─────────────────────────────
filterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    filterPills.forEach(p => p.classList.remove('is-active'));
    pill.classList.add('is-active');
    currentFilter = pill.dataset.filter;
    renderCatalog();
  });
});

// ── Modal ────────────────────────────────────
function openModal(work) {
  // Populate modal
  document.getElementById('modal-title').textContent = work.title;
  document.getElementById('modal-img').src = work.image;
  document.getElementById('modal-img').alt = work.title;
  document.getElementById('modal-size').textContent = work.size;
  document.getElementById('modal-medium').textContent = work.medium;
  document.getElementById('modal-status').textContent = getStatusLabel(work.status);
  document.getElementById('modal-description').textContent = work.description;
  document.getElementById('modal-price').textContent = formatPrice(work.price);

  const addBtn = document.getElementById('modal-add-btn');
  const inCart = cart.some(i => i.id === work.id);
  addBtn.disabled = inCart;
  addBtn.textContent = inCart ? 'Уже в корзине' : 'Добавить в корзину';
  addBtn.onclick = () => {
    addToCart(work);
    closeModal();
  };

  modalOverlay.classList.add('is-open');
  workModal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('is-open');
  workModal.classList.remove('is-open');
  document.body.style.overflow = '';
}

modalOverlay.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCart(); closeCheckout(); } });

// ── Cart ─────────────────────────────────────
function addToCart(work) {
  const existing = cart.find(i => i.id === work.id);
  if (existing) return; // already in cart — button is disabled, no toast needed
  cart.push({ ...work });
  updateCartUI();
  showToast(`«${work.title}» добавлена в корзину`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price, 0);
}

function updateCartUI() {
  // Count badge
  const count = cart.length;
  cartCountEl.textContent = count;
  cartCountEl.classList.toggle('is-hidden', count === 0);

  // Items list
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
    checkoutBtn.disabled = true;
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-thumb">
          <img src="${item.image}" alt="${item.title}">
        </div>
        <div class="cart-item-info">
          <p class="cart-item-name">${item.title}</p>
          <p class="cart-item-size">${item.size}</p>
          <p class="cart-item-price">${formatPrice(item.price)}</p>
        </div>
        <button class="cart-item-remove" aria-label="Удалить" data-id="${item.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `).join('');
    checkoutBtn.disabled = false;

    cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
    });
  }

  cartTotalEl.textContent = formatPrice(getCartTotal());

  // Update FAB
  if (cartFab) {
    cartFab.classList.toggle('is-visible', count > 0);
    if (cartFabCount) cartFabCount.textContent = count;
  }
}

function openCart() {
  cartDrawer.classList.add('is-open');
  cartOverlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartDrawer.classList.remove('is-open');
  cartOverlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
if (cartFab) cartFab.addEventListener('click', openCart);

// ── Checkout ─────────────────────────────────
function buildDeliveryOptions() {
  deliveryContainer.innerHTML = DELIVERY_OPTIONS.map((opt, i) => `
    <label class="delivery-option">
      <input type="radio" name="delivery" value="${opt.id}" ${i === 0 ? 'checked' : ''}>
      <div class="delivery-option-info">
        <div class="delivery-option-name">${opt.label}</div>
        <div class="delivery-option-duration">${opt.duration}</div>
      </div>
      <div class="delivery-option-price">${opt.priceLabel || (opt.price === 0 ? 'Бесплатно' : formatPrice(opt.price))}</div>
    </label>
  `).join('');

  // Recalculate total on change
  deliveryContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', recalcCheckoutTotal);
  });
}

function getSelectedDelivery() {
  const checked = deliveryContainer.querySelector('input[type="radio"]:checked');
  if (!checked) return DELIVERY_OPTIONS[0];
  return DELIVERY_OPTIONS.find(o => o.id === checked.value) || DELIVERY_OPTIONS[0];
}

function recalcCheckoutTotal() {
  const delivery = getSelectedDelivery();
  // If delivery price is negotiated (price=0 with priceLabel), show works total + note
  if (delivery.priceLabel) {
    checkoutGrandTotal.textContent = formatPrice(getCartTotal()) + ' + доставка';
  } else {
    const total = getCartTotal() + delivery.price;
    checkoutGrandTotal.textContent = formatPrice(total);
  }
}

function openCheckout() {
  closeCart();

  // Populate order summary
  checkoutItemsList.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <span class="checkout-item-name">${item.title} (${item.size})</span>
      <span>${formatPrice(item.price)}</span>
    </div>
  `).join('');

  buildDeliveryOptions();
  recalcCheckoutTotal();

  checkoutOverlay.classList.add('is-open');
  checkoutDialog.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  checkoutOverlay.classList.remove('is-open');
  checkoutDialog.classList.remove('is-open');
  document.body.style.overflow = '';
}

checkoutBtn.addEventListener('click', openCheckout);
checkoutClose.addEventListener('click', closeCheckout);
checkoutOverlay.addEventListener('click', closeCheckout);

// ── Checkout Form Submit ──────────────────────
checkoutForm.addEventListener('submit', e => {
  e.preventDefault();
  const name    = document.getElementById('field-name').value.trim();
  const phone   = fieldPhone ? fieldPhone.value.trim() : '';
  const tg      = fieldTelegram ? fieldTelegram.value.trim() : '';

  if (!name) {
    showToast('Пожалуйста, укажите имя', 'error'); return;
  }
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 11) {
    showToast('Укажите полный номер телефона', 'error'); return;
  }
  if (!tg) {
    showToast('Укажите ник в Telegram', 'error'); return;
  }
  closeCheckout();
  showPaymentScreen();
});

// ── Payment Screen ────────────────────────────
function showPaymentScreen() {
  paymentScreen.classList.add('is-active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
confirmPaymentBtn.addEventListener('click', function() {
  // Open Telegram dialog automatically
  window.open('https://t.me/nasty_brouke', '_blank', 'noopener,noreferrer');
  showSuccessScreen();
});

// ── Success Screen ────────────────────────────
function showSuccessScreen() {
  paymentScreen.classList.remove('is-active');
  successScreen.classList.add('is-active');

  const orderNum = 'JD-' + Date.now().toString().slice(-6);
  document.querySelector('.order-num').textContent = `Заказ ${orderNum}`;

  const summaryCard = document.querySelector('.order-summary-card');
  const delivery = getSelectedDelivery();
  summaryCard.innerHTML = `
    ${cart.map(item => `<div class="checkout-item"><span class="checkout-item-name">${item.title}</span><span>${formatPrice(item.price)}</span></div>`).join('')}
    <div class="checkout-item" style="margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid var(--color-border)">
      <span>Доставка (${delivery.label})</span>
      <span>${delivery.priceLabel || (delivery.price === 0 ? 'Бесплатно' : formatPrice(delivery.price))}</span>
    </div>
    <div class="checkout-item" style="font-weight:700; color:var(--color-accent); margin-top:0.5rem">
      <span>Итого</span>
      <span>${formatPrice(getCartTotal() + delivery.price)}</span>
    </div>
  `;

  cart = [];
  updateCartUI();
}

const backToCatalogBtn = document.getElementById('back-to-catalog-btn');
backToCatalogBtn.addEventListener('click', e => {
  e.preventDefault();
  successScreen.classList.remove('is-active');
  paymentScreen.classList.remove('is-active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── About Toggle ─────────────────────────────
const aboutToggle = document.getElementById('about-toggle');
const aboutExpand = document.getElementById('about-expand');
if (aboutToggle && aboutExpand) {
  aboutToggle.addEventListener('click', () => {
    const isOpen = aboutExpand.classList.toggle('is-open');
    aboutToggle.textContent = isOpen ? 'Скрыть ↑' : 'Читать дальше →';
  });
}

// ── Phone mask ───────────────────────────────
function initPhoneMask() {
  if (!fieldPhone) return;

  fieldPhone.addEventListener('input', function() {
    let val = this.value.replace(/\D/g, ''); // only digits
    if (val.startsWith('8')) val = '7' + val.slice(1);
    if (!val.startsWith('7')) val = '7' + val;
    val = val.slice(0, 11);

    let formatted = '+7';
    if (val.length > 1) formatted += ' (' + val.slice(1, 4);
    if (val.length >= 4) formatted += ') ' + val.slice(4, 7);
    if (val.length >= 7) formatted += '-' + val.slice(7, 9);
    if (val.length >= 9) formatted += '-' + val.slice(9, 11);

    this.value = formatted;
  });

  fieldPhone.addEventListener('keydown', function(e) {
    // Allow deleting back past +7
    if (e.key === 'Backspace' && this.value === '+7') {
      e.preventDefault();
    }
  });

  fieldPhone.addEventListener('focus', function() {
    if (!this.value) this.value = '+7 (';
  });

  fieldPhone.addEventListener('blur', function() {
    if (this.value === '+7 (') this.value = '';
  });
}

// ── Telegram @ strip ─────────────────────────
function initTelegramField() {
  if (!fieldTelegram) return;
  fieldTelegram.addEventListener('input', function() {
    // Remove any leading @ the user might type
    this.value = this.value.replace(/^@+/, '');
    // No spaces allowed
    this.value = this.value.replace(/\s/g, '');
  });
}

// ── Init ─────────────────────────────────────
renderCatalog();
updateCartUI();
initPhoneMask();
initTelegramField();
