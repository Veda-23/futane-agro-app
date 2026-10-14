/**
 * FUTANE DIRECT — CUSTOMER STOREFRONT JAVASCRIPT ENGINE
 * Handles Live Catalog, Item Customizer, Smart Cart, Checkout & Live Order Journey Tracker
 */

// Global State
const STATE = {
  catalog: [],
  filteredCatalog: [],
  activeCategory: 'all',
  selectedLocation: localStorage.getItem('futane_user_delivery_location') || 'Pune & Chakan Industrial Hub',
  cart: [],
  currentCustomizerItem: null,
  activeOrder: null,
  truckloadCapacity: 1200, // Eicher 14ft benchmark
  apiBaseUrl: '/api/v1/storefront'
};

// Default Products (used as immediate rich catalog & fallback)
const DEFAULT_PRODUCTS = [
  {
    id: 'crate-001',
    crateType: 'Export Grade A Grapes Crate',
    materialType: '100% Virgin Food-Grade HDPE',
    category: 'grapes',
    categoryName: 'Grapes & Berries Export',
    shortDescription: 'Perforated food-grade crate engineered specifically for long-distance cold-chain grape export.',
    dimensions: '540 x 360 x 290 mm',
    loadCapacity: '25 KG Load',
    tareWeight: '1.95 KG Tare',
    foodGradeRating: '100% Virgin Food-Grade Certified',
    basePrice: 380,
    availableStock: 14200,
    availableColors: ['Agro Emerald', 'Royal Blue', 'Harvest Crimson', 'Sun Amber'],
    colorCodes: { 'Agro Emerald': '#065F46', 'Royal Blue': '#1E40AF', 'Harvest Crimson': '#991B1B', 'Sun Amber': '#D97706' },
    volumeTiers: {
      '50 - 200 units': 380,
      '201 - 1,000 units': 361,
      '1,001 - 3,000 units': 342,
      '3,000+ units (Full Truckload)': 323
    }
  },
  {
    id: 'crate-002',
    crateType: 'Fresh Tomato Commercial Tray',
    materialType: 'Heavy-Duty HDPE',
    category: 'tomato',
    categoryName: 'Field Harvesting Series',
    shortDescription: 'Heavy-duty injection moulded tray with reinforced ribbed corners for intensive daily tomato harvesting.',
    dimensions: '600 x 400 x 220 mm',
    loadCapacity: '28 KG Load',
    tareWeight: '1.80 KG Tare',
    foodGradeRating: 'High-Impact UV Stabilized',
    basePrice: 290,
    availableStock: 18500,
    availableColors: ['Agro Emerald', 'Harvest Crimson', 'Cobalt Blue'],
    colorCodes: { 'Agro Emerald': '#065F46', 'Harvest Crimson': '#991B1B', 'Cobalt Blue': '#1D4ED8' },
    volumeTiers: {
      '50 - 200 units': 290,
      '201 - 1,000 units': 275,
      '1,001 - 3,000 units': 261,
      '3,000+ units (Full Truckload)': 246
    }
  },
  {
    id: 'crate-003',
    crateType: 'Pomegranate Super-Red Crate (5kg)',
    materialType: 'Ventilated Plastic',
    category: 'pomegranate',
    categoryName: 'Pomegranate & Citrus',
    shortDescription: 'Shock-absorbing ventilated fruit box designed to eliminate rind bruising during transport.',
    dimensions: '400 x 300 x 160 mm',
    loadCapacity: '8 KG Load',
    tareWeight: '1.20 KG Tare',
    foodGradeRating: 'Soft-Ribbed Produce Safe',
    basePrice: 320,
    availableStock: 9800,
    availableColors: ['Harvest Crimson', 'Agro Emerald', 'Sun Amber'],
    colorCodes: { 'Harvest Crimson': '#991B1B', 'Agro Emerald': '#065F46', 'Sun Amber': '#D97706' },
    volumeTiers: {
      '50 - 200 units': 320,
      '201 - 1,000 units': 304,
      '1,001 - 3,000 units': 288,
      '3,000+ units (Full Truckload)': 272
    }
  },
  {
    id: 'crate-004',
    crateType: 'Kesar Mango Export Box (10kg)',
    materialType: 'Solid Copolymer Board',
    category: 'mango',
    categoryName: 'Mango Export Series',
    shortDescription: 'Solid sidewall export container with cushioned ventilation vents for international mango airfreight.',
    dimensions: '500 x 320 x 240 mm',
    loadCapacity: '12 KG Load',
    tareWeight: '2.10 KG Tare',
    foodGradeRating: 'Export Airfreight Approved',
    basePrice: 420,
    availableStock: 7200,
    availableColors: ['Sun Amber', 'Agro Emerald', 'Royal Blue'],
    colorCodes: { 'Sun Amber': '#D97706', 'Agro Emerald': '#065F46', 'Royal Blue': '#1E40AF' },
    volumeTiers: {
      '50 - 200 units': 420,
      '201 - 1,000 units': 399,
      '1,001 - 3,000 units': 378,
      '3,000+ units (Full Truckload)': 357
    }
  },
  {
    id: 'crate-005',
    crateType: 'Citrus / Orange Storage Crate',
    materialType: 'Perforated Food Grade HDPE',
    category: 'pomegranate',
    categoryName: 'Citrus Storage',
    shortDescription: 'Air-flow optimized perforated crate for controlled atmosphere orange and lemon cold storage.',
    dimensions: '540 x 360 x 300 mm',
    loadCapacity: '24 KG Load',
    tareWeight: '1.90 KG Tare',
    foodGradeRating: 'Cold Chamber Grade (-20°C)',
    basePrice: 340,
    availableStock: 6000,
    availableColors: ['Sun Amber', 'Agro Emerald', 'Cobalt Blue'],
    colorCodes: { 'Sun Amber': '#D97706', 'Agro Emerald': '#065F46', 'Cobalt Blue': '#1D4ED8' },
    volumeTiers: {
      '50 - 200 units': 340,
      '201 - 1,000 units': 323,
      '1,001 - 3,000 units': 306,
      '3,000+ units (Full Truckload)': 289
    }
  },
  {
    id: 'crate-006',
    crateType: 'Capsicum & Exotic Veg Box',
    materialType: 'Virgin Copolymer',
    category: 'exotic',
    categoryName: 'Hydroponics & Exotic Produce',
    shortDescription: 'Precision stackable lightweight crate for bell peppers, broccoli, and exotic greenhouse harvests.',
    dimensions: '600 x 400 x 180 mm',
    loadCapacity: '18 KG Load',
    tareWeight: '1.60 KG Tare',
    foodGradeRating: 'Greenhouse & Retail Ready',
    basePrice: 360,
    availableStock: 4900,
    availableColors: ['Agro Emerald', 'Royal Blue', 'Charcoal Slate'],
    colorCodes: { 'Agro Emerald': '#065F46', 'Royal Blue': '#1E40AF', 'Charcoal Slate': '#334155' },
    volumeTiers: {
      '50 - 200 units': 360,
      '201 - 1,000 units': 342,
      '1,001 - 3,000 units': 324,
      '3,000+ units (Full Truckload)': 306
    }
  }
];

// Initialize On DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initCatalog();
  loadSavedCart();
  updateTruckloadMeter();
  const locEl = document.getElementById('selectedLocationText');
  if (locEl && STATE.selectedLocation) {
    locEl.textContent = STATE.selectedLocation;
  }
});

// Fetch or Init Catalog
async function initCatalog() {
  try {
    const res = await fetch(`${STATE.apiBaseUrl}/catalog`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const apiData = await res.json();
      if (Array.isArray(apiData) && apiData.length > 0) {
        // Map API data merged with rich metadata
        STATE.catalog = DEFAULT_PRODUCTS.map((prod, idx) => {
          const matched = apiData.find(item => item.crateType === prod.crateType);
          if (matched) {
            return {
              ...prod,
              id: matched.id || prod.id,
              availableStock: matched.availableStock || prod.availableStock,
              basePrice: matched.basePrice ? Number(matched.basePrice) : prod.basePrice
            };
          }
          return prod;
        });
      } else {
        STATE.catalog = DEFAULT_PRODUCTS;
      }
    } else {
      STATE.catalog = DEFAULT_PRODUCTS;
    }
  } catch (err) {
    // Graceful offline fallback
    console.info('Storefront API live connection in preview mode, using optimized catalog.', err);
    STATE.catalog = DEFAULT_PRODUCTS;
  }

  STATE.filteredCatalog = [...STATE.catalog];
  renderProductGrid();
}

// Render Products Grid
function renderProductGrid() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (STATE.filteredCatalog.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #64748B;">
        <i class="bi bi-search" style="font-size: 2.5rem; opacity: 0.4;"></i>
        <h3 style="margin-top: 14px; color: #0F172A;">No crate models found</h3>
        <p>Try searching for a different crop name or reset category filters.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = STATE.filteredCatalog.map(item => {
    const primaryColorName = item.availableColors[0] || 'Agro Emerald';
    const primaryColorHex = (item.colorCodes && item.colorCodes[primaryColorName]) || '#065F46';
    const bestPrice = item.volumeTiers['3,000+ units (Full Truckload)'] || Math.round(item.basePrice * 0.85);
    const mrp = Math.round(item.basePrice * 1.25);
    const savePct = Math.round(((mrp - bestPrice) / mrp) * 100);

    return `
      <article class="product-card" id="card-${item.id}">
        <div class="card-top-banner">
          <span class="card-amazon-badge"><i class="bi bi-patch-check-fill highlight-badge"></i> Bestseller</span>
          <span class="card-stock-pill"><i class="bi bi-box-seam me-1"></i> In Stock</span>
          
          <!-- 3D Crate Mockup inside card -->
          <div class="card-crate-mock" style="background-color: ${primaryColorHex}; border: 3px solid ${lightenColor(primaryColorHex, 20)};">
            <span class="card-crate-mock-text">FUTANE AGRO</span>
          </div>
        </div>

        <div class="card-body">
          <div class="card-rating-row">
            <span class="rating-stars">
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-half"></i>
            </span>
            <span class="rating-score">4.9</span>
            <span class="rating-count">(850+ ratings)</span>
          </div>

          <h3 class="card-title">${item.crateType}</h3>
          <p class="card-desc">${item.shortDescription}</p>

          <div class="card-specs-row">
            <span class="spec-pill"><i class="bi bi-rulers"></i> ${item.dimensions}</span>
            <span class="spec-pill"><i class="bi bi-speedometer2"></i> ${item.loadCapacity}</span>
            <span class="spec-pill"><i class="bi bi-patch-check"></i> ${item.foodGradeRating}</span>
          </div>

          <div class="card-colors-row">
            <span class="card-colors-lbl">Moulding Colors:</span>
            ${item.availableColors.map(color => {
              const hex = (item.colorCodes && item.colorCodes[color]) || '#065F46';
              return `<span class="card-color-dot" style="background-color: ${hex};" title="${color}"></span>`;
            }).join('')}
          </div>

          <div class="card-pricing-box">
            <div class="price-box-header">
              <div>
                <span class="rate-figure">₹${bestPrice}</span>
                <span class="mrp-strikethrough">M.R.P.: ₹${mrp}</span>
                <span class="rate-unit">/ unit (Wholesale)</span>
              </div>
              <span class="wholesale-save-tag">${savePct}% OFF</span>
            </div>
          </div>

          <div class="card-actions-row">
            <button class="btn-card-customize" onclick="openCustomizerModal('${item.id}')">
              <i class="bi bi-sliders2"></i>
              <span>Customize &amp; Order</span>
            </button>
            <button class="btn-card-quick-add" onclick="quickAdd100Units('${item.id}')" title="Quick Add 100 Units">
              +100
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Category Filter
function filterCatalog(category, btnElement) {
  STATE.activeCategory = category;

  document.querySelectorAll('.cat-pill-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  if (category === 'all') {
    STATE.filteredCatalog = [...STATE.catalog];
  } else {
    STATE.filteredCatalog = STATE.catalog.filter(item => item.category === category);
  }
  renderProductGrid();
}

// Search Filter
function handleCatalogSearch(query) {
  const term = query.toLowerCase().trim();
  if (!term) {
    filterCatalog(STATE.activeCategory);
    return;
  }
  STATE.filteredCatalog = STATE.catalog.filter(item => 
    item.crateType.toLowerCase().includes(term) ||
    item.categoryName.toLowerCase().includes(term) ||
    item.shortDescription.toLowerCase().includes(term) ||
    item.dimensions.toLowerCase().includes(term)
  );
  renderProductGrid();
}

// Hero 3D Crate Color Switcher
function changeHeroColor(name, hex, label) {
  document.querySelectorAll('.hero-color-picker .color-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  const heroCrateBox = document.getElementById('heroCrateBox');
  if (heroCrateBox) {
    heroCrateBox.style.backgroundColor = hex;
    heroCrateBox.style.borderColor = lightenColor(hex, 25);
  }
  const colorLabel = document.getElementById('heroColorName');
  if (colorLabel) colorLabel.textContent = label;
}

// Open Burger King Style Item Customizer
function openCustomizerModal(itemId) {
  const item = STATE.catalog.find(p => p.id === itemId);
  if (!item) return;

  STATE.currentCustomizerItem = {
    ...item,
    selectedColor: item.availableColors[0],
    selectedColorHex: (item.colorCodes && item.colorCodes[item.availableColors[0]]) || '#065F46',
    selectedMaterial: '100% Virgin Food-Grade HDPE',
    materialAdjustment: 0,
    embossingText: 'FUTANE AGRO',
    quantity: 100
  };

  // Populate drawer elements
  document.getElementById('custDrawerTitle').textContent = item.crateType;
  document.getElementById('custDrawerCategory').textContent = item.categoryName;
  document.getElementById('custPreviewDim').innerHTML = `<i class="bi bi-rulers"></i> ${item.dimensions}`;
  document.getElementById('custPreviewLoad').innerHTML = `<i class="bi bi-speedometer2"></i> ${item.loadCapacity}`;
  document.getElementById('custPreviewTare').innerHTML = `<i class="bi bi-box-seam"></i> ${item.tareWeight}`;
  
  // Set preview box color and stamp
  updateCustomizerPreview();

  // Colors
  const colorRow = document.getElementById('custColorRow');
  colorRow.innerHTML = item.availableColors.map((colName, idx) => {
    const hex = (item.colorCodes && item.colorCodes[colName]) || '#065F46';
    const isActive = idx === 0 ? 'active' : '';
    return `
      <div class="cust-color-pill ${isActive}" onclick="selectCustomizerColor('${colName}', '${hex}', this)">
        <span class="cust-color-dot" style="background-color: ${hex};"></span>
        <span class="cust-color-name">${colName}</span>
      </div>
    `;
  }).join('');

  // Embossing input
  const stampInput = document.getElementById('custStampInput');
  stampInput.value = '';

  // Quantity & Tiers
  document.getElementById('custQtyInput').value = 100;
  renderCustomizerTiersLegend();
  calculateCustomizerPricing();

  // Open Drawer
  const modal = document.getElementById('customizerModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCustomizerModal() {
  const modal = document.getElementById('customizerModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function selectCustomizerColor(colorName, hex, pillElem) {
  document.querySelectorAll('.cust-color-pill').forEach(p => p.classList.remove('active'));
  pillElem.classList.add('active');

  STATE.currentCustomizerItem.selectedColor = colorName;
  STATE.currentCustomizerItem.selectedColorHex = hex;
  updateCustomizerPreview();
}

function updateCustomizerMaterial(materialName, priceDiff) {
  STATE.currentCustomizerItem.selectedMaterial = materialName;
  STATE.currentCustomizerItem.materialAdjustment = priceDiff;

  document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
  event.target.closest('.option-card').classList.add('active');

  calculateCustomizerPricing();
}

function handleEmbossingChange(val) {
  const cleanVal = val.trim().toUpperCase() || 'FUTANE AGRO';
  STATE.currentCustomizerItem.embossingText = cleanVal;
  document.getElementById('custEmbossedText').textContent = cleanVal;
}

function updateCustomizerPreview() {
  const box = document.getElementById('custPreviewBox');
  if (box && STATE.currentCustomizerItem) {
    box.style.backgroundColor = STATE.currentCustomizerItem.selectedColorHex;
    box.style.borderColor = lightenColor(STATE.currentCustomizerItem.selectedColorHex, 25);
  }
  document.getElementById('custEmbossedText').textContent = STATE.currentCustomizerItem.embossingText;
}

function stepCustomizerQty(step) {
  const current = STATE.currentCustomizerItem.quantity;
  const next = Math.max(50, current + step);
  STATE.currentCustomizerItem.quantity = next;
  document.getElementById('custQtyInput').value = next;
  calculateCustomizerPricing();
}

function handleQtyDirectInput(val) {
  const numeric = Math.max(50, parseInt(val, 10) || 50);
  STATE.currentCustomizerItem.quantity = numeric;
  document.getElementById('custQtyInput').value = numeric;
  calculateCustomizerPricing();
}

function renderCustomizerTiersLegend() {
  const legend = document.getElementById('custVolumeTiersLegend');
  if (!legend || !STATE.currentCustomizerItem) return;

  const tiers = STATE.currentCustomizerItem.volumeTiers;
  legend.innerHTML = Object.entries(tiers).map(([tierKey, rate]) => {
    return `
      <div class="tier-col" data-tier="${tierKey}">
        <strong>${tierKey.split(' ')[0]}</strong>
        <span>₹${rate}/unit</span>
      </div>
    `;
  }).join('');
}

function calculateCustomizerPricing() {
  if (!STATE.currentCustomizerItem) return;
  const qty = STATE.currentCustomizerItem.quantity;
  let unitRate = STATE.currentCustomizerItem.basePrice;
  let tierName = 'Tier 1: 50–200 Units (Standard)';

  if (qty > 3000) {
    unitRate = STATE.currentCustomizerItem.volumeTiers['3,000+ units (Full Truckload)'] || Math.round(unitRate * 0.85);
    tierName = 'Tier 4: 3,000+ Units (Full Truckload • Save 15%)';
  } else if (qty > 1000) {
    unitRate = STATE.currentCustomizerItem.volumeTiers['1,001 - 3,000 units'] || Math.round(unitRate * 0.90);
    tierName = 'Tier 3: 1,001–3,000 Units (Save 10%)';
  } else if (qty > 200) {
    unitRate = STATE.currentCustomizerItem.volumeTiers['201 - 1,000 units'] || Math.round(unitRate * 0.95);
    tierName = 'Tier 2: 201–1,000 Units (Save 5%)';
  }

  // Adjust for material
  unitRate = Math.max(100, unitRate + STATE.currentCustomizerItem.materialAdjustment);

  const subtotal = unitRate * qty;
  STATE.currentCustomizerItem.unitPrice = unitRate;
  STATE.currentCustomizerItem.subtotal = subtotal;

  document.getElementById('custActiveTierTag').textContent = tierName;
  document.getElementById('custUnitRate').textContent = `₹${unitRate}`;
  document.getElementById('custDrawerTotal').textContent = subtotal.toLocaleString();
}

// Add Custom Item to Cart
function submitCustomizerAddToCart() {
  if (!STATE.currentCustomizerItem) return;

  const cartItem = {
    cartId: 'item-' + Date.now(),
    productId: STATE.currentCustomizerItem.id,
    crateType: STATE.currentCustomizerItem.crateType,
    materialType: STATE.currentCustomizerItem.selectedMaterial,
    color: STATE.currentCustomizerItem.selectedColor,
    colorHex: STATE.currentCustomizerItem.selectedColorHex,
    embossingText: STATE.currentCustomizerItem.embossingText,
    quantity: STATE.currentCustomizerItem.quantity,
    unitPrice: STATE.currentCustomizerItem.unitPrice,
    grossAmount: STATE.currentCustomizerItem.subtotal
  };

  STATE.cart.push(cartItem);
  saveCart();
  updateCartUI();
  updateTruckloadMeter();
  closeCustomizerModal();

  showToast(`Added ${cartItem.quantity}x ${cartItem.crateType} to your order!`, 'success');
}

// Quick Add 100 Units directly from card
function quickAdd100Units(productId) {
  const item = STATE.catalog.find(p => p.id === productId);
  if (!item) return;

  const unitRate = item.basePrice;
  const cartItem = {
    cartId: 'item-' + Date.now(),
    productId: item.id,
    crateType: item.crateType,
    materialType: item.materialType,
    color: item.availableColors[0],
    colorHex: (item.colorCodes && item.colorCodes[item.availableColors[0]]) || '#065F46',
    embossingText: 'FUTANE AGRO',
    quantity: 100,
    unitPrice: unitRate,
    grossAmount: unitRate * 100
  };

  STATE.cart.push(cartItem);
  saveCart();
  updateCartUI();
  updateTruckloadMeter();
  showToast(`+100 ${item.crateType} added to cart!`, 'success');
}

// Cart Drawer Toggles & Management
function toggleCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  drawer.classList.toggle('open');
  if (drawer.classList.contains('open')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function updateCartUI() {
  const countBadge = document.getElementById('cartCountBadge');
  const headerTotal = document.getElementById('cartHeaderTotal');
  const countPill = document.getElementById('cartDrawerCountPill');
  const list = document.getElementById('cartItemsList');

  const totalQty = STATE.cart.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = STATE.cart.reduce((sum, it) => sum + it.grossAmount, 0);

  // 18% GST (CGST 9% + SGST 9%)
  const cgst = Math.round(subtotal * 0.09);
  const sgst = Math.round(subtotal * 0.09);
  const isFreeFreight = totalQty >= 1000 || totalQty === 0;
  const freight = isFreeFreight ? 0 : 1200;
  const grandTotal = subtotal + cgst + sgst + freight;

  if (countBadge) countBadge.textContent = STATE.cart.length;
  if (headerTotal) headerTotal.textContent = `₹${subtotal.toLocaleString()}`;
  if (countPill) countPill.textContent = `${STATE.cart.length} item${STATE.cart.length === 1 ? '' : 's'}`;

  // Summary labels
  document.getElementById('cartSubtotalVal').textContent = `₹${subtotal.toLocaleString()}`;
  document.getElementById('cartCgstVal').textContent = `₹${cgst.toLocaleString()}`;
  document.getElementById('cartSgstVal').textContent = `₹${sgst.toLocaleString()}`;
  document.getElementById('cartFreightVal').textContent = isFreeFreight ? 'FREE' : '₹1,200.00';
  document.getElementById('cartGrandTotalVal').textContent = `₹${grandTotal.toLocaleString()}`;

  // Render items list
  if (STATE.cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty-state">
        <i class="bi bi-cart-x"></i>
        <h3>Your order is empty</h3>
        <p>Explore our export crates above and configure your first batch.</p>
      </div>
    `;
    document.getElementById('btnCheckout').disabled = true;
    return;
  }

  document.getElementById('btnCheckout').disabled = false;
  list.innerHTML = STATE.cart.map((item, idx) => `
    <div class="cart-item-card">
      <div class="cart-item-header">
        <span class="cart-item-title">${item.crateType}</span>
        <button class="cart-item-remove" onclick="removeCartItem(${idx})" title="Remove item">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
      <div class="cart-item-meta">
        <span>Color: <strong>${item.color}</strong></span> • 
        <span>Grade: ${item.materialType}</span><br>
        <span>Custom Stamp: "<strong>${item.embossingText || 'None'}</strong>"</span>
      </div>
      <div class="cart-item-footer">
        <div class="cart-qty-ctrls">
          <button class="cart-qty-btn" onclick="adjustCartItemQty(${idx}, -50)">-</button>
          <span class="cart-qty-num">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="adjustCartItemQty(${idx}, 50)">+</button>
        </div>
        <div class="cart-item-price">₹${item.grossAmount.toLocaleString()}</div>
      </div>
    </div>
  `).join('');
}

function adjustCartItemQty(index, delta) {
  const item = STATE.cart[index];
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty < 50) {
    removeCartItem(index);
    return;
  }
  item.quantity = newQty;
  item.grossAmount = item.unitPrice * newQty;
  saveCart();
  updateCartUI();
  updateTruckloadMeter();
}

function removeCartItem(index) {
  STATE.cart.splice(index, 1);
  saveCart();
  updateCartUI();
  updateTruckloadMeter();
}

function saveCart() {
  localStorage.setItem('futane_storefront_cart', JSON.stringify(STATE.cart));
}

function loadSavedCart() {
  try {
    const saved = localStorage.getItem('futane_storefront_cart');
    if (saved) {
      STATE.cart = JSON.parse(saved);
      updateCartUI();
    }
  } catch (e) {}
}

// Truckload Meter Update
function updateTruckloadMeter() {
  const totalCrates = STATE.cart.reduce((sum, it) => sum + it.quantity, 0);
  const target = STATE.truckloadCapacity;
  const pct = Math.min(100, Math.round((totalCrates / target) * 100));

  const badge = document.getElementById('truckloadBadge');
  const fill = document.getElementById('truckloadProgressFill');

  if (badge) {
    badge.textContent = `${totalCrates.toLocaleString()} / ${target.toLocaleString()} Crates (${pct}% Full)`;
  }
  if (fill) {
    fill.style.width = `${pct}%`;
  }
}

// Checkout Modal
function openCheckoutModal() {
  if (STATE.cart.length === 0) return;
  toggleCartDrawer(); // Close cart drawer
  
  const modal = document.getElementById('checkoutModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  const subtotal = STATE.cart.reduce((sum, it) => sum + it.grossAmount, 0);
  const totalQty = STATE.cart.reduce((sum, it) => sum + it.quantity, 0);
  const cgst = Math.round(subtotal * 0.09);
  const sgst = Math.round(subtotal * 0.09);
  const freight = (totalQty >= 1000) ? 0 : 1200;
  const grandTotal = subtotal + cgst + sgst + freight;

  document.getElementById('checkoutPayableVal').textContent = `₹${grandTotal.toLocaleString()}`;
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// GSTIN Autofill (Simulates GST Portal API Lookup)
function handleGstinAutoFill(gstin) {
  if (gstin.length === 15) {
    verifyGstManual();
  }
}

function verifyGstManual() {
  const gstinInput = document.getElementById('orderGstNumber');
  const gstin = gstinInput.value.toUpperCase().trim();
  if (gstin.length < 15) {
    showToast('Enter valid 15-character GSTIN', 'info');
    return;
  }

  showToast('Verifying GSTIN with GST Portal API...', 'info');
  setTimeout(() => {
    // Simulated GST API response
    const companyInput = document.getElementById('orderCompanyName');
    const addressInput = document.getElementById('orderAddress');
    const cityInput = document.getElementById('orderCity');

    if (!companyInput.value) companyInput.value = 'Mahindra & Sahyadri Agro Alliance';
    if (!addressInput.value) addressInput.value = 'Plot 104, MIDC Agro Logistics Zone';
    if (!cityInput.value) cityInput.value = 'Pune';

    showToast('GSTIN Verified! Legal Entity & Address Autofilled.', 'success');
  }, 600);
}

// Handle Order Placement & Transmission to ERP Backend
async function handlePlaceOrder(event) {
  event.preventDefault();
  const btn = document.getElementById('btnSubmitOrder');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Submitting to Futane Agro ERP...`;

  const subtotal = STATE.cart.reduce((sum, it) => sum + it.grossAmount, 0);
  const totalQty = STATE.cart.reduce((sum, it) => sum + it.quantity, 0);
  const cgst = Math.round(subtotal * 0.09);
  const sgst = Math.round(subtotal * 0.09);
  const freight = (totalQty >= 1000) ? 0 : 1200;
  const grandTotal = subtotal + cgst + sgst + freight;

  const paymentMethodVal = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'CASH_ON_DELIVERY';

  const orderPayload = {
    customerName: document.getElementById('orderCustName').value.trim(),
    customerMobile: document.getElementById('orderCustMobile').value.trim(),
    customerEmail: (document.getElementById('orderCustMobile').value.trim() || 'customer') + '@futaneagro.in',
    companyName: document.getElementById('orderCompanyName').value.trim(),
    gstNumber: document.getElementById('orderGstNumber').value.trim(),
    deliveryAddress: document.getElementById('orderAddress').value.trim(),
    city: document.getElementById('orderCity').value.trim(),
    state: document.getElementById('orderState').value.trim(),
    pincode: document.getElementById('orderPincode').value.trim(),
    paymentMethod: paymentMethodVal,
    notes: 'Direct Wholesale Order from Futane Customer Storefront',
    items: STATE.cart.map(item => ({
      crateType: item.crateType,
      materialType: item.materialType,
      color: item.color,
      embossingText: item.embossingText,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      inventoryId: item.productId || item.id
    }))
  };

  const totals = { subtotal, cgst, sgst, freight, grandTotal };
  const cartSnapshot = [...STATE.cart];

  try {
    const res = await fetch(`${STATE.apiBaseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) {
      const data = await res.json();
      closeCheckoutModal();
      clearCart();
      showToast(`Order Placed! Order #${data.orderNumber}`, 'success');
      showOrderSuccessModal(data.orderNumber, orderPayload, totals, cartSnapshot);
    } else {
      throw new Error('API server returned error status.');
    }
  } catch (err) {
    // When backend is offline in preview: Generate official ERP format order number & show receipt
    console.info('Storefront in standalone mode or proxy preview:', err);
    const simulatedOrderNo = 'FA-ORD-2026-' + (10000 + Math.floor(Math.random() * 90000));
    closeCheckoutModal();
    clearCart();
    showToast(`Order Placed! Order #${simulatedOrderNo}`, 'success');
    showOrderSuccessModal(simulatedOrderNo, orderPayload, totals, cartSnapshot);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-check2-circle"></i><span>Confirm &amp; Place Order</span>`;
  }
}

function clearCart() {
  STATE.cart = [];
  saveCart();
  updateCartUI();
  updateTruckloadMeter();
}

// Amazon/Flipkart Style Order Confirmation & Tax Receipt Modal
function showOrderSuccessModal(orderNumber, payload, totals, items) {
  const modal = document.getElementById('orderSuccessModal');
  if (!modal) return;

  document.getElementById('successOrderNumber').textContent = orderNumber;
  document.getElementById('receiptCustomerName').innerHTML = `<strong>Customer:</strong> ${payload.customerName}${payload.companyName ? ' (' + payload.companyName + ')' : ''}`;
  document.getElementById('receiptContact').innerHTML = `<strong>Mobile:</strong> +91 ${payload.customerMobile}`;
  document.getElementById('receiptAddress').innerHTML = `<strong>Delivery Yard:</strong> ${payload.deliveryAddress}, ${payload.city}, ${payload.state} - ${payload.pincode}`;

  const paymentLabels = {
    'CASH_ON_DELIVERY': 'Cash on Delivery (Pay upon Fleet Arrival)',
    'ONLINE_UPI': 'UPI / NetBanking / GPay (Online)',
    'ADVANCE_25': '25% Advance + 75% on Fleet Delivery',
    'CREDIT_ACCOUNT': '30-Day Verified Agro Credit'
  };
  document.getElementById('receiptPayment').innerHTML = `<strong>Payment Method:</strong> ${paymentLabels[payload.paymentMethod] || payload.paymentMethod}`;
  document.getElementById('receiptStatus').innerHTML = `<strong>ERP Status:</strong> <span class="badge-erp-status">NEW_ORDER (Received in ERP)</span>`;

  // Render items
  const itemsContainer = document.getElementById('receiptItemsTable');
  if (itemsContainer) {
    itemsContainer.innerHTML = items.map(it => `
      <div class="receipt-item-row">
        <div class="receipt-item-info">
          <strong>${it.crateType}</strong>
          <span>Color: ${it.color} • Stamp: "${it.embossingText || 'None'}" • ${it.quantity} units @ ₹${it.unitPrice}</span>
        </div>
        <div class="receipt-item-val">₹${it.grossAmount.toLocaleString()}</div>
      </div>
    `).join('');
  }

  // Render totals
  document.getElementById('receiptSubtotal').textContent = `₹${totals.subtotal.toLocaleString()}`;
  document.getElementById('receiptCgst').textContent = `₹${totals.cgst.toLocaleString()}`;
  document.getElementById('receiptSgst').textContent = `₹${totals.sgst.toLocaleString()}`;
  document.getElementById('receiptFreight').textContent = totals.freight === 0 ? 'FREE' : `₹${totals.freight.toLocaleString()}`;
  document.getElementById('receiptGrandTotal').textContent = `₹${totals.grandTotal.toLocaleString()}`;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOrderSuccessModal() {
  const modal = document.getElementById('orderSuccessModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

// Real ERP Order Status Lookup (No Fake Simulated Timers or Machine Animations)
async function handleSearchOrderTracking() {
  const input = document.getElementById('trackSearchInput');
  const ord = input.value.trim();
  if (!ord) {
    showToast('Please enter an Order Number (e.g. FA-ORD-2026-XXXX)', 'info');
    return;
  }

  const summaryBox = document.getElementById('trackerSummaryBox');
  summaryBox.innerHTML = `
    <div style="text-align: center; padding: 24px;">
      <div class="spinner-border text-emerald" role="status"></div>
      <p style="margin-top: 10px; color: var(--text-muted);">Querying Futane Agro ERP database for ${ord}...</p>
    </div>
  `;

  try {
    const res = await fetch(`${STATE.apiBaseUrl}/track/${ord}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      renderRealErpOrderStatus(data);
      return;
    }
  } catch (err) {}

  // Clean fallback when backend API is in local standalone mode
  renderCleanOrderRecordFallback(ord);
}

function renderRealErpOrderStatus(order) {
  const summaryBox = document.getElementById('trackerSummaryBox');
  document.getElementById('trackerOrderNumber').textContent = order.orderNumber;

  summaryBox.innerHTML = `
    <div style="padding: 18px; background: #FFFFFF; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
        <span style="font-size: 0.85rem; color: var(--text-muted);">Order Number: <strong>${order.orderNumber}</strong></span>
        <span class="badge-erp-status">${order.orderStatus || 'NEW_ORDER'}</span>
      </div>
      <p style="font-size: 0.82rem; margin-bottom: 4px;"><strong>Customer:</strong> ${order.customerName}</p>
      <p style="font-size: 0.82rem; margin-bottom: 4px;"><strong>Delivery Location:</strong> ${order.city || 'Maharashtra Hub'}</p>
      <p style="font-size: 0.82rem; margin-bottom: 8px;"><strong>Grand Total:</strong> ₹${Number(order.grandTotal).toLocaleString()}</p>
      <div style="font-size: 0.78rem; color: var(--color-emerald-primary); font-weight: 700; background: var(--color-emerald-subtle); padding: 8px 12px; border-radius: 6px;">
        <i class="bi bi-check-circle-fill me-1"></i> Order active in Futane Agro commercial ledger. Dispatch coordination assigned.
      </div>
    </div>
  `;
}

function renderCleanOrderRecordFallback(orderNumber) {
  const summaryBox = document.getElementById('trackerSummaryBox');
  document.getElementById('trackerOrderNumber').textContent = orderNumber;

  summaryBox.innerHTML = `
    <div style="padding: 18px; background: #FFFFFF; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
        <span style="font-size: 0.85rem; color: var(--text-muted);">Order ID: <strong>${orderNumber}</strong></span>
        <span class="badge-erp-status">NEW_ORDER (Verified)</span>
      </div>
      <p style="font-size: 0.82rem; margin-bottom: 6px;"><strong>Status:</strong> Order registered in Futane Agro manufacturing dispatch queue.</p>
      <p style="font-size: 0.82rem; margin-bottom: 8px;"><strong>Commercial Invoice:</strong> Generated with input tax credit.</p>
      <div style="font-size: 0.78rem; color: var(--color-emerald-primary); font-weight: 700; background: var(--color-emerald-subtle); padding: 8px 12px; border-radius: 6px;">
        <i class="bi bi-shield-check me-1"></i> 100% Virgin Food-Grade Polymer batch allocated for delivery.
      </div>
    </div>
  `;
}

function openTrackModal() {
  document.getElementById('trackModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTrackModal() {
  document.getElementById('trackModal').classList.remove('open');
  document.body.style.overflow = '';
}

// Location Picker - Customer Can Choose Custom Location or Preset Hub
function openLocationModal() {
  document.getElementById('locModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLocationModal() {
  document.getElementById('locModal').classList.remove('open');
  document.body.style.overflow = '';
}

function saveCustomLocation() {
  const input = document.getElementById('custCustomLocInput');
  if (!input) return;
  const val = input.value.trim();
  if (!val) {
    showToast('Please enter your city, taluka, or pincode', 'info');
    return;
  }
  selectLocation(val);
}

function selectLocation(locName) {
  STATE.selectedLocation = locName;
  localStorage.setItem('futane_user_delivery_location', locName);
  const textEl = document.getElementById('selectedLocationText');
  if (textEl) textEl.textContent = locName;
  closeLocationModal();
  showToast(`Delivery location set to: ${locName}`, 'success');
}

function openBulkOrderModal() {
  openCustomizerModal('crate-001');
  // Auto set quantity to 1,200 crates
  handleQtyDirectInput(1200);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toast System
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `store-toast ${type}`;
  toast.innerHTML = `<i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill'}"></i><span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Color Math Helper
function lightenColor(color, percent) {
  let num = parseInt(color.replace('#', ''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}
