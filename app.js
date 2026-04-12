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

/* =========================
   1) حماية النسخ وزر اليمين
   نفعّلها أولًا حتى لا تتأثر لو حصل خطأ لاحق
========================= */
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
      () => {
        clearTimeout(pressTimer);
      },
      { passive: false }
    );
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "F12") {
      e.preventDefault();
    }
    if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) {
      e.preventDefault();
    }
    if (e.ctrlKey && e.key.toUpperCase() === "U") {
      e.preventDefault();
    }
  });
})();

/* =========================
   2) Firebase
========================= */
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

/* =========================
   3) Elements
========================= */
const els = {
  restaurantName: document.getElementById("restaurantName"),
  restaurantSubtitle: document.getElementById("restaurantSubtitle"),
  restaurantLogo: document.getElementById("restaurantLogo"),
  heroBanner: document.getElementById("heroBanner"),
  heroTitle: document.getElementById("heroTitle"),
  heroDescription: document.getElementById("heroDescription"),
  footerName: document.getElementById("footerName"),
  displayPhone: document.getElementById("displayPhone"),

  whatsappBtn: document.getElementById("whatsappBtn"),
  instagramBtn: document.getElementById("instagramBtn"),
  facebookBtn: document.getElementById("facebookBtn"),
  mapsBtn: document.getElementById("mapsBtn"),
  mapsInlineBtn: document.getElementById("mapsInlineBtn"),

  searchInput: document.getElementById("searchInput"),
  sortFilter: document.getElementById("sortFilter"),
  quickCategories: document.getElementById("quickCategories"),

  offersTrack: document.getElementById("offersTrack"),
  offersDots: document.getElementById("offersDots"),

  menuGroups: document.getElementById("menuGroups"),
  menuCounter: document.getElementById("menuCounter"),

  mealModal: document.getElementById("mealModal"),
  modalImage: document.getElementById("modalImage"),
  modalCategory: document.getElementById("modalCategory"),
  modalName: document.getElementById("modalName"),
  modalPrice: document.getElementById("modalPrice"),
  modalDescription: document.getElementById("modalDescription"),
  modalIngredients: document.getElementById("modalIngredients"),
  orderWhatsappBtn: document.getElementById("orderWhatsappBtn"),

  yearNow: document.getElementById("yearNow")
};

/* =========================
   4) State
========================= */
let settings = null;
let categories = [];
let meals = [];
let offers = [];
let activeCategory = "all";
let sliderIndex = 0;
let sliderTimer = null;

/* =========================
   5) بيانات احتياطية
========================= */
const FALLBACK_SETTINGS = {
  restaurantName: "فطاير ع طاير",
  subtitle: "للمعجنات والبيتزا",
  heroTitle: "جرّبونا لتعرفونا",
  heroDescription:
    "أشهى المعجنات والبيتزا والعروض اليومية، بطابع سريع وجذاب مع إمكانية الطلب المباشر عبر واتساب.",
  phone: "0983906667",
  whatsapp: "https://wa.me/0983906667",
  instagram: "#",
  facebook: "#",
  maps: "#",
  logoUrl: "https://images.unsplash.com/photo-1541544181051-e46607c3a54b?q=80&w=600&auto=format&fit=crop",
  bannerUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop"
};

const FALLBACK_CATEGORIES = [
  { id: "demo-cat-1", name: "معجنات", order: 1 },
  { id: "demo-cat-2", name: "بيتزا", order: 2 },
  { id: "demo-cat-3", name: "عروض", order: 3 }
];

const FALLBACK_MEALS = [
  {
    id: "demo-1",
    name: "قشقوان",
    price: 3.5,
    categoryId: "demo-cat-1",
    description: "فطيرة طازجة محشوة بجبنة القشقوان وتقدّم ساخنة.",
    ingredients: ["قشقوان", "عجين", "سمسم"],
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "demo-2",
    name: "بيتزا خضار",
    price: 8.9,
    categoryId: "demo-cat-2",
    description: "بيتزا شهية مع صلصة طماطم وجبنة وخضار طازجة.",
    ingredients: ["جبنة", "فليفلة", "زيتون"],
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "demo-3",
    name: "عرض العائلة",
    price: 14.9,
    categoryId: "demo-cat-3",
    description: "عرض مميز للعائلة مع أصناف متنوعة وسعر مناسب.",
    ingredients: ["معجنات", "بيتزا", "صلصات"],
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop"
  }
];

const FALLBACK_OFFERS = [
  {
    id: "offer-1",
    title: "عرض اليوم",
    badge: "خصم خاص",
    description: "خصم على بعض الأصناف المختارة لفترة محدودة.",
    imageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "offer-2",
    title: "عرض الأصدقاء",
    badge: "الأكثر طلبًا",
    description: "اشترِ أكثر واستفد من سعر أفضل ضمن العروض الحالية.",
    imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1200&auto=format&fit=crop"
  }
];

/* =========================
   6) Helpers
========================= */
if (els.yearNow) {
  els.yearNow.textContent = new Date().getFullYear();
}

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

  const anyOpen = document.querySelector(".modal.show");
  if (!anyOpen) {
    document.body.style.overflow = "";
  }
}

function formatPrice(price) {
  return `${Number(price || 0).toFixed(2)} €`;
}

function getCategoryName(categoryId) {
  return categories.find((c) => c.id === categoryId)?.name || "قسم غير معروف";
}

function phoneFromSettings() {
  const raw = settings?.phone || settings?.whatsapp || "";
  return String(raw).replace(/\D/g, "");
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

/* =========================
   7) Global Events
========================= */
document.addEventListener("click", (e) => {
  const closeId = e.target.getAttribute("data-close");
  if (closeId) closePanel(closeId);
});

/* =========================
   8) Apply settings to UI
========================= */
function applySettingsToUI(data) {
  const s = data || FALLBACK_SETTINGS;

  if (els.restaurantName) els.restaurantName.textContent = s.restaurantName || "فطاير ع طاير";
  if (els.restaurantSubtitle) els.restaurantSubtitle.textContent = s.subtitle || "للمعجنات والبيتزا";
  if (els.heroTitle) els.heroTitle.textContent = s.heroTitle || "جرّبونا لتعرفونا";
  if (els.heroDescription) {
    els.heroDescription.textContent =
      s.heroDescription ||
      "أشهى المعجنات والبيتزا والعروض اليومية، بطابع سريع وجذاب مع إمكانية الطلب المباشر عبر واتساب.";
  }
  if (els.footerName) els.footerName.textContent = s.restaurantName || "فطاير ع طاير";
  if (els.displayPhone) els.displayPhone.textContent = `📞 ${s.phone || "0983906667"}`;

  if (els.restaurantLogo) {
    els.restaurantLogo.src = s.logoUrl || FALLBACK_SETTINGS.logoUrl;
  }
  if (els.heroBanner) {
    els.heroBanner.src = s.bannerUrl || FALLBACK_SETTINGS.bannerUrl;
  }

  const whatsappUrl = s.whatsapp || "#";
  const instagramUrl = s.instagram || "#";
  const facebookUrl = s.facebook || "#";
  const mapsUrl = s.maps || "#";

  if (els.whatsappBtn) els.whatsappBtn.href = whatsappUrl;
  if (els.instagramBtn) els.instagramBtn.href = instagramUrl;
  if (els.facebookBtn) els.facebookBtn.href = facebookUrl;
  if (els.mapsBtn) els.mapsBtn.href = mapsUrl;
  if (els.mapsInlineBtn) els.mapsInlineBtn.href = mapsUrl;
}

/* =========================
   9) Categories
========================= */
function renderQuickCategories() {
  if (!els.quickCategories) return;

  const chips = [
    `<button class="category-chip ${activeCategory === "all" ? "active" : ""}" data-category="all">الكل</button>`,
    ...categories.map(
      (cat) => `
      <button class="category-chip ${activeCategory === cat.id ? "active" : ""}" data-category="${cat.id}">
        ${cat.name}
      </button>
    `
    )
  ];

  els.quickCategories.innerHTML = chips.join("");
}

function bindCategoryChipEvents() {
  if (!els.quickCategories) return;

  els.quickCategories.addEventListener("click", (e) => {
    const chip = e.target.closest(".category-chip");
    if (!chip) return;

    activeCategory = chip.dataset.category || "all";
    renderQuickCategories();
    renderMeals();
  });
}

/* =========================
   10) Meals
========================= */
function buildMealCard(meal) {
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients.slice(0, 3) : [];
  const image =
    meal.imageUrl ||
    "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop";

  return `
    <article class="meal-card" data-meal-id="${meal.id}">
      <img class="meal-image" src="${image}" alt="${meal.name}" />
      <div class="meal-body">
        <div class="meal-top">
          <h3 class="meal-name">${meal.name}</h3>
          <div class="meal-price">${formatPrice(meal.price)}</div>
        </div>
        <p class="meal-desc">${meal.description || ""}</p>
        <div class="tags">
          <span class="tag">${getCategoryName(meal.categoryId)}</span>
          ${ingredients.map((item) => `<span class="tag">${item}</span>`).join("")}
          ${meal.available === false ? `<span class="tag">غير متوفر</span>` : ""}
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
    ]
      .join(" ")
      .toLowerCase();

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
    els.menuGroups.innerHTML = `
      <div class="empty-state">
        لا توجد نتائج مطابقة حاليًا. جرّب كلمة بحث أخرى أو اختر فئة مختلفة.
      </div>
    `;
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
          <p class="category-note">${group.meals.length} وجبة ضمن هذا القسم</p>
        </div>
        <div class="meals-grid">
          ${group.meals.map(buildMealCard).join("")}
        </div>
      </section>
    `
    )
    .join("");
}

function openMealModal(meal) {
  if (!els.modalImage) return;

  els.modalImage.src =
    meal.imageUrl ||
    "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop";
  els.modalCategory.textContent = getCategoryName(meal.categoryId);
  els.modalName.textContent = meal.name;
  els.modalPrice.textContent = formatPrice(meal.price);
  els.modalDescription.textContent = meal.description || "لا يوجد وصف إضافي.";

  els.modalIngredients.innerHTML =
    Array.isArray(meal.ingredients) && meal.ingredients.length
      ? meal.ingredients.map((item) => `<span class="tag">${item}</span>`).join("")
      : `<span class="tag">لا توجد مكونات محددة</span>`;

  if (els.orderWhatsappBtn) {
    const phone = phoneFromSettings();
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
    const card = e.target.closest(".meal-card");
    if (!card) return;

    const meal = meals.find((m) => m.id === card.dataset.mealId);
    if (meal) openMealModal(meal);
  });
}

/* =========================
   11) Offers slider
========================= */
function renderOffers() {
  if (!els.offersTrack || !els.offersDots) return;

  if (!offers.length) {
    els.offersTrack.innerHTML = `
      <div class="slide">
        <div class="slide-body">
          <span class="badge">لا توجد عروض بعد</span>
          <h3 class="slide-title">يمكنك إضافة عروض لاحقًا</h3>
          <p class="slide-text">ستظهر هنا البطاقات الترويجية الخاصة بالمطعم.</p>
        </div>
        <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop" alt="عرض افتراضي" />
      </div>
    `;
    els.offersDots.innerHTML = "";
    return;
  }

  els.offersTrack.innerHTML = offers
    .map(
      (offer) => `
      <div class="slide">
        <div class="slide-body">
          <span class="badge">${offer.badge || "عرض خاص"}</span>
          <h3 class="slide-title">${offer.title}</h3>
          <p class="slide-text">${offer.description || ""}</p>
        </div>
        <img src="${offer.imageUrl}" alt="${offer.title}" />
      </div>
    `
    )
    .join("");

  els.offersDots.innerHTML = offers
    .map(
      (_, idx) => `<button class="dot ${idx === sliderIndex ? "active" : ""}" data-dot-index="${idx}"></button>`
    )
    .join("");

  moveSlider(sliderIndex, false);
  startSlider();
}

function moveSlider(index, animate = true) {
  if (!offers.length || !els.offersTrack || !els.offersDots) return;

  sliderIndex = (index + offers.length) % offers.length;
  els.offersTrack.style.transition = animate ? "transform .45s ease" : "none";
  els.offersTrack.style.transform = `translateX(${sliderIndex * -100}%)`;

  els.offersDots.querySelectorAll(".dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === sliderIndex);
  });
}

function startSlider() {
  clearInterval(sliderTimer);
  if (offers.length <= 1) return;

  sliderTimer = setInterval(() => {
    moveSlider(sliderIndex + 1);
  }, 4200);
}

function bindSliderDots() {
  document.addEventListener("click", (e) => {
    const dot = e.target.closest(".dot");
    if (!dot) return;

    moveSlider(Number(dot.dataset.dotIndex));
    startSlider();
  });
}

/* =========================
   12) Load data
========================= */
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

async function loadOffers() {
  try {
    const snap = await getDocs(query(collection(db, "offers"), orderBy("createdAt", "desc")));
    offers = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
    if (!offers.length) offers = [...FALLBACK_OFFERS];
  } catch {
    offers = [...FALLBACK_OFFERS];
  }

  renderOffers();
}

async function loadMeals() {
  try {
    const snap = await getDocs(query(collection(db, "meals"), orderBy("createdAt", "desc")));
    meals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!meals.length) meals = [...FALLBACK_MEALS];
  } catch {
    meals = [...FALLBACK_MEALS];
  }

  renderMeals();
}

async function init() {
  await loadSettings();
  await loadCategories();
  await loadOffers();
  await loadMeals();
}

/* =========================
   13) Search + sort
========================= */
if (els.searchInput) {
  els.searchInput.addEventListener("input", renderMeals);
}

if (els.sortFilter) {
  els.sortFilter.addEventListener("change", renderMeals);
}

/* =========================
   14) Start
========================= */
bindCategoryChipEvents();
bindMealEvents();
bindSliderDots();
init();
