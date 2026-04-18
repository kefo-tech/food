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

/* =========================================================
   1) إعداد Firebase
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

/* =========================================================
   2) إعداد Cloudinary
========================================================= */
const cloudinaryConfig = {
  cloudName: "dbvtq61ws",
  uploadPreset: "restaurant_upload"
};

/* =========================================================
   3) عناصر الصفحة
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
   4) الحالة العامة
========================================================= */
let settings = {};
let categories = [];
let meals = [];

/* =========================================================
   5) أدوات مساعدة
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
  if (!els.mealCategoryInput) return;

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

/* =========================================================
   6) Cloudinary Upload Widget
========================================================= */
function openCloudinaryWidget({ folder = "restaurant", onSuccess }) {
  if (!window.cloudinary) {
    showStatus("Cloudinary widget لم يتم تحميله.", true);
    return;
  }

  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName: cloudinaryConfig.cloudName,
      uploadPreset: cloudinaryConfig.uploadPreset,
      folder,
      sources: ["local", "camera", "url"],
      multiple: false,
      resourceType: "image",
      clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
      maxFiles: 1
    },
    (error, result) => {
      if (error) {
        console.error(error);
        showStatus("حدث خطأ أثناء رفع الصورة.", true);
        return;
      }

      if (result && result.event === "success") {
        onSuccess?.(result.info);
      }
    }
  );

  widget.open();
}

/* =========================================================
   7) التنقل بين أقسام اللوحة
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
   8) تسجيل الدخول والخروج
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
   9) رفع الشعار عبر Cloudinary
========================================================= */
els.uploadLogoBtn?.addEventListener("click", () => {
  openCloudinaryWidget({
    folder: "restaurant/logo",
    onSuccess: (info) => {
      els.logoUrlInput.value = info.secure_url || info.url || "";
      showStatus("تم رفع شعار المطعم بنجاح.");
    }
  });
});

/* =========================================================
   10) حفظ إعدادات المطعم
========================================================= */
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
   11) حفظ بيانات التواصل
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
   12) الأقسام
========================================================= */
function renderCategoriesList() {
  if (!els.categoriesList) return;

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
   13) الوجبات
========================================================= */
function renderMealsList() {
  if (!els.mealsList) return;

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
          <button class="btn btn-danger" data-delete-meal="${meal.id}">حذف</button>
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
  els.mealIngredientsInput.value = Array.isArray(meal.ingredients)
    ? meal.ingredients.join(", ")
    : "";
  els.mealActionTypeInput.value = meal.actionType || "counter";
  els.mealFeaturedInput.value = String(!!meal.featured);
  els.mealDescriptionInput.value = meal.description || "";
  els.mealImageUrlInput.value = meal.imageUrl || "";

  els.addMealBtn.dataset.editingId = meal.id;
  els.addMealBtn.textContent = "حفظ تعديل الوجبة";

  document.getElementById("mealsSection")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
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
  delete els.addMealBtn.dataset.editingId;
  els.addMealBtn.textContent = "إضافة الوجبة";
}

els.uploadMealImageBtn?.addEventListener("click", () => {
  openCloudinaryWidget({
    folder: "restaurant/meals",
    onSuccess: (info) => {
      els.mealImageUrlInput.value = info.secure_url || info.url || "";
      showStatus("تم رفع صورة الوجبة بنجاح.");
    }
  });
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
   14) حذف وتعديل من القوائم
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
    try {
      await deleteDoc(doc(db, "meals", deleteMealId));
      await loadMeals();
      showStatus("تم حذف الوجبة.");
    } catch (error) {
      console.error(error);
      showStatus("تعذر حذف الوجبة.", true);
    }
  }
});

/* =========================================================
   15) جلب البيانات من Firestore
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
