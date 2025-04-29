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

const subcategories = {
  "events": ["stages", "enterence", "pathway", "cheddar", "name board"],
  "catering": ["food corner", "Juice corner", "dishes", "drinks"],
  "special events": ["mehandi", "wedding night", "bride to be", "groom to be", "birthday", "wedding anuversary"],
  "more": ["paper blast", "cold pyro", "dry ice", "sound", "light"]
};

async function fetchAndDisplayProducts(filterCategory = 'all', filterSubcategory = null) {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    productGrid.innerHTML = '';

    querySnapshot.forEach(doc => {
      const data = doc.data();

      const categoryMatch = (filterCategory === 'all') || data.category === filterCategory;
      const subcategoryMatch = !filterSubcategory || data.subcategory === filterSubcategory;

      if (categoryMatch && subcategoryMatch) {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.innerHTML = `
          <img src="${data.imageUrl}" alt="${data.productName}">
          <div class="card-content">
            <h3>${data.productName}</h3>
            <p><strong>Rate:</strong> ₹${data.rate}</p>
            <p><strong>Category:</strong> ${data.category}</p>
            <p><strong>Subcategory:</strong> ${data.subcategory}</p>
          </div>
        `;
        productGrid.appendChild(card);
      }
    });
  } catch (error) {
    console.error("Error loading products:", error);
    productGrid.innerHTML = "<p>Failed to load products.</p>";
  }
}

categoryButtons.forEach(button => {
  button.addEventListener('click', () => {
    const category = button.getAttribute('data-filter');

    categoryButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    displaySubcategoryButtons(category);
    fetchAndDisplayProducts(category);
  });
});

function displaySubcategoryButtons(category) {
  subCategoryButtonsContainer.innerHTML = '';
  const subcats = subcategories[category] || [];

  subcats.forEach(subcat => {
    const btn = document.createElement('button');
    btn.textContent = subcat;
    btn.classList.add('subcategory-btn');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subcategory-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fetchAndDisplayProducts(category, subcat);
    });
    subCategoryButtonsContainer.appendChild(btn);
  });
}

// Load all products initially
fetchAndDisplayProducts();
