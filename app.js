/**
 * VibrantGlaze - Core Application Logic (SQLite & localStorage Fallback)
 * Premium Resin Customization & Imitation Jewellery Store
 */

const API_BASE = "/api";

// Helper function to call backend API, fallback gracefully to localStorage if offline
async function apiCall(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json"
      }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[SQLite Offline Fallback] API Call to ${endpoint} failed. Using localStorage. Details:`, err.message);
    return null; // Returns null so callers can trigger local storage fallback
  }
}

// ==========================================
// 1. DATABASE STATE (LOCAL REPLICAS)
// ==========================================

const DEFAULT_PRODUCTS = [
  {
    id: "p1",
    title: "Bespoke Floral A-Z Initial Keychain",
    category: "Keychain",
    price: 349,
    basePrice: 349,
    image: "resin_keychain.png",
    color: "Pink & Gold",
    material: "Epoxy Resin, Dried Petals, Gold Flakes",
    isCustomizable: true,
    rating: 4.8,
    description: "Individually handcrafted initial keychain, cast with crystal-clear resin, authentic copper/gold flakes, and locally-sourced dehydrated pink flower petals. Sealed with a scratch-resistant gloss glaze.",
    sizes: ["Standard (Small Keyring)", "Premium (Tassel & Charm)", "Luxury (Double Tassel & Monogram)"],
    sizePrices: {
      "Standard (Small Keyring)": 0,
      "Premium (Tassel & Charm)": 100,
      "Luxury (Double Tassel & Monogram)": 200
    },
    reviews: [
      { name: "Sneha Patel", rating: 5, date: "2026-05-14", comment: "Absolutely stunning! The packaging had a lovely lavender scent and the gold leaf shines beautifully under daylight.", photo: "resin_keychain.png" },
      { name: "Rahul Verma", rating: 4, date: "2026-05-20", comment: "Ordered letter 'R' as a gift. The resin is super smooth. Delivery took 8 days as expected for custom art.", photo: null }
    ]
  },
  {
    id: "p2",
    title: "Preserved Botanical Daisy Pendant Necklace",
    category: "Pendant",
    price: 499,
    basePrice: 499,
    image: "resin_pendant.png",
    color: "White & Gold",
    material: "Epoxy Resin, Daisy Flower, Gold Plated Brass",
    isCustomizable: true,
    rating: 4.9,
    description: "An elegant oval pendant preserving a whole real white daisy flower in high-grade UV-resistant resin. Suspended from an 18K gold-plated nickel-free brass chain.",
    sizes: ["16-Inch Chain", "18-Inch Chain", "20-Inch Chain"],
    sizePrices: {
      "16-Inch Chain": 0,
      "18-Inch Chain": 50,
      "20-Inch Chain": 90
    },
    reviews: [
      { name: "Aditi Rao", rating: 5, date: "2026-05-02", comment: "So simple and aesthetic. Matches my casual linen shirts perfectly. Love the real flower preservation!", photo: null }
    ]
  },
  {
    id: "p3",
    title: "Luxury Gold-Plated White Pearl Drop Earrings",
    category: "Earring",
    price: 699,
    basePrice: 699,
    image: "pearl_earrings.png",
    color: "Pearl White",
    material: "Gold Plating, Brass, Faux Pearl, Cubic Zirconia",
    isCustomizable: false,
    rating: 4.7,
    description: "Exquisite drop earrings highlighting a perfectly round premium shell pearl capped in sparkling micro-pave cubic zirconia settings and finished with high-quality gold plating. Ideal for cocktail parties and weddings.",
    sizes: ["Standard Pair"],
    sizePrices: { "Standard Pair": 0 },
    reviews: [
      { name: "Neha Sharma", rating: 5, date: "2026-04-18", comment: "Looks like real fine gold jewellery! Light-weight and does not cause allergy. Loved it.", photo: "pearl_earrings.png" },
      { name: "Preeti Singh", rating: 4, date: "2026-04-29", comment: "A bit smaller than expected, but extremely shiny and feels luxury.", photo: null }
    ]
  },
  {
    id: "p4",
    title: "Royal Kundan & Pearl Bridal Necklace Set",
    category: "Pendant",
    price: 1899,
    basePrice: 1899,
    image: "kundan_necklace.png",
    color: "Gold & Ruby Red",
    material: "Brass, Kundan Stones, Enamel Work, Cultured Pearls",
    isCustomizable: false,
    rating: 5.0,
    description: "Traditional heavy Kundan choker embellished with deep ruby red glass beads, faux pearls, and detailed meenakari back-enameling. Includes matching statement drop earrings.",
    sizes: ["Choker + Earring Set"],
    sizePrices: { "Choker + Earring Set": 0 },
    reviews: [
      { name: "Megha Tosawad", rating: 5, date: "2026-05-30", comment: "Breathtaking piece! Wore it for my cousin's wedding and received dozens of compliments. Feels very heavy and premium.", photo: "kundan_necklace.png" }
    ]
  },
  {
    id: "p5",
    title: "Custom Amethyst Resin Coaster Pair",
    category: "Resin",
    price: 599,
    basePrice: 599,
    image: "https://images.unsplash.com/photo-1596548438137-d51ef5c43291?auto=format&fit=crop&q=80&w=600",
    color: "Amethyst Violet",
    material: "Epoxy Resin, Acrylic Pigment, Silver Leaf",
    isCustomizable: true,
    rating: 4.6,
    description: "Geode-style resin coasters mixed with amethyst-colored alcohol inks and fine glitter, edged with silver metallic gilding. Heat-resistant up to 80°C.",
    sizes: ["2-Piece Set", "4-Piece Set (+Rs. 450)", "6-Piece Set (+Rs. 850)"],
    sizePrices: {
      "2-Piece Set": 0,
      "4-Piece Set (+Rs. 450)": 450,
      "6-Piece Set (+Rs. 850)": 850
    },
    reviews: []
  },
  {
    id: "p6",
    title: "Classic Gold Foil Floral Resin Bangle",
    category: "Bangles",
    price: 449,
    basePrice: 449,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=600",
    color: "Gold & Yellow",
    material: "Epoxy Resin, Dried Buttercups, Gold Foil",
    isCustomizable: true,
    rating: 4.5,
    description: "A continuous solid resin bangle containing yellow dried buttercup petals and crushed gold foil flakes. Smooth inner circumference for a comfortable fit.",
    sizes: ["2.4 Size", "2.6 Size (+Rs. 30)", "2.8 Size (+Rs. 60)"],
    sizePrices: {
      "2.4 Size": 0,
      "2.6 Size (+Rs. 30)": 30,
      "2.8 Size (+Rs. 60)": 60
    },
    reviews: []
  },
  {
    id: "p7",
    title: "Aesthetic Ocean Wave Resin Bookmark",
    category: "Resin",
    price: 249,
    basePrice: 249,
    image: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=600",
    color: "Oceanic Blue",
    material: "Epoxy Resin, Sea Sand, Acrylic Foam Cell, Tassel",
    isCustomizable: true,
    rating: 4.9,
    description: "Perfect gift for bibliophiles. Features a realistic multi-layered ocean shoreline pour complete with real beach sand, blue wave gradients, and seafoam cells, topped with a silken tassel.",
    sizes: ["Standard Bookmark", "Bookmark with Custom Initial Letter charm (+Rs. 50)"],
    sizePrices: {
      "Standard Bookmark": 0,
      "Bookmark with Custom Initial Letter charm (+Rs. 50)": 50
    },
    reviews: [
      { name: "John Doe", rating: 5, date: "2026-05-18", comment: "Literally looks like a piece of the beach in my books. Incredible layer work.", photo: null }
    ]
  },
  {
    id: "p8",
    title: "Polished Kundan Gold-Plated Cuff Bracelet",
    category: "Bracelet",
    price: 799,
    basePrice: 799,
    image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&q=80&w=600",
    color: "Gold",
    material: "Gold Plating, Brass, Kundan Stones",
    isCustomizable: false,
    rating: 4.8,
    description: "Openable cuff bracelet lined with geometric Kundan work and backed by a hand-carved floral brass structure. Double lock mechanism for safety.",
    sizes: ["Standard Adjustable Size"],
    sizePrices: { "Standard Adjustable Size": 0 },
    reviews: []
  }
];

const MOCK_FAQS = [
  {
    question: "What is the delivery timeline for custom orders?",
    answer: "Resin customization orders require 2-3 days for casting, multi-stage pouring, degassing, and curing. Hence, custom orders are delivered in 7-8 working days. Standard resin items and imitation jewellery take 5-6 working days.",
    category: "shipping"
  },
  {
    question: "Do you offer Cash on Delivery (COD)?",
    answer: "No, VibrantGlaze operates strictly on a prepaid-only model. Since customized products cannot be uncured or resold, we process payments via secure UPI or Credit/Debit cards during checkout.",
    category: "payment"
  },
  {
    question: "What is your Return and Exchange Policy?",
    answer: "We follow a strict NO RETURN policy. Exchanges are supported ONLY for damaged or incorrect items. You must share a continuous, unedited unboxing video of the package within 24 hours of delivery to our WhatsApp (+91 9228221331) or email (nehatosawad@gmail.com).",
    category: "policy"
  },
  {
    question: "How should I clean and maintain my resin art?",
    answer: "Keep resin items away from continuous direct UV rays to avoid softening or discoloration. Clean gently with a soft microfiber cloth. Avoid harsh chemical cleaners, perfumes, or scrubbing pads which can scratch the glossy surface.",
    category: "care"
  },
  {
    question: "Is your imitation jewelry skin-friendly?",
    answer: "Yes, all our imitation jewelry pieces use lead-free, nickel-free brass as the base metal, heavily electroplated with hypoallergenic gold layers to prevent skin irritation.",
    category: "material"
  }
];

// Memory replicas
let products = [];
let orders = [];
let users = [];
let coupons = [];
let cart = JSON.parse(localStorage.getItem("vibrantglaze_cart") || "[]");
let currentUser = JSON.parse(localStorage.getItem("vibrantglaze_current_user") || "null");

// Active filters in Shop
let activeFilters = {
  categories: [],
  maxPrice: 2500,
  colors: [],
  materials: [],
  customizableOnly: false,
  searchQuery: "",
  sortBy: "popular"
};

let currentDetailProductId = null;
let activeReviewStars = 5;

// ==========================================
// 2. SYNCHRONIZE MOCK DATABASE WITH SQLITE API
// ==========================================

async function syncDatabaseState() {
  console.log("[SQLite Sync] Requesting server data...");

  // 1. Settings (Announcement)
  const settingsRes = await apiCall("/settings");
  if (settingsRes && settingsRes.announcement) {
    localStorage.setItem("vibrantglaze_announcement", settingsRes.announcement);
  } else {
    if (!localStorage.getItem("vibrantglaze_announcement")) {
      localStorage.setItem("vibrantglaze_announcement", "✨ FESTIVAL OFFER: Use code FESTIVE15 for 15% OFF on all customized resin art!");
    }
  }

  // 2. Products
  const productsRes = await apiCall("/products");
  if (productsRes) {
    products = productsRes;
    localStorage.setItem("vibrantglaze_products", JSON.stringify(products));
  } else {
    // offline fallback
    if (!localStorage.getItem("vibrantglaze_products")) {
      localStorage.setItem("vibrantglaze_products", JSON.stringify(DEFAULT_PRODUCTS));
    }
    products = JSON.parse(localStorage.getItem("vibrantglaze_products"));
  }

  // 3. Coupons
  const couponsRes = await apiCall("/coupons");
  if (couponsRes) {
    coupons = couponsRes;
    localStorage.setItem("vibrantglaze_coupons", JSON.stringify(coupons));
  } else {
    // offline fallback
    if (!localStorage.getItem("vibrantglaze_coupons")) {
      localStorage.setItem("vibrantglaze_coupons", JSON.stringify([
        { code: "FESTIVE15", discountPercent: 15, isActive: true },
        { code: "MONSOON50", discountPercent: 10, isActive: true }
      ]));
    }
    coupons = JSON.parse(localStorage.getItem("vibrantglaze_coupons"));
  }

  // 4. Orders
  const ordersRes = await apiCall("/orders");
  if (ordersRes) {
    orders = ordersRes;
    localStorage.setItem("vibrantglaze_orders", JSON.stringify(orders));
  } else {
    // offline fallback
    if (!localStorage.getItem("vibrantglaze_orders")) {
      localStorage.setItem("vibrantglaze_orders", JSON.stringify([]));
    }
    orders = JSON.parse(localStorage.getItem("vibrantglaze_orders"));
  }

  // 5. Users (Only offline database fallback sync)
  if (!localStorage.getItem("vibrantglaze_users")) {
    localStorage.setItem("vibrantglaze_users", JSON.stringify([
      { name: "Neha", email: "neha@vibrantglaze.com", password: "neha123", phone: "9228221331", address: "Godadara, Surat, Gujarat - 395012", wishlist: ["p1", "p3"], savedDesigns: [] },
      { name: "Admin Manager", email: "admin@vibrantglaze.com", password: "admin123", phone: "9228221331", address: "Surat, Gujarat", wishlist: [], savedDesigns: [], isAdmin: true }
    ]));
  }
  users = JSON.parse(localStorage.getItem("vibrantglaze_users"));

  // Check if admin is currently logged in to keep nav consistent
  const adminBtn = document.querySelector(".admin-toggle-btn");
  if (adminBtn) {
    if (currentUser && currentUser.isAdmin) {
      adminBtn.style.display = "flex";
    } else {
      adminBtn.style.display = "none";
    }
  }

  // Refresh current view details
  renderGlobalAnnouncement();
  updateHeaderStats();
  renderHomeShowcases();
}

// ==========================================
// 3. VIEW CONTROLLER & ROUTING
// ==========================================

function navigateTo(viewId) {
  // Hide all sections
  document.querySelectorAll(".content-view").forEach(section => {
    section.classList.remove("active");
  });

  // Show target section
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Update navbar items
  document.querySelectorAll(".nav-item").forEach(link => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (href === `#${viewId}`) {
      link.classList.add("active");
    }
  });

  // Special view rendering routines
  if (viewId === "shop") {
    renderShopView();
  } else if (viewId === "account") {
    renderAccountView();
  } else if (viewId === "admin") {
    checkAdminAccess();
  } else if (viewId === "faqs") {
    renderFAQs();
  } else if (viewId === "gallery") {
    renderGallery();
  } else if (viewId === "home") {
    renderHomeShowcases();
  }

  // Close drawers/modals on transition
  document.getElementById("search-modal").classList.remove("active");
  document.getElementById("checkout-modal").classList.remove("active");
}

// Global Nav setup
window.addEventListener("hashchange", () => {
  const hash = window.location.hash.substring(1) || "home";
  if (hash.startsWith("product/")) {
    const pId = hash.split("/")[1];
    viewProductDetail(pId);
  } else {
    navigateTo(hash);
  }
});

// Initial load router
document.addEventListener("DOMContentLoaded", async () => {
  await syncDatabaseState();
  const hash = window.location.hash.substring(1) || "home";
  if (hash.startsWith("product/")) {
    const pId = hash.split("/")[1];
    viewProductDetail(pId);
  } else {
    navigateTo(hash);
  }
  setupLogoEasterEgg();
  if (currentUser) {
    document.getElementById("logged-user-name").textContent = currentUser.name;
  }
});

// Announcement
function renderGlobalAnnouncement() {
  const bar = document.getElementById("announcement-slider");
  if (bar) {
    const text = localStorage.getItem("vibrantglaze_announcement");
    bar.innerHTML = `<span>${text}</span>`;
  }
}

// Easter egg for admin entry
let logoClickCount = 0;
let logoClickTimeout = null;
function setupLogoEasterEgg() {
  const logo = document.querySelector(".logo-area");
  if (logo) {
    logo.addEventListener("click", () => {
      logoClickCount++;
      clearTimeout(logoClickTimeout);
      logoClickTimeout = setTimeout(() => {
        logoClickCount = 0;
      }, 3000);

      if (logoClickCount === 5) {
        showToast("✨ Secret pathway unlocked! Showing Admin Panel link.");
        const btn = document.querySelector(".admin-toggle-btn");
        if (btn) {
          btn.style.display = "flex";
        }
        logoClickCount = 0;
      }
    });
  }
}

// Toast Notifications
function showToast(message, type = "success") {
  let wrapper = document.getElementById("toast-wrapper");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = "toast-wrapper";
    wrapper.style.position = "fixed";
    wrapper.style.bottom = "20px";
    wrapper.style.right = "20px";
    wrapper.style.zIndex = "3000";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "10px";
    document.body.appendChild(wrapper);
  }

  const toast = document.createElement("div");
  toast.className = `toast-popup ${type}`;
  toast.style.background = type === "success" ? "var(--text-primary)" : "#d9534f";
  toast.style.color = "#ffffff";
  toast.style.padding = "12px 24px";
  toast.style.borderRadius = "6px";
  toast.style.boxShadow = "var(--shadow-medium)";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "500";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "8px";
  toast.style.animation = "fadeInUp 0.3s ease-out";
  toast.style.border = "1px solid var(--color-gold)";

  const icon = type === "success" ? "✨" : "⚠️";
  toast.innerHTML = `<span>${icon} ${message}</span>`;

  wrapper.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.35s ease";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ==========================================
// 4. HOME VIEW CONTROLLER
// ==========================================

function renderHomeShowcases() {
  const featuredContainer = document.getElementById("featured-products-container");
  if (!featuredContainer) return;

  const featured = products.slice(0, 4);
  featuredContainer.innerHTML = featured.map(p => renderProductCardHTML(p)).join("");
  renderTestimonials();
}

function renderTestimonials() {
  const container = document.getElementById("testimonials-container");
  if (!container) return;

  const testimonials = [
    { name: "Pooja Mehta", review: "I ordered a personalized name standee for my desk. The color transitions in the resin are gorgeous! Hand-written note was a beautiful addition.", location: "Mumbai", stars: 5 },
    { name: "Rohan Deshmukh", review: "Purchased the Kundan bridal set for my sister. The detailing on the back meenakari is pure luxury. Strongly recommend VibrantGlaze!", location: "Pune", stars: 5 },
    { name: "Kirti Solanki", review: "Top notch quality resin keychains. No bubbles, perfect glass shine. Will definitely order custom coasters soon.", location: "Surat", stars: 5 }
  ];

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-top: 20px;">
      ${testimonials.map(t => `
        <div style="background: var(--bg-card); padding: 30px; border-radius: var(--border-radius); border: 1px solid rgba(197, 168, 128, 0.15); box-shadow: var(--shadow-subtle);">
          <div style="color: #f0ad4e; margin-bottom: 12px; font-size: 16px;">
            ${"★".repeat(t.stars)}
          </div>
          <p style="font-style: italic; color: var(--text-secondary); margin-bottom: 15px; font-size: 14.5px;">"${t.review}"</p>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="background: var(--color-gold-light); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--color-gold-dark); font-size: 12px;">
              ${t.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <h5 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600;">${t.name}</h5>
              <span style="font-size: 11px; color: var(--text-secondary);">${t.location}</span>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// ==========================================
// 5. CATALOGUE & FILTER ENGINE (SHOP)
// ==========================================

function renderShopView() {
  renderSidebarFilters();
  applyFilters();
}

function renderSidebarFilters() {
  const catList = document.getElementById("filter-categories-list");
  if (catList) {
    const cats = [...new Set(products.map(p => p.category))];
    catList.innerHTML = cats.map(c => `
      <label class="checkbox-container">
        <input type="checkbox" value="${c}" ${activeFilters.categories.includes(c) ? "checked" : ""} onchange="toggleCategoryFilter('${c}')">
        <span>${c} Art / Jewelry</span>
      </label>
    `).join("");
  }

  const colorSwatches = document.getElementById("filter-colors-swatches");
  if (colorSwatches) {
    const colors = ["Pink", "Gold", "Violet", "Blue", "White", "Ruby", "Yellow", "Silver"];
    const colorHex = {
      Pink: "#dca8bd", Gold: "#c5a880", Violet: "#7c4d7e", Blue: "#4a90e2",
      White: "#ffffff", Ruby: "#d9534f", Yellow: "#f5a623", Silver: "#cccccc"
    };
    colorSwatches.innerHTML = colors.map(col => `
      <button class="color-swatch-btn ${activeFilters.colors.includes(col) ? "active" : ""}" 
              style="background-color: ${colorHex[col]}" 
              title="${col}"
              onclick="toggleColorFilter('${col}')">
      </button>
    `).join("");
  }

  const matList = document.getElementById("filter-materials-list");
  if (matList) {
    const materials = ["Resin", "Gold Plating", "Brass", "Pearl", "Kundan", "Dried Petals", "Glitter"];
    matList.innerHTML = materials.map(m => `
      <label class="checkbox-container">
        <input type="checkbox" value="${m}" ${activeFilters.materials.includes(m) ? "checked" : ""} onchange="toggleMaterialFilter('${m}')">
        <span>${m}</span>
      </label>
    `).join("");
  }
}

function toggleCategoryFilter(category) {
  const index = activeFilters.categories.indexOf(category);
  if (index > -1) {
    activeFilters.categories.splice(index, 1);
  } else {
    activeFilters.categories.push(category);
  }
  applyFilters();
}

function toggleColorFilter(color) {
  const index = activeFilters.colors.indexOf(color);
  if (index > -1) {
    activeFilters.colors.splice(index, 1);
  } else {
    activeFilters.colors.push(color);
  }
  renderSidebarFilters();
  applyFilters();
}

function toggleMaterialFilter(material) {
  const index = activeFilters.materials.indexOf(material);
  if (index > -1) {
    activeFilters.materials.splice(index, 1);
  } else {
    activeFilters.materials.push(material);
  }
  applyFilters();
}

function updatePriceLabel(val) {
  const valSpan = document.getElementById("price-slider-value");
  if (valSpan) {
    valSpan.textContent = `Max: Rs. ${val}`;
  }
  activeFilters.maxPrice = parseInt(val);
  applyFilters();
}

function clearAllFilters() {
  activeFilters.categories = [];
  activeFilters.maxPrice = 2500;
  activeFilters.colors = [];
  activeFilters.materials = [];
  activeFilters.customizableOnly = false;
  activeFilters.searchQuery = "";
  
  const slider = document.getElementById("filter-price-slider");
  if (slider) slider.value = 2500;
  
  const customToggle = document.getElementById("filter-customizable-toggle");
  if (customToggle) customToggle.checked = false;

  const globalSearch = document.getElementById("global-search-input");
  if (globalSearch) globalSearch.value = "";

  const valSpan = document.getElementById("price-slider-value");
  if (valSpan) valSpan.textContent = `Max: Rs. 2500`;

  renderSidebarFilters();
  applyFilters();
}

function applyFilters() {
  const grid = document.getElementById("catalog-products-grid");
  if (!grid) return;

  const customToggle = document.getElementById("filter-customizable-toggle");
  if (customToggle) {
    activeFilters.customizableOnly = customToggle.checked;
  }

  let filtered = products.filter(p => {
    if (activeFilters.categories.length > 0 && !activeFilters.categories.includes(p.category)) {
      return false;
    }
    if (p.price > activeFilters.maxPrice) {
      return false;
    }
    if (activeFilters.colors.length > 0) {
      const match = activeFilters.colors.some(c => p.color.toLowerCase().includes(c.toLowerCase()));
      if (!match) return false;
    }
    if (activeFilters.materials.length > 0) {
      const match = activeFilters.materials.some(m => p.material.toLowerCase().includes(m.toLowerCase()));
      if (!match) return false;
    }
    if (activeFilters.customizableOnly && !p.isCustomizable) {
      return false;
    }
    if (activeFilters.searchQuery.trim() !== "") {
      const query = activeFilters.searchQuery.toLowerCase();
      const match = p.title.toLowerCase().includes(query) || 
                    p.description.toLowerCase().includes(query) || 
                    p.category.toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  });

  if (activeFilters.sortBy === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (activeFilters.sortBy === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (activeFilters.sortBy === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  } else {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  const countSpan = document.getElementById("catalog-count");
  if (countSpan) countSpan.textContent = filtered.length;

  renderBreadcrumbs();

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <i class="fa-solid fa-face-frown" style="font-size: 48px; color: var(--color-gold); margin-bottom: 20px;"></i>
        <h3>No products match your filter criteria</h3>
        <p style="color: var(--text-secondary); margin-top: 10px;">Try resetting your filters or adjusting your price slider.</p>
        <button class="btn btn-secondary" style="margin-top: 20px;" onclick="clearAllFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => renderProductCardHTML(p)).join("");
}

function renderBreadcrumbs() {
  const row = document.getElementById("active-breadcrumbs-row");
  if (!row) return;

  let chips = [];
  if (activeFilters.categories.length > 0) {
    activeFilters.categories.forEach(c => {
      chips.push({ text: `Cat: ${c}`, action: `toggleCategoryFilter('${c}')` });
    });
  }
  if (activeFilters.maxPrice < 2500) {
    chips.push({ text: `Price: ≤Rs. ${activeFilters.maxPrice}`, action: "updatePriceLabel(2500)" });
  }
  if (activeFilters.colors.length > 0) {
    activeFilters.colors.forEach(col => {
      chips.push({ text: `Color: ${col}`, action: `toggleColorFilter('${col}')` });
    });
  }
  if (activeFilters.materials.length > 0) {
    activeFilters.materials.forEach(m => {
      chips.push({ text: `Mat: ${m}`, action: `toggleMaterialFilter('${m}')` });
    });
  }
  if (activeFilters.customizableOnly) {
    chips.push({ text: "Customizable Only", action: "document.getElementById('filter-customizable-toggle').click()" });
  }
  if (activeFilters.searchQuery !== "") {
    chips.push({ text: `Search: "${activeFilters.searchQuery}"`, action: "clearSearchQuery()" });
  }

  row.innerHTML = chips.map(c => `
    <span class="breadcrumb-chip">
      ${c.text}
      <i class="fa-solid fa-circle-xmark" onclick="${c.action}"></i>
    </span>
  `).join("");
}

function clearSearchQuery() {
  activeFilters.searchQuery = "";
  const globalSearch = document.getElementById("global-search-input");
  if (globalSearch) globalSearch.value = "";
  applyFilters();
}

function handleSortChange(val) {
  activeFilters.sortBy = val;
  applyFilters();
}

function filterByCategory(cat) {
  clearAllFilters();
  activeFilters.categories = [cat];
  navigateTo("shop");
}

function toggleSearch() {
  const modal = document.getElementById("search-modal");
  modal.classList.toggle("active");
  if (modal.classList.contains("active")) {
    document.getElementById("global-search-input").focus();
  }
}

function handleGlobalSearch(e) {
  if (e.key === "Enter") {
    executeGlobalSearch();
  }
}

function executeGlobalSearch() {
  const input = document.getElementById("global-search-input");
  if (input) {
    activeFilters.searchQuery = input.value;
    toggleSearch();
    navigateTo("shop");
  }
}

function renderProductCardHTML(p) {
  const ratingStars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
  const isWishlisted = currentUser && currentUser.wishlist.includes(p.id);

  return `
    <div class="product-card">
      <div class="product-img-wrapper" onclick="viewProductDetail('${p.id}')" style="cursor: pointer;">
        <img src="${p.image}" alt="${p.title}" onerror="this.src='logo.jpg'">
        <div class="product-badges">
          ${p.isCustomizable ? '<span class="badge-tag badge-custom">Custom</span>' : ''}
          ${p.price > 1000 ? '<span class="badge-tag badge-hot">Luxury</span>' : ''}
          ${p.id === "p1" || p.id === "p2" ? '<span class="badge-tag badge-new">Bestseller</span>' : ''}
        </div>
      </div>
      <button class="wishlist-add-btn ${isWishlisted ? 'in-wishlist' : ''}" 
              onclick="toggleWishlist('${p.id}', event)" 
              title="Add to Wishlist">
        <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
      </button>
      <div class="product-card-body">
        <span class="product-card-cat">${p.category}</span>
        <h3 class="product-card-title" onclick="viewProductDetail('${p.id}')" style="cursor: pointer;">${p.title}</h3>
        <div class="product-card-rating">
          <span style="color: #f0ad4e">${ratingStars}</span>
          <span class="rating-count-label">(${p.reviews ? p.reviews.length : 0})</span>
        </div>
        <div class="product-card-footer">
          <span class="product-card-price">Rs. ${p.price}</span>
          <button class="product-card-btn" onclick="viewProductDetail('${p.id}')">View Details</button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 6. PRODUCT DETAILS VIEW
// ==========================================

function viewProductDetail(productId) {
  currentDetailProductId = productId;
  const product = products.find(p => p.id === productId);
  if (!product) {
    showToast("Product not found!", "error");
    return;
  }

  window.location.hash = `product/${productId}`;
  
  const container = document.getElementById("product-detail-container");
  if (!container) return;

  const avgStars = product.rating;
  const filledStars = "★".repeat(Math.round(avgStars)) + "☆".repeat(5 - Math.round(avgStars));
  
  const customizableForm = product.isCustomizable ? `
    <div class="customization-box-form">
      <h3><i class="fa-solid fa-wand-magic-sparkles"></i> Customize Your Resin Art</h3>
      
      <div class="form-row">
        <label for="custom-product-size">Choose Dimension / Style</label>
        <select id="custom-product-size" onchange="updateDynamicDetailPrice('${product.id}')">
          ${product.sizes.map(s => `<option value="${s}">${s} (Rs. ${product.price + product.sizePrices[s]})</option>`).join("")}
        </select>
      </div>

      <div class="form-row">
        <label for="custom-text-input">Monogram Initials / Custom Name</label>
        <input type="text" id="custom-text-input" placeholder="e.g. A-Z, NEHA, LOVE" maxlength="25">
        <span class="form-note">Maximum 25 characters. Will be cured inside the resin.</span>
      </div>

      <div class="form-row">
        <label for="custom-color-theme">Glaze Theme / Liquid Pigments</label>
        <select id="custom-color-theme">
          <option value="Pink Blush & Gold Flakes">Pink Blush & Gold Flakes</option>
          <option value="Deep Amethyst & Silver Flakes">Deep Amethyst & Silver Flakes</option>
          <option value="Ocean Wave Turquoise & Sand">Ocean Wave Turquoise & Sand</option>
          <option value="Emerald Green & Bronze Foils">Emerald Green & Bronze Foils</option>
          <option value="Crystal Clear & Real Rose Petals">Crystal Clear & Real Rose Petals</option>
        </select>
      </div>

      <div class="form-row">
        <label>Embed Custom Photo (Optional)</label>
        <input type="file" id="custom-photo-file" accept="image/*" onchange="handleCustomPhotoUpload(event)">
        <div id="custom-photo-preview" style="margin-top: 10px;"></div>
        <input type="hidden" id="custom-photo-mock-url" value="">
      </div>
      
      <div style="display:flex; justify-content:flex-end;">
        <button type="button" class="btn btn-secondary" id="save-design-btn" style="font-size:11px; padding:6px 14px; text-transform:none;"><i class="fa-solid fa-bookmark" style="margin-right: 5px;"></i> Save Design to Profile</button>
      </div>
    </div>
  ` : `
    <div class="customization-box-form" style="background: rgba(197, 168, 128, 0.08); border-color: rgba(197, 168, 128, 0.3);">
      <h3 style="color: var(--text-primary); border:none; margin-bottom: 0;">
        <i class="fa-solid fa-circle-check" style="color: green"></i> Readymade Premium Jewelry
      </h3>
      <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 10px;">This piece is fully crafted and ready to ship. Custom text engraving or resin cast is not applicable for this collection.</p>
      <input type="hidden" id="custom-product-size" value="${product.sizes ? product.sizes[0] : 'Standard'}">
    </div>
  `;

  const resinDeliveryDays = product.isCustomizable ? "7-8 working days (Curing included)" : "5-6 working days";
  
  container.innerHTML = `
    <div class="detail-gallery">
      <div class="detail-main-img-box">
        <img id="detail-main-image" src="${product.image}" alt="${product.title}" onerror="this.src='logo.jpg'">
      </div>
      <div class="detail-thumbnails">
        <button class="detail-thumb-btn active" onclick="changeDetailImage('${product.image}', this)">
          <img src="${product.image}" alt="Thumb 1" onerror="this.src='logo.jpg'">
        </button>
        <button class="detail-thumb-btn" onclick="changeDetailImage('logo.jpg', this)">
          <img src="logo.jpg" alt="Thumb 2">
        </button>
      </div>
    </div>

    <div class="detail-info">
      <div class="detail-badges-row">
        <span class="badge-tag badge-custom" style="background: var(--gold-gradient)">${product.category}</span>
        ${product.isCustomizable ? '<span class="badge-tag badge-custom">Customizable</span>' : '<span class="badge-tag badge-hot">Readymade</span>'}
      </div>
      <h1>${product.title}</h1>
      
      <div class="detail-rating-row">
        <span style="color: #f0ad4e">${filledStars}</span>
        <strong style="color: var(--text-primary); font-size: 15px;">${avgStars.toFixed(1)}</strong>
        <span style="color: var(--text-secondary);">(${product.reviews ? product.reviews.length : 0} verified customer reviews)</span>
      </div>

      <div class="detail-price-row">
        <span class="detail-price-main" id="dynamic-detail-price">Rs. ${product.price}</span>
      </div>

      <div class="detail-desc-box">
        <p>${product.description}</p>
      </div>

      <ul class="spec-list-detail">
        <li><strong>Core Materials:</strong> <span>${product.material}</span></li>
        <li><strong>Glaze / Color:</strong> <span>${product.color}</span></li>
        <li><strong>Shipping Speed:</strong> <span>${resinDeliveryDays}</span></li>
      </ul>

      ${customizableForm}

      <div class="detail-actions-row">
        <div class="quantity-selector">
          <button class="qty-btn" onclick="changeDetailQuantity(-1)">-</button>
          <input type="number" id="detail-qty-input" class="qty-input" value="1" min="1" readonly>
          <button class="qty-btn" onclick="changeDetailQuantity(1)">+</button>
        </div>
        <button class="btn btn-primary" style="flex-grow: 1;" onclick="addProductToCart('${product.id}')">
          <i class="fa-solid fa-bag-shopping" style="margin-right: 10px;"></i> Add to Shopping Bag
        </button>
      </div>

      <div class="delivery-estimator-box">
        <h4><i class="fa-solid fa-truck-fast"></i> Check Delivery Estimate</h4>
        <div class="zip-input-row">
          <input type="text" id="zip-code-checker" placeholder="Enter 6-digit Pincode" maxlength="6">
          <button onclick="checkDeliveryEstimate('${product.id}')">Check Pincode</button>
        </div>
        <div id="zip-checker-feedback" class="zip-feedback"></div>
      </div>
    </div>
  `;

  renderDetailReviews(product);
  navigateTo("product-detail");
}

function changeDetailImage(src, btn) {
  document.getElementById("detail-main-image").src = src;
  document.querySelectorAll(".detail-thumb-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function changeDetailQuantity(delta) {
  const input = document.getElementById("detail-qty-input");
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  input.value = val;
}

function updateDynamicDetailPrice(pId) {
  const product = products.find(p => p.id === pId);
  const sizeSelect = document.getElementById("custom-product-size");
  const priceDisplay = document.getElementById("dynamic-detail-price");
  if (product && sizeSelect && priceDisplay) {
    const extraPrice = product.sizePrices[sizeSelect.value] || 0;
    priceDisplay.textContent = `Rs. ${product.price + extraPrice}`;
  }
}

function handleCustomPhotoUpload(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("custom-photo-preview");
  const hiddenUrl = document.getElementById("custom-photo-mock-url");

  if (file && preview && hiddenUrl) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid var(--color-gold);">`;
      hiddenUrl.value = e.target.result;
      showToast("Design photo attached successfully!");
    };
    reader.readAsDataURL(file);
  }
}

function checkDeliveryEstimate(pId) {
  const pincode = document.getElementById("zip-code-checker").value;
  const feedback = document.getElementById("zip-checker-feedback");
  const product = products.find(p => p.id === pId);

  if (!/^\d{6}$/.test(pincode)) {
    feedback.style.color = "#d9534f";
    feedback.textContent = "Please enter a valid 6-digit Pincode.";
    return;
  }

  feedback.style.color = "var(--text-primary)";
  feedback.textContent = "Calculating delivery timeline...";

  setTimeout(() => {
    let days = 5;
    if (product.isCustomizable) {
      days = 7;
    }
    
    if (pincode.startsWith("395")) {
      days -= 1;
      feedback.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color: green"></i> 
        Local Delivery (Surat Zone): Delivery estimated within <strong>${days}-${days + 1} working days</strong>.
      `;
    } else {
      feedback.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color: green"></i> 
        Standard Delivery (India-Wide): Delivery estimated within <strong>${days}-${days + 1} working days</strong>.
      `;
    }
  }, 700);
}

// ==========================================
// 7. SHOPPING CART & ADDON MANAGEMENT
// ==========================================

function toggleCart() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-drawer-overlay");
  drawer.classList.toggle("active");
  overlay.classList.toggle("active");
  
  if (drawer.classList.contains("active")) {
    renderCartItems();
  }
}

function addProductToCart(pId) {
  const product = products.find(p => p.id === pId);
  const qty = parseInt(document.getElementById("detail-qty-input").value);
  const size = document.getElementById("custom-product-size").value;
  
  let customText = "";
  let customColor = "";
  let customPhoto = "";
  
  if (product.isCustomizable) {
    customText = document.getElementById("custom-text-input").value;
    customColor = document.getElementById("custom-color-theme").value;
    customPhoto = document.getElementById("custom-photo-mock-url").value;
  }

  const baseExtra = product.sizePrices[size] || 0;
  const finalSinglePrice = product.price + baseExtra;

  const existingIndex = cart.findIndex(item => 
    item.productId === pId && 
    item.selectedSize === size && 
    item.customText === customText && 
    item.customColor === customColor
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += qty;
  } else {
    cart.push({
      cartItemId: "citem_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      productId: pId,
      title: product.title,
      image: product.image,
      category: product.category,
      price: finalSinglePrice,
      quantity: qty,
      selectedSize: size,
      customText: customText,
      customColor: customColor,
      customPhoto: customPhoto,
      isCustomizable: product.isCustomizable
    });
  }

  localStorage.setItem("vibrantglaze_cart", JSON.stringify(cart));
  updateHeaderStats();
  showToast("Added to Shopping Bag!");
  toggleCart();
}

function updateHeaderStats() {
  const countSpan = document.getElementById("header-cart-count");
  if (countSpan) {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    countSpan.textContent = totalQty;
  }
}

function renderCartItems() {
  const container = document.getElementById("cart-items-container");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
        <i class="fa-solid fa-bag-shopping" style="font-size: 42px; margin-bottom: 15px; color: var(--color-gold-light)"></i>
        <h4>Your shopping bag is empty</h4>
        <button class="btn btn-secondary" style="margin-top: 15px; font-size: 12px; padding: 8px 16px;" onclick="toggleCart(); navigateTo('shop');">Browse Catalog</button>
      </div>
    `;
    updateCartTotals();
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item-row" style="display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid rgba(44, 39, 36, 0.08);">
      <img src="${item.image}" alt="${item.title}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid var(--color-gold-light);" onerror="this.src='logo.jpg'">
      <div style="flex-grow: 1;">
        <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">${item.title}</h4>
        <p style="font-size: 11px; color: var(--color-gold-dark); margin-bottom: 6px;">
          Size: ${item.selectedSize} 
          ${item.customText ? `| Text: "${item.customText}"` : ''} 
          ${item.customColor ? `| Theme: ${item.customColor}` : ''}
          ${item.customPhoto ? `| 🖼️ Custom Photo Added` : ''}
        </p>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div class="quantity-selector" style="height: 32px;">
            <button class="qty-btn" style="width: 28px;" onclick="changeCartItemQuantity('${item.cartItemId}', -1)">-</button>
            <input type="text" class="qty-input" style="width: 30px; font-size: 13px;" value="${item.quantity}" readonly>
            <button class="qty-btn" style="width: 28px;" onclick="changeCartItemQuantity('${item.cartItemId}', 1)">+</button>
          </div>
          <strong style="font-size: 14px;">Rs. ${item.price * item.quantity}</strong>
        </div>
      </div>
      <button onclick="removeCartItem('${item.cartItemId}')" style="background: none; border: none; cursor: pointer; color: #d9534f; align-self: flex-start; font-size: 16px; padding: 2px;">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join("");

  updateCartTotals();
}

function changeCartItemQuantity(cartItemId, delta) {
  const index = cart.findIndex(item => item.cartItemId === cartItemId);
  if (index > -1) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) {
      cart[index].quantity = 1;
    }
    localStorage.setItem("vibrantglaze_cart", JSON.stringify(cart));
    updateHeaderStats();
    renderCartItems();
  }
}

function removeCartItem(cartItemId) {
  cart = cart.filter(item => item.cartItemId !== cartItemId);
  localStorage.setItem("vibrantglaze_cart", JSON.stringify(cart));
  updateHeaderStats();
  renderCartItems();
  showToast("Removed from shopping bag.", "info");
}

let activeAppliedCoupon = null;

function handleCouponApply() {
  const input = document.getElementById("cart-coupon-input").value.trim().toUpperCase();
  const feedback = document.getElementById("coupon-feedback-message");
  
  if (!input) return;

  const valid = coupons.find(c => c.code === input && c.isActive);
  if (valid) {
    activeAppliedCoupon = valid;
    feedback.style.color = "green";
    feedback.textContent = `Coupon Applied: ${valid.discountPercent}% OFF!`;
    updateCartTotals();
    showToast("Discount coupon applied!");
  } else {
    activeAppliedCoupon = null;
    feedback.style.color = "red";
    feedback.textContent = "Invalid or expired coupon code.";
    updateCartTotals();
  }
}

function updateCartTotals() {
  const subtotalDisplay = document.getElementById("cart-summary-subtotal");
  const discountRow = document.getElementById("cart-summary-discount-row");
  const discountDisplay = document.getElementById("cart-summary-discount");
  const giftRow = document.getElementById("cart-summary-gift-row");
  const giftMsgWrapper = document.getElementById("gift-message-wrapper");
  const giftToggle = document.getElementById("cart-gift-packaging-toggle");
  const taxDisplay = document.getElementById("cart-summary-tax");
  const shippingDisplay = document.getElementById("cart-summary-shipping");
  const grandTotalDisplay = document.getElementById("cart-summary-total");
  const checkoutBtn = document.getElementById("cart-checkout-trigger-btn");

  if (!subtotalDisplay) return;

  if (cart.length === 0) {
    subtotalDisplay.textContent = "Rs. 0";
    taxDisplay.textContent = "Rs. 0";
    shippingDisplay.textContent = "Rs. 0";
    grandTotalDisplay.textContent = "Rs. 0";
    if (discountRow) discountRow.classList.add("hidden");
    if (giftRow) giftRow.classList.add("hidden");
    if (giftMsgWrapper) giftMsgWrapper.classList.add("hidden");
    checkoutBtn.disabled = true;
    return;
  }

  checkoutBtn.disabled = false;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  subtotalDisplay.textContent = `Rs. ${subtotal}`;

  let discountAmount = 0;
  if (activeAppliedCoupon) {
    discountAmount = Math.round(subtotal * (activeAppliedCoupon.discountPercent / 100));
    discountRow.classList.remove("hidden");
    document.getElementById("cart-summary-coupon-code").textContent = activeAppliedCoupon.code;
    discountDisplay.textContent = `-Rs. ${discountAmount}`;
  } else {
    discountRow.classList.add("hidden");
  }

  let giftPackagingFee = 0;
  if (giftToggle && giftToggle.checked) {
    giftPackagingFee = 50;
    giftRow.classList.remove("hidden");
    giftMsgWrapper.classList.remove("hidden");
  } else {
    giftRow.classList.add("hidden");
    if (giftMsgWrapper) giftMsgWrapper.classList.add("hidden");
  }

  const taxableSubtotal = subtotal - discountAmount;
  let shippingFee = 60;
  if (taxableSubtotal >= 999) {
    shippingFee = 0;
  }
  shippingDisplay.textContent = shippingFee === 0 ? "FREE" : `Rs. ${shippingFee}`;

  const taxAmount = Math.round(taxableSubtotal * 0.18);
  taxDisplay.textContent = `Rs. ${taxAmount}`;

  const grandTotal = taxableSubtotal + giftPackagingFee + shippingFee;
  grandTotalDisplay.textContent = `Rs. ${grandTotal}`;
}

function saveGiftMessage() {
  const msg = document.getElementById("cart-gift-message").value;
  localStorage.setItem("vibrantglaze_gift_message", msg);
}

// ==========================================
// 8. CHECKOUT & PREPAID PAYMENT (SQLITE MIGRATION)
// ==========================================

function openCheckoutModal() {
  if (cart.length === 0) return;

  const modal = document.getElementById("checkout-modal");
  modal.classList.add("active");

  if (currentUser) {
    document.getElementById("checkout-name").value = currentUser.name;
    document.getElementById("checkout-phone").value = currentUser.phone || "";
    document.getElementById("checkout-address").value = currentUser.address || "";
  }
  calculateCheckoutPayable();
}

function closeCheckoutModal() {
  document.getElementById("checkout-modal").classList.remove("active");
}

function handleShippingSpeedChange(val) {
  calculateCheckoutPayable();
}

function calculateCheckoutPayable() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountAmount = 0;
  if (activeAppliedCoupon) {
    discountAmount = Math.round(subtotal * (activeAppliedCoupon.discountPercent / 100));
  }
  
  let giftFee = 0;
  const giftToggle = document.getElementById("cart-gift-packaging-toggle");
  if (giftToggle && giftToggle.checked) {
    giftFee = 50;
  }

  const taxableSubtotal = subtotal - discountAmount;
  
  const speed = document.getElementById("checkout-shipping-method").value;
  let shippingFee = 60;
  if (speed === "express") {
    shippingFee = 150;
  } else if (taxableSubtotal >= 999) {
    shippingFee = 0;
  }

  const finalAmount = taxableSubtotal + giftFee + shippingFee;
  document.getElementById("checkout-payable-total").textContent = `Rs. ${finalAmount}`;
}

function switchPaymentFields(method) {
  document.querySelectorAll(".payment-fields-set").forEach(f => f.classList.remove("active"));
  document.getElementById(`payment-field-${method}`).classList.add("active");
}

async function handlePlaceOrder(event) {
  event.preventDefault();
  
  const name = document.getElementById("checkout-name").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const address = document.getElementById("checkout-address").value.trim();
  const shippingSpeed = document.getElementById("checkout-shipping-method").value;
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  
  if (paymentMethod === "upi") {
    const upiVal = document.getElementById("checkout-upi-id").value;
    if (!upiVal.includes("@")) {
      showToast("Please enter a valid UPI ID (e.g. name@okhdfc)", "error");
      return;
    }
  } else {
    const cardNum = document.getElementById("checkout-card-num").value;
    if (cardNum.replace(/\s/g, "").length < 16) {
      showToast("Please enter a valid 16-digit Card Number.", "error");
      return;
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountAmount = 0;
  if (activeAppliedCoupon) {
    discountAmount = Math.round(subtotal * (activeAppliedCoupon.discountPercent / 100));
  }
  
  let giftFee = 0;
  const giftToggle = document.getElementById("cart-gift-packaging-toggle");
  let giftMsg = "";
  if (giftToggle && giftToggle.checked) {
    giftFee = 50;
    giftMsg = document.getElementById("cart-gift-message").value;
  }

  const taxableSubtotal = subtotal - discountAmount;
  let shippingFee = shippingSpeed === "express" ? 150 : (taxableSubtotal >= 999 ? 0 : 60);
  const tax = Math.round(taxableSubtotal * 0.18);
  const grandTotal = taxableSubtotal + giftFee + shippingFee;

  const orderId = "VG_" + Date.now().toString().substr(-6) + "_" + Math.floor(Math.random()*900 + 100);

  const newOrder = {
    orderId: orderId,
    customerName: name,
    customerEmail: currentUser ? currentUser.email : "guest@vibrantglaze.com",
    customerPhone: phone,
    shippingAddress: address,
    items: [...cart],
    subtotal: subtotal,
    discount: discountAmount,
    giftPackagingFee: giftFee,
    giftMessage: giftMsg,
    shippingFee: shippingFee,
    tax: tax,
    grandTotal: grandTotal,
    paymentMethod: paymentMethod.toUpperCase(),
    shippingSpeed: shippingSpeed,
    status: "Placed",
    date: new Date().toISOString().split("T")[0],
    trackingHistory: [
      { status: "Placed", timestamp: new Date().toLocaleString() }
    ]
  };

  // Sync with SQLITE Flask API
  const res = await apiCall("/orders", "POST", newOrder);
  
  // Update local memory replica
  orders.push(newOrder);
  localStorage.setItem("vibrantglaze_orders", JSON.stringify(orders));

  if (currentUser) {
    const uIndex = users.findIndex(u => u.email === currentUser.email);
    if (uIndex > -1) {
      if (!users[uIndex].orders) users[uIndex].orders = [];
      users[uIndex].orders.push(orderId);
      localStorage.setItem("vibrantglaze_users", JSON.stringify(users));
      currentUser = users[uIndex];
      localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
    }
  }

  simulateNotification(newOrder, "Placed");

  cart = [];
  localStorage.removeItem("vibrantglaze_cart");
  localStorage.removeItem("vibrantglaze_gift_message");
  activeAppliedCoupon = null;
  updateHeaderStats();
  
  closeCheckoutModal();
  toggleCart();

  showToast("Prepaid Order Placed Successfully! 🎁");
  showOrderTracking(orderId);
}

function simulateNotification(order, state) {
  const contact = order.customerEmail;
  console.log(`[Notification Simulator] To: ${contact} & ${order.customerPhone}. Order: ${order.orderId}. Status: ${state}.`);
  setTimeout(() => {
    alert(`✉️ [SMS/EMAIL NOTIFICATION SENT]\nTo: ${order.customerPhone} / ${contact}\n\nHi ${order.customerName},\nYour VibrantGlaze Order ${order.orderId} status is now: [${state.toUpperCase()}].\nThank you for shopping prepaid!`);
  }, 1000);
}

// ==========================================
// 9. ORDER TRACKING VIEW
// ==========================================

function showOrderTracking(orderId) {
  const o = orders.find(ord => ord.orderId === orderId);
  const container = document.getElementById("tracking-card-details");
  if (!container) return;

  if (!o) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 0;">
        <p style="color: red; font-weight: 600;">Order ID not found in database.</p>
        <button class="btn btn-secondary" onclick="navigateTo('home')">Return Home</button>
      </div>
    `;
    navigateTo("order-tracking");
    return;
  }

  const steps = ["Placed", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"];
  const currIndex = steps.indexOf(o.status);

  const checkpointsHTML = steps.map((step, idx) => {
    let stateClass = "pending";
    if (idx < currIndex) stateClass = "completed";
    else if (idx === currIndex) stateClass = "active";
    
    let icon = "fa-circle-dot";
    if (step === "Placed") icon = "fa-receipt";
    else if (step === "Confirmed") icon = "fa-clipboard-check";
    else if (step === "Packed") icon = "fa-box-open";
    else if (step === "Shipped") icon = "fa-truck";
    else if (step === "Out for Delivery") icon = "fa-motorcycle";
    else if (step === "Delivered") icon = "fa-house-circle-check";

    const hist = o.trackingHistory.find(h => h.status === step);
    const dateText = hist ? `<span style="font-size: 11px; color: var(--color-gold-dark);">${hist.timestamp}</span>` : '';

    return `
      <div class="tracking-node ${stateClass}" style="display: flex; gap: 20px; align-items: flex-start; margin-bottom: 25px; position: relative;">
        <div class="node-icon" style="
          width: 36px; height: 36px; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; 
          background: ${stateClass === 'completed' ? 'var(--color-gold)' : (stateClass === 'active' ? 'var(--resin-gradient)' : '#ddd')};
          color: #ffffff; z-index: 2; font-size: 15px; box-shadow: var(--shadow-subtle);">
          <i class="fa-solid ${icon}"></i>
        </div>
        <div>
          <h4 style="font-size: 15px; font-weight: 700; color: ${stateClass === 'pending' ? '#888' : 'var(--text-primary)'}">${step}</h4>
          ${dateText}
        </div>
      </div>
    `;
  }).join("");

  const standardDays = o.items.some(item => item.isCustomizable) ? "7-8 business days" : "5-6 business days";
  const speedLabel = o.shippingSpeed === "express" ? "Express Delivery (2-3 days)" : `Standard Delivery (${standardDays})`;

  container.innerHTML = `
    <div class="tracking-layout-grid" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; margin-top: 30px;">
      <div>
        <div style="background: var(--bg-card); padding: 30px; border-radius: var(--border-radius); border: 1px solid rgba(197, 168, 128, 0.15); box-shadow: var(--shadow-subtle);">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(44, 39, 36, 0.08); padding-bottom: 15px; margin-bottom: 20px;">
            <div>
              <span style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Order Number</span>
              <h3 style="font-size: 20px; font-weight: 700; color: var(--color-gold-dark);">${o.orderId}</h3>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Order Date</span>
              <p style="font-weight: 600;">${o.date}</p>
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h4 style="font-size: 16px; margin-bottom: 10px;">Delivery Location</h4>
            <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
              <strong>${o.customerName}</strong><br>
              ${o.shippingAddress}<br>
              Phone: ${o.customerPhone}
            </p>
          </div>

          <div style="margin-bottom: 25px;">
            <h4 style="font-size: 16px; margin-bottom: 10px;">Items Ordered</h4>
            ${o.items.map(item => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed rgba(44, 39, 36, 0.08);">
                <div style="display: flex; gap: 10px; align-items: center;">
                  <img src="${item.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" onerror="this.src='logo.jpg'">
                  <div>
                    <h5 style="margin: 0; font-size: 13.5px; font-weight: 500;">${item.title} x ${item.quantity}</h5>
                    <span style="font-size: 11px; color: var(--color-gold-dark);">Size: ${item.selectedSize}</span>
                  </div>
                </div>
                <strong>Rs. ${item.price * item.quantity}</strong>
              </div>
            `).join("")}
          </div>

          <div style="background: rgba(197, 168, 128, 0.08); padding: 15px; border-radius: 6px; font-size: 13.5px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Subtotal</span>
              <span>Rs. ${o.subtotal}</span>
            </div>
            ${o.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: green;">
                <span>Coupon Applied</span>
                <span>-Rs. ${o.discount}</span>
              </div>
            ` : ''}
            ${o.giftPackagingFee > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span>Premium Gift Packaging</span>
                <span>Rs. 50</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Shipping Option (${o.shippingSpeed.toUpperCase()})</span>
              <span>${o.shippingFee === 0 ? 'FREE' : 'Rs. ' + o.shippingFee}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(197,168,128,0.2); padding-top: 8px; font-weight: 700; font-size: 15px;">
              <span>Total Paid</span>
              <span>Rs. ${o.grandTotal}</span>
            </div>
          </div>

          <div style="margin-top: 20px; display: flex; gap: 10px;">
            <a href="https://wa.me/919228221331?text=Hi%20VibrantGlaze%2C%20I%20want%20to%20query%20about%20order%20${o.orderId}" 
               target="_blank" 
               class="btn btn-secondary" 
               style="font-size: 12px; padding: 10px 16px; flex-grow: 1; text-transform:none;">
              <i class="fa-brands fa-whatsapp" style="margin-right: 6px; color: green; font-size: 15px;"></i> WhatsApp Seller
            </a>
            <button class="btn btn-primary" onclick="navigateTo('shop')" style="font-size: 12px; padding: 10px 16px; flex-grow: 1; text-transform:none;">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>

      <div style="background: var(--bg-card); padding: 30px; border-radius: var(--border-radius); border: 1px solid rgba(197, 168, 128, 0.15); box-shadow: var(--shadow-subtle); height: fit-content;">
        <h3 style="font-size: 18px; margin-bottom: 20px; border-bottom: 1px solid rgba(197, 168, 128, 0.15); padding-bottom: 10px;">
          Live Tracking Timeline
        </h3>
        
        <div class="timeline-nodes-wrapper" style="position: relative;">
          <div class="timeline-line" style="
            position: absolute; left: 17px; top: 10px; bottom: 10px; width: 2px; 
            background: linear-gradient(to bottom, var(--color-gold) ${currIndex * 20}%, #ddd ${currIndex * 20}%); z-index: 1;">
          </div>
          ${checkpointsHTML}
        </div>

        <div style="background: #fdfaf7; border-left: 3px solid var(--color-gold); padding: 15px; margin-top: 30px; border-radius: 4px; font-size: 13px;">
          <h5 style="font-weight: 700; margin-bottom: 5px;">Shipping Method: ${speedLabel}</h5>
          <p style="color: var(--text-secondary);">Your package details and tracking status are linked to: <strong>${o.customerPhone}</strong>. If there are any delays, check WhatsApp alerts.</p>
        </div>
      </div>
    </div>
  `;

  navigateTo("order-tracking");
}

function searchOrderTracking(e) {
  e.preventDefault();
  const val = document.getElementById("order-tracking-search-id").value.trim();
  if (val) {
    showOrderTracking(val);
  }
}

// ==========================================
// 10. CUSTOMER ACCOUNTS (AUTHENTICATION REST APIs)
// ==========================================

function renderAccountView() {
  const authBox = document.getElementById("auth-box-container");
  const dashboard = document.getElementById("user-dashboard-container");

  if (currentUser) {
    authBox.classList.add("hidden");
    dashboard.classList.remove("hidden");
    renderDashboardContent();
  } else {
    authBox.classList.remove("hidden");
    dashboard.classList.add("hidden");
    switchAuthTab("login");
  }
}

function switchAuthTab(tab) {
  document.querySelectorAll(".auth-tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".auth-form-panel").forEach(panel => panel.classList.remove("active"));

  const indexMap = { login: 0, register: 1, otp: 2 };
  document.querySelectorAll(".auth-tab-btn")[indexMap[tab]].classList.add("active");
  document.getElementById(`${tab}-form`).classList.add("active");
}

async function handleEmailLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value;

  // Sync to SQLite API
  const res = await apiCall("/auth/login", "POST", { email, password: pass });
  
  if (res && res.success) {
    currentUser = res.user;
    localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
    
    const adminBtn = document.querySelector(".admin-toggle-btn");
    if (adminBtn) {
      if (currentUser.isAdmin) adminBtn.style.display = "flex";
      else adminBtn.style.display = "none";
    }

    document.getElementById("logged-user-name").textContent = currentUser.name;
    showToast(`Welcome back, ${currentUser.name}!`);
    renderAccountView();
  } else {
    // Offline database fallback
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      currentUser = user;
      localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
      
      const adminBtn = document.querySelector(".admin-toggle-btn");
      if (adminBtn) {
        if (currentUser.isAdmin) adminBtn.style.display = "flex";
        else adminBtn.style.display = "none";
      }
      
      document.getElementById("logged-user-name").textContent = currentUser.name;
      showToast(`Logged in (Offline Mode): ${currentUser.name}`);
      renderAccountView();
    } else {
      showToast("Invalid email or password credentials.", "error");
    }
  }
}

async function handleEmailRegister(event) {
  event.preventDefault();
  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;

  const res = await apiCall("/auth/register", "POST", { name, email, password });
  
  if (res && res.success) {
    currentUser = res.user;
    localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
    document.getElementById("logged-user-name").textContent = currentUser.name;
    showToast("Account registered successfully on SQLite!");
    renderAccountView();
  } else {
    // Offline local database fallback
    const existing = users.find(u => u.email === email);
    if (existing) {
      showToast("Email address already registered.", "error");
      return;
    }

    const newUser = {
      name,
      email,
      password,
      phone: "",
      address: "",
      wishlist: [],
      savedDesigns: []
    };

    users.push(newUser);
    localStorage.setItem("vibrantglaze_users", JSON.stringify(users));

    currentUser = newUser;
    localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
    document.getElementById("logged-user-name").textContent = currentUser.name;

    showToast("Registered account (Offline Fallback)");
    renderAccountView();
  }
}

let otpSentCode = null;
function handleMobileOTP(event) {
  event.preventDefault();
  const phone = document.getElementById("otp-phone").value.trim();
  const codeWrapper = document.getElementById("otp-code-wrapper");
  const codeInput = document.getElementById("otp-code");
  const submitBtn = document.getElementById("otp-submit-btn");

  if (codeWrapper.classList.contains("hidden")) {
    if (!/^\d{10}$/.test(phone)) {
      showToast("Please enter a valid 10-digit mobile number.", "error");
      return;
    }
    otpSentCode = Math.floor(Math.random()*9000 + 1000).toString();
    alert(`🔑 [MOBILE OTP SIMULATION]\nTo: +91 ${phone}\nYour verification code is: ${otpSentCode}`);
    
    codeWrapper.classList.remove("hidden");
    codeInput.required = true;
    submitBtn.textContent = "Verify OTP & Login";
    showToast("Mock OTP code sent to your mobile!");
  } else {
    const entered = codeInput.value.trim();
    if (entered === otpSentCode) {
      let user = users.find(u => u.phone === phone);
      if (!user) {
        user = {
          name: `User ${phone.substr(-4)}`,
          email: `${phone}@vibrantglaze-otp.com`,
          password: "otp-login",
          phone: phone,
          address: "",
          wishlist: [],
          savedDesigns: []
        };
        users.push(user);
        localStorage.setItem("vibrantglaze_users", JSON.stringify(users));
      }
      
      currentUser = user;
      localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
      document.getElementById("logged-user-name").textContent = currentUser.name;

      showToast("OTP Verified successfully!");
      
      codeWrapper.classList.add("hidden");
      codeInput.value = "";
      codeInput.required = false;
      submitBtn.textContent = "Send OTP Code";

      renderAccountView();
    } else {
      showToast("Invalid verification code. Try again.", "error");
    }
  }
}

function simulateGoogleLogin() {
  showToast("Connecting Google Account... (Simulation)");
  setTimeout(() => {
    const email = "google.user@gmail.com";
    let user = users.find(u => u.email === email);
    if (!user) {
      user = {
        name: "Google Explorer",
        email: email,
        password: "google-oauth",
        phone: "",
        address: "",
        wishlist: [],
        savedDesigns: []
      };
      users.push(user);
      localStorage.setItem("vibrantglaze_users", JSON.stringify(users));
    }
    currentUser = user;
    localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
    document.getElementById("logged-user-name").textContent = currentUser.name;

    showToast("Successfully logged in with Google!");
    renderAccountView();
  }, 1000);
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem("vibrantglaze_current_user");
  document.getElementById("logged-user-name").textContent = "Guest";
  
  const adminBtn = document.querySelector(".admin-toggle-btn");
  if (adminBtn) adminBtn.style.display = "none";

  showToast("Logged out successfully.");
  renderAccountView();
}

function switchDashboardTab(tabId) {
  document.querySelectorAll(".dash-menu-item").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".dashboard-tab-content").forEach(content => content.classList.remove("active"));

  const menuBtns = document.querySelectorAll(".dash-menu-item");
  const indexMap = { profile: 0, orders: 1, wishlist: 2, designs: 3 };
  menuBtns[indexMap[tabId]].classList.add("active");
  document.getElementById(`dash-tab-${tabId}`).classList.add("active");

  renderDashboardContent();
}

function renderDashboardContent() {
  if (!currentUser) return;

  const initials = currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase();
  document.getElementById("dash-avatar-initials").textContent = initials;
  document.getElementById("dash-user-name").textContent = currentUser.name;
  document.getElementById("dash-user-email").textContent = currentUser.email;

  document.getElementById("dash-input-name").value = currentUser.name;
  document.getElementById("dash-input-phone").value = currentUser.phone || "";
  document.getElementById("dash-input-address").value = currentUser.address || "";

  const ordersList = document.getElementById("dash-orders-history-list");
  if (ordersList) {
    const userOrders = orders.filter(o => o.customerEmail === currentUser.email);
    if (userOrders.length === 0) {
      ordersList.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 30px;">You haven't placed any prepaid orders yet.</p>`;
    } else {
      ordersList.innerHTML = userOrders.map(o => `
        <div class="order-summary-card" style="background: #fafafa; border: 1px solid #eee; padding: 20px; border-radius: 6px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-weight: 700; color: var(--color-gold-dark);">${o.orderId}</h4>
            <span style="font-size: 12px; color: var(--text-secondary);">${o.date} | Rs. ${o.grandTotal}</span>
            <div style="margin-top: 10px;">
              <span class="status-badge" style="
                background: ${o.status === 'Delivered' ? 'green' : (o.status === 'Cancelled' ? '#d9534f' : 'var(--color-gold)')};
                color: #fff; font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600;">
                ${o.status}
              </span>
            </div>
          </div>
          <button class="btn btn-secondary" style="font-size: 11px; padding: 8px 12px;" onclick="showOrderTracking('${o.orderId}')">Track Order</button>
        </div>
      `).join("");
    }
  }

  const wishlistGrid = document.getElementById("dash-wishlist-grid");
  if (wishlistGrid) {
    const userWish = products.filter(p => currentUser.wishlist.includes(p.id));
    if (userWish.length === 0) {
      wishlistGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-secondary); text-align: center; padding: 30px;">Your wishlist is empty.</p>`;
    } else {
      wishlistGrid.innerHTML = userWish.map(p => `
        <div style="display: flex; gap: 15px; background: #fafafa; padding: 15px; border-radius: 6px; border: 1px solid #eee;">
          <img src="${p.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" onerror="this.src='logo.jpg'">
          <div style="flex-grow: 1; display:flex; flex-direction:column; justify-content:space-between;">
            <h5 style="margin:0; font-size:13.5px; font-weight:600;">${p.title}</h5>
            <strong style="font-size: 13px;">Rs. ${p.price}</strong>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button class="btn btn-primary" style="font-size: 10px; padding: 5px 10px; text-transform:none;" onclick="viewProductDetail('${p.id}')">Order</button>
              <button class="btn btn-secondary" style="font-size: 10px; padding: 5px 10px; text-transform:none;" onclick="toggleWishlist('${p.id}')">Remove</button>
            </div>
          </div>
        </div>
      `).join("");
    }
  }

  const designsGrid = document.getElementById("dash-designs-grid");
  if (designsGrid) {
    const saved = currentUser.savedDesigns || [];
    if (saved.length === 0) {
      designsGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-secondary); text-align: center; padding: 30px;">No custom resin designs saved yet. Design a customizable item in the Shop!</p>`;
    } else {
      designsGrid.innerHTML = saved.map((d, idx) => `
        <div style="background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 15px; display:flex; gap:15px;">
          ${d.customPhoto ? `<img src="${d.customPhoto}" style="width:60px; height:60px; object-fit:cover; border-radius:4px;">` : `<div style="width:60px; height:60px; background:#ddd; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:24px;">✨</div>`}
          <div style="flex-grow: 1;">
            <h5 style="margin: 0; font-weight:700; font-size:14px;">Customized ${d.productTitle}</h5>
            <p style="font-size:11px; color:var(--text-secondary); margin-top: 4px;">
              Letter: <strong>"${d.customText}"</strong> | Color Theme: <strong>${d.customColor}</strong> | Size: <strong>${d.selectedSize}</strong>
            </p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
              <strong style="font-size: 13px;">Rs. ${d.price}</strong>
              <button class="btn btn-primary" style="font-size:10px; padding: 6px 12px; text-transform:none;" onclick="reorderCustomDesign(${idx})">Add to Bag</button>
            </div>
          </div>
        </div>
      `).join("");
    }
  }
}

async function saveProfileDetails(event) {
  event.preventDefault();
  if (!currentUser) return;

  const name = document.getElementById("dash-input-name").value.trim();
  const phone = document.getElementById("dash-input-phone").value.trim();
  const address = document.getElementById("dash-input-address").value.trim();

  const body = { email: currentUser.email, name, phone, address };
  const res = await apiCall("/users/profile", "PUT", body);

  if (res && res.success) {
    currentUser = res.user;
    localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
    document.getElementById("logged-user-name").textContent = currentUser.name;
    showToast("Profile details updated on SQLite!");
  } else {
    // offline local update
    const idx = users.findIndex(u => u.email === currentUser.email);
    if (idx > -1) {
      users[idx].name = name;
      users[idx].phone = phone;
      users[idx].address = address;
      localStorage.setItem("vibrantglaze_users", JSON.stringify(users));
      currentUser = users[idx];
      localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
      document.getElementById("logged-user-name").textContent = currentUser.name;
      showToast("Profile details saved locally (Offline)");
    }
  }
  renderDashboardContent();
}

async function toggleWishlist(pId, event) {
  if (event) event.stopPropagation();

  if (!currentUser) {
    showToast("Please log in to manage your wishlist.", "error");
    navigateTo("account");
    return;
  }

  const idx = users.findIndex(u => u.email === currentUser.email);
  if (idx > -1) {
    const wIndex = users[idx].wishlist.indexOf(pId);
    if (wIndex > -1) {
      users[idx].wishlist.splice(wIndex, 1);
      showToast("Removed from wishlist.");
    } else {
      users[idx].wishlist.push(pId);
      showToast("Added to wishlist! ❤️");
    }

    // Sync to SQLite API
    await apiCall("/users/wishlist", "POST", { email: currentUser.email, wishlist: users[idx].wishlist });

    localStorage.setItem("vibrantglaze_users", JSON.stringify(users));
    currentUser = users[idx];
    localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
    
    if (window.location.hash.startsWith("#product")) {
      viewProductDetail(pId);
    } else if (window.location.hash === "#shop") {
      applyFilters();
    }
    renderDashboardContent();
  }
}

async function saveCurrentCustomDesign() {
  if (!currentUser) {
    showToast("Please log in to save custom designs.", "error");
    navigateTo("account");
    return;
  }

  const product = products.find(p => p.id === currentDetailProductId);
  const size = document.getElementById("custom-product-size").value;
  const customText = document.getElementById("custom-text-input").value;
  const customColor = document.getElementById("custom-color-theme").value;
  const customPhoto = document.getElementById("custom-photo-mock-url").value;

  const extra = product.sizePrices[size] || 0;
  const price = product.price + extra;

  const design = {
    productTitle: product.title,
    productId: product.id,
    selectedSize: size,
    customText: customText,
    customColor: customColor,
    customPhoto: customPhoto,
    price: price
  };

  const idx = users.findIndex(u => u.email === currentUser.email);
  if (idx > -1) {
    if (!users[idx].savedDesigns) users[idx].savedDesigns = [];
    users[idx].savedDesigns.push(design);
    
    // Sync to SQLite API
    await apiCall("/users/saved-designs", "POST", { email: currentUser.email, savedDesigns: users[idx].savedDesigns });

    localStorage.setItem("vibrantglaze_users", JSON.stringify(users));
    currentUser = users[idx];
    localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
    showToast("Design saved to account dashboard!");
  }
}

function reorderCustomDesign(designIdx) {
  if (!currentUser) return;
  const design = currentUser.savedDesigns[designIdx];
  if (!design) return;

  const product = products.find(p => p.id === design.productId);
  if (!product) return;

  cart.push({
    cartItemId: "citem_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    productId: design.productId,
    title: design.productTitle,
    image: product.image,
    category: product.category,
    price: design.price,
    quantity: 1,
    selectedSize: design.selectedSize,
    customText: design.customText,
    customColor: design.customColor,
    customPhoto: design.customPhoto,
    isCustomizable: true
  });

  localStorage.setItem("vibrantglaze_cart", JSON.stringify(cart));
  updateHeaderStats();
  showToast("Custom design added to cart!");
  toggleCart();
}

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "save-design-btn") {
    saveCurrentCustomDesign();
  }
});

// ==========================================
// 11. REVIEWS & VERIFIED RATING SYSTEM
// ==========================================

function renderDetailReviews(product) {
  const avgText = document.getElementById("detail-avg-stars-num");
  const countSpan = document.getElementById("detail-reviews-count");
  const starContainer = document.getElementById("detail-avg-stars-stars");
  const list = document.getElementById("product-reviews-list");

  if (!list) return;

  const reviewsList = product.reviews || [];
  
  if (avgText) avgText.textContent = `${product.rating.toFixed(1)} out of 5`;
  if (countSpan) countSpan.textContent = `(${reviewsList.length} reviews)`;
  if (starContainer) {
    starContainer.innerHTML = "★".repeat(Math.round(product.rating)) + "☆".repeat(5 - Math.round(product.rating));
  }

  if (reviewsList.length === 0) {
    list.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No reviews yet. Be the first to review this handcrafted piece!</p>`;
    return;
  }

  list.innerHTML = reviewsList.map(r => `
    <div class="review-item">
      <div class="review-header-info">
        <div>
          <span class="review-user-name">${r.name}</span>
          <span style="color: #f0ad4e; margin-left: 10px;">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
        </div>
        <span class="review-date">${r.date}</span>
      </div>
      <p class="review-comment">${r.comment}</p>
      ${r.photo ? `<img class="review-attach-img" src="${r.photo}" onclick="window.open(this.src)" title="Click to enlarge review photo">` : ''}
    </div>
  `).join("");
}

function openReviewModal() {
  document.getElementById("review-modal").classList.add("active");
  setSelectReviewStar(5);
  document.getElementById("review-form-file").value = "";
  document.getElementById("review-image-preview-box").innerHTML = "";
}

function closeReviewModal() {
  document.getElementById("review-modal").classList.remove("active");
}

function setSelectReviewStar(stars) {
  activeReviewStars = stars;
  document.getElementById("review-form-star-value").value = stars;
  document.querySelectorAll(".star-interactive").forEach(star => {
    const val = parseInt(star.getAttribute("data-val"));
    if (val <= stars) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

function previewReviewImage(event) {
  const file = event.target.files[0];
  const box = document.getElementById("review-image-preview-box");
  if (file && box) {
    const reader = new FileReader();
    reader.onload = function(e) {
      box.innerHTML = `<img src="${e.target.result}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px;">`;
    };
    reader.readAsDataURL(file);
  }
}

async function handleReviewSubmit(event) {
  event.preventDefault();
  
  const product = products.find(p => p.id === currentDetailProductId);
  if (!product) return;

  const name = document.getElementById("review-form-name").value.trim();
  const comment = document.getElementById("review-form-comment").value.trim();
  const rating = parseInt(document.getElementById("review-form-star-value").value);
  
  let photoData = null;
  const imgElem = document.querySelector("#review-image-preview-box img");
  if (imgElem) {
    photoData = imgElem.src;
  }

  const body = { name, rating, comment, photo: photoData };

  // Sync to SQLite API
  const res = await apiCall(`/products/${product.id}/reviews`, "POST", body);

  if (res && res.success) {
    product.reviews = res.reviews;
    product.rating = res.rating;
    showToast("Verified customer review submitted to SQLite!");
  } else {
    // local fallback
    const newReview = {
      name,
      rating,
      date: new Date().toISOString().split("T")[0],
      comment,
      photo: photoData
    };
    if (!product.reviews) product.reviews = [];
    product.reviews.unshift(newReview);

    const totalStars = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = totalStars / product.reviews.length;
    showToast("Review saved locally (Offline)");
  }

  localStorage.setItem("vibrantglaze_products", JSON.stringify(products));
  closeReviewModal();
  viewProductDetail(product.id);
}

// ==========================================
// 12. FAQ ACCORDION ENGINE
// ==========================================

function renderFAQs() {
  const container = document.getElementById("faqs-accordion-container");
  if (!container) return;

  container.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <h3 style="margin-bottom: 25px; font-family:'Cinzel'; text-align:center;">Store Policies & Craft FAQs</h3>
      ${MOCK_FAQS.map((faq, idx) => `
        <div class="faq-item" style="background: var(--bg-card); border: 1px solid rgba(197, 168, 128, 0.15); border-radius: var(--border-radius); margin-bottom: 15px; overflow: hidden; box-shadow: var(--shadow-subtle);">
          <div class="faq-question" style="padding: 20px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="toggleFAQAnswer(${idx})">
            <span>${faq.question}</span>
            <i class="fa-solid fa-chevron-down" style="transition: transform 0.3s;" id="faq-chevron-${idx}"></i>
          </div>
          <div class="faq-answer" id="faq-answer-${idx}" style="padding: 0 20px 20px; color: var(--text-secondary); display: none; border-top: 1px dashed rgba(197, 168, 128, 0.1); line-height: 1.6; font-size: 14.5px;">
            <p style="margin-top: 15px;">${faq.answer}</p>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function toggleFAQAnswer(idx) {
  const answer = document.getElementById(`faq-answer-${idx}`);
  const chevron = document.getElementById(`faq-chevron-${idx}`);
  
  if (answer.style.display === "none" || answer.style.display === "") {
    answer.style.display = "block";
    chevron.style.transform = "rotate(180deg)";
  } else {
    answer.style.display = "none";
    chevron.style.transform = "rotate(0deg)";
  }
}

// ==========================================
// 13. GENERAL GALLERY SHOWCASE
// ==========================================

function renderGallery() {
  const container = document.getElementById("gallery-grid-container");
  if (!container) return;

  container.innerHTML = products.map(p => `
    <div class="gallery-item-card" style="position: relative; overflow: hidden; border-radius: var(--border-radius); height: 280px; box-shadow: var(--shadow-subtle); cursor: pointer;" onclick="viewProductDetail('${p.id}')">
      <img src="${p.image}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s;" onerror="this.src='logo.jpg'">
      <div style="
        position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; 
        background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0)); 
        color: #ffffff; opacity: 0; transition: opacity 0.3s; display: flex; flex-direction: column; justify-content: flex-end; height: 50%;">
        <h4 style="margin: 0; font-family: 'Outfit'; font-size: 16px;">${p.title}</h4>
        <span style="font-size: 12px; color: var(--color-gold); margin-top: 5px;">${p.category} Collection</span>
      </div>
    </div>
  `).join("");

  const cards = document.querySelectorAll(".gallery-item-card");
  cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
      card.querySelector("img").style.transform = "scale(1.1)";
      card.querySelector("div").style.opacity = "1";
    });
    card.addEventListener("mouseleave", () => {
      card.querySelector("img").style.transform = "scale(1)";
      card.querySelector("div").style.opacity = "0";
    });
  });
}

// ==========================================
// 14. HIDDEN MERCHANT CONSOLE (ADMIN)
// ==========================================

function checkAdminAccess() {
  if (currentUser && currentUser.isAdmin) {
    renderAdminDashboard();
  } else {
    const pass = prompt("🔐 VibrantGlaze Merchant Console Access:\nPlease enter the Admin Security Code:");
    if (pass === "admin123") {
      const adminUser = users.find(u => u.isAdmin);
      currentUser = adminUser;
      localStorage.setItem("vibrantglaze_current_user", JSON.stringify(currentUser));
      document.getElementById("logged-user-name").textContent = currentUser.name;
      
      const btn = document.querySelector(".admin-toggle-btn");
      if (btn) btn.style.display = "flex";

      showToast("Access Granted. Welcome, Merchant Admin!");
      renderAdminDashboard();
    } else {
      showToast("Incorrect security access code.", "error");
      navigateTo("home");
    }
  }
}

function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));

  const btns = document.querySelectorAll(".admin-tab-btn");
  const indexMap = { products: 0, orders: 1, customers: 2 };
  btns[indexMap[tab]].classList.add("active");
  document.getElementById(`admin-tab-${tab}`).classList.add("active");

  renderAdminDashboard();
}

async function renderAdminDashboard() {
  // Sync state first to make sure stats are latest
  const ordersRes = await apiCall("/orders");
  if (ordersRes) {
    orders = ordersRes;
    localStorage.setItem("vibrantglaze_orders", JSON.stringify(orders));
  }

  const totalRev = orders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + o.grandTotal, 0);
  document.getElementById("admin-stat-revenue").textContent = `Rs. ${totalRev.toLocaleString()}`;
  document.getElementById("admin-stat-orders-count").textContent = orders.length;

  const activeOrders = orders.filter(o => !["Delivered", "Cancelled"].includes(o.status)).length;
  document.getElementById("admin-stat-active-orders").textContent = activeOrders;
  document.getElementById("admin-stat-products-count").textContent = products.length;

  renderAdminProductsTable();
  renderAdminOrdersTable();
  
  // Sync customer directory
  const customersRes = await apiCall("/admin/customers");
  if (customersRes) {
    renderAdminCustomersTable(customersRes);
  } else {
    renderAdminCustomersTable(users);
  }
}

function renderAdminProductsTable() {
  const tbody = document.getElementById("admin-products-table-body");
  if (!tbody) return;

  tbody.innerHTML = products.map(p => `
    <tr>
      <td style="display:flex; gap:10px; align-items:center; border:none; padding: 12px 10px;">
        <img src="${p.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" onerror="this.src='logo.jpg'">
        <strong style="font-size: 13.5px;">${p.title}</strong>
      </td>
      <td>${p.category}</td>
      <td>Rs. ${p.price}</td>
      <td>${p.color}</td>
      <td>${p.isCustomizable ? 'Yes' : 'No'}</td>
      <td>
        <button class="btn btn-secondary" style="font-size: 10px; padding: 5px 10px; margin-right:5px; text-transform:none;" onclick="openEditProductModal('${p.id}')">Edit</button>
        <button class="btn btn-secondary" style="font-size: 10px; padding: 5px 10px; color:#d9534f; border-color:#d9534f; text-transform:none;" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

function renderAdminOrdersTable() {
  const tbody = document.getElementById("admin-orders-table-body");
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color: #888;">No orders have been placed yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.slice().reverse().map(o => {
    const statuses = ["Placed", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
    const statusOptions = statuses.map(s => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`).join("");

    return `
      <tr>
        <td><strong>${o.orderId}</strong></td>
        <td>
          <div style="font-size:13px;">${o.customerName}</div>
          <div style="font-size:11px; color:#888;">${o.customerPhone}</div>
        </td>
        <td>${o.date}</td>
        <td>Rs. ${o.grandTotal}</td>
        <td>
          <span class="status-badge" style="
            background: ${o.status === 'Delivered' ? 'green' : (o.status === 'Cancelled' ? '#d9534f' : 'var(--color-gold)')};
            color: #fff; font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight:600;">
            ${o.status}
          </span>
        </td>
        <td>
          <select style="padding: 5px; font-size:12px; border-radius:4px;" onchange="updateOrderStatus('${o.orderId}', this.value)">
            ${statusOptions}
          </select>
        </td>
      </tr>
    `;
  }).join("");
}

function renderAdminCustomersTable(customersList) {
  const tbody = document.getElementById("admin-customers-table-body");
  if (!tbody) return;

  tbody.innerHTML = customersList.map(u => `
    <tr>
      <td><strong>${u.name}</strong> ${u.isAdmin ? '<span style="background:var(--color-accent-violet); color:#fff; font-size:9px; padding:2px 5px; border-radius:3px;">Admin</span>' : ''}</td>
      <td>${u.email}</td>
      <td>${u.phone || 'N/A'}</td>
      <td style="max-width:250px; font-size:12px; color:#666;">${u.address || 'No address saved.'}</td>
    </tr>
  `).join("");
}

async function updateOrderStatus(orderId, newStatus) {
  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx > -1) {
    orders[idx].status = newStatus;
    orders[idx].trackingHistory.push({
      status: newStatus,
      timestamp: new Date().toLocaleString()
    });

    // Sync to SQLite API
    await apiCall(`/orders/${orderId}/status`, "PUT", { status: newStatus, trackingHistory: orders[idx].trackingHistory });

    localStorage.setItem("vibrantglaze_orders", JSON.stringify(orders));
    simulateNotification(orders[idx], newStatus);
    showToast(`Order status updated to: ${newStatus}`);
    renderAdminDashboard();
  }
}

function toggleAddProductForm() {
  const modal = document.getElementById("admin-add-product-wrapper");
  modal.classList.toggle("hidden");
  
  if (modal.classList.contains("hidden")) {
    document.getElementById("admin-product-form").reset();
    document.getElementById("form-product-id").value = "";
  } else {
    document.getElementById("product-form-title").textContent = "Create New Catalog Product";
  }
}

function openEditProductModal(pId) {
  const p = products.find(prod => prod.id === pId);
  if (!p) return;

  toggleAddProductForm();
  document.getElementById("product-form-title").textContent = `Edit Product: ${p.title}`;
  
  document.getElementById("form-product-id").value = p.id;
  document.getElementById("form-product-title").value = p.title;
  document.getElementById("form-product-category").value = p.category;
  document.getElementById("form-product-price").value = p.price;
  document.getElementById("form-product-image").value = p.image;
  document.getElementById("form-product-color").value = p.color;
  document.getElementById("form-product-material").value = p.material;
  document.getElementById("form-product-customizable").checked = p.isCustomizable;
  document.getElementById("form-product-desc").value = p.description;
}

async function handleSaveProduct(event) {
  event.preventDefault();

  const pId = document.getElementById("form-product-id").value;
  const title = document.getElementById("form-product-title").value.trim();
  const category = document.getElementById("form-product-category").value;
  const price = parseInt(document.getElementById("form-product-price").value);
  const image = document.getElementById("form-product-image").value.trim();
  const color = document.getElementById("form-product-color").value.trim();
  const material = document.getElementById("form-product-material").value.trim();
  const isCustomizable = document.getElementById("form-product-customizable").checked;
  const description = document.getElementById("form-product-desc").value.trim();

  const body = { id: pId, title, category, price, image, color, material, isCustomizable, description };

  if (pId) {
    // EDIT
    await apiCall(`/products/${pId}`, "PUT", body);
    
    const idx = products.findIndex(prod => prod.id === pId);
    if (idx > -1) {
      products[idx].title = title;
      products[idx].category = category;
      products[idx].price = price;
      products[idx].basePrice = price;
      products[idx].image = image;
      products[idx].color = color;
      products[idx].material = material;
      products[idx].isCustomizable = isCustomizable;
      products[idx].description = description;
    }
    showToast("Product updated in catalog!");
  } else {
    // ADD NEW
    const newId = "p" + (products.length + 1) + "_" + Math.floor(Math.random()*90 + 10);
    const sizes = isCustomizable ? 
      ["Standard Size", "Medium Size (+Rs. 100)", "Bespoke Gift Package Size (+Rs. 250)"] : 
      ["Standard Size"];
    const sizePrices = isCustomizable ? 
      { "Standard Size": 0, "Medium Size (+Rs. 100)": 100, "Bespoke Gift Package Size (+Rs. 250)": 250 } : 
      { "Standard Size": 0 };

    const newProduct = {
      id: newId,
      title,
      category,
      price,
      image,
      color,
      material,
      isCustomizable,
      description,
      sizes,
      sizePrices
    };

    await apiCall("/products", "POST", newProduct);
    
    products.push({
      ...newProduct,
      basePrice: price,
      rating: 5.0,
      reviews: []
    });
    showToast("New product created in catalog!");
  }

  localStorage.setItem("vibrantglaze_products", JSON.stringify(products));
  toggleAddProductForm();
  renderAdminDashboard();
}

async function deleteProduct(pId) {
  if (confirm("Are you sure you want to delete this product from the catalog?")) {
    await apiCall(`/products/${pId}`, "DELETE");
    products = products.filter(prod => prod.id !== pId);
    localStorage.setItem("vibrantglaze_products", JSON.stringify(products));
    showToast("Product removed from catalog.", "info");
    renderAdminDashboard();
  }
}

// ==========================================
// 15. MISCELLANEOUS FORM HANDLERS
// ==========================================

function handleContactSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("contact-form-name").value.trim();
  const email = document.getElementById("contact-form-email").value.trim();
  const message = document.getElementById("contact-form-msg").value.trim();

  alert(`✉️ [QUERY DELIVERED TO nehatosawad@gmail.com]\nFrom: ${name} (${email})\nMessage:\n${message}\n\nOur design artist will reach out to you via email or phone within 24 hours.`);
  document.getElementById("contact-query-form").reset();
  showToast("Your customization query was sent successfully!");
}

function handleNewsletterSubmit(event) {
  event.preventDefault();
  const email = document.getElementById("newsletter-email").value.trim();
  showToast("Thank you for subscribing to VibrantGlaze news! 🎁");
  document.getElementById("newsletter-email").value = "";
}

function openPolicyModal(policyId) {
  const modal = document.getElementById(`policy-modal-${policyId}`);
  if (modal) {
    modal.classList.add("active");
  }
}

function closePolicyModal(policyId) {
  const modal = document.getElementById(`policy-modal-${policyId}`);
  if (modal) {
    modal.classList.remove("active");
  }
}

function openQuickCustomizer() {
  viewProductDetail("p1");
}
