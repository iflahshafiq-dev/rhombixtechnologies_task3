// =============================================
//  MyBookShelf — App Logic (app.js)
// =============================================

// ---- STATE ----
let currentRating = 0;
let editingBookId = null;
let isGridView = true;
let activeView = 'dashboard';

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  // Trigger default data load
  DB.getBooks();
  DB.getBorrows();
  DB.getHistory();

  initNavigation();
  initSearch();
  initForm();
  initBorrowModal();
  initViewToggle();
  initStarRating();
  initMobileMenu();

  renderDashboard();
  renderLibrary();
  renderBorrowed();
  renderHistory();
  updateTotalChip();
});

// ---- NAVIGATION ----
function initNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const view = link.dataset.view;
      switchView(view);
      // Close mobile sidebar
      document.getElementById('sidebar').classList.remove('open');
    });
  });
}

function switchView(view) {
  activeView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelector(`[data-view="${view}"]`).classList.add('active');

  if (view === 'dashboard') renderDashboard();
  if (view === 'library') renderLibrary();
  if (view === 'borrowed') renderBorrowed();
  if (view === 'history') renderHistory();
  if (view === 'add' && !editingBookId) resetForm();
}

// ---- MOBILE MENU ----
function initMobileMenu() {
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

// ---- GLOBAL SEARCH ----
function initSearch() {
  document.getElementById('globalSearch').addEventListener('input', e => {
    const q = e.target.value.trim();
    if (q.length > 0) {
      switchView('library');
      renderLibrary(q);
    } else {
      renderLibrary();
    }
  });
}

// ---- DASHBOARD ----
function renderDashboard() {
  const books = DB.getBooks();
  const borrows = DB.getBorrows();

  // Stats
  document.getElementById('stat-total').textContent = books.length;
  document.getElementById('stat-reading').textContent = books.filter(b => b.status === 'Reading').length;
  document.getElementById('stat-borrowed').textContent = borrows.length;
  document.getElementById('stat-finished').textContent = books.filter(b => b.status === 'Finished').length;

  // Recent books
  const recentEl = document.getElementById('recentBooks');
  const recent = [...books].slice(0, 5);
  recentEl.innerHTML = recent.length
    ? recent.map(b => `
        <div class="recent-item" onclick="openBookModal('${b.id}')">
          <div class="recent-cover">
            ${b.cover ? `<img src="${b.cover}" alt="" onerror="this.parentElement.innerHTML='📖'">` : '📖'}
          </div>
          <div class="recent-info">
            <div class="recent-title">${esc(b.title)}</div>
            <div class="recent-author">${esc(b.author)}</div>
          </div>
          <span class="book-status-badge status-${b.status.replace(' ', '\\ ')}">${b.status}</span>
        </div>`).join('')
    : '<p style="color:var(--text-muted);font-size:.875rem;">No books yet. Add your first book!</p>';

  // Genre chart
  const genreEl = document.getElementById('genreChart');
  const genreCounts = {};
  books.forEach(b => { genreCounts[b.category] = (genreCounts[b.category] || 0) + 1; });
  const sorted = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = sorted[0]?.[1] || 1;

  genreEl.innerHTML = sorted.length
    ? sorted.map(([genre, count]) => `
        <div class="genre-bar-row">
          <div class="genre-name" title="${genre}">${genre}</div>
          <div class="genre-bar-bg">
            <div class="genre-bar-fill" style="width:${(count/max*100).toFixed(0)}%"></div>
          </div>
          <div class="genre-count">${count}</div>
        </div>`).join('')
    : '<p style="color:var(--text-muted);font-size:.875rem;">No data yet.</p>';

  // Overdue
  const overdueEl = document.getElementById('overdueList');
  const today = new Date();
  const overdue = borrows.filter(b => !b.returned && new Date(b.dueDate) < today);
  overdueEl.innerHTML = overdue.length
    ? overdue.map(b => {
        const days = Math.floor((today - new Date(b.dueDate)) / 86400000);
        return `<div class="overdue-item">
          <span>📕</span>
          <div class="overdue-book">${esc(b.bookTitle)}</div>
          <div class="overdue-who">→ ${esc(b.borrower)}</div>
          <div class="overdue-days">${days}d overdue</div>
        </div>`;
      }).join('')
    : '<p class="no-overdue">✅ No overdue books. All good!</p>';
}

// ---- LIBRARY ----
function renderLibrary(searchQuery = '') {
  let books = DB.getBooks();
  const cat = document.getElementById('filterCategory').value;
  const status = document.getElementById('filterStatus').value;
  const sort = document.getElementById('sortBy').value;

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    books = books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  // Filter
  if (cat) books = books.filter(b => b.category === cat);
  if (status) books = books.filter(b => b.status === status);

  // Sort
  books.sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'author') return a.author.localeCompare(b.author);
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    return new Date(b.dateAdded) - new Date(a.dateAdded);
  });

  const gridEl = document.getElementById('booksGrid');
  const listEl = document.getElementById('booksList');
  const emptyEl = document.getElementById('libraryEmpty');

  if (books.length === 0) {
    gridEl.innerHTML = '';
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    gridEl.innerHTML = books.map(renderBookCard).join('');
    listEl.innerHTML = books.map(renderBookListItem).join('');
  }
}

function renderBookCard(b) {
  const stars = b.rating ? '★'.repeat(b.rating) + '☆'.repeat(5 - b.rating) : '☆☆☆☆☆';
  return `
    <div class="book-card" onclick="openBookModal('${b.id}')">
      <div class="book-cover">
        ${b.cover ? `<img src="${b.cover}" alt="${esc(b.title)}" onerror="this.style.display='none'">` : '📖'}
        <span class="book-status-badge status-${b.status.replace(/ /g, '-')}">${b.status}</span>
      </div>
      <div class="book-info">
        <div class="book-title">${esc(b.title)}</div>
        <div class="book-author">${esc(b.author)}</div>
        <div class="book-meta">
          <span class="book-category">${b.category}</span>
          <span class="book-rating">${stars}</span>
        </div>
      </div>
      <div class="book-actions" onclick="event.stopPropagation()">
        <button class="btn-icon" onclick="editBook('${b.id}')" title="Edit">✏️ Edit</button>
        <button class="btn-icon danger" onclick="deleteBook('${b.id}')" title="Delete">🗑️</button>
      </div>
    </div>`;
}

function renderBookListItem(b) {
  const stars = b.rating ? '★'.repeat(b.rating) : '—';
  return `
    <div class="book-list-item" onclick="openBookModal('${b.id}')">
      <div class="list-cover">
        ${b.cover ? `<img src="${b.cover}" alt="" onerror="this.style.display='none'">` : '📖'}
      </div>
      <div class="list-title">${esc(b.title)}</div>
      <div class="list-author">${esc(b.author)}</div>
      <div class="list-category"><span class="book-category">${b.category}</span></div>
      <div class="list-status"><span class="book-status-badge status-${b.status.replace(/ /g, '-')}">${b.status}</span></div>
      <div class="list-rating" style="color:var(--gold)">${stars}</div>
      <div class="list-actions" onclick="event.stopPropagation()">
        <button class="btn-icon" onclick="editBook('${b.id}')">✏️</button>
        <button class="btn-icon danger" onclick="deleteBook('${b.id}')">🗑️</button>
      </div>
    </div>`;
}

// ---- VIEW TOGGLE ----
function initViewToggle() {
  document.getElementById('gridViewBtn').addEventListener('click', () => {
    isGridView = true;
    document.getElementById('booksGrid').classList.remove('hidden');
    document.getElementById('booksList').classList.add('hidden');
    document.getElementById('gridViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
  });

  document.getElementById('listViewBtn').addEventListener('click', () => {
    isGridView = false;
    document.getElementById('booksGrid').classList.add('hidden');
    document.getElementById('booksList').classList.remove('hidden');
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('gridViewBtn').classList.remove('active');
  });

  document.getElementById('filterCategory').addEventListener('change', () => renderLibrary());
  document.getElementById('filterStatus').addEventListener('change', () => renderLibrary());
  document.getElementById('sortBy').addEventListener('change', () => renderLibrary());
}

// ---- BOOK MODAL ----
function openBookModal(id) {
  const b = DB.getBookById(id);
  if (!b) return;
  const stars = b.rating ? '★'.repeat(b.rating) + '☆'.repeat(5 - b.rating) : 'Not rated';
  const addedDate = new Date(b.dateAdded).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  document.getElementById('bookModalBody').innerHTML = `
    <div class="modal-book-cover">
      ${b.cover ? `<img src="${b.cover}" alt="${esc(b.title)}" onerror="this.parentElement.innerHTML='📖'">` : '📖'}
    </div>
    <h2 class="modal-book-title">${esc(b.title)}</h2>
    <p class="modal-book-author">by ${esc(b.author)}</p>
    <div class="modal-tags">
      <span class="modal-tag">${b.category}</span>
      <span class="modal-tag status-tag">${b.status}</span>
      ${b.year ? `<span class="modal-tag">${b.year}</span>` : ''}
    </div>
    <div class="modal-details">
      <div class="modal-detail-item">
        <span class="modal-detail-label">Rating</span>
        <span class="modal-detail-value" style="color:var(--gold)">${stars}</span>
      </div>
      <div class="modal-detail-item">
        <span class="modal-detail-label">Pages</span>
        <span class="modal-detail-value">${b.pages || '—'}</span>
      </div>
      <div class="modal-detail-item">
        <span class="modal-detail-label">ISBN</span>
        <span class="modal-detail-value">${b.isbn || '—'}</span>
      </div>
      <div class="modal-detail-item">
        <span class="modal-detail-label">Added On</span>
        <span class="modal-detail-value">${addedDate}</span>
      </div>
    </div>
    ${b.notes ? `<div class="modal-notes">"${esc(b.notes)}"</div>` : ''}
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="editBook('${b.id}'); closeBookModal()">✏️ Edit</button>
      <button class="btn btn-ghost" onclick="changeStatus('${b.id}')">🔄 Change Status</button>
      <button class="btn btn-danger" onclick="deleteBook('${b.id}'); closeBookModal()">🗑️ Delete</button>
    </div>`;

  document.getElementById('bookModal').classList.remove('hidden');
}

function closeBookModal() {
  document.getElementById('bookModal').classList.add('hidden');
}

document.getElementById('closeBookModal').addEventListener('click', closeBookModal);
document.getElementById('bookModal').addEventListener('click', e => {
  if (e.target === document.getElementById('bookModal')) closeBookModal();
});

function changeStatus(id) {
  const b = DB.getBookById(id);
  const statuses = ['Unread', 'Reading', 'Finished'];
  const next = statuses[(statuses.indexOf(b.status) + 1) % statuses.length];
  DB.updateBook(id, { status: next });
  closeBookModal();
  renderLibrary();
  renderDashboard();
  updateTotalChip();
  showToast(`Status changed to "${next}"`);
}

// ---- ADD / EDIT FORM ----
function initForm() {
  document.getElementById('bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const book = {
      title: document.getElementById('bookTitle').value.trim(),
      author: document.getElementById('bookAuthor').value.trim(),
      category: document.getElementById('bookCategory').value,
      status: document.getElementById('bookStatus').value,
      isbn: document.getElementById('bookISBN').value.trim(),
      year: document.getElementById('bookYear').value || null,
      pages: document.getElementById('bookPages').value || null,
      rating: currentRating,
      cover: document.getElementById('bookCover').value.trim(),
      notes: document.getElementById('bookNotes').value.trim(),
    };

    if (editingBookId) {
      DB.updateBook(editingBookId, book);
      showToast('✅ Book updated!', 'success');
      editingBookId = null;
    } else {
      DB.addBook(book);
      showToast('📚 Book added to your library!', 'success');
    }

    resetForm();
    renderLibrary();
    renderDashboard();
    updateTotalChip();
    switchView('library');
  });

  document.getElementById('cancelEdit').addEventListener('click', () => {
    editingBookId = null;
    resetForm();
    switchView('library');
  });
}

function editBook(id) {
  const b = DB.getBookById(id);
  if (!b) return;

  editingBookId = id;
  document.getElementById('formTitle').textContent = 'Edit Book';
  document.getElementById('bookTitle').value = b.title;
  document.getElementById('bookAuthor').value = b.author;
  document.getElementById('bookCategory').value = b.category;
  document.getElementById('bookStatus').value = b.status;
  document.getElementById('bookISBN').value = b.isbn || '';
  document.getElementById('bookYear').value = b.year || '';
  document.getElementById('bookPages').value = b.pages || '';
  document.getElementById('bookCover').value = b.cover || '';
  document.getElementById('bookNotes').value = b.notes || '';
  document.getElementById('submitBtn').textContent = 'Save Changes';

  setStars(b.rating || 0);
  switchView('add');
}

function deleteBook(id) {
  if (!confirm('Are you sure you want to delete this book?')) return;
  DB.deleteBook(id);
  renderLibrary();
  renderDashboard();
  updateTotalChip();
  showToast('🗑️ Book deleted.', 'error');
}

function resetForm() {
  document.getElementById('bookForm').reset();
  document.getElementById('formTitle').textContent = 'Add a New Book';
  document.getElementById('submitBtn').textContent = 'Add to Library';
  editingBookId = null;
  setStars(0);
  currentRating = 0;
}

// ---- STAR RATING ----
function initStarRating() {
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.val);
      setStars(currentRating);
    });
    star.addEventListener('mouseover', () => {
      const val = parseInt(star.dataset.val);
      document.querySelectorAll('.star').forEach((s, i) => {
        s.style.color = i < val ? 'var(--gold)' : 'var(--border)';
      });
    });
    star.addEventListener('mouseout', () => setStars(currentRating));
  });
}

function setStars(rating) {
  currentRating = rating;
  document.getElementById('bookRating').value = rating;
  document.querySelectorAll('.star').forEach((s, i) => {
    s.classList.toggle('active', i < rating);
    s.style.color = i < rating ? 'var(--gold)' : 'var(--border)';
  });
}

// ---- BORROWED ----
function renderBorrowed() {
  const borrows = DB.getBorrows();
  const listEl = document.getElementById('borrowedList');
  const emptyEl = document.getElementById('borrowedEmpty');
  const today = new Date();

  if (borrows.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  listEl.innerHTML = borrows.map(borrow => {
    const due = new Date(borrow.dueDate);
    const isOverdue = due < today && !borrow.returned;
    const borrowed = new Date(borrow.borrowDate).toLocaleDateString('en-GB');
    const dueStr = due.toLocaleDateString('en-GB');

    return `
      <div class="borrow-card ${isOverdue ? 'overdue' : ''}">
        <div class="borrow-card-icon">${isOverdue ? '⚠️' : '📗'}</div>
        <div class="borrow-card-info">
          <div class="borrow-book-title">${esc(borrow.bookTitle)}</div>
          <div class="borrow-borrower">👤 ${esc(borrow.borrower)}</div>
          <div class="borrow-dates">
            Borrowed: <span>${borrowed}</span> &nbsp;|&nbsp; Due: <span>${dueStr}</span>
          </div>
        </div>
        <span class="borrow-card-badge ${isOverdue ? 'badge-overdue' : 'badge-ok'}">
          ${isOverdue ? '⏰ Overdue' : '✅ On Time'}
        </span>
        <div class="borrow-card-actions">
          <button class="btn btn-primary" onclick="markReturned('${borrow.id}')">Mark Returned</button>
        </div>
      </div>`;
  }).join('');
}

function markReturned(borrowId) {
  DB.returnBook(borrowId);
  renderBorrowed();
  renderHistory();
  renderDashboard();
  renderLibrary();
  updateTotalChip();
  showToast('📗 Book marked as returned!', 'success');
}

// ---- BORROW MODAL ----
function initBorrowModal() {
  document.getElementById('openBorrowModal').addEventListener('click', () => {
    // Populate book select with non-borrowed books
    const books = DB.getBooks().filter(b => b.status !== 'Borrowed Out');
    const sel = document.getElementById('borrowBookSelect');
    sel.innerHTML = '<option value="">Select a book...</option>' +
      books.map(b => `<option value="${b.id}" data-title="${esc(b.title)}">${esc(b.title)}</option>`).join('');

    // Default dates
    const today = new Date();
    document.getElementById('borrowDate').value = today.toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 14);
    document.getElementById('returnDue').value = due.toISOString().split('T')[0];

    document.getElementById('borrowModal').classList.remove('hidden');
  });

  document.getElementById('closeBorrowModal').addEventListener('click', closeBorrowModal);
  document.getElementById('cancelBorrow').addEventListener('click', closeBorrowModal);
  document.getElementById('borrowModal').addEventListener('click', e => {
    if (e.target === document.getElementById('borrowModal')) closeBorrowModal();
  });

  document.getElementById('borrowForm').addEventListener('submit', e => {
    e.preventDefault();
    const sel = document.getElementById('borrowBookSelect');
    const bookId = sel.value;
    const bookTitle = sel.options[sel.selectedIndex].dataset.title;

    DB.addBorrow({
      bookId,
      bookTitle,
      borrower: document.getElementById('borrowerName').value.trim(),
      borrowDate: new Date(document.getElementById('borrowDate').value).toISOString(),
      dueDate: new Date(document.getElementById('returnDue').value).toISOString(),
      returned: false
    });

    closeBorrowModal();
    renderBorrowed();
    renderDashboard();
    renderLibrary();
    updateTotalChip();
    showToast('🤝 Borrow recorded!', 'success');
  });
}

function closeBorrowModal() {
  document.getElementById('borrowModal').classList.add('hidden');
  document.getElementById('borrowForm').reset();
}

// ---- HISTORY ----
function renderHistory(query = '') {
  let history = DB.getHistory();
  const bodyEl = document.getElementById('historyBody');
  const emptyEl = document.getElementById('historyEmpty');

  if (query) {
    const q = query.toLowerCase();
    history = history.filter(h =>
      h.bookTitle.toLowerCase().includes(q) ||
      h.borrower.toLowerCase().includes(q)
    );
  }

  if (history.length === 0) {
    bodyEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  bodyEl.innerHTML = history.map(h => {
    const borrowed = new Date(h.borrowDate).toLocaleDateString('en-GB');
    const returned = h.returnDate ? new Date(h.returnDate).toLocaleDateString('en-GB') : '—';
    return `
      <tr>
        <td><strong>${esc(h.bookTitle)}</strong></td>
        <td>${esc(h.borrower)}</td>
        <td>${borrowed}</td>
        <td>${returned}</td>
        <td><span class="${h.returned ? 'badge-returned' : 'badge-out'}">${h.returned ? 'Returned' : 'Still Out'}</span></td>
      </tr>`;
  }).join('');
}

document.getElementById('historySearch').addEventListener('input', e => {
  renderHistory(e.target.value);
});

document.getElementById('clearHistory').addEventListener('click', () => {
  if (confirm('Clear all borrowing history? This cannot be undone.')) {
    DB.clearHistory();
    renderHistory();
    showToast('History cleared.', 'error');
  }
});

// ---- UTILS ----
function updateTotalChip() {
  const count = DB.getBooks().length;
  document.getElementById('totalBooksChip').textContent = `📚 ${count} Book${count !== 1 ? 's' : ''}`;
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
}

function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
