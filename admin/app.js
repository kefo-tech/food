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
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
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

/* =========================================================
   1) إعداد Firebase
   ضع بيانات مشروعك هنا
========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyBrZ_bjKn_4docfkAbqRRmr-uFKN0DHo2c",
  authDomain: "restaurant-menu-b06cc.firebaseapp.com",
  projectId: "restaurant-menu-b06cc",
  storageBucket: "restaurant-menu-b06cc.firebasestorage.app",
  messagingSenderId: "1035129331473",
  appId: "1:1035129331473:web:4a4141ce29e80e2d72b6b0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* =========================================================
   2) عناصر الصفحة
========================================================= */
const els = {
  navButtons: document.querySelectorAll(".nav-btn"),
  sections: document.querySelectorAll(".panel-section"),

  adminEmail: document.getElementById("adminEmail"),
  adminPassword: document.getElementById("adminPassword"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  adminContent: document.getElementById("adminContent"),
  statusBox: document.getElementById("statusBox"),

  restaurantNameInput: document.getElementById("restaurantNameInput"),
  restaurantSubtitleInput: document.getElementById("restaurantSubtitleInput"),
  aboutTextInput: document.getElementById("aboutTextInput"),
  addressTextInput: document.getElementById("addressTextInput"),
  logoFileInput: document.getElementById("logoFileInput"),
  logoUrlInput: document.getElementById("logoUrlInput"),
  uploadLogoBtn: document.getElementById("uploadLogoBtn"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),

  categoryNameInput: document.getElementById("categoryNameInput"),
  categoryOrderInput: document.getElementById("categoryOrderInput"),
  addCategoryBtn: document.getElementById("addCategoryBtn"),
  categoriesList: document.getElementById("categoriesList"),

  mealNameInput: document.getElementById("mealNameInput"),
  mealCategoryInput: document.getElementById("mealCategoryInput"),
  mealPriceInput: document.getElementById("mealPriceInput"),
  mealOldPriceInput: document.getElementById("mealOldPriceInput"),
  mealIngredientsInput: document.getElementById("mealIngredientsInput"),
  mealActionTypeInput: document.getElementById("mealActionTypeInput"),
  mealFeaturedInput: document.getElementById("mealFeaturedInput"),
  mealImageFileInput: document.getElementById("mealImageFileInput"),
  mealDescriptionInput: document.getElementById("mealDescriptionInput"),
  mealImageUrlInput: document.getElementById("mealImageUrlInput"),
  uploadMealImageBtn: document.getElementById("uploadMealImageBtn"),
  addMealBtn: document.getElementById("addMealBtn"),
  mealsList: document.getElementById("mealsList"),

  phoneInput: document.getElementById("phoneInput"),
  instagramInput: document.getElementById("instagramInput"),
  facebookInput: document.getElementById("facebookInput"),
  mapsInput: document.getElementById("mapsInput"),
  saveContactBtn: document.getElementById("saveContactBtn")
};

/* =========================================================
   3) الحالة العامة
========================================================= */
let settings = {};
let categories = [];
let meals = [];

/* =========================================================
   4) أدوات مساعدة
========================================================= */
function showStatus(message, isError = false) {
  if (!els.statusBox) return;
  els.statusBox.textContent = message;
  els.statusBox.classList.remove("error");
  if (isError) els.statusBox.classList.add("error");
  els.statusBox.style.display = "block";

  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(() => {
    els.statusBox.style.display = "none";
  }, 3500);
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

function safeArrayFromCSV(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fillSettingsForm(data) {
  els.restaurantNameInput.value = data.restaurantName || "";
  els.restaurantSubtitleInput.value = data.subtitle || "";
  els.aboutTextInput.value = data.aboutText || "";
  els.addressTextInput.value = data.addressText || "";
  els.logoUrlInput.value = data.logoUrl || "";
  els.phoneInput.value = data.phone || "";
  els.instagramInput.value = data.instagram || "";
  els.facebookInput.value = data.facebook || "";
  els.mapsInput.value = data.maps || "";
}

function renderCategorySelect() {
  if (!categories.length) {
    els.mealCategoryInput.innerHTML = `<option value="">أضف قسمًا أولًا</option>`;
    return;
  }

  els.mealCategoryInput.innerHTML = categories
    .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
    .join("");
}

function getCategoryName(categoryId) {
  return categories.find((c) => c.id === categoryId)?.name || "قسم غير معروف";
}

async function uploadImage(file, folder) {
  const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const storagePath = `${folder}/${safeName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, storagePath };
}

/* =========================================================
   5) التنقل بين أقسام اللوحة
========================================================= */
els.navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    els.navButtons.forEach((b) => b.classList.remove("active"));
    els.sections.forEach((section) => section.classList.remove("active-section"));

    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.target);
    if (target) target.classList.add("active-section");
  });
});

/* =========================================================
   6) المصادقة
========================================================= */
els.loginBtn?.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      els.adminEmail.value.trim(),
      els.adminPassword.value
    );
    showStatus("تم تسجيل الدخول بنجاح.");
  } catch (error) {
    console.error(error);
    showStatus("فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.", true);
  }
});

els.logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showStatus("تم تسجيل الخروج.");
  } catch (error) {
    console.error(error);
    showStatus("تعذر تسجيل الخروج.", true);
  }
});

onAuthStateChanged(auth, async (user) => {
  const loggedIn = !!user;
  els.adminContent.classList.toggle("hidden", !loggedIn);
  els.logoutBtn.classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    await loadAll();
  }
});

/* =========================================================
   7) إعدادات المطعم الأساسية
========================================================= */
els.uploadLogoBtn?.addEventListener("click", async () => {
  const file = els.logoFileInput.files?.[0];
  if (!file) {
    showStatus("اختر صورة الشعار أولًا.", true);
    return;
  }

  try {
    const uploaded = await uploadImage(file, "restaurant/logo");
    els.logoUrlInput.value = uploaded.url;
    showStatus("تم رفع الشعار بنجاح.");
  } catch (error) {
    console.error(error);
    showStatus("تعذر رفع الشعار.", true);
  }
});

els.saveSettingsBtn?.addEventListener("click", async () => {
  try {
    const payload = {
      restaurantName: els.restaurantNameInput.value.trim(),
      subtitle: els.restaurantSubtitleInput.value.trim(),
      aboutText: els.aboutTextInput.value.trim(),
      addressText: els.addressTextInput.value.trim(),
      logoUrl: els.logoUrlInput.value.trim(),
      phone: els.phoneInput.value.trim(),
      instagram: els.instagramInput.value.trim(),
      facebook: els.facebookInput.value.trim(),
      maps: els.mapsInput.value.trim(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "settings", "main"), payload, { merge: true });
    settings = { ...settings, ...payload };
    showStatus("تم حفظ إعدادات المطعم بنجاح.");
  } catch (error) {
    console.error(error);
    showStatus("تعذر حفظ إعدادات المطعم.", true);
  }
});

/* =========================================================
   8) بيانات التواصل والخريطة
========================================================= */
els.saveContactBtn?.addEventListener("click", async () => {
  try {
    const payload = {
      phone: els.phoneInput.value.trim(),
      instagram: els.instagramInput.value.trim(),
      facebook: els.facebookInput.value.trim(),
      maps: els.mapsInput.value.trim(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "settings", "main"), payload, { merge: true });
    settings = { ...settings, ...payload };
    showStatus("تم حفظ بيانات التواصل والخريطة.");
  } catch (error) {
    console.error(error);
    showStatus("تعذر حفظ بيانات التواصل.", true);
  }
});

/* =========================================================
   9) الأقسام
========================================================= */
function renderCategoriesList() {
  if (!categories.length) {
    els.categoriesList.innerHTML = `<div class="panel-card">لا توجد أقسام بعد.</div>`;
    return;
  }

  els.categoriesList.innerHTML = categories
    .map(
      (cat) => `
      <div class="list-item">
        <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop" alt="${cat.name}" />
        <div class="item-meta">
          <h5>${cat.name}</h5>
          <p>الترتيب: ${cat.order ?? 0}</p>
        </div>
        <div class="item-actions">
          <button class="btn btn-danger" data-delete-category="${cat.id}">حذف</button>
        </div>
      </div>
    `
    )
    .join("");
}

els.addCategoryBtn?.addEventListener("click", async () => {
  const name = els.categoryNameInput.value.trim();
  const order = Number(els.categoryOrderInput.value || 0);

  if (!name) {
    showStatus("أدخل اسم القسم أولًا.", true);
    return;
  }

  try {
    await addDoc(collection(db, "categories"), {
      name,
      order,
      createdAt: serverTimestamp()
    });

    els.categoryNameInput.value = "";
    els.categoryOrderInput.value = "";

    await loadCategories();
    showStatus("تمت إضافة القسم بنجاح.");
  } catch (error) {
    console.error(error);
    showStatus("تعذر إضافة القسم.", true);
  }
});

/* =========================================================
   10) الوجبات
========================================================= */
function renderMealsList() {
  if (!meals.length) {
    els.mealsList.innerHTML = `<div class="panel-card">لا توجد وجبات بعد.</div>`;
    return;
  }

  els.mealsList.innerHTML = meals
    .map(
      (meal) => `
      <div class="list-item">
        <img src="${meal.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop"}" alt="${meal.name}" />
        <div class="item-meta">
          <h5>${meal.name} — ${meal.price ?? 0}</h5>
          <p>
            القسم: ${getCategoryName(meal.categoryId)}<br>
            ${meal.description || ""}<br>
            ${meal.featured ? "ضمن الأكثر طلبًا" : "وجبة عادية"}
          </p>
        </div>
        <div class="item-actions">
          <button class="btn btn-secondary" data-fill-meal="${meal.id}">تعديل</button>
          <button class="btn btn-danger" data-delete-meal="${meal.id}" data-image-path="${meal.storagePath || ""}">حذف</button>
        </div>
      </div>
    `
    )
    .join("");
}

function fillMealForm(mealId) {
  const meal = meals.find((m) => m.id === mealId);
  if (!meal) return;

  els.mealNameInput.value = meal.name || "";
  els.mealCategoryInput.value = meal.categoryId || "";
  els.mealPriceInput.value = meal.price ?? "";
  els.mealOldPriceInput.value = meal.oldPrice ?? "";
  els.mealIngredientsInput.value = Array.isArray(meal.ingredients) ? meal.ingredients.join(", ") : "";
  els.mealActionTypeInput.value = meal.actionType || "counter";
  els.mealFeaturedInput.value = String(!!meal.featured);
  els.mealDescriptionInput.value = meal.description || "";
  els.mealImageUrlInput.value = meal.imageUrl || "";
  els.addMealBtn.dataset.editingId = meal.id;
  els.addMealBtn.textContent = "حفظ تعديل الوجبة";

  document.getElementById("mealsSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetMealForm() {
  els.mealNameInput.value = "";
  els.mealPriceInput.value = "";
  els.mealOldPriceInput.value = "";
  els.mealIngredientsInput.value = "";
  els.mealActionTypeInput.value = "counter";
  els.mealFeaturedInput.value = "true";
  els.mealDescriptionInput.value = "";
  els.mealImageUrlInput.value = "";
  els.mealImageFileInput.value = "";
  delete els.addMealBtn.dataset.editingId;
  els.addMealBtn.textContent = "إضافة الوجبة";
}

els.uploadMealImageBtn?.addEventListener("click", async () => {
  const file = els.mealImageFileInput.files?.[0];
  if (!file) {
    showStatus("اختر صورة الوجبة أولًا.", true);
    return;
  }

  try {
    const uploaded = await uploadImage(file, "restaurant/meals");
    els.mealImageUrlInput.value = uploaded.url;
    els.mealImageUrlInput.dataset.storagePath = uploaded.storagePath;
    showStatus("تم رفع صورة الوجبة.");
  } catch (error) {
    console.error(error);
    showStatus("تعذر رفع صورة الوجبة.", true);
  }
});

els.addMealBtn?.addEventListener("click", async () => {
  const editingId = els.addMealBtn.dataset.editingId;

  const payload = {
    name: els.mealNameInput.value.trim(),
    categoryId: els.mealCategoryInput.value,
    price: Number(els.mealPriceInput.value || 0),
    oldPrice: els.mealOldPriceInput.value ? Number(els.mealOldPriceInput.value) : null,
    ingredients: safeArrayFromCSV(els.mealIngredientsInput.value),
    actionType: els.mealActionTypeInput.value,
    featured: els.mealFeaturedInput.value === "true",
    description: els.mealDescriptionInput.value.trim(),
    imageUrl: els.mealImageUrlInput.value.trim(),
    storagePath: els.mealImageUrlInput.dataset.storagePath || "",
    updatedAt: serverTimestamp()
  };

  if (!payload.name || !payload.categoryId || !payload.price || !payload.imageUrl) {
    showStatus("أدخل اسم الوجبة والقسم والسعر وارفع الصورة.", true);
    return;
  }

  try {
    if (editingId) {
      await updateDoc(doc(db, "meals", editingId), payload);
      showStatus("تم تعديل الوجبة بنجاح.");
    } else {
      await addDoc(collection(db, "meals"), {
        ...payload,
        createdAt: serverTimestamp()
      });
      showStatus("تمت إضافة الوجبة بنجاح.");
    }

    resetMealForm();
    await loadMeals();
  } catch (error) {
    console.error(error);
    showStatus("تعذر حفظ الوجبة.", true);
  }
});

/* =========================================================
   11) الحذف والتعديل من القوائم
========================================================= */
document.addEventListener("click", async (e) => {
  const deleteCategoryId = e.target.getAttribute("data-delete-category");
  if (deleteCategoryId) {
    try {
      await deleteDoc(doc(db, "categories", deleteCategoryId));
      await loadCategories();
      showStatus("تم حذف القسم.");
    } catch (error) {
      console.error(error);
      showStatus("تعذر حذف القسم.", true);
    }
  }

  const fillMealId = e.target.getAttribute("data-fill-meal");
  if (fillMealId) {
    fillMealForm(fillMealId);
  }

  const deleteMealId = e.target.getAttribute("data-delete-meal");
  if (deleteMealId) {
    const imagePath = e.target.getAttribute("data-image-path");

    try {
      await deleteDoc(doc(db, "meals", deleteMealId));
      if (imagePath) {
        try {
          await deleteObject(ref(storage, imagePath));
        } catch (_) {}
      }
      await loadMeals();
      showStatus("تم حذف الوجبة.");
    } catch (error) {
      console.error(error);
      showStatus("تعذر حذف الوجبة.", true);
    }
  }
});

/* =========================================================
   12) جلب البيانات من Firestore
========================================================= */
async function loadSettings() {
  const snap = await getDoc(doc(db, "settings", "main"));
  settings = snap.exists() ? snap.data() : {};
  fillSettingsForm(settings);
}

async function loadCategories() {
  const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
  categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderCategorySelect();
  renderCategoriesList();
}

async function loadMeals() {
  const snap = await getDocs(query(collection(db, "meals"), orderBy("createdAt", "desc")));
  meals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderMealsList();
}

async function loadAll() {
  try {
    await Promise.all([loadSettings(), loadCategories(), loadMeals()]);
  } catch (error) {
    console.error(error);
    showStatus("حدث خطأ أثناء تحميل بيانات اللوحة.", true);
  }
}
