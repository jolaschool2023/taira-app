"""SQLite persistence layer for Lumen, the intelligent library."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATABASE = BASE_DIR / "data" / "library.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    year INTEGER NOT NULL,
    pages INTEGER NOT NULL,
    rating REAL NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '',
    cover TEXT NOT NULL DEFAULT 'forest',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    borrower TEXT NOT NULL,
    borrowed_at TEXT NOT NULL,
    returned_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower);
CREATE INDEX IF NOT EXISTS idx_loans_book ON loans(book_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_loan ON loans(book_id) WHERE returned_at IS NULL;
"""

BOOK_SELECT = """
SELECT
    b.*,
    l.id AS loan_id,
    l.borrower AS borrowed_by,
    l.borrowed_at AS borrowed_at,
    CASE WHEN l.id IS NULL THEN 1 ELSE 0 END AS available
FROM books b
LEFT JOIN loans l ON l.book_id = b.id AND l.returned_at IS NULL
"""

SEED_BOOKS = [
    {
        "title": "El nombre del viento",
        "author": "Patrick Rothfuss",
        "genre": "Fantasía",
        "year": 2007,
        "pages": 662,
        "rating": 4.8,
        "cover": "ember",
        "tags": "magia, música, academia, aventura, épica, amistad",
        "description": "Kvothe relata su infancia entre artistas, su paso por una universidad de magia y la búsqueda de los nombres verdaderos. Una historia de ambición, pérdida y leyenda.",
    },
    {
        "title": "Dune",
        "author": "Frank Herbert",
        "genre": "Ciencia ficción",
        "year": 1965,
        "pages": 688,
        "rating": 4.7,
        "cover": "sand",
        "tags": "desierto, política, ecología, imperio, profecía, aventura",
        "description": "Paul Atreides llega a Arrakis, el planeta más peligroso del universo y única fuente de la especia. Allí descubre el peso del poder, la religión y el destino.",
    },
    {
        "title": "La sombra del viento",
        "author": "Carlos Ruiz Zafón",
        "genre": "Misterio",
        "year": 2001,
        "pages": 576,
        "rating": 4.6,
        "cover": "night",
        "tags": "Barcelona, libros, secretos, posguerra, misterio, romance",
        "description": "Un joven descubre un libro maldito en el Cementerio de los Libros Olvidados. Su búsqueda del autor lo arrastra a una Barcelona de sombras y secretos.",
    },
    {
        "title": "Cien años de soledad",
        "author": "Gabriel García Márquez",
        "genre": "Realismo mágico",
        "year": 1967,
        "pages": 471,
        "rating": 4.8,
        "cover": "aurora",
        "tags": "familia, Macondo, generaciones, memoria, magia, clásico",
        "description": "La familia Buendía atraviesa generaciones de amores imposibles, guerras y milagros cotidianos en Macondo, un pueblo donde la realidad y el mito comparten la misma casa.",
    },
    {
        "title": "Klara y el sol",
        "author": "Kazuo Ishiguro",
        "genre": "Ciencia ficción",
        "year": 2021,
        "pages": 352,
        "rating": 4.2,
        "cover": "cosmos",
        "tags": "inteligencia artificial, futuro, ternura, humanidad, familia, distopía",
        "description": "Klara, una amiga artificial, observa el mundo desde el escaparate de una tienda. Cuando es elegida por una familia, intentará comprender el amor, la fe y lo que nos hace humanos.",
    },
    {
        "title": "El problema de los tres cuerpos",
        "author": "Cixin Liu",
        "genre": "Ciencia ficción",
        "year": 2008,
        "pages": 448,
        "rating": 4.5,
        "cover": "ocean",
        "tags": "espacio, física, alienígenas, conspiración, ciencia, futuro",
        "description": "Una señal desde el espacio cambia para siempre el destino de la humanidad. Científicos de todo el mundo deben enfrentarse a un enemigo que conoce cada uno de sus movimientos.",
    },
    {
        "title": "La casa de los espíritus",
        "author": "Isabel Allende",
        "genre": "Realismo mágico",
        "year": 1982,
        "pages": 496,
        "rating": 4.5,
        "cover": "rose",
        "tags": "familia, Chile, política, mujeres, memoria, magia",
        "description": "Las vidas de cuatro generaciones de la familia Trueba se entrelazan con la historia de Chile. Un relato de pasiones, ideales y secretos contados por mujeres memorables.",
    },
    {
        "title": "Sapiens",
        "author": "Yuval Noah Harari",
        "genre": "Historia",
        "year": 2011,
        "pages": 496,
        "rating": 4.4,
        "cover": "sand",
        "tags": "humanidad, historia, evolución, sociedad, ciencia, ensayo",
        "description": "Un recorrido provocador por la historia de la humanidad, desde los primeros cazadores hasta la era de los algoritmos, y una pregunta incómoda sobre nuestro futuro.",
    },
    {
        "title": "El poder del ahora",
        "author": "Eckhart Tolle",
        "genre": "Filosofía",
        "year": 1997,
        "pages": 256,
        "rating": 4.0,
        "cover": "moss",
        "tags": "meditación, presente, conciencia, bienestar, espiritualidad, ensayo",
        "description": "Una invitación a soltar el ruido de la mente y habitar el presente. Ideas sencillas para transformar la relación con los pensamientos, el miedo y la identidad.",
    },
    {
        "title": "Orgullo y prejuicio",
        "author": "Jane Austen",
        "genre": "Romance",
        "year": 1813,
        "pages": 432,
        "rating": 4.6,
        "cover": "rose",
        "tags": "amor, sociedad, Inglaterra, familia, clásico, ingenio",
        "description": "Elizabeth Bennet y el señor Darcy chocan por orgullo, prejuicio y una atracción que ninguno quiere admitir. Una comedia brillante sobre el amor y las reglas sociales.",
    },
    {
        "title": "El resplandor",
        "author": "Stephen King",
        "genre": "Terror",
        "year": 1977,
        "pages": 688,
        "rating": 4.4,
        "cover": "night",
        "tags": "hotel, familia, aislamiento, fantasmas, locura, terror",
        "description": "Jack Torrance acepta cuidar durante el invierno un hotel vacío en las montañas. El aislamiento y los fantasmas del lugar despiertan algo oscuro en él y en su hijo.",
    },
    {
        "title": "La chica del tren",
        "author": "Paula Hawkins",
        "genre": "Thriller",
        "year": 2015,
        "pages": 336,
        "rating": 3.9,
        "cover": "ocean",
        "tags": "suspenso, misterio, obsesión, testimonio, crimen, giros",
        "description": "Rachel observa cada día una casa junto a las vías y cree conocer a quienes viven allí. Una noticia la convierte en testigo de un misterio que la involucra más de lo que imagina.",
    },
    {
        "title": "Tokio blues",
        "author": "Haruki Murakami",
        "genre": "Contemporáneo",
        "year": 1987,
        "pages": 384,
        "rating": 4.3,
        "cover": "violet",
        "tags": "juventud, amor, pérdida, música, Tokio, melancolía",
        "description": "Toru Watanabe recuerda sus años universitarios en Tokio, una época de amistades intensas, primeros amores y pérdidas que marcarán su forma de estar en el mundo.",
    },
    {
        "title": "El principito",
        "author": "Antoine de Saint-Exupéry",
        "genre": "Fábula",
        "year": 1943,
        "pages": 96,
        "rating": 4.9,
        "cover": "aurora",
        "tags": "amistad, infancia, filosofía, viaje, ternura, clásico",
        "description": "Un aviador perdido en el desierto conoce a un pequeño príncipe que viene de otro planeta. Una historia sobre la amistad, la soledad y lo esencial que solo se ve con el corazón.",
    },
    {
        "title": "Rayuela",
        "author": "Julio Cortázar",
        "genre": "Experimental",
        "year": 1963,
        "pages": 736,
        "rating": 4.3,
        "cover": "ember",
        "tags": "París, juego, amor, estructura, jazz, libertad, clásico",
        "description": "Horacio Oliveira busca a la Maga entre París y Buenos Aires. Una novela que puede leerse en múltiples órdenes y que transforma al lector en cómplice del juego.",
    },
    {
        "title": "La ciudad y los perros",
        "author": "Mario Vargas Llosa",
        "genre": "Contemporáneo",
        "year": 1963,
        "pages": 432,
        "rating": 4.2,
        "cover": "moss",
        "tags": "colegio, poder, juventud, Lima, violencia, amistad",
        "description": "En un colegio militar de Lima, un grupo de cadetes esconde un secreto que amenaza con romper el frágil orden de la institución. Una novela sobre el poder y la lealtad.",
    },
]


def connect(database_path: str | Path = DEFAULT_DATABASE) -> sqlite3.Connection:
    path = Path(database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def init_database(database_path: str | Path = DEFAULT_DATABASE) -> None:
    connection = connect(database_path)
    try:
        connection.executescript(SCHEMA)
        count = connection.execute("SELECT COUNT(*) FROM books").fetchone()[0]
        if count == 0:
            connection.executemany(
                """
                INSERT INTO books
                    (title, author, genre, year, pages, rating, description, tags, cover, created_at)
                VALUES
                    (:title, :author, :genre, :year, :pages, :rating, :description, :tags, :cover, :created_at)
                """,
                [{**book, "created_at": now_iso()} for book in SEED_BOOKS],
            )
        connection.commit()
    finally:
        connection.close()


def book_from_row(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    data["tags"] = [tag.strip() for tag in data.get("tags", "").split(",") if tag.strip()]
    data["available"] = bool(data.get("available", 1))
    return data


def get_books(
    connection: sqlite3.Connection,
    query: str = "",
    genre: str = "",
    availability: str = "all",
    sort: str = "featured",
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []

    if query.strip():
        term = f"%{query.strip()}%"
        clauses.append(
            "(b.title LIKE ? OR b.author LIKE ? OR b.genre LIKE ? OR b.tags LIKE ? OR b.description LIKE ?)"
        )
        params.extend([term, term, term, term, term])

    if genre.strip():
        clauses.append("LOWER(b.genre) = LOWER(?)")
        params.append(genre.strip())

    if availability == "available":
        clauses.append("l.id IS NULL")
    elif availability == "borrowed":
        clauses.append("l.id IS NOT NULL")

    order = {
        "rating": "b.rating DESC, b.title ASC",
        "newest": "b.year DESC, b.title ASC",
        "title": "b.title ASC",
        "pages": "b.pages ASC, b.title ASC",
        "featured": "l.id IS NULL DESC, b.rating DESC, b.year DESC",
    }.get(sort, "l.id IS NULL DESC, b.rating DESC, b.year DESC")

    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = connection.execute(f"{BOOK_SELECT}{where} ORDER BY {order}", params).fetchall()
    return [book_from_row(row) for row in rows]


def get_book(connection: sqlite3.Connection, book_id: int) -> dict[str, Any] | None:
    row = connection.execute(f"{BOOK_SELECT} WHERE b.id = ?", (book_id,)).fetchone()
    return book_from_row(row) if row else None


def create_book(connection: sqlite3.Connection, payload: dict[str, Any]) -> dict[str, Any]:
    tags = payload.get("tags", [])
    if isinstance(tags, list):
        tags = ", ".join(str(tag).strip() for tag in tags if str(tag).strip())

    cursor = connection.execute(
        """
        INSERT INTO books
            (title, author, genre, year, pages, rating, description, tags, cover, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["title"].strip(),
            payload["author"].strip(),
            payload["genre"].strip(),
            payload["year"],
            payload["pages"],
            payload.get("rating", 0),
            payload.get("description", "").strip(),
            tags,
            payload.get("cover", "forest"),
            now_iso(),
        ),
    )
    connection.commit()
    return get_book(connection, cursor.lastrowid)


def get_loans(
    connection: sqlite3.Connection,
    borrower: str = "",
    active_only: bool = False,
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    if borrower.strip():
        clauses.append("LOWER(l.borrower) = LOWER(?)")
        params.append(borrower.strip())
    if active_only:
        clauses.append("l.returned_at IS NULL")
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = connection.execute(
        f"""
        SELECT l.*, b.title, b.author, b.genre, b.pages, b.cover,
               CASE WHEN l.returned_at IS NULL THEN 1 ELSE 0 END AS active
        FROM loans l
        JOIN books b ON b.id = l.book_id
        {where}
        ORDER BY l.returned_at IS NULL DESC, l.borrowed_at DESC
        """,
        params,
    ).fetchall()
    results = []
    for row in rows:
        loan = dict(row)
        loan["active"] = bool(loan["active"])
        results.append(loan)
    return results


def borrow_book(connection: sqlite3.Connection, book_id: int, borrower: str) -> dict[str, Any]:
    book = get_book(connection, book_id)
    if not book:
        raise LookupError("El libro no existe.")
    if not book["available"]:
        raise ValueError("Este libro ya está prestado.")
    try:
        cursor = connection.execute(
            "INSERT INTO loans (book_id, borrower, borrowed_at) VALUES (?, ?, ?)",
            (book_id, borrower.strip(), now_iso()),
        )
        connection.commit()
    except sqlite3.IntegrityError as error:
        connection.rollback()
        raise ValueError("Este libro acaba de ser prestado.") from error
    return dict(connection.execute("SELECT * FROM loans WHERE id = ?", (cursor.lastrowid,)).fetchone())


def return_book(connection: sqlite3.Connection, book_id: int, borrower: str = "") -> dict[str, Any]:
    clauses = ["book_id = ?", "returned_at IS NULL"]
    params: list[Any] = [book_id]
    if borrower.strip():
        clauses.append("LOWER(borrower) = LOWER(?)")
        params.append(borrower.strip())
    row = connection.execute(
        f"SELECT * FROM loans WHERE {' AND '.join(clauses)}", params
    ).fetchone()
    if not row:
        raise LookupError("No hay un préstamo activo para este libro.")
    connection.execute(
        "UPDATE loans SET returned_at = ? WHERE id = ?", (now_iso(), row["id"])
    )
    connection.commit()
    return dict(connection.execute("SELECT * FROM loans WHERE id = ?", (row["id"],)).fetchone())


def get_stats(connection: sqlite3.Connection) -> dict[str, int]:
    total_books = connection.execute("SELECT COUNT(*) FROM books").fetchone()[0]
    active_loans = connection.execute(
        "SELECT COUNT(*) FROM loans WHERE returned_at IS NULL"
    ).fetchone()[0]
    readers = connection.execute("SELECT COUNT(DISTINCT borrower) FROM loans").fetchone()[0]
    reviews = connection.execute("SELECT COUNT(*) FROM books WHERE rating > 0").fetchone()[0]
    average_rating = connection.execute(
        "SELECT COALESCE(AVG(rating), 0) FROM books WHERE rating > 0"
    ).fetchone()[0]
    return {
        "total_books": total_books,
        "available_books": total_books - active_loans,
        "active_loans": active_loans,
        "readers": readers,
        "rated_books": reviews,
        "average_rating": round(average_rating, 1),
    }


def get_genres(connection: sqlite3.Connection) -> list[str]:
    rows = connection.execute(
        "SELECT DISTINCT genre FROM books ORDER BY genre COLLATE NOCASE"
    ).fetchall()
    return [row["genre"] for row in rows]
