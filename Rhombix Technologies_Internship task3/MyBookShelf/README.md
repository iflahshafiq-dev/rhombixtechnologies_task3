# 📚 MyBookShelf — Personal Library Manager

A beautiful, fully functional personal book library web app built with pure HTML, CSS, and JavaScript. No frameworks, no dependencies, no installation needed.

---

## 🚀 How to Run

1. **Unzip** the folder anywhere on your computer
2. **Open** `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
3. That's it — no server, no npm, no setup required!

> **Tip for VS Code users:** Install the "Live Server" extension, right-click `index.html`, and choose "Open with Live Server" for the best experience.

---

## ✨ Features

### 📊 Dashboard
- Live stats: Total books, Currently Reading, Borrowed Out, Finished
- Recently added books with quick-view
- Genre breakdown bar chart
- Overdue borrowed books alert

### 📖 My Library
- View all books in **Grid** or **List** view
- **Filter** by Category and Reading Status
- **Sort** by Date Added, Title, Author, or Rating
- Click any book for a detailed view
- Edit or delete books inline

### ➕ Add Book
- Add books with: Title, Author, Category, Status, ISBN, Year, Pages
- **5-star rating** system
- Cover image via URL
- Personal notes

### 🤝 Borrowed Books
- Record who borrowed which book
- Set borrow date & due date
- **Overdue alerts** highlighted in red
- One-click "Mark as Returned"

### 🕓 Borrowing History
- Full history of all past borrows
- Search by book name or borrower
- Clear history option

### 🔍 Global Search
- Search across all books from the top bar (by title, author, genre)

---

## 📁 Project Structure

```
MyBookShelf/
├── index.html         ← Main app file (open this!)
├── css/
│   └── style.css      ← All styles & themes
├── js/
│   ├── data.js        ← Data layer (localStorage)
│   └── app.js         ← App logic & rendering
└── README.md
```

---

## 💾 Data Storage

All data is saved in your **browser's localStorage** — no internet or server needed. Your books persist between sessions automatically.

> To reset all data: Open browser DevTools → Application → Local Storage → Clear.

---

## 🎨 Design

- **Warm editorial aesthetic** inspired by cozy libraries
- **Playfair Display** (serif) + **DM Sans** (sans-serif) typography
- Fully **responsive** — works on mobile, tablet, desktop
- Smooth animations and micro-interactions

---

Made with ♥ for book lovers.
