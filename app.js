import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   1) الحماية من النسخ وزر اليمين
========================================================= */
(function activateProtection() {
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  document.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });

  document.addEventListener("copy", (e) => {
    e.preventDefault();
  });

  document.addEventListener("cut", (e) => {
    e.preventDefault();
  });

  document.addEventListener("selectstart", (e) => {
    const allowed = e.target.closest("input, textarea");
    if (!allowed) e.preventDefault();
  });

  let pressTimer = null;
  document.addEventListener(
    "touchstart",
    (e) => {
      const allowed = e.target.closest("input, textarea");
      if (allowed) return;

      pressTimer = setTimeout(() => {
        e.preventDefault();
      }, 500);
    },
    { passive: false }
  );

  ["touchend", "touchmove", "touchcancel"].forEach((eventName) => {
    document.addEventListener(
      eventName,
      () => clearTimeout(pressTimer),
      { passive: false }
    );
  });
})();

/* =========================================================
   2) إعداد Firebase
   ضع بيانات مشروعك هنا
========================================================= */
const firebaseConfig = {
  apiKey: "PUT_YOUR_API_KEY",
  authDomain: "PUT_YOUR_AUTH_DOMAIN",
  projectId: "PUT_YOUR_PROJECT_ID",
  storageBucket: "PUT_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PUT_YOUR_MESSAGING_SENDER_ID",
  appId: "PUT_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================================================
   3) عناصر الصفحة
========================================================= */
const els = {
  restaurantName: document.getElementById("restaurantName"),
  restaurantSubtitle: document.getElementById("restaurantSubtitle"),
  restaurantLogo: document.getElementById("restaurantLogo"),
  heroTitle: document.getElementById("heroTitle"),
  heroDescription: document.getElementById("heroDescription"),
  heroBanner: document.getElementById("heroBanner"),

  footerLogo: document.getElementById("footerLogo"),
  footerRestaurantName: document.getElementById("footerRestaurantName"),
  aboutText: document.getElementById("aboutText"),
  displayPhone: document.getElementById("displayPhone"),
  displayPhoneLink: document.getElementById("displayPhoneLink"),
  displayAddress: document.getElementById("displayAddress"),

  whatsappBtn: document.getElementById("whatsappBtn"),
  instagramBtn: document.getElementById("instagramBtn"),
  facebookBtn: document.getElementById("facebookBtn"),
  mapsBtn: document.getElementById("mapsBtn"),
  mapsInlineBtn: document.getElementById("mapsInlineBtn"),

  searchInput: document.getElementById("searchInput"),
  sortFilter: document.getElementById("sortFilter"),
  quickCategories: document.getElementById("quickCategories"),

  featuredGrid: document.getElementById("featuredGrid"),
  menuGroups: document.getElementById("menuGroups"),
  menuCounter: document.getElementById("menuCounter"),

  modalImage: document.getElementById("modalImage"),
  modalCategory: document.getElementById("modalCategory"),
  modalName: document.getElementById("modalName"),
  modalPrice: document.getElementById("modalPrice"),
  modalDescription: document.getElementById("modalDescription"),
  modalIngredients: document.getElementById("modalIngredients"),
  orderWhatsappBtn: document.getElementById("orderWhatsappBtn")
};

/* =========================================================
   4) الحالة العامة
========================================================= */
let settings = null;
let categories = [];
let meals = [];
let activeCategory = "all";

/* =========================================================
   5) بيانات احتياطية
========================================================= */
const FALLBACK_SETTINGS = {
  restaurantName: "فطاير ع طاير",
  subtitle: "للمعجنات والبيتزا",
  heroTitle: "أشهى المعجنات والبيتزا",
  heroDescription: "واجهة منيو سريعة وحديثة مع طلب مباشر عبر واتساب.",
  aboutText: "نقدم لكم أشهى المأكولات المحضرة بعناية من أجود المكونات الطازجة، ونسعى دائمًا لتقديم تجربة طعام لذيذة وسريعة.",
  phone: "0983906667",
  whatsapp: "https://wa.me/963983906667",
  instagram: "#",
  facebook: "#",
  maps: "#",
  addressText: "الموقع على خرائط جوجل",
  logoUrl: "https://images.unsplash.com/photo-1541544181051-e46607c3a54b?q=80&w=600&auto=format&fit=crop",
  bannerUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop"
};

const FALLBACK_CATEGORIES = [
  { id: "demo-cat-1", name: "قسم المشاوي", order: 1 },
  { id: "demo-cat-2", name: "الوجبات السريعة", order: 2 },
  { id: "demo-cat-3", name: "قسم السندويشات", order: 3 }
];

const FALLBACK_MEALS = [
  {
    id: "demo-1",
    name: "ساندويش كريسبي",
    price: 110,
    oldPrice: 200,
    categoryId: "demo-cat-3",
    description: "ساندويش كريسبي مقرمش بطعم مميز.",
    ingredients: ["دجاج", "صوص", "خبز"],
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "demo-2",
    name: "وجبة شاورما إكسترا",
    price: 199,
    oldPrice: 300,
    categoryId: "demo-cat-2",
    description: "وجبة شاورما إكسترا + بطاطا + مخللات + مثومة + سلطة روسية.",
    ingredients: ["شاورما", "بطاطا", "مخللات"],
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "demo-3",
    name: "سوبريم",
    price: 249,
    oldPrice: 350,
    categoryId: "demo-cat-2",
    description: "سوبريم 4 قطع + بطاطا + مخللات.",
    ingredients: ["دجاج", "بطاطا", "صلصة"],
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "demo-4",
    name: "بيتزا خضار",
    price: 175,
    categoryId: "demo-cat-2",
    description: "بيتزا شهية مع جبنة وخضار طازجة.",
    ingredients: ["جبنة", "فليفلة", "زيتون"],
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop"
  }
];

/* =========================================================
   6) دوال مساعدة
========================================================= */
function openPanel(id) {
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closePanel(id) {
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.classList.remove("show");
  document.body.style.overflow = "";
}

document.addEventListener("click", (e) => {
  const closeId = e.target.getAttribute("data-close");
  if (closeId) closePanel(closeId);
});

function formatPrice(price) {
  return `${Number(price || 0)} ليرة`;
}

function getCategoryName(categoryId) {
  return categories.find((c) => c.id === categoryId)?.name || "قسم غير معروف";
}

function normalizeSyrianWhatsappNumber(rawValue) {
  if (!rawValue) return "";

  let value = String(rawValue).trim();

  if (value.includes("wa.me")) {
    return value.replace(/\D/g, "");
  }

  value = value.replace(/[^\d+]/g, "");

  if (value.startsWith("+963")) return value.replace(/\D/g, "");
  if (value.startsWith("963")) return value.replace(/\D/g, "");
  if (value.startsWith("0")) return `963${value.slice(1)}`;

  return value.replace(/\D/g, "");
}

function buildWhatsappMessage(meal) {
  const categoryName = getCategoryName(meal.categoryId);
  const ingredientsText =
    Array.isArray(meal.ingredients) && meal.ingredients.length
      ? meal.ingredients.join("، ")
      : "غير محددة";

  return [
    "مرحبًا 👋",
    "أريد طلب هذه الوجبة:",
    `🍽️ الوجبة: ${meal.name}`,
    `💰 السعر: ${formatPrice(meal.price)}`,
    `📂 القسم: ${categoryName}`,
    `🧾 التفاصيل: ${meal.description || "لا يوجد"}`,
    `🥐 المكونات: ${ingredientsText}`
  ].join("\n");
}

/* =========================================================
   7) تطبيق إعدادات المطعم على الواجهة
   هنا تعمل روابط التواصل الاجتماعي
========================================================= */
function applySettingsToUI(data) {
  const s = data || FALLBACK_SETTINGS;

  if (els.restaurantName) els.restaurantName.textContent = s.restaurantName || "فطاير ع طاير";
  if (els.restaurantSubtitle) els.restaurantSubtitle.textContent = s.subtitle || "للمعجنات والبيتزا";
  if (els.heroTitle) els.heroTitle.textContent = s.heroTitle || "أشهى المعجنات والبيتزا";
  if (els.heroDescription) els.heroDescription.textContent = s.heroDescription || "";
  if (els.heroBanner) els.heroBanner.src = s.bannerUrl || FALLBACK_SETTINGS.bannerUrl;

  if (els.restaurantLogo) els.restaurantLogo.src = s.logoUrl || FALLBACK_SETTINGS.logoUrl;
  if (els.footerLogo) els.footerLogo.src = s.logoUrl || FALLBACK_SETTINGS.logoUrl;
  if (els.footerRestaurantName) els.footerRestaurantName.textContent = s.restaurantName || "فطاير ع طاير";
  if (els.aboutText) els.aboutText.textContent = s.aboutText || FALLBACK_SETTINGS.aboutText;

  const visiblePhone = s.phone || FALLBACK_SETTINGS.phone;
  const normalizedPhone = normalizeSyrianWhatsappNumber(s.phone || s.whatsapp || FALLBACK_SETTINGS.phone);
  const whatsappLink = `https://wa.me/${normalizedPhone}`;

  if (els.displayPhone) els.displayPhone.textContent = `+${normalizedPhone}`;
  if (els.displayPhoneLink) els.displayPhoneLink.href = whatsappLink;

  if (els.whatsappBtn) els.whatsappBtn.href = whatsappLink;

  /*
    هنا ضع روابط التواصل الاجتماعي داخل settings/main في Firestore:
    instagram: "https://instagram.com/your_page"
    facebook: "https://facebook.com/your_page"
    maps: "https://maps.google.com/..."
  */
  if (els.instagramBtn) els.instagramBtn.href = s.instagram || "#";
  if (els.facebookBtn) els.facebookBtn.href = s.facebook || "#";
  if (els.mapsBtn) els.mapsBtn.href = s.maps || "#";
  if (els.mapsInlineBtn) els.mapsInlineBtn.href = s.maps || "#";
  if (els.displayAddress) els.displayAddress.textContent = s.addressText || "الموقع على خرائط جوجل";
}

/* =========================================================
   8) الفئات
========================================================= */
function renderQuickCategories() {
  if (!els.quickCategories) return;

  els.quickCategories.innerHTML = [
    `<button class="category-chip ${activeCategory === "all" ? "active" : ""}" data-category="all">عرض الكل</button>`,
    ...categories.map(
      (cat) => `
      <button class="category-chip ${activeCategory === cat.id ? "active" : ""}" data-category="${cat.id}">
        ${cat.name}
      </button>
    `
    )
  ].join("");
}

function bindCategoryChipEvents() {
  if (!els.quickCategories) return;

  els.quickCategories.addEventListener("click", (e) => {
    const chip = e.target.closest(".category-chip");
    if (!chip) return;

    activeCategory = chip.dataset.category || "all";
    renderQuickCategories();
    renderFeaturedMeals();
    renderMeals();
  });
}

/* =========================================================
   9) المنتجات المميزة
========================================================= */
function buildFeaturedCard(meal) {
  return `
    <article class="featured-card" data-meal-id="${meal.id}">
      <img src="${meal.imageUrl}" alt="${meal.name}" />
      <div class="featured-body">
        <h3 class="featured-title">${meal.name}</h3>
        <p class="featured-desc">${meal.description || ""}</p>
        <div class="featured-price">
          ${meal.oldPrice ? `<del>${formatPrice(meal.oldPrice)}</del> ` : ""}
          <strong>${formatPrice(meal.price)}</strong>
        </div>
      </div>
    </article>
  `;
}

function renderFeaturedMeals() {
  if (!els.featuredGrid) return;

  const sourceMeals =
    activeCategory === "all"
      ? meals
      : meals.filter((meal) => meal.categoryId === activeCategory);

  const featured = sourceMeals.filter((meal) => meal.featured === true).slice(0, 3);
  const finalFeatured = featured.length ? featured : sourceMeals.slice(0, 3);

  if (!finalFeatured.length) {
    els.featuredGrid.innerHTML = `<div class="empty-state">لا توجد منتجات مميزة حاليًا.</div>`;
    return;
  }

  els.featuredGrid.innerHTML = finalFeatured.map(buildFeaturedCard).join("");
}

/* =========================================================
   10) قائمة الطعام
========================================================= */
function buildMealCard(meal) {
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients.slice(0, 3) : [];

  return `
    <article class="meal-card" data-meal-id="${meal.id}">
      <img class="meal-image" src="${meal.imageUrl}" alt="${meal.name}" />
      <div class="meal-body">
        <div class="meal-top">
          <h3 class="meal-name">${meal.name}</h3>
          <div class="meal-price">${formatPrice(meal.price)}</div>
        </div>
        <p class="meal-desc">${meal.description || ""}</p>
        <div class="tags">
          <span class="tag">${getCategoryName(meal.categoryId)}</span>
          ${ingredients.map((item) => `<span class="tag">${item}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function getFilteredMeals() {
  const search = els.searchInput?.value.trim().toLowerCase() || "";
  const sort = els.sortFilter?.value || "default";

  let filtered = meals.filter((meal) => {
    const matchesCategory = activeCategory === "all" || meal.categoryId === activeCategory;

    const haystack = [
      meal.name,
      meal.description,
      ...(meal.ingredients || []),
      getCategoryName(meal.categoryId)
    ].join(" ").toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    return matchesCategory && matchesSearch;
  });

  if (sort === "price-asc") filtered.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "price-desc") filtered.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name, "ar"));

  return filtered;
}

function renderMeals() {
  if (!els.menuGroups || !els.menuCounter) return;

  const filteredMeals = getFilteredMeals();
  els.menuCounter.textContent = `${filteredMeals.length} وجبة متاحة للعرض`;

  if (!filteredMeals.length) {
    els.menuGroups.innerHTML = `<div class="empty-state">لا توجد نتائج مطابقة حاليًا.</div>`;
    return;
  }

  const visibleCategories =
    activeCategory === "all"
      ? categories
      : categories.filter((cat) => cat.id === activeCategory);

  const grouped = visibleCategories
    .map((cat) => ({
      ...cat,
      meals: filteredMeals.filter((meal) => meal.categoryId === cat.id)
    }))
    .filter((group) => group.meals.length);

  els.menuGroups.innerHTML = grouped
    .map(
      (group) => `
      <section class="category-block">
        <div>
          <h3 class="category-title">${group.name}</h3>
          <p class="category-note">${group.meals.length} منتج ضمن هذا القسم</p>
        </div>
        <div class="meals-grid">
          ${group.meals.map(buildMealCard).join("")}
        </div>
      </section>
    `
    )
    .join("");
}

/* =========================================================
   11) نافذة التفاصيل + طلب واتساب
========================================================= */
function openMealModal(meal) {
  if (!els.modalImage) return;

  els.modalImage.src = meal.imageUrl;
  els.modalCategory.textContent = getCategoryName(meal.categoryId);
  els.modalName.textContent = meal.name;
  els.modalPrice.textContent = formatPrice(meal.price);
  els.modalDescription.textContent = meal.description || "لا يوجد وصف إضافي.";

  els.modalIngredients.innerHTML =
    Array.isArray(meal.ingredients) && meal.ingredients.length
      ? meal.ingredients.map((item) => `<span class="tag">${item}</span>`).join("")
      : `<span class="tag">لا توجد مكونات محددة</span>`;

  if (els.orderWhatsappBtn) {
    const phone = normalizeSyrianWhatsappNumber(settings?.phone || settings?.whatsapp || FALLBACK_SETTINGS.phone);
    const message = buildWhatsappMessage(meal);

    els.orderWhatsappBtn.onclick = () => {
      if (!phone) {
        alert("رقم واتساب المتجر غير مضبوط بعد.");
        return;
      }

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    };
  }

  openPanel("mealModal");
}

function bindMealEvents() {
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".meal-card, .featured-card");
    if (!card) return;

    const meal = meals.find((m) => m.id === card.dataset.mealId);
    if (meal) openMealModal(meal);
  });
}

/* =========================================================
   12) جلب البيانات من Firestore
========================================================= */
async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "main"));
    settings = snap.exists() ? snap.data() : FALLBACK_SETTINGS;
  } catch {
    settings = FALLBACK_SETTINGS;
  }

  applySettingsToUI(settings);
}

async function loadCategories() {
  try {
    const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
    categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!categories.length) categories = [...FALLBACK_CATEGORIES];
  } catch {
    categories = [...FALLBACK_CATEGORIES];
  }

  renderQuickCategories();
}

async function loadMeals() {
  try {
    const snap = await getDocs(query(collection(db, "meals"), orderBy("createdAt", "desc")));
    meals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!meals.length) meals = [...FALLBACK_MEALS];
  } catch {
    meals = [...FALLBACK_MEALS];
  }

  renderFeaturedMeals();
  renderMeals();
}

async function init() {
  await loadSettings();
  await loadCategories();
  await loadMeals();
}

/* =========================================================
   13) البحث والترتيب
========================================================= */
if (els.searchInput) {
  els.searchInput.addEventListener("input", () => {
    renderFeaturedMeals();
    renderMeals();
  });
}

if (els.sortFilter) {
  els.sortFilter.addEventListener("change", renderMeals);
}

/* =========================================================
   14) بدء التشغيل
========================================================= */
bindCategoryChipEvents();
bindMealEvents();
init();
