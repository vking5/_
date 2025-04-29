import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

const productGrid = document.getElementById('productGrid');
const categoryButtons = document.querySelectorAll('#categoryButtons button');
const subCategoryButtonsContainer = document.getElementById('subCategoryButtons');
const rateFilter = document.getElementById('rateFilter');

let selectedCategory = 'all';
let selectedSubcategory = null;
let cart = [];

const cartList = document.getElementById('cartList');
const cartCount = document.getElementById('cartCount');
const cartButton = document.getElementById('cartButton');
const purchaseButton = document.getElementById('purchaseBtn');

const subcategories = {
  "Events": ["Stages", "Enterence", "Pathway", "Cheddar", "NameBoard"],
  "Catering": ["FoodCorner", "JuiceCorner", "Dishes", "Drinks"],
  "Special Events": ["Mehandi", "Haldi", "BrideToBe", "Birthday"],
  "More": ["PaperBlast", "ColdPyro", "DryIce", "Sound", "Light"]
};

function toggleCart() {
  const modal = document.getElementById('cartModal');
  modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
}

async function fetchAndDisplayProducts(category = 'all', subcategory = null) {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    productGrid.innerHTML = '';

    const maxRate = parseInt(rateFilter.value) || Infinity;

    querySnapshot.forEach(doc => {
      const data = doc.data();

      const matchCategory = category === 'all' || data.category === category;
      const matchSubcategory = !subcategory || data.subcategory === subcategory;
      const matchRate = rateFilter.value === 'all' || data.rate <= maxRate;

      if (matchCategory && matchSubcategory && matchRate) {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.innerHTML = `
          <img src="${data.imageUrl}" alt="${data.productName}">
          <div class="card-content" align="center">
            <h3>${data.productName}</h3>
            <p><strong></strong> ₹${data.rate}</p>
            <button class="add-to-cart-btn" data-id="${doc.id}">Add to Cart</button>
          </div>
        `;

        const item = {
          id: doc.id,
          productName: data.productName,
          rate: data.rate
        };

        const btn = card.querySelector('.add-to-cart-btn');
        const exists = cart.find(p => p.id === item.id);
        btn.textContent = exists ? 'Added' : 'Add to Cart';
        btn.disabled = !!exists;

        btn.addEventListener('click', () => {
          if (!cart.find(p => p.id === item.id)) {
            cart.push(item);
            updateCartUI();
          }
        });

        productGrid.appendChild(card);
      }
    });

    updateCartUI();
  } catch (error) {
    console.error("Error loading products:", error);
    productGrid.innerHTML = "<p>Failed to load products.</p>";
  }
}

function displaySubcategoryButtons(category) {
  subCategoryButtonsContainer.innerHTML = '';
  const subs = subcategories[category] || [];

  subs.forEach(sub => {
    const btn = document.createElement('button');
    btn.textContent = sub;
    btn.classList.add('subcategory-btn');

    btn.addEventListener('click', () => {
      document.querySelectorAll('.subcategory-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSubcategory = sub;
      fetchAndDisplayProducts(selectedCategory, selectedSubcategory);
    });

    subCategoryButtonsContainer.appendChild(btn);
  });
}

function updateCartUI() {
  cartList.innerHTML = '';
  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.productName} - ₹${item.rate}
      <button onclick="removeFromCart(${index})">❌</button>
    `;
    cartList.appendChild(li);
  });

  cartCount.textContent = cart.length;

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    const id = btn.dataset.id;
    const exists = cart.find(item => item.id === id);
    btn.textContent = exists ? 'Added' : 'Add to Cart';
    btn.disabled = !!exists;
  });
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

categoryButtons.forEach(button => {
  button.addEventListener('click', () => {
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    selectedCategory = button.getAttribute('data-filter');
    selectedSubcategory = null;
    displaySubcategoryButtons(selectedCategory);
    fetchAndDisplayProducts(selectedCategory);
  });
});

rateFilter.addEventListener('change', () => {
  fetchAndDisplayProducts(selectedCategory, selectedSubcategory);
});

cartButton.addEventListener('click', toggleCart);

purchaseButton.addEventListener('click', () => {
  const customerName = prompt("Enter your name:");
  const customerLocation = prompt("Enter your location:");

  if (!customerName || !customerLocation || cart.length === 0) {
    alert("Please fill all fields and add items to cart.");
    return;
  }

  let message = `*Customer:* ${customerName}\n*Location:* ${customerLocation}\n\n*Order Items:*\n`;
  cart.forEach(item => {
    message += `• ${item.productName} - ₹${item.rate}\n`;
  });

  const encodedMsg = encodeURIComponent(message);
  const phoneNumber = '919778202896';
  window.open(`https://wa.me/${phoneNumber}?text=${encodedMsg}`, '_blank');
});

fetchAndDisplayProducts(); // Initial load
