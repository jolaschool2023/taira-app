"""Lumen: a full-stack intelligent library powered by a local AI engine."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from flask import Flask, g, jsonify, request

from ai_engine import LibraryAI
from database import (
    DEFAULT_DATABASE,
    borrow_book,
    connect,
    create_book,
    get_book,
    get_books,
    get_genres,
    get_loans,
    get_stats,
    init_database,
    return_book,
)

ALLOWED_COVERS = {"aurora", "ember", "cosmos", "sand", "rose", "ocean", "violet", "night", "moss", "forest"}


def create_app(test_config: dict[str, Any] | None = None) -> Flask:
    app = Flask(__name__, static_folder="static", static_url_path="")
    app.config.from_mapping(
        DATABASE=os.environ.get("LIBRARY_DB", str(DEFAULT_DATABASE)),
        JSON_SORT_KEYS=False,
    )
    if test_config:
        app.config.update(test_config)

    app.config["DATABASE"] = str(Path(app.config["DATABASE"]))
    init_database(app.config["DATABASE"])
    app.extensions["library_ai"] = LibraryAI()

    def db():
        if "db" not in g:
            g.db = connect(app.config["DATABASE"])
        return g.db

    @app.teardown_appcontext
    def close_db(_error=None):
        connection = g.pop("db", None)
        if connection is not None:
            connection.close()

    @app.after_request
    def add_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/")
    def index():
        return app.send_static_file("index.html")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "lumen-library", "ai": "local-tfidf"})

    @app.get("/api/books")
    def list_books():
        books = get_books(
            db(),
            query=request.args.get("q", ""),
            genre=request.args.get("genre", ""),
            availability=request.args.get("availability", "all"),
            sort=request.args.get("sort", "featured"),
        )
        return jsonify({"count": len(books), "results": books})

    @app.get("/api/books/<int:book_id>")
    def book_detail(book_id: int):
        book = get_book(db(), book_id)
        if not book:
            return jsonify({"error": "El libro no existe."}), 404
        return jsonify(book)

    @app.post("/api/books")
    def add_book():
        payload = request.get_json(silent=True)
        errors = validate_book(payload)
        if errors:
            return jsonify({"errors": errors}), 400
        book = create_book(db(), payload)
        return jsonify(book), 201

    @app.get("/api/genres")
    def genres():
        return jsonify({"genres": get_genres(db())})

    @app.get("/api/stats")
    def stats():
        return jsonify(get_stats(db()))

    @app.get("/api/loans")
    def loans():
        borrower = request.args.get("borrower", "")
        active_only = request.args.get("active", "").lower() in {"1", "true", "yes"}
        results = get_loans(db(), borrower=borrower, active_only=active_only)
        return jsonify({"count": len(results), "results": results})

    @app.post("/api/books/<int:book_id>/borrow")
    def borrow(book_id: int):
        payload = request.get_json(silent=True) or {}
        borrower = str(payload.get("borrower", "")).strip()
        if not 2 <= len(borrower) <= 60:
            return jsonify({"error": "El nombre del lector debe tener entre 2 y 60 caracteres."}), 400
        try:
            loan = borrow_book(db(), book_id, borrower)
        except LookupError as error:
            return jsonify({"error": str(error)}), 404
        except ValueError as error:
            return jsonify({"error": str(error)}), 409
        return jsonify({"loan": loan, "book": get_book(db(), book_id)}), 201

    @app.post("/api/books/<int:book_id>/return")
    def give_back(book_id: int):
        payload = request.get_json(silent=True) or {}
        borrower = str(payload.get("borrower", "")).strip()
        book = get_book(db(), book_id)
        if not book:
            return jsonify({"error": "El libro no existe."}), 404
        if borrower and book.get("borrowed_by") and book["borrowed_by"].lower() != borrower.lower():
            return jsonify({"error": "Este libro está prestado a otra persona."}), 409
        try:
            loan = return_book(db(), book_id, borrower)
        except LookupError as error:
            return jsonify({"error": str(error)}), 409
        return jsonify({"loan": loan, "book": get_book(db(), book_id)})

    @app.get("/api/recommendations")
    def recommendations():
        borrower = request.args.get("borrower", "").strip()
        query = request.args.get("q", "").strip()
        try:
            limit = max(1, min(int(request.args.get("limit", 4)), 12))
        except ValueError:
            limit = 4
        books = get_books(db(), sort="featured")
        loans = get_loans(db())
        results = app.extensions["library_ai"].recommend(
            books, loans, borrower=borrower, query=query, limit=limit
        )
        has_history = bool(
            borrower
            and any(
                loan["borrower"].lower() == borrower.lower()
                for loan in loans
            )
        )
        return jsonify(
            {
                "borrower": borrower,
                "strategy": "historial-personal" if has_history else "seleccion-editorial",
                "generated_by": "Lumen AI local",
                "count": len(results),
                "results": results,
            }
        )

    @app.get("/api/assistant/suggestions")
    def assistant_suggestions():
        return jsonify(
            {
                "suggestions": [
                    "Recomiéndame una novela corta",
                    "¿Qué libro se parece a Dune?",
                    "Busco una historia que me haga sentir bien",
                    "¿Qué tienes disponible ahora?",
                ]
            }
        )

    @app.post("/api/assistant")
    def assistant():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Envía un objeto JSON con el campo 'message'."}), 400
        message = str(payload.get("message", "")).strip()
        if not message:
            return jsonify({"error": "El mensaje no puede estar vacío."}), 400
        if len(message) > 600:
            return jsonify({"error": "El mensaje no puede superar los 600 caracteres."}), 400
        borrower = str(payload.get("borrower", "")).strip()
        books = get_books(db(), sort="featured")
        loans = get_loans(db())
        result = app.extensions["library_ai"].chat(message, books, loans, borrower)
        result["generated_by"] = "Lumen AI local"
        return jsonify(result)

    @app.get("/api/insights")
    def insights():
        borrower = request.args.get("borrower", "").strip()
        result = app.extensions["library_ai"].reading_insights(
            get_books(db(), sort="featured"), get_loans(db()), borrower
        )
        return jsonify(result)

    @app.errorhandler(404)
    def not_found(_error):
        if request.path.startswith("/api/"):
            return jsonify({"error": "Ruta no encontrada."}), 404
        return app.send_static_file("index.html")

    return app


def validate_book(payload: Any) -> list[str]:
    if not isinstance(payload, dict):
        return ["El cuerpo de la petición debe ser un objeto JSON."]
    errors: list[str] = []
    for field, label in (
        ("title", "El título"),
        ("author", "El autor"),
        ("genre", "El género"),
    ):
        value = payload.get(field)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{label} es obligatorio.")
        elif len(value.strip()) > 160:
            errors.append(f"{label} no puede superar los 160 caracteres.")

    year = payload.get("year")
    if not isinstance(year, int) or isinstance(year, bool) or not 1000 <= year <= 2100:
        errors.append("El año debe ser un entero entre 1000 y 2100.")

    pages = payload.get("pages")
    if not isinstance(pages, int) or isinstance(pages, bool) or not 1 <= pages <= 5000:
        errors.append("Las páginas deben ser un entero entre 1 y 5000.")

    rating = payload.get("rating", 0)
    if not isinstance(rating, (int, float)) or isinstance(rating, bool) or not 0 <= rating <= 5:
        errors.append("La valoración debe estar entre 0 y 5.")

    description = payload.get("description", "")
    if not isinstance(description, str) or len(description) > 2000:
        errors.append("La descripción debe ser texto de hasta 2000 caracteres.")

    tags = payload.get("tags", "")
    if isinstance(tags, list):
        if any(not isinstance(tag, str) for tag in tags):
            errors.append("Las etiquetas deben ser texto.")
    elif not isinstance(tags, str):
        errors.append("Las etiquetas deben ser texto o una lista de textos.")

    cover = payload.get("cover", "forest")
    if cover not in ALLOWED_COVERS:
        errors.append("La portada elegida no es válida.")
    return errors


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", "5050")))
