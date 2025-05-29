import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAMCJgfC_lox-EIEelRRh-7VjriZ7dftP0",
  authDomain: "myalbumproject-dca7f.firebaseapp.com",
  projectId: "myalbumproject-dca7f",
  storageBucket: "myalbumproject-dca7f.appspot.com",
  messagingSenderId: "685476424363",
  appId: "1:685476424363:web:b6c91eb7d57e37d60d65ee"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const subcategories = {
  events: ["Stage", "Enterence", "Pathway", "Cheddar", "Nameboard"],
  catering: ["FoodCorner", "JuiceCorner", "Dishes", "Drinks"],
  special: ["Mehandi", "Haldi", "BrideToBe", "Birthday"],
  more: ["Paperblast", "Coldpyro", "DryIce", "Sound", "Light"]
};

// Default state
let selectedCategory = null;
let selectedSubcategory = null;
let editMode = false;
let editProductId = null;

window.showTab = function(tabName) {
  document.querySelectorAll('.tabContent').forEach(tab => tab.style.display = 'none');
  document.getElementById(tabName).style.display = 'block';
}
showTab('addProduct');

window.updateSubcategories = function() {
  const category = document.getElementById('category').value;
  const subcategorySelect = document.getElementById('subcategory');
  subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
  
  if (subcategories[category]) {
    subcategories[category].forEach(sub => {
      const option = document.createElement('option');
      option.value = sub;
      option.textContent = sub;
      subcategorySelect.appendChild(option);
    });
  }
}

window.addProduct = async function() {
  const productName = document.getElementById('productName').value.trim();
  const category = document.getElementById('category').value.trim();
  const subcategory = document.getElementById('subcategory').value.trim();
  const rate = document.getElementById('rate').value.trim();
  const productImage = document.getElementById('productImage').files[0];

  if (!category || !subcategory) {
    alert("Please fill all fields!");
    return;
  }

  try {
    let imageUrl = null;

    if (productImage) {
      const formData = new FormData();
      formData.append('file', productImage);
      formData.append('upload_preset', 'Imageuploader');

      const cloudinaryResponse = await fetch('https://api.cloudinary.com/v1_1/dmx3gppso/image/upload', {
        method: 'POST',
        body: formData
      });
      const cloudinaryData = await cloudinaryResponse.json();
      imageUrl = cloudinaryData.secure_url;
    }

    if (editMode && editProductId) {
      const updateData = {
        productName,
        category,
        subcategory,
        rate
      };
      if (imageUrl) updateData.imageUrl = imageUrl;

      await updateDoc(doc(db, 'products', editProductId), updateData);
      alert("Product updated!");
    } else {
      if (!imageUrl) {
        alert("Image is required for new product.");
        return;
      }
      await addDoc(collection(db, 'products'), {
        productName,
        category,
        subcategory,
        rate,
        imageUrl
      });
      alert("Product added successfully!");
    }

    resetForm();
    loadProducts();
    showTab('viewProducts');
  } catch (error) {
    console.error(error);
    alert("Failed to save product!");
  }
}

function resetForm() {
  document.getElementById('productName').value = '';
  document.getElementById('category').value = '';
  document.getElementById('subcategory').innerHTML = '<option value="">Select Subcategory</option>';
  document.getElementById('rate').value = '';
  document.getElementById('productImage').value = '';
  editMode = false;
  editProductId = null;
}

async function loadProducts() {
  const productsList = document.getElementById('productsList');
  productsList.innerHTML = '';
  const querySnapshot = await getDocs(collection(db, 'products'));

  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();

    if (
      (!selectedCategory || data.category === selectedCategory) &&
      (!selectedSubcategory || data.subcategory === selectedSubcategory)
    ) {
      const productHTML = `
        <div class="product-item">
          <img src="${data.imageUrl}" alt="Product">
          <h3>${data.productName}</h3>
          <p><b>Category:</b> ${data.category}</p>
          <p><b>Subcategory:</b> ${data.subcategory}</p>
          <p><b>Rate:</b> ₹${data.rate}</p>
          <button class="edit-btn" onclick="editProduct('${docSnap.id}', '${data.productName}', '${data.category}', '${data.subcategory}', '${data.rate}', '${data.imageUrl}')">Edit</button>
          <button onclick="deleteProduct('${docSnap.id}')">Delete</button>
        </div>
      `;
      productsList.innerHTML += productHTML;
    }
  });
}

window.editProduct = async function(id, name, category, subcategory, rate, imageUrl) {
  document.getElementById('productName').value = name;
  document.getElementById('category').value = category;
  updateSubcategories();
  document.getElementById('subcategory').value = subcategory;
  document.getElementById('rate').value = rate;
  document.getElementById('productImage').value = '';
  
  editMode = true;
  editProductId = id;
  showTab('addProduct');
}

window.deleteProduct = async function(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    await deleteDoc(doc(db, 'products', id));
    alert("Product deleted!");
    loadProducts();
  }
}

document.querySelector("nav button:nth-child(2)").addEventListener("click", () => {
  renderCategoryButtons();
  loadProducts();
});

function renderCategoryButtons() {
  const categoryFilters = document.getElementById('categoryFilters');
  categoryFilters.innerHTML = '';

  Object.keys(subcategories).forEach(category => {
    const btn = document.createElement('button');
    btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    btn.className = 'filter-btn';
    btn.onclick = () => {
      selectedCategory = category;
      selectedSubcategory = null;
      renderSubcategoryButtons(category);
      loadProducts();
    };
    categoryFilters.appendChild(btn);
  });

  // Functionality to reset category and subcategory, but no visible "All" button
  if (!selectedCategory && !selectedSubcategory) {
    loadProducts();
  }
}

function renderSubcategoryButtons(category) {
  const subFilter = document.getElementById('subcategoryFilters');
  subFilter.innerHTML = '';

  subcategories[category].forEach(sub => {
    const btn = document.createElement('button');
    btn.textContent = sub;
    btn.className = 'filter-btn';
    btn.onclick = () => {
      selectedSubcategory = sub;
      loadProducts();
    };
    subFilter.appendChild(btn);
  });

  // Automatically load all subcategory products if no subcategory selected
  if (!selectedSubcategory) {
    loadProducts();
  }
}



window.handleLogin = function() {
  const id = document.getElementById("loginId").value.trim();
  const pw = document.getElementById("loginPassword").value.trim();
  const error = document.getElementById("loginError");

  if (id === "admin" && pw === "12345") {
    sessionStorage.setItem("loggedIn", "true");
    document.getElementById("loginOverlay").style.display = "none";
  } else {
    error.style.display = "block";
  }
};

window.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("loggedIn") === "true") {
    document.getElementById("loginOverlay").style.display = "none";
  } else {
    document.getElementById("loginOverlay").style.display = "flex";
  }
});


document.addEventListener('DOMContentLoaded', function () {
  // Push dummy state so there's something to go "back" to
  history.pushState(null, null, location.href);

  window.addEventListener('popstate', function (event) {
    const confirmExit = confirm("Are you sure you want to exit?");
    if (confirmExit) {
      history.back();
    } else {
      history.pushState(null, null, location.href);
    }
  });
});
