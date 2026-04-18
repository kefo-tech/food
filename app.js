/* =========================================================
   1) حماية النسخ وزر اليمين
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
})();

/* =========================================================
   2) عناصر الصفحة
========================================================= */
const els = {
  restaurantName: document.getElementById("restaurantName"),
  restaurantSubtitle: document.getElementById("restaurantSubtitle"),
  restaurantLogo: document.getElementById("restaurantLogo"),

  drawerLogo: document.getElementById("drawerLogo"),
  drawerRestaurantName: document.getElementById("drawerRestaurantName"),
  aboutText: document.getElementById("aboutText"),
  displayPhone: document.getElementById("displayPhone"),
  displayAddress: document.getElementById("displayAddress"),

  drawerWhatsappBtn: document.getElementById("drawerWhatsappBtn"),
  drawerMapsBtn: document.getElementById("drawerMapsBtn"),
  instagramDrawerBtn: document.getElementById("instagramDrawerBtn"),
  facebookDrawerBtn: document.getElementById("facebookDrawerBtn"),

  whatsappFloatingBtn: document.getElementById("whatsappFloatingBtn"),
  instagramFloatingBtn: document.getElementById("instagramFloatingBtn"),
  facebookFloatingBtn: document.getElementById("facebookFloatingBtn"),
  mapsFloatingBtn: document.getElementById("mapsFloatingBtn"),

  searchInput: document.getElementById("searchInput"),
  quickCategories: document.getElementById("quickCategories"),
  menuGroups: document.getElementById("menuGroups"),
  menuCounter: document.getElementById("menuCounter"),
  featuredGrid: document.getElementById("featuredGrid"),

  modalImage: document.getElementById("modalImage"),
  modalCategory: document.getElementById("modalCategory"),
  modalName: document.getElementById("modalName"),
  modalPrice: document.getElementById("modalPrice"),
  modalDescription: document.getElementById("modalDescription"),
  modalIngredients: document.getElementById("modalIngredients"),
  orderWhatsappBtn: document.getElementById("orderWhatsappBtn"),

  mealModal: document.getElementById("mealModal"),

  menuToggleBtn: document.getElementById("menuToggleBtn"),
  sideDrawer: document.getElementById("sideDrawer"),
  drawerOverlay: document.getElementById("drawerOverlay"),
  drawerCloseBtn: document.getElementById("drawerCloseBtn")
};

/* =========================================================
   3) الحالة العامة
========================================================= */
let settings = null;
let categories = [];
let meals = [];
let activeCategory = "all";
let currentSort = "default";

/* =========================================================
   4) بيانات محلية تجريبية
   طالما Firestore غير مبني بعد
========================================================= */
const FALLBACK_SETTINGS = {
  restaurantName: "فطاير ع طاير",
  subtitle: "للمعجنات والبيتزا",
  aboutText:
    "نقدم لكم أشهى المأكولات المحضرة بعناية من أجود المكونات الطازجة، ونسعى دائمًا لتقديم تجربة طعام لا تُنسى.",
  phone: "0983906667",
  instagram: "#",
  facebook: "#",
  maps: "#",
  addressText: "الموقع على خرائط جوجل",
  logoUrl:
    "https://images.unsplash.com/photo-1541544181051-e46607c3a54b?q=80&w=600&auto=format&fit=crop"
};

const FALLBACK_CATEGORIES = [
  { id: "cat1", name: "قسم المشاوي", order: 1 },
  { id: "cat2", name: "الوجبات السريعة", order: 2 },
  { id: "cat3", name: "الفروج", order: 3 }
];

const FALLBACK_MEALS = [
  {
    id: "m1",
    name: "ساندويش كريسبي",
    price: 110,
    oldPrice: 200,
    categoryId: "cat2",
    description: "ساندويش كريسبي",
    ingredients: ["خبز", "دجاج", "خس"],
    featured: true,
    actionType: "counter",
    imageUrl:
      "https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "m2",
    name: "وجبة شاورما إكسترا",
    price: 199,
    oldPrice: 300,
    categoryId: "cat2",
    description: "وجبة شاورما اكسترا + بطاطا + مخللات + مثومة + سلطة روسية",
    ingredients: ["شاورما", "بطاطا", "مخللات"],
    featured: true,
    actionType: "counter",
    imageUrl:
      "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "m3",
    name: "سوبريم",
    price: 249,
    oldPrice: 350,
    categoryId: "cat2",
    description: "سوبريم 4 قطع + بطاطا + مخللات",
    ingredients: ["دجاج", "بطاطا", "صلصة"],
    featured: true,
    actionType: "select",
    imageUrl:
      "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "m4",
    name: "صحن فروج",
    price: 180,
    oldPrice: 240,
    categoryId: "cat3",
    description: "صحن فروج مع بطاطا ومخللات",
    ingredients: ["فروج", "بطاطا", "مخللات"],
    featured: false,
    actionType: "counter",
    imageUrl:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "m5",
    name: "مشاوي مشكلة",
    price: 320,
    oldPrice: 400,
    categoryId: "cat1",
    description: "طبق مشاوي مشكلة مع خبز وسلطات",
    ingredients: ["كباب", "شيش", "خبز"],
    featured: false,
    actionType: "select",
    imageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop"
  }
];

/* =========================================================
   5) أدوات مساعدة
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
  return `${Number(price || 0)}`;
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
    `💰 السعر: ${meal.price} ليرة`,
    `📂 القسم: ${categoryName}`,
    `🧾 التفاصيل: ${meal.description || "لا يوجد"}`,
    `🥐 المكونات: ${ingredientsText}`
  ].join("\n");
}

/* =========================================================
   6) القائمة الجانبية
========================================================= */
function openDrawer() {
  els.sideDrawer?.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  els.sideDrawer?.classList.remove("show");
  document.body.style.overflow = "";
}

els.menuToggleBtn?.addEventListener("click", openDrawer);
els.drawerOverlay?.addEventListener("click", closeDrawer);
els.drawerCloseBtn?.addEventListener("click", closeDrawer);

/* =========================================================
   7) تطبيق الإعدادات على الواجهة
========================================================= */
function applySettingsToUI(data) {
  const s = data || FALLBACK_SETTINGS;

  if (els.restaurantName) els.restaurantName.textContent = s.restaurantName || "فطاير ع طاير";
  if (els.restaurantSubtitle) els.restaurantSubtitle.textContent = s.subtitle || "للمعجنات والبيتزا";

  if (els.restaurantLogo) els.restaurantLogo.src = s.logoUrl || FALLBACK_SETTINGS.logoUrl;
  if (els.drawerLogo) els.drawerLogo.src = s.logoUrl || FALLBACK_SETTINGS.logoUrl;
  if (els.drawerRestaurantName) els.drawerRestaurantName.textContent = s.restaurantName || "فطاير ع طاير";
  if (els.aboutText) els.aboutText.textContent = s.aboutText || FALLBACK_SETTINGS.aboutText;

  const normalizedPhone = normalizeSyrianWhatsappNumber(s.phone || FALLBACK_SETTINGS.phone);
  const whatsappLink = `https://wa.me/${normalizedPhone}`;

  if (els.displayPhone) els.displayPhone.textContent = normalizedPhone;
  if (els.drawerWhatsappBtn) els.drawerWhatsappBtn.href = whatsappLink;
  if (els.whatsappFloatingBtn) els.whatsappFloatingBtn.href = whatsappLink;

  if (els.drawerMapsBtn) els.drawerMapsBtn.href = s.maps || "#";
  if (els.mapsFloatingBtn) els.mapsFloatingBtn.href = s.maps || "#";

  if (els.displayAddress) els.displayAddress.textContent = s.addressText || "الموقع على خرائط جوجل";

  if (els.instagramDrawerBtn) els.instagramDrawerBtn.href = s.instagram || "#";
  if (els.facebookDrawerBtn) els.facebookDrawerBtn.href = s.facebook || "#";
  if (els.instagramFloatingBtn) els.instagramFloatingBtn.href = s.instagram || "#";
  if (els.facebookFloatingBtn) els.facebookFloatingBtn.href = s.facebook || "#";
}

/* =========================================================
   8) الفئات
========================================================= */
function renderQuickCategories() {
  if (!els.quickCategories) return;

  els.quickCategories.innerHTML = [
    `<button class="category-chip ${activeCategory === "all" ? "active" : ""}" data-category="all">عرض الكل</button>`,
    ...categories.map(cat => `
      <button class="category-chip ${activeCategory === cat.id ? "active" : ""}" data-category="${cat.id}">
        ${cat.name}
      </button>
    `)
  ].join("");
}

function bindCategoryEvents() {
  els.quickCategories?.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-chip");
    if (!btn) return;

    activeCategory = btn.dataset.category || "all";
    renderAllVisibleContent();
  });
}

/* =========================================================
   9) الفلتر الذكي
========================================================= */
function bindSmartFilterEvents() {
  document.querySelectorAll(".smart-filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".smart-filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSort = btn.dataset.sort || "default";
      renderAllVisibleContent();
    });
  });
}

/* =========================================================
   10) بناء بطاقة الوجبة
========================================================= */
function buildActionButton(meal) {
  if (meal.actionType === "select") {
    return `<div class="card-action select-btn">اختر</div>`;
  }

  return `
    <div class="card-action">
      <span>1</span>
      <span class="plus">+</span>
    </div>
  `;
}

function buildFoodCard(meal) {
  return `
    <article class="food-card" data-meal-id="${meal.id}">
      <div class="food-card-content">
        <div class="food-card-top">
          <h3>${meal.name}</h3>
          <p>${meal.description || ""}</p>
        </div>

        <div class="food-card-bottom">
          ${buildActionButton(meal)}

          <div class="card-price">
            ${meal.oldPrice ? `<del>${formatPrice(meal.oldPrice)}</del>` : ""}
            <strong><span>${formatPrice(meal.price)}</span> ليرة</strong>
          </div>
        </div>
      </div>

      <div class="food-card-image">
        <img
          src="${meal.imageUrl}"
          alt="${meal.name}"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      </div>
    </article>
  `;
}

/* =========================================================
   11) الفلترة السريعة
========================================================= */
function getCurrentMealsView() {
  const search = els.searchInput?.value.trim().toLowerCase() || "";

  let filtered = meals.filter((meal) => {
    const matchesCategory = activeCategory === "all" || meal.categoryId === activeCategory;
    const haystack = [
      meal.name,
      meal.description,
      ...(meal.ingredients || []),
      getCategoryName(meal.categoryId)
    ].join(" ").toLowerCase();

    return matchesCategory && (!search || haystack.includes(search));
  });

  if (currentSort === "price-asc") {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (currentSort === "price-desc") {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (currentSort === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }

  return filtered;
}

/* =========================================================
   12) الأكثر طلباً
========================================================= */
function renderFeaturedMeals(filteredMeals) {
  if (!els.featuredGrid) return;

  const featured = filteredMeals.filter(meal => meal.featured).slice(0, 3);
  const finalItems = featured.length ? featured : filteredMeals.slice(0, 3);

  if (!finalItems.length) {
    els.featuredGrid.innerHTML = `<div class="empty-state">لا توجد عناصر مميزة حاليًا.</div>`;
    return;
  }

  els.featuredGrid.innerHTML = finalItems.map(buildFoodCard).join("");
}

/* =========================================================
   13) القائمة الرئيسية
========================================================= */
function renderMeals(filteredMeals) {
  if (!els.menuGroups || !els.menuCounter) return;

  els.menuCounter.textContent = `${filteredMeals.length} وجبة متاحة`;

  if (!filteredMeals.length) {
    els.menuGroups.innerHTML = `<div class="empty-state">لا توجد نتائج مطابقة حاليًا.</div>`;
    return;
  }

  const visibleCategories =
    activeCategory === "all"
      ? categories
      : categories.filter(cat => cat.id === activeCategory);

  const grouped = visibleCategories
    .map(cat => ({
      ...cat,
      meals: filteredMeals.filter(meal => meal.categoryId === cat.id)
    }))
    .filter(group => group.meals.length);

  els.menuGroups.innerHTML = grouped.map(group => `
    <section class="category-block">
      <div>
        <h3 class="category-title">${group.name}</h3>
        <p class="category-note">${group.meals.length} وجبة ضمن هذا القسم</p>
      </div>

      <div class="category-meals">
        ${group.meals.map(buildFoodCard).join("")}
      </div>
    </section>
  `).join("");
}

/* =========================================================
   14) إعادة الرسم مرة واحدة فقط
========================================================= */
function renderAllVisibleContent() {
  renderQuickCategories();
  const filteredMeals = getCurrentMealsView();
  renderFeaturedMeals(filteredMeals);
  renderMeals(filteredMeals);
}

/* =========================================================
   15) نافذة التفاصيل
========================================================= */
function openMealModal(meal) {
  els.modalImage.src = meal.imageUrl;
  els.modalCategory.textContent = getCategoryName(meal.categoryId);
  els.modalName.textContent = meal.name;
  els.modalPrice.textContent = `${meal.price} ليرة`;
  els.modalDescription.textContent = meal.description || "لا يوجد وصف إضافي.";

  els.modalIngredients.innerHTML =
    Array.isArray(meal.ingredients) && meal.ingredients.length
      ? meal.ingredients.map(item => `<span class="tag">${item}</span>`).join("")
      : `<span class="tag">لا توجد مكونات محددة</span>`;

  const phone = normalizeSyrianWhatsappNumber(settings?.phone || FALLBACK_SETTINGS.phone);
  const message = buildWhatsappMessage(meal);

  els.orderWhatsappBtn.onclick = () => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  openPanel("mealModal");
}

function bindMealEvents() {
  document.addEventListener("click", (e) => {
    const area = e.target.closest(".food-card-image, .food-card");
    if (!area) return;

    const card = e.target.closest(".food-card");
    if (!card) return;

    const meal = meals.find(m => m.id === card.dataset.mealId);
    if (meal) openMealModal(meal);
  });
}

/* =========================================================
   16) التحميل المحلي السريع
========================================================= */
function init() {
  settings = FALLBACK_SETTINGS;
  categories = [...FALLBACK_CATEGORIES];
  meals = [...FALLBACK_MEALS];

  applySettingsToUI(settings);
  renderAllVisibleContent();
}

/* =========================================================
   17) البحث مع debounce
========================================================= */
let searchTimer;

els.searchInput?.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    renderAllVisibleContent();
  }, 180);
});

/* =========================================================
   18) بدء التشغيل
========================================================= */
bindCategoryEvents();
bindSmartFilterEvents();
bindMealEvents();
init();
