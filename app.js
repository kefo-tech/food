import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "PUT_YOUR_API_KEY",
  authDomain: "PUT_YOUR_AUTH_DOMAIN",
  projectId: "PUT_YOUR_PROJECT_ID",
  storageBucket: "PUT_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PUT_YOUR_MESSAGING_SENDER_ID",
  appId: "PUT_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const els = {
  restaurantName: document.getElementById("restaurantName"),
  restaurantSubtitle: document.getElementById("restaurantSubtitle"),
  restaurantLogo: document.getElementById("restaurantLogo"),
  heroBanner: document.getElementById("heroBanner"),
  heroTitle: document.getElementById("heroTitle"),
  heroDescription: document.getElementById("heroDescription"),
  footerName: document.getElementById("footerName"),
  whatsappBtn: document.getElementById("whatsappBtn"),
  instagramBtn: document.getElementById("instagramBtn"),
  facebookBtn: document.getElementById("facebookBtn"),
  mapsBtn: document.getElementById("mapsBtn"),
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
  adminPanel: document.getElementById("adminPanel"),
  openAdminBtn: document.getElementById("openAdminBtn"),
  adminEmail: document.getElementById("adminEmail"),
  adminPassword: document.getElementById("adminPassword"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  adminContent: document.getElementById("adminContent"),
  statusBox: document.getElementById("statusBox"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  settingRestaurantName: document.getElementById("settingRestaurantName"),
  settingSubtitle: document.getElementById("settingSubtitle"),
  settingLogoUrl: document.getElementById("settingLogoUrl"),
  settingBannerUrl: document.getElementById("settingBannerUrl"),
  settingWhatsapp: document.getElementById("settingWhatsapp"),
  settingInstagram: document.getElementById("settingInstagram"),
  settingFacebook: document.getElementById("settingFacebook"),
  settingMaps: document.getElementById("settingMaps"),
  categoryNameInput: document.getElementById("categoryNameInput"),
  categoryOrderInput: document.getElementById("categoryOrderInput"),
  addCategoryBtn: document.getElementById("addCategoryBtn"),
  categoriesAdminList: document.getElementById("categoriesAdminList"),
  offerTitleInput: document.getElementById("offerTitleInput"),
  offerBadgeInput: document.getElementById("offerBadgeInput"),
  offerDescriptionInput: document.getElementById("offerDescriptionInput"),
  offerImageInput: document.getElementById("offerImageInput"),
  addOfferBtn: document.getElementById("addOfferBtn"),
  offersAdminList: document.getElementById("offersAdminList"),
  mealNameInput: document.getElementById("mealNameInput"),
  mealPriceInput: document.getElementById("mealPriceInput"),
  mealCategoryInput: document.getElementById("mealCategoryInput"),
  mealDescriptionInput: document.getElementById("mealDescriptionInput"),
  mealIngredientsInput: document.getElementById("mealIngredientsInput"),
  mealImageInput: document.getElementById("mealImageInput"),
  mealAvailabilityInput: document.getElementById("mealAvailabilityInput"),
  addMealBtn: document.getElementById("addMealBtn"),
  mealsAdminList: document.getElementById("mealsAdminList")
};

let settings = null;
let categories = [];
let meals = [];
let offers = [];
let activeCategory = "all";
let sliderIndex = 0;
let sliderTimer = null;

const FALLBACK_MEALS = [
  {
    id: "demo-1",
    name: "فطيرة جبنة",
    price: 3.5,
    categoryId: "demo-cat-1",
    description: "فطيرة طازجة محشوة بالجبنة وتقدم ساخنة.",
    ingredients: ["جبنة", "عجين", "سمسم"],
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "demo-2",
    name: "بيتزا خضار",
    price: 8.9,
    categoryId: "demo-cat-2",
    description: "بيتزا مخبوزة مع صلصة طماطم وجبنة وخضار طازجة.",
    ingredients: ["جبنة", "فليفلة", "زيتون"],
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "demo-3",
    name: "بوكس عرض عائلي",
    price: 14.9,
    categoryId: "demo-cat-3",
    description: "عرض متنوع مناسب للعائلة مع أصناف مختارة.",
    ingredients: ["معجنات", "صلصات", "مشروبات"],
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop"
  }
];

const FALLBACK_CATEGORIES = [
  { id: "demo-cat-1", name: "معجنات", order: 1 },
  { id: "demo-cat-2", name: "بيتزا", order: 2 },
  { id: "demo-cat-3", name: "عروض", order: 3 }
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
    title: "بوكس العائلة",
    badge: "الأكثر طلبًا",
    description: "مجموعة متنوعة مناسبة للعائلة بسعر مميز.",
    imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1200&auto=format&fit=crop"
  }
];

function showStatus(message, isError = false) {
  els.statusBox.textContent = message;
  els.statusBox.classList.remove("error");
  if (isError) els.statusBox.classList.add("error");
  els.statusBox.style.display = "block";
  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(() => {
    els.statusBox.style.display = "none";
  }, 3500);
}

function formatPrice(price) {
  return `${Number(price || 0).toFixed(2)} €`;
}

function openPanel(id) {
  document.getElementById(id).classList.add("show");
  document.body.style.overflow = "hidden";
}

function closePanel(id) {
  document.getElementById(id).classList.remove("show");
  if (![...document.querySelectorAll(".modal.show, .admin-panel.show")].length) {
    document.body.style.overflow = "";
  }
}

document.addEventListener("click", (e) => {
  const closeId = e.target.getAttribute("data-close");
  if (closeId) closePanel(closeId);
});

els.openAdminBtn.addEventListener("click", () => openPanel("adminPanel"));
document.getElementById("yearNow").textContent = new Date().getFullYear();

function applySettingsToUI(data) {
  const s = data || {};
  els.restaurantName.textContent = s.restaurantName || "اسم المطعم";
  els.restaurantSubtitle.textContent = s.subtitle || "أشهى الوجبات الطازجة يوميًا";
  els.heroTitle.textContent = s.heroTitle || "قائمة طعام رقمية أنيقة وسريعة";
  els.heroDescription.textContent = s.heroDescription || "تصفح الأصناف بسهولة، وابحث عن وجبتك المفضلة، وافتح تفاصيل كل وجبة ضمن بطاقة جميلة تعرض الصورة والاسم والسعر والتفاصيل والمكونات.";
  els.footerName.textContent = s.restaurantName || "اسم المطعم";
  if (s.logoUrl) els.restaurantLogo.src = s.logoUrl;
  if (s.bannerUrl) els.heroBanner.src = s.bannerUrl;
  els.whatsappBtn.href = s.whatsapp || "#";
  els.instagramBtn.href = s.instagram || "#";
  els.facebookBtn.href = s.facebook || "#";
  els.mapsBtn.href = s.maps || "#";
  els.settingRestaurantName.value = s.restaurantName || "";
  els.settingSubtitle.value = s.subtitle || "";
  els.settingLogoUrl.value = s.logoUrl || "";
  els.settingBannerUrl.value = s.bannerUrl || "";
  els.settingWhatsapp.value = s.whatsapp || "";
  els.settingInstagram.value = s.instagram || "";
  els.settingFacebook.value = s.facebook || "";
  els.settingMaps.value = s.maps || "";
}

function getCategoryName(categoryId) {
  return categories.find((c) => c.id === categoryId)?.name || "قسم غير معروف";
}

function renderQuickCategories() {
  const chips = ['<button class="category-chip active" data-category="all">الكل</button>']
    .concat(categories.map((cat) => `<button class="category-chip" data-category="${cat.id}">${cat.name}</button>`));
  els.quickCategories.innerHTML = chips.join("");
}

function renderCategoryInputs() {
  els.mealCategoryInput.innerHTML = categories.length
    ? categories.map((cat) => `<option value="${cat.id}">${cat.name}</option>`).join("")
    : '<option value="">أضف قسمًا أولًا</option>';
}

function buildMealCard(meal) {
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients.slice(0, 3) : [];
  return `
    <article class="meal-card" data-meal-id="${meal.id}">
      <img class="meal-image" src="${meal.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop"}" alt="${meal.name}" />
      <div class="meal-body">
        <div class="meal-top">
          <h3 class="meal-name">${meal.name}</h3>
          <div class="meal-price">${formatPrice(meal.price)}</div>
        </div>
        <p class="meal-desc">${meal.description || ""}</p>
        <div class="tags">
          <span class="tag">${getCategoryName(meal.categoryId)}</span>
          ${ingredients.map((item) => `<span class="tag">${item}</span>`).join("")}
          ${meal.available === false ? '<span class="tag">غير متوفر</span>' : ""}
        </div>
      </div>
    </article>
  `;
}

function getFilteredMeals() {
  const search = els.searchInput.value.trim().toLowerCase();
  const sort = els.sortFilter.value;
  let filtered = meals.filter((meal) => {
    const matchesCategory = activeCategory === "all" || meal.categoryId === activeCategory;
    const haystack = [meal.name, meal.description, ...(meal.ingredients || []), getCategoryName(meal.categoryId)].join(" ").toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    return matchesCategory && matchesSearch;
  });

  if (sort === "price-asc") filtered.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "price-desc") filtered.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  return filtered;
}

function renderMeals() {
  const filteredMeals = getFilteredMeals();
  els.menuCounter.textContent = `${filteredMeals.length} وجبة متاحة للعرض`;

  if (!filteredMeals.length) {
    els.menuGroups.innerHTML = '<div class="empty-state">لا توجد نتائج مطابقة حاليًا. جرّب كلمة بحث أخرى أو اختر فئة مختلفة.</div>';
    return;
  }

  const grouped = (activeCategory === "all" ? categories : categories.filter((cat) => cat.id === activeCategory))
    .map((cat) => ({ ...cat, meals: filteredMeals.filter((meal) => meal.categoryId === cat.id) }))
    .filter((group) => group.meals.length);

  els.menuGroups.innerHTML = grouped.map((group) => `
    <section class="category-block">
      <div>
        <h3 class="category-title">${group.name}</h3>
        <p class="category-note">${group.meals.length} وجبة ضمن هذا القسم</p>
      </div>
      <div class="meals-grid">
        ${group.meals.map(buildMealCard).join("")}
      </div>
    </section>
  `).join("");
}

function renderOffers() {
  if (!offers.length) {
    els.offersTrack.innerHTML = `
      <div class="slide">
        <div class="slide-body">
          <span class="badge">لا توجد عروض بعد</span>
          <h3 class="slide-title">يمكنك إضافة عروض من لوحة الإدارة</h3>
          <p class="slide-text">كل عرض يمكن أن يحتوي على صورة وعنوان ووصف مختصر.</p>
        </div>
        <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop" alt="عرض افتراضي" />
      </div>`;
    els.offersDots.innerHTML = "";
    return;
  }

  els.offersTrack.innerHTML = offers.map((offer) => `
    <div class="slide">
      <div class="slide-body">
        <span class="badge">${offer.badge || "عرض خاص"}</span>
        <h3 class="slide-title">${offer.title}</h3>
        <p class="slide-text">${offer.description || ""}</p>
      </div>
      <img src="${offer.imageUrl}" alt="${offer.title}" />
    </div>`).join("");

  els.offersDots.innerHTML = offers.map((_, idx) => `<button class="dot ${idx === sliderIndex ? "active" : ""}" data-dot-index="${idx}"></button>`).join("");
  moveSlider(sliderIndex, false);
  startSlider();
}

function moveSlider(index, animate = true) {
  if (!offers.length) return;
  sliderIndex = (index + offers.length) % offers.length;
  els.offersTrack.style.transition = animate ? "transform .45s ease" : "none";
  els.offersTrack.style.transform = `translateX(${sliderIndex * -100}%)`;
  [...els.offersDots.querySelectorAll(".dot")].forEach((dot, i) => {
    dot.classList.toggle("active", i === sliderIndex);
  });
}

function startSlider() {
  clearInterval(sliderTimer);
  if (offers.length <= 1) return;
  sliderTimer = setInterval(() => moveSlider(sliderIndex + 1), 4200);
}

function bindCategoryChipEvents() {
  els.quickCategories.addEventListener("click", (e) => {
    const chip = e.target.closest(".category-chip");
    if (!chip) return;
    activeCategory = chip.dataset.category;
    [...els.quickCategories.querySelectorAll(".category-chip")].forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    renderMeals();
  });
}

function bindMealAndSliderEvents() {
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".meal-card");
    if (card) {
      const meal = meals.find((m) => m.id === card.dataset.mealId);
      if (!meal) return;
      els.modalImage.src = meal.imageUrl || "";
      els.modalCategory.textContent = getCategoryName(meal.categoryId);
      els.modalName.textContent = meal.name;
      els.modalPrice.textContent = formatPrice(meal.price);
      els.modalDescription.textContent = meal.description || "لا يوجد وصف إضافي.";
      els.modalIngredients.innerHTML = (meal.ingredients || []).length
        ? meal.ingredients.map((item) => `<span class="tag">${item}</span>`).join("")
        : '<span class="tag">لا توجد مكونات محددة</span>';
      openPanel("mealModal");
    }

    const dot = e.target.closest(".dot");
    if (dot) {
      moveSlider(Number(dot.dataset.dotIndex));
      startSlider();
    }
  });
}

function renderAdminCategories() {
  if (!categories.length) {
    els.categoriesAdminList.innerHTML = '<div class="empty-state">لا توجد أقسام بعد.</div>';
    return;
  }
  els.categoriesAdminList.innerHTML = categories.map((cat) => `
    <div class="admin-item">
      <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop" alt="${cat.name}" />
      <div>
        <h4>${cat.name}</h4>
        <p>الترتيب: ${cat.order ?? 0}</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-danger" data-delete-category="${cat.id}">حذف</button>
      </div>
    </div>`).join("");
}

function renderAdminOffers() {
  if (!offers.length) {
    els.offersAdminList.innerHTML = '<div class="empty-state">لا توجد عروض بعد.</div>';
    return;
  }
  els.offersAdminList.innerHTML = offers.map((item) => `
    <div class="admin-item">
      <img src="${item.imageUrl}" alt="${item.title}" />
      <div>
        <h4>${item.title}</h4>
        <p>${item.badge || "عرض"} — ${item.description || ""}</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-danger" data-delete-offer="${item.id}" data-image-path="${item.storagePath || ""}">حذف</button>
      </div>
    </div>`).join("");
}

function renderAdminMeals() {
  if (!meals.length) {
    els.mealsAdminList.innerHTML = '<div class="empty-state">لا توجد وجبات بعد.</div>';
    return;
  }
  els.mealsAdminList.innerHTML = meals.map((item) => `
    <div class="admin-item">
      <img src="${item.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop"}" alt="${item.name}" />
      <div>
        <h4>${item.name} — ${formatPrice(item.price)}</h4>
        <p>${getCategoryName(item.categoryId)} • ${item.available === false ? "غير متوفر" : "متوفر"}<br>${item.description || ""}</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-danger" data-delete-meal="${item.id}" data-image-path="${item.storagePath || ""}">حذف</button>
      </div>
    </div>`).join("");
}

async function uploadImage(file, folder) {
  const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const storagePath = `${folder}/${safeName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, storagePath };
}

async function loadSettings() {
  const snap = await getDoc(doc(db, "settings", "main"));
  settings = snap.exists() ? snap.data() : null;
  applySettingsToUI(settings);
}

async function loadCategories() {
  const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
  categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!categories.length) categories = [...FALLBACK_CATEGORIES];
  renderQuickCategories();
  renderCategoryInputs();
  renderAdminCategories();
}

async function loadOffers() {
  const snap = await getDocs(query(collection(db, "offers"), orderBy("createdAt", "desc")));
  offers = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
  if (!offers.length) offers = [...FALLBACK_OFFERS];
  renderOffers();
  renderAdminOffers();
}

async function loadMeals() {
  const snap = await getDocs(query(collection(db, "meals"), orderBy("createdAt", "desc")));
  meals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!meals.length) meals = [...FALLBACK_MEALS];
  renderMeals();
  renderAdminMeals();
}

async function loadAll() {
  try {
    await Promise.all([loadSettings(), loadCategories(), loadOffers(), loadMeals()]);
  } catch (error) {
    console.error(error);
    categories = [...FALLBACK_CATEGORIES];
    meals = [...FALLBACK_MEALS];
    offers = [...FALLBACK_OFFERS];
    renderQuickCategories();
    renderCategoryInputs();
    renderMeals();
    renderOffers();
    renderAdminCategories();
    renderAdminOffers();
    renderAdminMeals();
  }
}

els.searchInput.addEventListener("input", renderMeals);
els.sortFilter.addEventListener("change", renderMeals);

els.loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, els.adminEmail.value.trim(), els.adminPassword.value);
    showStatus("تم تسجيل الدخول بنجاح.");
  } catch (error) {
    console.error(error);
    showStatus("فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.", true);
  }
});

els.logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  showStatus("تم تسجيل الخروج.");
});

onAuthStateChanged(auth, (user) => {
  const loggedIn = !!user;
  els.adminContent.classList.toggle("hidden", !loggedIn);
  els.logoutBtn.classList.toggle("hidden", !loggedIn);
});

els.saveSettingsBtn.addEventListener("click", async () => {
  try {
    const payload = {
      restaurantName: els.settingRestaurantName.value.trim(),
      subtitle: els.settingSubtitle.value.trim(),
      logoUrl: els.settingLogoUrl.value.trim(),
      bannerUrl: els.settingBannerUrl.value.trim(),
      whatsapp: els.settingWhatsapp.value.trim(),
      instagram: els.settingInstagram.value.trim(),
      facebook: els.settingFacebook.value.trim(),
      maps: els.settingMaps.value.trim(),
      heroTitle: "قائمة طعام رقمية أنيقة وسريعة",
      heroDescription: "تصفح الأصناف بسهولة، وابحث عن وجبتك المفضلة، وافتح تفاصيل كل وجبة ضمن بطاقة جميلة تعرض الصورة والاسم والسعر والتفاصيل والمكونات."
    };
    await setDoc(doc(db, "settings", "main"), payload, { merge: true });
    settings = payload;
    applySettingsToUI(payload);
    showStatus("تم حفظ إعدادات المطعم.");
  } catch (error) {
    console.error(error);
    showStatus("تعذر حفظ الإعدادات.", true);
  }
});

els.addCategoryBtn.addEventListener("click", async () => {
  const name = els.categoryNameInput.value.trim();
  const order = Number(els.categoryOrderInput.value || 0);
  if (!name) return showStatus("أدخل اسم القسم أولًا.", true);
  try {
    await addDoc(collection(db, "categories"), { name, order, createdAt: serverTimestamp() });
    els.categoryNameInput.value = "";
    els.categoryOrderInput.value = "";
    await loadCategories();
    renderMeals();
    showStatus("تمت إضافة القسم.");
  } catch (error) {
    console.error(error);
    showStatus("تعذر إضافة القسم.", true);
  }
});

els.addOfferBtn.addEventListener("click", async () => {
  const title = els.offerTitleInput.value.trim();
  const badge = els.offerBadgeInput.value.trim();
  const description = els.offerDescriptionInput.value.trim();
  const file = els.offerImageInput.files[0];
  if (!title || !file) return showStatus("أدخل عنوان العرض واختر صورة.", true);
  try {
    const uploaded = await uploadImage(file, "offers");
    await addDoc(collection(db, "offers"), {
      title,
      badge,
      description,
      imageUrl: uploaded.url,
      storagePath: uploaded.storagePath,
      createdAt: serverTimestamp()
    });
    els.offerTitleInput.value = "";
    els.offerBadgeInput.value = "";
    els.offerDescriptionInput.value = "";
    els.offerImageInput.value = "";
    await loadOffers();
    showStatus("تم رفع العرض إلى السلايدر.");
  } catch (error) {
    console.error(error);
    showStatus("تعذر رفع العرض.", true);
  }
});

els.addMealBtn.addEventListener("click", async () => {
  const name = els.mealNameInput.value.trim();
  const price = Number(els.mealPriceInput.value || 0);
  const categoryId = els.mealCategoryInput.value;
  const description = els.mealDescriptionInput.value.trim();
  const ingredients = els.mealIngredientsInput.value.split(",").map((i) => i.trim()).filter(Boolean);
  const available = els.mealAvailabilityInput.value === "true";
  const file = els.mealImageInput.files[0];
  if (!name || !price || !categoryId || !file) {
    return showStatus("أدخل اسم الوجبة والسعر والقسم والصورة.", true);
  }
  try {
    const uploaded = await uploadImage(file, "meals");
    await addDoc(collection(db, "meals"), {
      name,
      price,
      categoryId,
      description,
      ingredients,
      available,
      imageUrl: uploaded.url,
      storagePath: uploaded.storagePath,
      createdAt: serverTimestamp()
    });
    els.mealNameInput.value = "";
    els.mealPriceInput.value = "";
    els.mealDescriptionInput.value = "";
    els.mealIngredientsInput.value = "";
    els.mealImageInput.value = "";
    els.mealAvailabilityInput.value = "true";
    await loadMeals();
    showStatus("تمت إضافة الوجبة بنجاح.");
  } catch (error) {
    console.error(error);
    showStatus("تعذر رفع الوجبة.", true);
  }
});

document.addEventListener("click", async (e) => {
  const deleteCategoryId = e.target.getAttribute("data-delete-category");
  if (deleteCategoryId) {
    try {
      await deleteDoc(doc(db, "categories", deleteCategoryId));
      await loadCategories();
      renderMeals();
      showStatus("تم حذف القسم.");
    } catch (error) {
      console.error(error);
      showStatus("تعذر حذف القسم.", true);
    }
  }

  const deleteMealId = e.target.getAttribute("data-delete-meal");
  if (deleteMealId) {
    const imagePath = e.target.getAttribute("data-image-path");
    try {
      await deleteDoc(doc(db, "meals", deleteMealId));
      if (imagePath) {
        try { await deleteObject(ref(storage, imagePath)); } catch (_) {}
      }
      await loadMeals();
      showStatus("تم حذف الوجبة.");
    } catch (error) {
      console.error(error);
      showStatus("تعذر حذف الوجبة.", true);
    }
  }

  const deleteOfferId = e.target.getAttribute("data-delete-offer");
  if (deleteOfferId) {
    const imagePath = e.target.getAttribute("data-image-path");
    try {
      await deleteDoc(doc(db, "offers", deleteOfferId));
      if (imagePath) {
        try { await deleteObject(ref(storage, imagePath)); } catch (_) {}
      }
      await loadOffers();
      showStatus("تم حذف العرض.");
    } catch (error) {
      console.error(error);
      showStatus("تعذر حذف العرض.", true);
    }
  }
});

function blockCopyActions() {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("dragstart", (e) => e.preventDefault());
  document.addEventListener("copy", (e) => e.preventDefault());
  document.addEventListener("cut", (e) => e.preventDefault());
  document.addEventListener("selectstart", (e) => {
    const allowed = e.target.closest("input, textarea");
    if (!allowed) e.preventDefault();
  });
  let pressTimer;
  document.addEventListener("touchstart", (e) => {
    const allowed = e.target.closest("input, textarea");
    if (allowed) return;
    pressTimer = setTimeout(() => e.preventDefault(), 500);
  }, { passive: false });
  ["touchend", "touchmove", "touchcancel"].forEach((eventName) => {
    document.addEventListener(eventName, () => clearTimeout(pressTimer), { passive: false });
  });
}

bindCategoryChipEvents();
bindMealAndSliderEvents();
blockCopyActions();
await loadAll();
