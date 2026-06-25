/**
 * VibrantGlaze — Shared Utilities
 * Used across all pages: cart, API, toast, search, announcement
 */

const API_BASE = "/api";

function isLocalFileMode() {
  return window.location.protocol === "file:";
}

function resolveImageUrl(src) {
  if (!src) src = "logo.jpg";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return src;
  const filename = src.replace(/^images\//, "");
  if (isLocalFileMode()) return filename;
  return "/static/images/" + filename;
}

function setDynamicImagePaths() {
  document.documentElement.style.setProperty(
    "--hero-bg-image",
    `url("${resolveImageUrl("hero-new.jpg")}")`
  );
  document.documentElement.style.setProperty(
    "--promo-bg-image",
    `url("${resolveImageUrl("pearl_earrings.png")}")`
  );
  document.documentElement.style.setProperty(
    "--cat-resin-bg",
    `url("${resolveImageUrl("resin_keychain.png")}")`
  );
  document.documentElement.style.setProperty(
    "--cat-earrings-bg",
    `url("${resolveImageUrl("pearl_earrings.png")}")`
  );
  document.documentElement.style.setProperty(
    "--cat-pendants-bg",
    `url("${resolveImageUrl("resin_pendant.png")}")`
  );
  document.documentElement.style.setProperty(
    "--cat-keychains-bg",
    `url("${resolveImageUrl("resin_keychain.png")}")`
  );
}

// =========================================
// API HELPER
// =========================================
async function apiCall(endpoint, method = "GET", body = null) {
  try {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + endpoint, opts);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API Fallback] ${endpoint}:`, err.message);
    return null;
  }
}

// =========================================
// DEFAULT DATA (offline fallback)
// =========================================
const DEFAULT_PRODUCTS = [
  { id:"p1", title:"Bespoke Floral A-Z Initial Keychain", category:"Keychain", price:349, image:"resin_keychain.png", color:"Pink & Gold", material:"Epoxy Resin, Dried Petals, Gold Flakes", isCustomizable:true, rating:4.8, description:"Individually handcrafted initial keychain, cast with crystal-clear resin, authentic copper/gold flakes, and locally-sourced dehydrated pink flower petals. Sealed with a scratch-resistant gloss glaze.", sizes:["Standard (Small Keyring)","Premium (Tassel & Charm)","Luxury (Double Tassel & Monogram)"], sizePrices:{"Standard (Small Keyring)":0,"Premium (Tassel & Charm)":100,"Luxury (Double Tassel & Monogram)":200}, reviews:[{name:"Sneha Patel",rating:5,date:"2026-05-14",comment:"Absolutely stunning! The packaging had a lovely lavender scent.",photo:"resin_keychain.png"},{name:"Rahul Verma",rating:4,date:"2026-05-20",comment:"Ordered letter R as a gift. The resin is super smooth.",photo:null}] },
  { id:"p2", title:"Preserved Botanical Daisy Pendant Necklace", category:"Pendant", price:499, image:"resin_pendant.png", color:"White & Gold", material:"Epoxy Resin, Daisy Flower, Gold Plated Brass", isCustomizable:true, rating:4.9, description:"An elegant oval pendant preserving a whole real white daisy flower in high-grade UV-resistant resin. Suspended from an 18K gold-plated nickel-free brass chain.", sizes:["16-Inch Chain","18-Inch Chain","20-Inch Chain"], sizePrices:{"16-Inch Chain":0,"18-Inch Chain":50,"20-Inch Chain":90}, reviews:[{name:"Aditi Rao",rating:5,date:"2026-05-02",comment:"So simple and aesthetic. Matches my casual linen shirts perfectly.",photo:null}] },
  { id:"p3", title:"Luxury Gold-Plated White Pearl Drop Earrings", category:"Earring", price:699, image:"pearl_earrings.png", color:"Pearl White", material:"Gold Plating, Brass, Faux Pearl, Cubic Zirconia", isCustomizable:false, rating:4.7, description:"Exquisite drop earrings highlighting a perfectly round premium shell pearl capped in sparkling micro-pave cubic zirconia settings.", sizes:["Standard Pair"], sizePrices:{"Standard Pair":0}, reviews:[{name:"Neha Sharma",rating:5,date:"2026-04-18",comment:"Looks like real fine gold jewellery!",photo:"pearl_earrings.png"},{name:"Preeti Singh",rating:4,date:"2026-04-29",comment:"A bit smaller than expected, but extremely shiny.",photo:null}] },
  { id:"p4", title:"Royal Kundan & Pearl Bridal Necklace Set", category:"Pendant", price:1899, image:"kundan_necklace.png", color:"Gold & Ruby Red", material:"Brass, Kundan Stones, Enamel Work, Cultured Pearls", isCustomizable:false, rating:5.0, description:"Traditional heavy Kundan choker embellished with deep ruby red glass beads, faux pearls, and detailed meenakari back-enameling.", sizes:["Choker + Earring Set"], sizePrices:{"Choker + Earring Set":0}, reviews:[{name:"Megha Tosawad",rating:5,date:"2026-05-30",comment:"Breathtaking piece! Wore it for my cousin's wedding.",photo:"kundan_necklace.png"}] },
  { id:"p5", title:"Custom Amethyst Resin Coaster Pair", category:"Resin", price:599, image:"https://images.unsplash.com/photo-1596548438137-d51ef5c43291?auto=format&fit=crop&q=80&w=600", color:"Amethyst Violet", material:"Epoxy Resin, Acrylic Pigment, Silver Leaf", isCustomizable:true, rating:4.6, description:"Geode-style resin coasters mixed with amethyst-colored alcohol inks and fine glitter, edged with silver metallic gilding. Heat-resistant up to 80°C.", sizes:["2-Piece Set","4-Piece Set (+Rs. 450)","6-Piece Set (+Rs. 850)"], sizePrices:{"2-Piece Set":0,"4-Piece Set (+Rs. 450)":450,"6-Piece Set (+Rs. 850)":850}, reviews:[] },
  { id:"p6", title:"Classic Gold Foil Floral Resin Bangle", category:"Bangles", price:449, image:"https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=600", color:"Gold & Yellow", material:"Epoxy Resin, Dried Buttercups, Gold Foil", isCustomizable:true, rating:4.5, description:"A continuous solid resin bangle containing yellow dried buttercup petals and crushed gold foil flakes. Smooth inner circumference for a comfortable fit.", sizes:["2.4 Size","2.6 Size (+Rs. 30)","2.8 Size (+Rs. 60)"], sizePrices:{"2.4 Size":0,"2.6 Size (+Rs. 30)":30,"2.8 Size (+Rs. 60)":60}, reviews:[] },
  { id:"p7", title:"Aesthetic Ocean Wave Resin Bookmark", category:"Resin", price:249, image:"https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=600", color:"Oceanic Blue", material:"Epoxy Resin, Sea Sand, Acrylic Foam Cell, Tassel", isCustomizable:true, rating:4.9, description:"Perfect gift for bibliophiles. Features a realistic multi-layered ocean shoreline pour with real beach sand and seafoam cells, topped with a silken tassel.", sizes:["Standard Bookmark","Bookmark with Custom Initial Letter charm (+Rs. 50)"], sizePrices:{"Standard Bookmark":0,"Bookmark with Custom Initial Letter charm (+Rs. 50)":50}, reviews:[{name:"John Doe",rating:5,date:"2026-05-18",comment:"Literally looks like a piece of the beach in my books.",photo:null}] },
  { id:"p8", title:"Polished Kundan Gold-Plated Cuff Bracelet", category:"Bracelet", price:799, image:"https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&q=80&w=600", color:"Gold", material:"Gold Plating, Brass, Kundan Stones", isCustomizable:false, rating:4.8, description:"Openable cuff bracelet lined with geometric Kundan work and backed by a hand-carved floral brass structure. Double lock mechanism for safety.", sizes:["Standard Adjustable Size"], sizePrices:{"Standard Adjustable Size":0}, reviews:[] },
  { id:"p9", title:"Ruby Resin Teardrop Jhumka Earrings", category:"Earring", price:350, image:"earring_ruby_teardrop.png", color:"Ruby & Gold", material:"Epoxy Resin, Gold Flakes, Antique Silver Brass", isCustomizable:false, rating:4.9, description:"Stunning teardrop-shaped resin earrings filled with deep ruby red pigment and real gold foil flakes, set in an intricately detailed antique silver jhumka frame with delicate dangling bell fringe. Lightweight yet bold — perfect for festive occasions.", sizes:["Standard Pair"], sizePrices:{"Standard Pair":0}, reviews:[{name:"Priya Mehta", rating:5, date:"2026-05-10", comment:"These are absolutely gorgeous! Got so many compliments at the wedding.", photo:null}] },
  { id:"p10", title:"Ruby Resin Square Jhumka Earrings", category:"Earring", price:350, image:"earring_ruby_square.png", color:"Ruby & Gold", material:"Epoxy Resin, Gold Flakes, Antique Silver Brass", isCustomizable:false, rating:4.8, description:"Bold square-shaped resin earrings in vibrant ruby pink with chunky gold foil embedded inside, framed in ornate antique silver with a cascading row of silver ghungroo bells. A statement piece that adds traditional elegance to any look.", sizes:["Standard Pair"], sizePrices:{"Standard Pair":0}, reviews:[{name:"Simran Kaur", rating:5, date:"2026-05-18", comment:"Perfectly crafted. The gold chunks inside look so premium!", photo:null}] },
  { id:"p11", title:"Blue Daisy Resin Square Jhumka Earrings", category:"Earring", price:350, image:"earring_blue_daisy.png", color:"Turquoise Blue & White", material:"Epoxy Resin, Pressed Daisy Flower, Antique Silver Brass", isCustomizable:false, rating:5.0, description:"Vibrant turquoise blue resin earrings with a real preserved white daisy flower at the center, set in a diamond-cut antique silver jhumka frame. A beautiful fusion of nature and resin art, perfect for everyday boho styling.", sizes:["Standard Pair"], sizePrices:{"Standard Pair":0}, reviews:[{name:"Aisha Siddiqui", rating:5, date:"2026-06-01", comment:"The flower inside looks so real! Absolutely love the color.", photo:null}] },
  { id:"p12", title:"Sky Blue Daisy Resin Teardrop Earrings", category:"Earring", price:350, image:"earring_skyblue_daisy.png", color:"Sky Blue & White", material:"Epoxy Resin, Pressed Daisy Flower, Antique Silver Brass", isCustomizable:false, rating:4.9, description:"Delicate sky blue teardrop resin earrings with a real dried white daisy preserved inside, encased in an ornate antique silver filigree frame with silver ghungroo bells. Elegant, lightweight, and ideal for both casual and festive wear.", sizes:["Standard Pair"], sizePrices:{"Standard Pair":0}, reviews:[{name:"Divya Nair", rating:5, date:"2026-06-03", comment:"So pretty and dainty. The sky blue colour is exactly as shown.", photo:null}] },
  { id:"p13", title:"Teal & Gold Daisy Resin Jhumka Earrings", category:"Earring", price:350, image:"earring_teal_daisy.png", color:"Teal & Gold", material:"Epoxy Resin, Pressed Daisy Flower, Gold Flakes, Antique Silver Brass", isCustomizable:false, rating:4.9, description:"Rich teal resin earrings featuring a real white daisy flower surrounded by scattered gold foil flakes, housed in a teardrop antique silver jhumka with layered bell dangles. The most luxurious of our floral earring series — a true collector's piece.", sizes:["Standard Pair"], sizePrices:{"Standard Pair":0}, reviews:[{name:"Rukhsana Shaikh", rating:5, date:"2026-06-05", comment:"Bought all three daisy pairs! This teal one is my absolute favourite.", photo:null}] }
];

// =========================================
// GLOBAL STATE
// =========================================
let VG = {
  products: [],
  coupons: [],
  cart: JSON.parse(localStorage.getItem("vg_cart") || "[]"),
  user: JSON.parse(localStorage.getItem("vg_user") || "null"),
  appliedCoupon: JSON.parse(localStorage.getItem("vg_applied_coupon") || "null")
};

// =========================================
// INIT — LOAD DATA & RENDER SHARED UI
// =========================================
async function vgInit() {
  // Load products
  const p = await apiCall("/products");
  VG.products = p || JSON.parse(localStorage.getItem("vg_products") || "null") || DEFAULT_PRODUCTS;
  if (p) localStorage.setItem("vg_products", JSON.stringify(p));

  // Load coupons
  const c = await apiCall("/coupons");
  VG.coupons = c || JSON.parse(localStorage.getItem("vg_coupons") || "null") || [];
  if (c) localStorage.setItem("vg_coupons", JSON.stringify(c));

  // Load announcement
  const s = await apiCall("/settings");
  if (s && s.announcement) {
    localStorage.setItem("vg_announcement", s.announcement);
  }

  renderAnnouncement();
  renderHeaderUser();
  updateCartBadge();
  setActiveNavLink();
}

// =========================================
// ANNOUNCEMENT
// =========================================
function renderAnnouncement() {
  const el = document.getElementById("announcement-text");
  if (!el) return;
  const txt = localStorage.getItem("vg_announcement") || "✨ FESTIVAL OFFER: Use code FESTIVE15 for 15% OFF on all customized resin art!";
  el.textContent = txt;
}

// =========================================
// HEADER USER STATE
// =========================================
function renderHeaderUser() {
  const badge = document.getElementById("header-user-badge");
  const adminBtn = document.getElementById("admin-nav-btn");
  if (badge) badge.textContent = VG.user ? VG.user.name.split(" ")[0] : "Account";
  if (adminBtn) adminBtn.style.display = (VG.user && VG.user.isAdmin) ? "flex" : "none";
}

// =========================================
// ACTIVE NAV LINK
// =========================================
function setActiveNavLink() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  let page = path.split("/").pop() || "index.html";
  if (page === "" || page === "index") page = "index.html";
  else if (!page.includes(".")) page = page + ".html";
  document.querySelectorAll(".nav-item[data-page]").forEach(a => {
    a.classList.toggle("active", a.dataset.page === page);
  });
}

// =========================================
// CART BADGE
// =========================================
function updateCartBadge() {
  const count = VG.cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll(".cart-badge").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

function saveCart() {
  localStorage.setItem("vg_cart", JSON.stringify(VG.cart));
  updateCartBadge();
}

// =========================================
// ADD TO CART
// =========================================
function addToCart(productId, qty = 1, size = null, btn = null) {
  const p = VG.products.find(x => x.id === productId);
  if (!p) return;
  const selectedSize = size || (p.sizes && p.sizes[0]) || "Standard";
  const extraPrice = (p.sizePrices && p.sizePrices[selectedSize]) || 0;
  const unitPrice = p.price + extraPrice;
  const key = productId + "__" + selectedSize;
  const existing = VG.cart.find(i => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    VG.cart.push({ key, id: productId, title: p.title, image: p.image, price: unitPrice, qty, size: selectedSize, isCustomizable: p.isCustomizable });
  }
  saveCart();
  showToast(`"${p.title}" added to cart!`);
  renderCartDrawer();
  
  if (btn) {
    if (btn.classList.contains('btn-add-cart')) {
      btn.textContent = "Go to Cart";
    } else {
      btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
      btn.title = "Go to Cart";
    }
    btn.setAttribute("onclick", "event.stopPropagation(); goToCartPage();");
  }
}

function goToCartPage() {
  window.location.href = "cart.html";
}

// =========================================
// CART DRAWER
// =========================================
function toggleCart() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  if (!drawer) return;
  drawer.classList.toggle("active");
  if (overlay) overlay.classList.toggle("active");
  if (drawer.classList.contains("active")) renderCartDrawer();
}

function renderCartDrawer() {
  const container = document.getElementById("cart-items-list");
  if (!container) return;

  const giftToggle = document.getElementById("gift-toggle");
  if (giftToggle) giftToggle.checked = localStorage.getItem("vg_gift_packaging") === "1";

  const couponInput = document.getElementById("coupon-input");
  if (couponInput && VG.appliedCoupon) couponInput.value = VG.appliedCoupon.code;

  if (!VG.cart.length) {
    container.innerHTML = `<div style="text-align:center;padding:32px 12px;color:var(--text-secondary)"><i class="fa-solid fa-bag-shopping" style="font-size:36px;opacity:0.2;margin-bottom:12px;display:block;"></i><p style="font-size:14px">Your bag is empty</p><a href="shop.html" style="display:inline-block;margin-top:16px;padding:11px 24px;background:var(--gold-gradient);color:#fff;border-radius:8px;font-size:13px;font-weight:600;">Start Shopping</a></div>`;
    updateCartTotals();
    renderCartSuggestions();
    return;
  }

  container.innerHTML = VG.cart.map(item => `
    <div class="cart-item" id="ci-${item.key.replace(/[^a-z0-9]/gi,'_')}">
      <img src="${resolveImageUrl(item.image)}" class="cart-item-img" alt="${item.title}" onerror="this.src='${resolveImageUrl('logo.jpg')}'">
      <div class="cart-item-details">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-custom-txt" style="${item.size ? '' : 'display:none;'}">${item.size}</div>
        <div class="cart-item-row-action">
          <div class="cart-item-price">Rs. ${item.price.toLocaleString("en-IN")}</div>
          <div style="display:flex;align-items:center;gap:10px;border:1px solid rgba(197,168,128,0.3);border-radius:4px;padding:2px 6px;">
            <button onclick="changeQty('${item.key}', -1)" style="background:none;border:none;cursor:pointer;">−</button>
            <span style="font-size:13px;font-weight:600;">${item.qty}</span>
            <button onclick="changeQty('${item.key}', 1)" style="background:none;border:none;cursor:pointer;">+</button>
          </div>
          <button class="remove-cart-item-btn" onclick="removeFromCart('${item.key}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`).join("");
  updateCartTotals();
  renderCartSuggestions();
}

function renderCartSuggestions() {
  const drawerSection = document.getElementById("cart-suggestions-section");
  const drawerList = document.getElementById("cart-suggestions-list");
  const pageSection = document.getElementById("cart-page-suggestions-section");
  const pageList = document.getElementById("cart-page-suggestions-list");
  
  if (!drawerSection && !pageSection) return;

  const cartIds = VG.cart.map(i => i.id);
  const available = VG.products.filter(p => !cartIds.includes(p.id));

  if (!available.length) {
    if (drawerSection) drawerSection.style.display = "none";
    if (pageSection) pageSection.style.display = "none";
    return;
  }

  // Shuffle and pick 3 suggestions
  const suggestions = [...available].sort(() => 0.5 - Math.random()).slice(0, 3);

  const generateHtml = (isDrawer) => suggestions.map(p => `
    <div style="min-width: ${isDrawer ? '140px' : '180px'}; flex: 0 0 auto; border: 1px solid rgba(197,168,128,0.2); border-radius: 8px; overflow: hidden; background: var(--bg-card); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
      <img src="${resolveImageUrl(p.image)}" style="width:100%; height:${isDrawer ? '120px' : '150px'}; object-fit:cover; border-bottom: 1px solid rgba(197,168,128,0.1); cursor:pointer;" alt="${p.title}" onerror="this.src='${resolveImageUrl('logo.jpg')}'" onclick="window.location.href='product.html?id=${p.id}'">
      <div style="padding: 10px;">
        <div style="font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;" title="${p.title}">${p.title}</div>
        <div style="font-size: 12px; color: var(--color-gold-dark); font-weight: 700; margin-bottom: 8px;">Rs. ${p.price.toLocaleString("en-IN")}</div>
        <button onclick="addToCart('${p.id}', 1, null, this)" style="width:100%; padding: 6px; font-size: 11px; background: transparent; border: 1.5px solid rgba(197,168,128,0.4); border-radius: 4px; cursor:pointer; color: var(--color-gold-dark); font-weight: 600; transition:all 0.2s; font-family:'Outfit',sans-serif;" onmouseover="this.style.background='rgba(197,168,128,0.1)'" onmouseout="this.style.background='transparent'">+ Add</button>
      </div>
    </div>
  `).join("");

  if (drawerSection && drawerList) {
    drawerList.innerHTML = generateHtml(true);
    drawerSection.style.display = "block";
  }

  if (pageSection && pageList) {
    pageList.innerHTML = generateHtml(false);
    pageSection.style.display = "block";
  }
}

function changeQty(key, delta) {
  const item = VG.cart.find(i => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) VG.cart = VG.cart.filter(i => i.key !== key);
  saveCart();
  renderCartDrawer();
}

function removeFromCart(key) {
  VG.cart = VG.cart.filter(i => i.key !== key);
  saveCart();
  renderCartDrawer();
  showToast("Item removed from cart", "info");
}

function getCheckoutTotals() {
  const subtotal = VG.cart.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;
  if (VG.appliedCoupon) discount = Math.round(subtotal * VG.appliedCoupon.discountPercent / 100);
  const giftEl = document.getElementById("cart-page-gift-toggle") || document.getElementById("gift-toggle");
  const gift = giftEl ? (giftEl.checked ? 50 : 0) : (localStorage.getItem("vg_gift_packaging") === "1" ? 50 : 0);

  // Estimate weight in grams
  let weight = 0;
  VG.cart.forEach(item => {
    const title = item.title.toLowerCase();
    let itemWeight = 50; // default 50g
    if (title.includes("necklace") || title.includes("kundan")) itemWeight = 300;
    else if (title.includes("coaster")) itemWeight = 400;
    else if (title.includes("earring")) itemWeight = 40;
    else if (title.includes("pendant")) itemWeight = 30;
    else if (title.includes("bangle") || title.includes("bracelet")) itemWeight = 80;
    weight += itemWeight * item.qty;
  });

  // Calculate shipping zone cost
  const zoneEl = document.getElementById("co-zone");
  const zone = zoneEl ? zoneEl.value : "National (Zone A)";
  let baseShipping = 60;
  if (zone.includes("Local")) baseShipping = 40;
  else if (zone.includes("Zone B")) baseShipping = 80;
  else if (zone.includes("Remote")) baseShipping = 120;

  // Free shipping threshold
  let freeThreshold = 999;
  if (zone.includes("Remote")) freeThreshold = 1499;

  let shipping = subtotal >= freeThreshold ? 0 : baseShipping;

  // Add weight-based surcharge: if > 500g, add flat ₹50 surcharge
  let weightSurcharge = 0;
  if (weight > 500) {
    weightSurcharge = 50;
  }
  shipping += weightSurcharge;

  const speedEl = document.getElementById("co-shipping");
  if (speedEl?.value.includes("Express")) shipping += 120;

  const total = subtotal - discount + gift + shipping;
  const tax = Math.round((subtotal - discount) * 18 / 118); // GST is 18% inclusive
  
  return { subtotal, discount, gift, shipping, total, tax, weight, weightSurcharge, freeThreshold };
}

function updateCartTotals() {
  const { subtotal, discount, gift, shipping, total } = getCheckoutTotals();

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("cart-subtotal", `Rs. ${subtotal.toLocaleString("en-IN")}`);
  set("cart-discount", discount ? `-Rs. ${discount.toLocaleString("en-IN")}` : "—");
  set("cart-gift", gift ? `Rs. ${gift}` : "—");
  set("cart-shipping", shipping === 0 ? "FREE" : `Rs. ${shipping}`);
  set("cart-total", `Rs. ${total.toLocaleString("en-IN")}`);

  const couponRow = document.getElementById("cart-discount-row");
  if (couponRow) couponRow.style.display = discount ? "" : "none";

  localStorage.setItem("vg_cart_total", total);
  localStorage.setItem("vg_gift_packaging", gift ? "1" : "0");
}

function proceedToCheckout() {
  if (!VG.cart.length) {
    showToast("Your cart is empty!", "info");
    return;
  }
  syncGiftToggleFromPage();
  updateCartTotals();
  const drawer = document.getElementById("cart-drawer");
  if (drawer?.classList.contains("active")) toggleCart();
  window.location.href = "checkout.html";
}

function syncGiftToggleFromPage() {
  const pageGift = document.getElementById("cart-page-gift-toggle");
  const drawerGift = document.getElementById("gift-toggle");
  if (pageGift && drawerGift) drawerGift.checked = pageGift.checked;
  if (pageGift) localStorage.setItem("vg_gift_packaging", pageGift.checked ? "1" : "0");
}

function renderCartPage() {
  const emptyEl = document.getElementById("cart-page-empty");
  const contentEl = document.getElementById("cart-page-content");
  const summaryEl = document.getElementById("cart-page-summary");
  const layoutEl = document.getElementById("cart-page-layout");
  const checkoutBtn = document.getElementById("cart-checkout-btn");
  if (!emptyEl || !contentEl) return;

  const giftToggle = document.getElementById("cart-page-gift-toggle");
  if (giftToggle) giftToggle.checked = localStorage.getItem("vg_gift_packaging") === "1";

  const couponInput = document.getElementById("cart-page-coupon-input");
  if (couponInput && VG.appliedCoupon) couponInput.value = VG.appliedCoupon.code;

  const accountPrompt = document.getElementById("cart-account-prompt");
  if (accountPrompt) {
    accountPrompt.style.display = VG.user ? "none" : "";
  }

  if (!VG.cart.length) {
    emptyEl.style.display = "block";
    emptyEl.setAttribute("aria-hidden", "false");
    contentEl.style.display = "none";
    contentEl.setAttribute("aria-hidden", "true");
    if (summaryEl) summaryEl.style.opacity = "0.55";
    if (checkoutBtn) checkoutBtn.disabled = true;
    updateCartPageTotals();
    renderCartSuggestions();
    return;
  }

  emptyEl.style.display = "none";
  emptyEl.setAttribute("aria-hidden", "true");
  contentEl.style.display = "block";
  contentEl.setAttribute("aria-hidden", "false");
  if (summaryEl) summaryEl.style.opacity = "1";
  if (checkoutBtn) checkoutBtn.disabled = false;
  if (layoutEl) layoutEl.classList.remove("cart-page-layout-empty");

  const list = document.getElementById("cart-page-items-list");
  if (list) {
    list.innerHTML = VG.cart.map(item => {
      const safeKey = item.key.replace(/'/g, "\\'");
      const lineTotal = item.price * item.qty;
      return `
        <div class="cart-page-row" id="cpr-${item.key.replace(/[^a-z0-9]/gi, '_')}">
          <img src="${resolveImageUrl(item.image)}" class="cart-page-row-img" alt="${item.title}" onerror="this.src='${resolveImageUrl('logo.jpg')}'">
          <div class="cart-page-row-body">
            <a href="product.html?id=${item.id}" class="cart-page-row-title">${item.title}</a>
            ${item.size ? `<div class="cart-page-row-variant">${item.size}</div>` : ""}
            <div class="cart-page-row-unit-price">Rs. ${item.price.toLocaleString("en-IN")}</div>
            <div class="cart-page-qty-wrap">
              <button type="button" class="cart-page-qty-btn" onclick="changeCartPageQty('${safeKey}', -1)" aria-label="Decrease quantity">−</button>
              <span class="cart-page-qty-value">${item.qty}</span>
              <button type="button" class="cart-page-qty-btn" onclick="changeCartPageQty('${safeKey}', 1)" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-page-remove" onclick="removeCartPageItem('${safeKey}')">
              <i class="fa-solid fa-trash-can"></i> Remove
            </button>
          </div>
          <div class="cart-page-row-total">Rs. ${lineTotal.toLocaleString("en-IN")}</div>
        </div>`;
    }).join("");
  }

  updateCartPageTotals();
  renderCartSuggestions();
}

function changeCartPageQty(key, delta) {
  changeQty(key, delta);
  renderCartPage();
}

function removeCartPageItem(key) {
  removeFromCart(key);
  renderCartPage();
}

function updateCartPageTotals() {
  syncGiftToggleFromPage();
  updateCartTotals();
  const { subtotal, discount, gift, shipping, total, tax } = getCheckoutTotals();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("cart-page-total", `Rs. ${total.toLocaleString("en-IN")}`);
  const breakdown = document.getElementById("cart-page-breakdown");
  if (breakdown) {
    let html = `<div class="summary-line"><span>Subtotal</span><span>Rs. ${subtotal.toLocaleString("en-IN")}</span></div>`;
    if (discount) html += `<div class="summary-line discount-line"><span>Coupon</span><span>-Rs. ${discount.toLocaleString("en-IN")}</span></div>`;
    if (gift) html += `<div class="summary-line"><span>Gift Packaging</span><span>Rs. ${gift}</span></div>`;
    html += `<div class="summary-line"><span>Shipping</span><span>${shipping === 0 ? "FREE" : "Rs. " + shipping}</span></div>`;
    html += `<div class="summary-line inclusive-tax-line" style="font-size:11px; color:var(--text-secondary); border-top:1px dashed rgba(197,168,128,0.15); margin-top:8px; padding-top:8px;"><span>GST (18% inclusive)</span><span>Rs. ${tax.toLocaleString("en-IN")}</span></div>`;
    breakdown.innerHTML = html;
  }
}

function applyCoupon() {
  const code = (document.getElementById("cart-page-coupon-input") || document.getElementById("coupon-input"))?.value?.trim()?.toUpperCase();
  const fb = document.getElementById("coupon-feedback");
  const pageFb = document.getElementById("cart-page-coupon-feedback");
  if (!code) return;
  const found = VG.coupons.find(c => c.code === code && c.isActive);
  if (found) {
    VG.appliedCoupon = found;
    localStorage.setItem("vg_applied_coupon", JSON.stringify(found));
    if (fb) { fb.textContent = `✓ Coupon "${code}" applied — ${found.discountPercent}% off!`; fb.style.color = "var(--color-success, #4caf7d)"; }
    if (pageFb) { pageFb.textContent = fb?.textContent || `✓ Coupon "${code}" applied — ${found.discountPercent}% off!`; pageFb.style.color = "var(--color-success, #4caf7d)"; }
    updateCartTotals();
    if (typeof updateCartPageTotals === "function") updateCartPageTotals();
  } else {
    VG.appliedCoupon = null;
    localStorage.removeItem("vg_applied_coupon");
    if (fb) { fb.textContent = "Invalid or expired coupon code."; fb.style.color = "#e05c5c"; }
    if (pageFb) { pageFb.textContent = "Invalid or expired coupon code."; pageFb.style.color = "#e05c5c"; }
    updateCartTotals();
    if (typeof updateCartPageTotals === "function") updateCartPageTotals();
  }
}

// =========================================
// SEARCH
// =========================================
function toggleSearch() {
  document.getElementById("search-overlay")?.classList.toggle("active");
  if (document.getElementById("search-overlay")?.classList.contains("active")) {
    setTimeout(() => document.getElementById("search-input")?.focus(), 100);
  }
}

function handleSearchKey(e) {
  if (e.key === "Enter") runSearch();
  if (e.key === "Escape") toggleSearch();
}

function runSearch() {
  const q = document.getElementById("search-input")?.value?.trim();
  if (q) window.location.href = `shop.html?search=${encodeURIComponent(q)}`;
}

// =========================================
// TOAST
// =========================================
function showToast(msg, type = "success") {
  let wrap = document.getElementById("toast-wrapper");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "toast-wrapper";
    Object.assign(wrap.style, { position:"fixed", top:"50%", left:"50%", transform:"translate(-50%, -50%)", zIndex:"9999", display:"flex", flexDirection:"column", gap:"10px", alignItems:"center" });
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  const colors = { success:"var(--text-primary,#2c2724)", error:"#c0392b", info:"#2980b9", warning:"#e67e22" };
  Object.assign(t.style, { background: colors[type] || colors.success, color:"#fff", padding:"12px 20px", borderRadius:"8px", fontSize:"14px", fontWeight:"500", display:"flex", alignItems:"center", gap:"8px", boxShadow:"0 20px 40px rgba(0,0,0,0.4)", border:"1px solid rgba(197,168,128,0.3)", animation:"fadeIn 0.3s ease", maxWidth:"320px", textAlign:"center" });
  const icons = { success:"✨", error:"⚠️", info:"ℹ️", warning:"⚡" };
  t.innerHTML = `<span>${icons[type] || "✨"} ${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity="0"; t.style.transform="scale(0.9)"; t.style.transition="all 0.3s ease"; setTimeout(() => t.remove(), 350); }, 3000);
}

// =========================================
// PRODUCT CARD RENDERER (shared)
// =========================================
function renderProductCard(p) {
  const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
  const inCart = VG.cart.some(i => i.id === p.id);
  const btnText = inCart ? "Go to Cart" : "Add to Bag";
  const btnAction = inCart ? "goToCartPage()" : `addToCart('${p.id}', 1, null, event.currentTarget)`;
  const iconAction = inCart ? "goToCartPage()" : `addToCart('${p.id}', 1, null, event.currentTarget)`;
  const iconClass = inCart ? "fa-solid fa-arrow-right" : "fa-solid fa-bag-shopping";
  const iconTitle = inCart ? "Go to Cart" : "Add to Cart";

  return `
    <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
      <div class="product-card-img-wrap">
        <img src="${resolveImageUrl(p.image)}" alt="${p.title}" loading="lazy" onerror="this.src='${resolveImageUrl('logo.jpg')}'">
        ${p.isCustomizable ? '<span class="product-badge-custom">Customizable</span>' : '<span class="product-badge-ready">Readymade</span>'}
        <div class="product-card-actions">
          <button onclick="event.stopPropagation(); ${iconAction}" title="${iconTitle}"><i class="${iconClass}"></i></button>
          <button onclick="event.stopPropagation(); toggleWishlist('${p.id}')" title="Wishlist"><i class="fa-solid fa-heart"></i></button>
        </div>
      </div>
      <div class="product-card-body">
        <span class="product-category-pill">${p.category}</span>
        <h3 class="product-title">${p.title}</h3>
        <div class="product-rating"><span class="stars-gold">${stars}</span><span>${p.rating}</span></div>
        <div class="product-price-row">
          <span class="product-price">Rs. ${p.price.toLocaleString("en-IN")}</span>
          <button class="btn-add-cart" onclick="event.stopPropagation(); ${btnAction}">${btnText}</button>
        </div>
      </div>
    </div>`;
}

function toggleWishlist(id) {
  if (!VG.user) { window.location.href = "dashboard.html"; return; }
  const wl = VG.user.wishlist || [];
  if (wl.includes(id)) {
    VG.user.wishlist = wl.filter(x => x !== id);
    showToast("Removed from wishlist", "info");
  } else {
    VG.user.wishlist = [...wl, id];
    showToast("Added to wishlist!");
  }
  localStorage.setItem("vg_user", JSON.stringify(VG.user));
  apiCall("/users/wishlist", "POST", { email: VG.user.email, wishlist: VG.user.wishlist }).catch(() => {});
}

// =========================================
// SHARED HEADER HTML
// =========================================
function buildHeader(activePage) {
  const nav = [
    { label:"Home", href:"index.html", page:"index.html" },
    { label:"Shop", href:"shop.html", page:"shop.html" },
    { label:"Gallery", href:"gallery.html", page:"gallery.html" },
    { label:"FAQs", href:"faqs.html", page:"faqs.html" },
    { label:"About Us", href:"about.html", page:"about.html" },
    { label:"Contact", href:"contact.html", page:"contact.html" },
  ];
  return `
    <div class="announcement-bar">
      <span id="announcement-text">✨ FESTIVAL OFFER: Use code FESTIVE15 for 15% OFF on all customized resin art!</span>
    </div>
    <header class="main-header">
      <div class="header-container">
        <a href="index.html" class="logo-area">
          <img src="${resolveImageUrl('logo.jpg')}" alt="VibrantGlaze" class="brand-logo" onerror="this.onerror=null;this.src='logo.jpg'">
          <div class="brand-text">
            <span class="brand-title" aria-label="VibrantGlaze">
              <span class="brand-vibrant">Vibrant</span><span class="brand-glaze">Glaze</span>
            </span>
            <span class="brand-subtitle">Resin &amp; Jewellery</span>
          </div>
        </a>
        <nav class="nav-links">
          ${nav.map(n => `<a href="${n.href}" class="nav-item${n.page === activePage ? " active" : ""}" data-page="${n.page}">${n.label}</a>`).join("")}
        </nav>
        <div class="header-actions">
          <button class="action-btn" onclick="toggleSearch()" title="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
          <a href="dashboard.html" class="action-btn" title="My Account">
            <i class="fa-solid fa-user"></i>
            <span class="user-badge" id="header-user-badge">Account</span>
          </a>
          <button class="action-btn cart-trigger" onclick="goToCartPage()" title="Shopping Bag">
            <i class="fa-solid fa-bag-shopping"></i>
            <span class="cart-badge" id="cart-badge-header">0</span>
          </button>
          <a href="admin.html" id="admin-nav-btn" class="admin-toggle-btn" style="display:none;">
            <i class="fa-solid fa-screwdriver-wrench"></i> Admin
          </a>
        </div>
      </div>
    </header>`;
}

// =========================================
// SHARED FOOTER HTML
// =========================================
function buildFooter() {
  return `
    <div class="trust-badges-section">
      <div class="trust-container">
        <div class="trust-item">
          <div class="trust-icon"><i class="fa-solid fa-globe"></i></div>
          <div class="trust-text">
            <h4>International Shipping</h4>
            <p>Global shipping, seamless delivery</p>
          </div>
        </div>
        <div class="trust-divider"></div>
        <div class="trust-item">
          <div class="trust-icon"><i class="fa-solid fa-award"></i></div>
          <div class="trust-text">
            <h4>Quality Assurance</h4>
            <p>Testing for seamless excellence</p>
          </div>
        </div>
        <div class="trust-divider"></div>
        <div class="trust-item">
          <div class="trust-icon"><i class="fa-solid fa-boxes-stacked"></i></div>
          <div class="trust-text">
            <h4>5000+ SKUs</h4>
            <p>Our endless product range</p>
          </div>
        </div>
        <div class="trust-divider"></div>
        <div class="trust-item">
          <div class="trust-icon"><i class="fa-solid fa-truck-fast"></i></div>
          <div class="trust-text">
            <h4>Fast Delivery</h4>
            <p>Quick delivery, because time is precious</p>
          </div>
        </div>
      </div>
    </div>
    <footer class="dark-footer">
      <div class="dark-footer-container">
        <div class="footer-col brand-col">
          <div class="footer-logo-area">
            <div class="logo-circle"><img src="${resolveImageUrl('logo.jpg')}" alt="VibrantGlaze"></div>
            <div class="logo-text-col">
              <span class="logo-brand" aria-label="VibrantGlaze">
                <span class="brand-vibrant">Vibrant</span><span class="brand-glaze">Glaze</span>
              </span>
              <span class="logo-sub">Resin &amp; Jewellery</span>
            </div>
          </div>
          <div class="footer-socials">
            <a href="#"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#"><i class="fa-brands fa-instagram"></i></a>
            <a href="#"><i class="fa-brands fa-youtube"></i></a>
            <a href="#"><i class="fa-brands fa-pinterest-p"></i></a>
            <a href="#"><i class="fa-solid fa-dharmachakra"></i></a>
          </div>
          <div class="footer-app-store">
            <p>Available on Google Play</p>
            <a href="#"><img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" class="play-badge"></a>
          </div>
        </div>
        
        <div class="footer-col links-col">
          <h4>Collections</h4>
          <ul>
            <li><a href="shop.html">All Collections</a></li>
            <li><a href="shop.html?cat=Resin">Epoxy Resin</a></li>
            <li><a href="shop.html?cat=Custom">Custom Products</a></li>
            <li><a href="shop.html?cat=Rakhi">Rakhi Materials</a></li>
            <li><a href="shop.html?cat=New">New Arrivals</a></li>
            <li><a href="shop.html?cat=Best">Best Price items</a></li>
            <li><a href="shop.html?cat=Offers">Offers</a></li>
            <li><a href="#" onclick="openPolicy('calculator')">Calculator</a></li>
            <li><a href="#" onclick="openPolicy('more-info')">More Info</a></li>
          </ul>
        </div>
        
        <div class="footer-col links-col">
          <h4>Information</h4>
          <ul>
            <li><a href="#" onclick="openPolicy('international-shipping')">International Shipping</a></li>
            <li><a href="#" onclick="openPolicy('privacy')">Privacy Policy</a></li>
            <li><a href="#" onclick="openPolicy('shipping')">Shipping Policy</a></li>
            <li><a href="#" onclick="openPolicy('shopping')">Terms and Conditions</a></li>
            <li><a href="#" onclick="openPolicy('refund')">Refund and Cancellation Policy</a></li>
            <li><a href="#" onclick="openPolicy('track')">Track Your Order</a></li>
          </ul>
        </div>
        
        <div class="footer-col contact-col">
          <h4>Here to help</h4>
          <p>Address: Mansarovar Society, Godadara, Surat, Gujarat — 395012</p>
          <p>Mail Id: sales@vibrantglaze.com</p>
          <p>Mobile No: +91 9228221331</p>
          <p>Monday to Saturday - 10:00 am - 6:30 pm</p>
        </div>
      </div>
      
      <div class="dark-footer-bottom">
        <div class="bottom-container">
          <p>&copy; 2026 VibrantGlaze Store Engees Ecommerce.</p>
          <div class="country-selector">
            <img src="https://flagcdn.com/w20/in.png" alt="India Flag">
            <span>India (INR ₹)</span>
            <i class="fa-solid fa-chevron-down"></i>
          </div>
        </div>
      </div>
    </footer>
    <div class="whatsapp-floating-widget">
      <div class="whatsapp-badge-tooltip">Chat with our Designer!</div>
      <a href="https://wa.me/919228221331?text=Hi%20VibrantGlaze!" target="_blank" class="whatsapp-btn"><i class="fa-brands fa-whatsapp"></i></a>
    </div>`;
}

// =========================================
// SHARED OVERLAYS (Search, Cart, Policies)
// =========================================
function buildOverlays() {
  return `
    <!-- Search -->
    <div id="search-overlay" class="search-modal" onclick="if(event.target===this)toggleSearch()">
      <div class="search-modal-content">
        <button class="close-search" onclick="toggleSearch()">&times;</button>
        <h2>Search Products</h2>
        <div class="search-input-wrapper">
          <input type="text" id="search-input" placeholder="e.g. customized letter keychain, gold flake earring..." onkeyup="handleSearchKey(event)">
          <button onclick="runSearch()"><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
      </div>
    </div>

    <!-- Cart Drawer -->
    <div id="cart-overlay" class="cart-drawer-overlay" onclick="toggleCart()"></div>
    <div id="cart-drawer" class="cart-drawer">
      <div class="cart-drawer-header">
        <h3><i class="fa-solid fa-bag-shopping" style="color:var(--color-gold-dark);margin-right:8px;font-size:15px"></i>Your Bag</h3>
        <button class="close-cart-btn" onclick="toggleCart()" aria-label="Close cart">&times;</button>
      </div>
      <div class="cart-drawer-scroll">
        <div class="cart-drawer-section">
          <div class="cart-section-label"><i class="fa-solid fa-box-open"></i> Items</div>
          <div class="cart-section-body cart-items-wrapper" id="cart-items-list"></div>
        </div>
        <div class="cart-drawer-section" id="cart-suggestions-section" style="display:none; padding-top:16px; border-top:1px dashed rgba(197,168,128,0.15);">
          <div class="cart-section-label"><i class="fa-solid fa-wand-magic-sparkles"></i> You May Also Like</div>
          <div class="cart-section-body" id="cart-suggestions-list" style="display:flex; gap:12px; overflow-x:auto; padding-bottom:8px;"></div>
        </div>
        <div class="cart-drawer-section">
          <div class="cart-section-label"><i class="fa-solid fa-ticket"></i> Coupon &amp; Extras</div>
          <div class="cart-section-body">
            <div class="cart-promo-section">
              <label>Apply Coupon</label>
              <div class="coupon-field-row">
                <input type="text" id="coupon-input" placeholder="FESTIVE15">
                <button onclick="applyCoupon()">Apply</button>
              </div>
              <div id="coupon-feedback" style="font-size:12px;margin-top:6px;"></div>
            </div>
            <div class="cart-extra-addons" style="margin-top:16px;padding-top:16px;border-top:1px dashed rgba(197,168,128,0.15)">
              <label class="checkbox-addon-container">
                <input type="checkbox" id="gift-toggle" onchange="updateCartTotals()">
                <span class="addon-checkbox"></span>
                <span class="addon-text"><strong>Premium Gift Packaging (+Rs. 50)</strong><span class="addon-subtext">Luxury box, greeting card &amp; wax-seal wrap.</span></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="cart-drawer-footer">
        <div class="cart-section-label" style="border:none;background:transparent;padding:0 0 12px"><i class="fa-solid fa-receipt"></i> Order Summary</div>
        <div class="cart-summary-block">
          <div class="summary-line"><span>Subtotal</span><span id="cart-subtotal">Rs. 0</span></div>
          <div class="summary-line" id="cart-discount-row" style="display:none"><span>Coupon Discount</span><span id="cart-discount">—</span></div>
          <div class="summary-line"><span>Gift Packaging</span><span id="cart-gift">—</span></div>
          <div class="summary-line"><span>Shipping</span><span id="cart-shipping">Rs. 60</span></div>
          <div class="summary-line grand-total-line"><span>Grand Total</span><span id="cart-total">Rs. 0</span></div>
        </div>
        <div class="cart-checkout-cta">
          <button class="btn btn-primary btn-full" onclick="goToCartPage()">View Cart</button>
          <button class="btn btn-secondary btn-full" onclick="proceedToCheckout()" style="margin-top:8px">Check out</button>
          <p class="cart-checkout-hint">Secure prepaid checkout · No COD · Free shipping above Rs. 999</p>
        </div>
      </div>
    </div>

    <!-- Policy Modals -->
    <div id="policy-international-shipping" class="policy-modal" onclick="if(event.target===this)closePolicy()">
      <div class="policy-modal-content">
        <span class="close-policy" onclick="closePolicy()">&times;</span>
        <h2>International Shipping</h2>
        <p>We provide global shipping with seamless delivery! International shipping rates are calculated at checkout. Deliveries generally take 10-15 working days depending on the country.</p>
      </div>
    </div>
    <div id="policy-refund" class="policy-modal" onclick="if(event.target===this)closePolicy()">
      <div class="policy-modal-content">
        <span class="close-policy" onclick="closePolicy()">&times;</span>
        <h2>Refund and Cancellation Policy</h2>
        <p>No refund for customized products. Non-customized products can be returned within 7 days of delivery if they are defective. Cancellations are only allowed within 24 hours of placing the order.</p>
      </div>
    </div>
    <div id="policy-track" class="policy-modal" onclick="if(event.target===this)closePolicy()">
      <div class="policy-modal-content">
        <span class="close-policy" onclick="closePolicy()">&times;</span>
        <h2>Track Your Order</h2>
        <p>Once your order is shipped, you will receive an email and WhatsApp notification with your unique AWB tracking link. You can track your package directly through our courier partner's portal.</p>
      </div>
    </div>
    <div id="policy-calculator" class="policy-modal" onclick="if(event.target===this)closePolicy()">
      <div class="policy-modal-content">
        <span class="close-policy" onclick="closePolicy()">&times;</span>
        <h2>Pricing Calculator</h2>
        <p>Our custom pricing calculator is currently being revamped! In the meantime, the base price of all our customized items includes standard letter cutting. For extra add-ons (gold flakes, specific charms), a small additional charge is applied at checkout.</p>
      </div>
    </div>
    <div id="policy-more-info" class="policy-modal" onclick="if(event.target===this)closePolicy()">
      <div class="policy-modal-content">
        <span class="close-policy" onclick="closePolicy()">&times;</span>
        <h2>More Info</h2>
        <p>VibrantGlaze is committed to using sustainable, non-toxic epoxy resins. All our floral products use real, preserved botanicals locally sourced in India. Stay tuned to our Instagram for behind-the-scenes content!</p>
      </div>
    </div>
    <div id="policy-shopping" class="policy-modal" onclick="if(event.target===this)closePolicy()">
      <div class="policy-modal-content">
        <span class="close-policy" onclick="closePolicy()">&times;</span>
        <h2>Shopping &amp; Customization Policy</h2>
        <p>All customized products require 2 to 3 days of curing time before they can be shipped. Once custom lettering, names, or photo inserts have been resin-cast, orders cannot be cancelled or altered. Please check spelling carefully before order placement.</p>
      </div>
    </div>
    <div id="policy-shipping" class="policy-modal" onclick="if(event.target===this)closePolicy()">
      <div class="policy-modal-content">
        <span class="close-policy" onclick="closePolicy()">&times;</span>
        <h2>Return &amp; Exchange Policy</h2>
        <p><strong>NO RETURN policy.</strong> We only support exchanges for damaged or wrong product received. A complete unboxing video must be sent to us within 24 hours of delivery.</p>
        <p style="margin-top:10px"><strong>Delivery Estimates:</strong> Resin art &amp; readymade jewellery: 5–6 working days. Custom orders: 7–8 working days.</p>
      </div>
    </div>
    <div id="policy-privacy" class="policy-modal" onclick="if(event.target===this)closePolicy()">
      <div class="policy-modal-content">
        <span class="close-policy" onclick="closePolicy()">&times;</span>
        <h2>Privacy Policy</h2>
        <p>VibrantGlaze stores only your contact info, order histories, and customized designs. We do not store card details or bank credentials. Photos uploaded for custom casting are deleted within 30 days of delivery.</p>
      </div>
    </div>`;
}

function openPolicy(type) {
  document.querySelectorAll(".policy-modal").forEach(m => m.classList.remove("active"));
  const el = document.getElementById("policy-" + type);
  if (el) el.classList.add("active");
}
function closePolicy() {
  document.querySelectorAll(".policy-modal").forEach(m => m.classList.remove("active"));
}

function subscribeNewsletter(e) {
  e.preventDefault();
  showToast("Subscribed! You'll receive our festival updates.");
  document.getElementById("newsletter-email").value = "";
}

// =========================================
// AUTO-INJECT SHARED UI
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  setDynamicImagePaths();

  const headerEl = document.getElementById("site-header");
  const footerEl = document.getElementById("site-footer");
  const overlaysEl = document.getElementById("site-overlays");
  const activePage = document.body.dataset.page || "index.html";

  if (headerEl) headerEl.innerHTML = buildHeader(activePage);
  if (footerEl) footerEl.innerHTML = buildFooter();
  if (overlaysEl) overlaysEl.innerHTML = buildOverlays();

  vgInit().then(() => {
    if (typeof onPageReady === "function") onPageReady();
  });
});
