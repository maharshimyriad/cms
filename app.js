/**
 * Frontend App Logic
 * Displays products from GitHub-hosted JSON
 */

let appData = { items: [] };

/**
 * Fetch data from GitHub
 */
async function fetchDataFromGitHub() {
  try {
    // Get GitHub username and repo from query parameters
    let owner = new URLSearchParams(window.location.search).get('owner');
    let repo = new URLSearchParams(window.location.search).get('repo');

    // If not in URL, check localStorage (set by admin panel)
    if (!owner || !repo) {
      owner = localStorage.getItem('cms_owner');
      repo = localStorage.getItem('cms_repo');
    }

    // If still missing, show error with instructions
    if (!owner || !repo) {
      showError(`
        ⚠️ GitHub repository not configured.
        
        Please use this URL format:
        index.html?owner=YOUR_USERNAME&repo=YOUR_REPO_NAME
        
        Example:
        index.html?owner=john&repo=my-products
        
        Or access from admin panel to auto-configure.
      `);
      return false;
    }

    // Initialize API without token (works for public repos)
    const github = new GitHubAPI(owner, repo, 'main', null);

    // Fetch data
    const fetchedData = await github.fetchData();
    appData = fetchedData.data;

    // Store for future use
    localStorage.setItem('cms_owner', owner);
    localStorage.setItem('cms_repo', repo);

    return true;
  } catch (error) {
    showError(`❌ Failed to load data: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Display items
 */
function displayItems() {
  const container = document.getElementById('items-container');
  const viewType = localStorage.getItem('cms_view_type') || 'cards';

  if (!appData.items || appData.items.length === 0) {
    container.innerHTML = '<p class="empty-state">No items to display</p>';
    return;
  }

  if (viewType === 'table') {
    displayAsTable(container);
  } else {
    displayAsCards(container);
  }
}

/**
 * Display items as cards
 */
function displayAsCards(container) {
  container.innerHTML = '';
  container.className = 'items-grid';

  appData.items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      ${item.image ? `<div class="item-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"></div>` : '<div class="item-image item-image-placeholder">No Image</div>'}
      <div class="item-content">
        <h3 class="item-name">${escapeHtml(item.name)}</h3>
        ${item.category ? `<p class="item-category">${escapeHtml(item.category)}</p>` : ''}
        ${item.description ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ''}
        <div class="item-footer">
          <span class="item-price">$${parseFloat(item.price || 0).toFixed(2)}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Display items as table
 */
function displayAsTable(container) {
  container.innerHTML = '';
  
  const table = document.createElement('table');
  table.className = 'items-table';

  // Create header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Name</th>
      <th>Category</th>
      <th>Price</th>
      <th>Description</th>
    </tr>
  `;
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');
  appData.items.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${escapeHtml(item.category || 'N/A')}</td>
      <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
      <td>${escapeHtml((item.description || '').substring(0, 50))}${(item.description || '').length > 50 ? '...' : ''}</td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  container.appendChild(table);
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  } else {
    alert(message);
  }
}

/**
 * Filter items by category
 */
function filterByCategory(category) {
  const filtered = category === 'all' ? appData.items : appData.items.filter((item) => item.category === category);
  displayFilteredItems(filtered);
}

/**
 * Display filtered items
 */
function displayFilteredItems(items) {
  const container = document.getElementById('items-container');
  container.innerHTML = '';
  container.className = 'items-grid';

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-state">No items found</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      ${item.image ? `<div class="item-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"></div>` : '<div class="item-image item-image-placeholder">No Image</div>'}
      <div class="item-content">
        <h3 class="item-name">${escapeHtml(item.name)}</h3>
        ${item.category ? `<p class="item-category">${escapeHtml(item.category)}</p>` : ''}
        ${item.description ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ''}
        <div class="item-footer">
          <span class="item-price">$${parseFloat(item.price || 0).toFixed(2)}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Search items
 */
function searchItems() {
  const query = document.getElementById('search-input')?.value.toLowerCase() || '';
  const filtered = query === '' ? appData.items : appData.items.filter((item) => {
    return (
      item.name.toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query) ||
      (item.category || '').toLowerCase().includes(query)
    );
  });
  displayFilteredItems(filtered);
}

/**
 * Sort items
 */
function sortItems(sortBy) {
  let sorted = [...appData.items];

  if (sortBy === 'name-asc') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'name-desc') {
    sorted.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy === 'price-asc') {
    sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortBy === 'price-desc') {
    sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  displayFilteredItems(sorted);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize app on page load
 */
async function initApp() {
  const loadingDiv = document.getElementById('loading');
  
  // Show loading
  if (loadingDiv) {
    loadingDiv.style.display = 'block';
  }

  // Fetch data
  const success = await fetchDataFromGitHub();

  // Hide loading
  if (loadingDiv) {
    loadingDiv.style.display = 'none';
  }

  if (success) {
    // Display items
    displayItems();

    // Set up search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', searchItems);
    }

    // Set up category filter
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        filterByCategory(e.target.value);
      });
    }

    // Set up sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortItems(e.target.value);
      });
    }

    // Set up view type toggle
    const viewToggle = document.getElementById('view-toggle');
    if (viewToggle) {
      viewToggle.addEventListener('change', (e) => {
        localStorage.setItem('cms_view_type', e.target.value);
        displayItems();
      });
    }
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
