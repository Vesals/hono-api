import { serve } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { BookType } from "../models/BookType";

const books: BookType[] = [
  { id: 1, title: "History", status: "Available" },
  { id: 2, title: "Science", status: "Not Available" },
  { id: 3, title: "Math", status: "On Loan" },
  // { id: 4, title: "Science Level:2", status: "On Loan" },
];

const booksRoute = new Hono();

// GET Books
booksRoute.get("/", (c) => {
  // /books?keyword=History
  const query = c.req.query();
  const keyword = query.keyword;

  if (keyword) {
    return c.json(books.filter((book) => book.title.includes(keyword)));
  }

  return c.json(books);
});

// POST Books
booksRoute.post("/", async (c) => {
  const body = await c.req.json();
  const title = body.title;

  if (!title) {
    return c.json({ error: "Please input name" });
  }

  const newBook: BookType = {
    id: books.length + 1,
    title: title,
    status: "Available",
  };

  books.push(newBook);

  return c.json(newBook);
});

// PUT Books/:id
booksRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const status = body.status;

  const book = books.find((book) => book.id === Number(id));

  if (!book) {
    return c.json({ error: "Book not found" });
  }

  book.status = status;

  return c.json(book);
});

// DEL /books/:id
booksRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");

  // Find the index of the book to remove
  const bookIndex = books.findIndex((book) => book.id === Number(id));

  if (bookIndex === -1) {
    return c.json({ error: "Book not found" });
  }

  // Remove the book from the array
  books.splice(bookIndex, 1);

  return c.json({ success: "Book deleted" });
});

export default booksRoute;
