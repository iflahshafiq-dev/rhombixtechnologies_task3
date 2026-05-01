// =============================================
//  MyBookShelf — Data Layer (data.js)
//  Handles localStorage persistence & defaults
// =============================================

const DB = {
  BOOKS_KEY: 'mybookshelf_books',
  BORROWS_KEY: 'mybookshelf_borrows',
  HISTORY_KEY: 'mybookshelf_history',

  // Default sample data for first-time users
  defaultBooks: [
    {
      id: 'b1',
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      category: 'History',
      status: 'Finished',
      isbn: '978-0-06-231609-7',
      year: 2011,
      pages: 443,
      rating: 5,
      cover: '',
      notes: 'Mind-blowing perspective on human civilization. A must-read.',
      dateAdded: new Date('2024-01-10').toISOString()
    },
    {
      id: 'b2',
      title: 'Atomic Habits',
      author: 'James Clear',
      category: 'Self-Help',
      status: 'Finished',
      isbn: '978-0-7352-1129-2',
      year: 2018,
      pages: 320,
      rating: 5,
      cover: '',
      notes: 'Changed how I think about building good habits. Very practical.',
      dateAdded: new Date('2024-02-05').toISOString()
    },
    {
      id: 'b3',
      title: 'The Hitchhiker\'s Guide to the Galaxy',
      author: 'Douglas Adams',
      category: 'Fiction',
      status: 'Reading',
      isbn: '978-0-345-39180-3',
      year: 1979,
      pages: 224,
      rating: 4,
      cover: '',
      notes: 'Hilarious and weirdly philosophical. Love it.',
      dateAdded: new Date('2024-03-18').toISOString()
    },
    {
      id: 'b4',
      title: 'Dune',
      author: 'Frank Herbert',
      category: 'Fantasy',
      status: 'Unread',
      isbn: '978-0-441-01382-6',
      year: 1965,
      pages: 688,
      rating: 0,
      cover: '',
      notes: 'Everyone says it\'s amazing. Added to my TBR pile.',
      dateAdded: new Date('2024-04-01').toISOString()
    },
    {
      id: 'b5',
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      category: 'Non-Fiction',
      status: 'Borrowed Out',
      isbn: '978-0-857-19776-9',
      year: 2020,
      pages: 256,
      rating: 4,
      cover: '',
      notes: 'Great insights on wealth and financial behavior.',
      dateAdded: new Date('2024-02-20').toISOString()
    },
    {
      id: 'b6',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      category: 'Technology',
      status: 'Finished',
      isbn: '978-0-13-235088-4',
      year: 2008,
      pages: 464,
      rating: 4,
      cover: '',
      notes: 'Essential reading for any developer. Changed how I write code.',
      dateAdded: new Date('2024-01-28').toISOString()
    }
  ],

  defaultBorrows: [
    {
      id: 'br1',
      bookId: 'b5',
      bookTitle: 'The Psychology of Money',
      borrower: 'Ahmed Raza',
      borrowDate: new Date('2024-11-01').toISOString(),
      dueDate: new Date('2024-11-25').toISOString(),
      returned: false
    }
  ],

  defaultHistory: [
    {
      id: 'h1',
      bookId: 'b2',
      bookTitle: 'Atomic Habits',
      borrower: 'Sara Khan',
      borrowDate: new Date('2024-09-01').toISOString(),
      returnDate: new Date('2024-09-20').toISOString(),
      returned: true
    },
    {
      id: 'h2',
      bookId: 'b6',
      bookTitle: 'Clean Code',
      borrower: 'Usman Tariq',
      borrowDate: new Date('2024-10-05').toISOString(),
      returnDate: new Date('2024-10-30').toISOString(),
      returned: true
    }
  ],

  // ---- BOOKS ----
  getBooks() {
    const raw = localStorage.getItem(this.BOOKS_KEY);
    if (!raw) {
      this.saveBooks(this.defaultBooks);
      return [...this.defaultBooks];
    }
    return JSON.parse(raw);
  },

  saveBooks(books) {
    localStorage.setItem(this.BOOKS_KEY, JSON.stringify(books));
  },

  addBook(book) {
    const books = this.getBooks();
    book.id = 'b' + Date.now();
    book.dateAdded = new Date().toISOString();
    books.unshift(book);
    this.saveBooks(books);
    return book;
  },

  updateBook(id, updates) {
    const books = this.getBooks();
    const i = books.findIndex(b => b.id === id);
    if (i !== -1) {
      books[i] = { ...books[i], ...updates };
      this.saveBooks(books);
      return books[i];
    }
  },

  deleteBook(id) {
    const books = this.getBooks().filter(b => b.id !== id);
    this.saveBooks(books);
  },

  getBookById(id) {
    return this.getBooks().find(b => b.id === id);
  },

  // ---- BORROWS ----
  getBorrows() {
    const raw = localStorage.getItem(this.BORROWS_KEY);
    if (!raw) {
      this.saveBorrows(this.defaultBorrows);
      return [...this.defaultBorrows];
    }
    return JSON.parse(raw);
  },

  saveBorrows(borrows) {
    localStorage.setItem(this.BORROWS_KEY, JSON.stringify(borrows));
  },

  addBorrow(borrow) {
    const borrows = this.getBorrows();
    borrow.id = 'br' + Date.now();
    borrows.unshift(borrow);
    this.saveBorrows(borrows);
    // Mark book as Borrowed Out
    this.updateBook(borrow.bookId, { status: 'Borrowed Out' });
    return borrow;
  },

  returnBook(borrowId) {
    const borrows = this.getBorrows();
    const borrow = borrows.find(b => b.id === borrowId);
    if (!borrow) return;

    // Move to history
    const history = this.getHistory();
    history.unshift({
      id: 'h' + Date.now(),
      bookId: borrow.bookId,
      bookTitle: borrow.bookTitle,
      borrower: borrow.borrower,
      borrowDate: borrow.borrowDate,
      returnDate: new Date().toISOString(),
      returned: true
    });
    this.saveHistory(history);

    // Remove from active borrows
    this.saveBorrows(borrows.filter(b => b.id !== borrowId));

    // Reset book status
    this.updateBook(borrow.bookId, { status: 'Unread' });
  },

  // ---- HISTORY ----
  getHistory() {
    const raw = localStorage.getItem(this.HISTORY_KEY);
    if (!raw) {
      this.saveHistory(this.defaultHistory);
      return [...this.defaultHistory];
    }
    return JSON.parse(raw);
  },

  saveHistory(history) {
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
  },

  clearHistory() {
    this.saveHistory([]);
  }
};
