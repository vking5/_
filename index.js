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

let selectedCategory = 'all';
let selectedSubcategory = null;
let cart = [];

let priceSort = null;
let priceRange = null;

const cartList = document.getElementById('cartList');
const cartCount = document.getElementById('cartCount');
const cartButton = document.getElementById('cartButton');
const purchaseButton = document.getElementById('purchaseBtn');
const cartModal = document.getElementById('cartModal');

const subcategories = {
  "events": ["Stage", "Enterence", "Pathway", "Cheddar", "Nameboard"],
  "catering": ["FoodCorner", "JuiceCorner", "Dishes", "Drinks"],
  "special": ["Mehandi", "Haldi", "BrideToBe", "Birthday"],
  "more": ["PaperBlast", "ColdPyro", "DryIce", "Sound", "Light"]
};

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
  const storedCart = localStorage.getItem('cart');
  if (storedCart) {
    cart = JSON.parse(storedCart);
    updateCartUI();
  }
}

function toggleCart() {
  cartModal.style.display = (cartModal.style.display === 'none') ? 'block' : 'none';
}

async function fetchAndDisplayProducts(category = 'all', subcategory = null) {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    let products = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const matchCategory = category === 'all' || data.category === category;
      const matchSubcategory = !subcategory || data.subcategory === subcategory;

      if (matchCategory && matchSubcategory) {
        products.push({ id: doc.id, ...data });
      }
    });

    if (priceRange) {
      const [min, max] = priceRange.split('-');
      const upperLimit = max === 'inf' ? Infinity : parseInt(max);
      products = products.filter(p => p.rate >= parseInt(min) && p.rate <= upperLimit);
    }

    if (priceSort === 'low') {
      products.sort((a, b) => a.rate - b.rate);
    } else if (priceSort === 'high') {
      products.sort((a, b) => b.rate - a.rate);
    }

    productGrid.innerHTML = '';

    products.forEach(data => {
      const card = document.createElement('div');
      card.classList.add('product-card');
      card.innerHTML = `
        <img src="${data.imageUrl}" alt="${data.productName}">
        <div class="card-content" align="center">
          <h3>${data.productName}</h3>
          <p><strong></strong> ₹${data.rate}</p>
          <button class="add-to-cart-btn" data-id="${data.id}">Add to Cart</button>
        </div>
      `;

      const item = {
        id: data.id,
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
          saveCart();
          updateCartUI();
        }
      });

      productGrid.appendChild(card);
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
      <button class="remove-item-btn" data-index="${index}">🗑️</button>
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

  saveCart();
}

cartList.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-item-btn')) {
    const index = parseInt(e.target.dataset.index);
    if (!isNaN(index)) {
      cart.splice(index, 1);
      updateCartUI();
    }
  }
});

document.getElementById('cartButton').addEventListener('click', toggleCart);
document.getElementById('closeCartBtn').addEventListener('click', toggleCart);

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

document.querySelectorAll('.price-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    priceSort = btn.dataset.sort || null;
    priceRange = btn.dataset.range || null;
    fetchAndDisplayProducts(selectedCategory, selectedSubcategory);
  });
});

document.getElementById('clearPriceFilter').addEventListener('click', () => {
  priceSort = null;
  priceRange = null;
  fetchAndDisplayProducts(selectedCategory, selectedSubcategory);
});

purchaseButton.addEventListener('click', () => {
  // Check if cart is empty
  if (!cart || cart.length === 0) {
    const popup = document.getElementById('emptyCartPopup');
    popup.style.display = 'block';
    
    // Hide the popup after 2 seconds
    setTimeout(() => {
      popup.style.display = 'none';
    }, 2000);
    
    return;
  }
  

  // Hide and disable the purchase button
  purchaseButton.style.display = 'none';
  purchaseButton.style.pointerEvents = 'none';
  purchaseButton.style.opacity = '0';

  // Create a form dynamically for order details
  const orderForm = document.createElement('form');
  orderForm.setAttribute('id', 'orderForm');

  orderForm.innerHTML = `
    <h3>Order Details</h3>
    
    <label for="name" style="color: white;"><b>Name:</b></label>
    <input type="text" id="name" placeholder="Enter your name" />

    <label for="phone" style="color: white;"><b>Phone Number:</b></label>
    <input type="text" id="phone" placeholder="Enter your phone number" />

    <label for="place" style="color: white;"><b>Place:</b></label>
    <input type="text" id="place" placeholder="Enter your place" />

    <label for="eventType" style="color: white;"><b>Event Type / Style:</b></label>
    <input type="text" id="eventType" placeholder="e.g. Marriage" />

    <label for="eventDate" style="color: white;"><b>Event Date:</b></label>
    <input type="date" id="eventDate" />

    <label for="eventTime" style="color: white;"><b>Event Time:</b></label>
    <input type="time" id="eventTime" />

    <label for="orderNote" style="color: white;"><b>Order Note:</b></label>
    <textarea id="orderNote" placeholder="Enter any suggestions or notes here"></textarea>

    <div class="form-actions">
      <button type="submit">Order on WhatsApp</button>
      <button type="button" id="cancelOrder">Cancel</button>
    </div>
  `;

  // Append the form to the body or a specific container
  document.body.appendChild(orderForm);

  // Handle cancel button click
  document.getElementById('cancelOrder').addEventListener('click', () => {
    document.body.removeChild(orderForm);

    // Show and re-enable the purchase button
    purchaseButton.style.display = 'inline-flex';
    purchaseButton.style.pointerEvents = 'auto';
    purchaseButton.style.opacity = '1';
  });

  // Handle form submission
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const customerName = document.getElementById('name').value;
    const phoneNumber = document.getElementById('phone').value;
    const place = document.getElementById('place').value;
    const eventType = document.getElementById('eventType').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
    const orderNote = document.getElementById('orderNote').value;



    let message = `*Order Details:*\n\n`;
    message += `*Name:* ${customerName}\n`;
    message += `*Phone Number:* ${phoneNumber}\n`;
    message += `*Place:* ${place}\n`;
    message += `*Event Type / Style:* ${eventType}\n`;
    message += `*Event Date:* ${eventDate}\n`;
    message += `*Event Time:* ${eventTime}\n`;
    message += `*Order Notes:* ${orderNote}\n\n`;

    message += `*Order Items:*\n`;
    cart.forEach(item => {
      message += `• ${item.productName} - ₹${item.rate}\n`;
    });

    const encodedMsg = encodeURIComponent(message);
    const whatsappPhoneNumber = '919778202896';
    window.open(`https://wa.me/${whatsappPhoneNumber}?text=${encodedMsg}`, '_blank');

    // Optionally, clear the cart after sending the order
    cart = [];
    saveCart();
    updateCartUI();

    // Close the form
    document.body.removeChild(orderForm);
  });
});


// Initial load
loadCart();
fetchAndDisplayProducts();

// Toggle filter menu on click
document.getElementById("filterToggle").addEventListener("click", function (e) {
    const filterMenu = document.getElementById("filterMenu");
    filterMenu.style.display = filterMenu.style.display === "block" ? "none" : "block";
    e.stopPropagation(); // prevent bubbling to window
});
  
// Close the filter menu if clicked outside
window.addEventListener("click", function () {
    const filterMenu = document.getElementById("filterMenu");
    if (filterMenu) filterMenu.style.display = "none";
});
  
// Prevent dropdown from closing when clicking inside
document.getElementById("filterMenu").addEventListener("click", function (e) {
    e.stopPropagation();
});

