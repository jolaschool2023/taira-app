"""Local, deterministic AI for recommendations, search and the library assistant.

The engine uses content-based features (TF-IDF plus cosine similarity), reading
history and lightweight intent parsing. It needs no API keys or external calls,
so the application remains fully functional offline.
"""

from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter
from typing import Any, Iterable

STOPWORDS = {
    "a", "al", "algo", "algun", "alguna", "algunas", "alguno", "algunos",
    "ante", "antes", "como", "con", "contra", "cual", "cuales", "cuando",
    "de", "del", "desde", "donde", "dos", "el", "ella", "ellas", "ello",
    "ellos", "en", "entre", "era", "es", "esa", "esas", "ese", "eso", "esos",
    "esta", "estas", "este", "esto", "estos", "fue", "ha", "hace", "hacia",
    "hasta", "hay", "la", "las", "le", "les", "lo", "los", "me", "mi", "mis",
    "mucho", "muy", "mas", "nada", "ni", "no", "nos", "o", "otra", "otro",
    "para", "pero", "poco", "por", "porque", "que", "quien", "se", "ser", "si",
    "sin", "sobre", "su", "sus", "tambien", "te", "tiene", "todo", "todos",
    "tu", "tus", "un", "una", "unas", "uno", "unos", "y", "ya", "yo",
    "libro", "libros", "leer", "lectura", "recomienda", "recomiendame",
    "recomiendas", "recomendacion", "recomendaciones", "sugiere", "sugerencia",
    "sugerencias", "quisiera", "quiero", "busco", "buscar", "dame", "gustaria",
    "puedes", "podrias", "ayudame", "algo",
}

GREETINGS = {
    "hola", "buenas", "buenos dias", "buenas tardes", "buenas noches",
    "hey", "saludos", "hello", "hi",
}

GENRE_KEYWORDS = {
    "Ciencia ficción": [
        "ciencia ficcion", "sci fi", "scifi", "espacio", "futuro", "futurista",
        "robot", "robots", "alien", "alienigena", "nave", "distopia", "ia",
        "inteligencia artificial", "planeta",
    ],
    "Fantasía": ["fantasia", "magia", "magico", "dragones", "epica", "hechicero"],
    "Misterio": ["misterio", "enigma", "detective", "investigar", "secreto"],
    "Thriller": ["thriller", "suspenso", "suspense", "crimen", "intriga", "policial"],
    "Terror": ["terror", "miedo", "horror", "fantasmas", "escalofrio"],
    "Romance": ["romance", "amor", "romantico", "romantica"],
    "Historia": ["novela historica", "historico", "humanidad", "ensayo historico"],
    "Filosofía": ["filosofia", "filosofico", "reflexion", "espiritual", "conciencia"],
    "Realismo mágico": ["realismo magico", "macondo", "magia cotidiana"],
    "Contemporáneo": ["contemporaneo", "actual", "realista", "cotidiano"],
    "Fábula": ["fabula", "cuento", "infancia", "alegoria"],
    "Experimental": ["experimental", "vanguardia", "juego literario"],
}

GENRE_ALIASES = {
    "ciencia ficcion": "Ciencia ficción",
    "fantasia": "Fantasía",
    "misterio": "Misterio",
    "thriller": "Thriller",
    "terror": "Terror",
    "romance": "Romance",
    "historia": "Historia",
    "filosofia": "Filosofía",
    "realismo magico": "Realismo mágico",
    "contemporaneo": "Contemporáneo",
    "fabula": "Fábula",
    "experimental": "Experimental",
}

SUGGESTIONS = [
    "Recomiéndame una novela corta",
    "¿Qué libro se parece a Dune?",
    "Busco una historia que me haga sentir bien",
    "¿Qué tienes disponible ahora?",
]


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", text.lower()).strip()


def tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", normalize(text))
    return [word for word in words if len(word) > 2 and word not in STOPWORDS]


def _book_text(book: dict[str, Any]) -> str:
    tags = book.get("tags", [])
    if isinstance(tags, list):
        tags = " ".join(tags)
    title = str(book.get("title", ""))
    return " ".join(
        [
            title,
            title,
            str(book.get("author", "")),
            str(book.get("genre", "")),
            str(book.get("genre", "")),
            str(tags),
            str(tags),
            str(book.get("description", "")),
        ]
    )


class LibraryAI:
    def _vectors(self, books: list[dict[str, Any]]) -> tuple[dict[int, dict[str, float]], dict[str, float]]:
        token_sets: dict[int, list[str]] = {
            book["id"]: tokenize(_book_text(book)) for book in books
        }
        document_frequency: Counter[str] = Counter()
        for tokens in token_sets.values():
            document_frequency.update(set(tokens))
        total = max(len(books), 1)
        idf = {
            term: math.log((1 + total) / (1 + frequency)) + 1
            for term, frequency in document_frequency.items()
        }
        vectors: dict[int, dict[str, float]] = {}
        for book_id, tokens in token_sets.items():
            counts = Counter(tokens)
            length = max(len(tokens), 1)
            vectors[book_id] = {
                term: (count / length) * idf.get(term, 1.0)
                for term, count in counts.items()
            }
        return vectors, idf

    def _profile_vector(
        self,
        history: list[dict[str, Any]],
        idf: dict[str, float],
    ) -> tuple[dict[str, float], Counter[str], Counter[str]]:
        vector: Counter[str] = Counter()
        genres: Counter[str] = Counter()
        authors: Counter[str] = Counter()
        for book in history:
            weight = 1.0 + (float(book.get("rating", 0)) / 5.0)
            tokens = tokenize(_book_text(book))
            counts = Counter(tokens)
            length = max(len(tokens), 1)
            for term, count in counts.items():
                vector[term] += (count / length) * idf.get(term, 1.0) * weight
            genres[book.get("genre", "")] += 1
            authors[book.get("author", "")] += 1
        return dict(vector), genres, authors

    @staticmethod
    def _cosine(left: dict[str, float], right: dict[str, float]) -> float:
        if not left or not right:
            return 0.0
        common = set(left) & set(right)
        numerator = sum(left[term] * right[term] for term in common)
        left_norm = math.sqrt(sum(value * value for value in left.values()))
        right_norm = math.sqrt(sum(value * value for value in right.values()))
        if not left_norm or not right_norm:
            return 0.0
        return numerator / (left_norm * right_norm)

    def recommend(
        self,
        books: list[dict[str, Any]],
        loans: list[dict[str, Any]],
        borrower: str = "",
        query: str = "",
        limit: int = 4,
        max_pages: int | None = None,
        min_pages: int | None = None,
        prefer_new: bool = False,
        genre: str = "",
    ) -> list[dict[str, Any]]:
        if not books:
            return []

        normalized_borrower = normalize(borrower)
        active_ids: set[int] = set()
        read_ids: set[int] = set()
        if normalized_borrower:
            for loan in loans:
                if normalize(loan.get("borrower", "")) != normalized_borrower:
                    continue
                read_ids.add(loan["book_id"])
                if loan.get("returned_at") is None:
                    active_ids.add(loan["book_id"])
        history = [book for book in books if book["id"] in read_ids]

        vectors, idf = self._vectors(books)
        profile, genre_preferences, _ = self._profile_vector(history, idf)
        query_vector: dict[str, float] = {}
        if query.strip():
            counts = Counter(tokenize(query))
            query_vector = {
                term: count * idf.get(term, 1.5) for term, count in counts.items()
            }

        popularity: Counter[int] = Counter(loan["book_id"] for loan in loans)
        max_popularity = max(popularity.values(), default=1)
        years = [book.get("year", 2000) for book in books]
        min_year, max_year = min(years), max(years)
        year_span = max(max_year - min_year, 1)
        top_genre = genre_preferences.most_common(1)[0][0] if genre_preferences else ""
        last_read = history[-1] if history else None

        candidates = []
        for book in books:
            if not book.get("available", True) or book["id"] in active_ids:
                continue
            if book["id"] in read_ids:
                continue
            if genre and book.get("genre") != genre:
                continue
            if max_pages and book.get("pages", 0) > max_pages:
                continue
            if min_pages and book.get("pages", 0) < min_pages:
                continue

            similarity = self._cosine(profile, vectors.get(book["id"], {}))
            query_similarity = self._cosine(query_vector, vectors.get(book["id"], {}))
            genre_score = 0.0
            if genre_preferences:
                genre_score = genre_preferences.get(book.get("genre", ""), 0) / max(
                    sum(genre_preferences.values()), 1
                )
            rating_score = float(book.get("rating", 0)) / 5.0
            popularity_score = popularity.get(book["id"], 0) / max_popularity
            newness = (book.get("year", min_year) - min_year) / year_span
            if prefer_new:
                newness = 0.5 + newness

            if query_vector:
                score = (
                    0.52 * query_similarity
                    + 0.15 * similarity
                    + 0.13 * rating_score
                    + 0.10 * genre_score
                    + 0.06 * popularity_score
                    + 0.04 * newness
                )
            elif profile:
                score = (
                    0.48 * similarity
                    + 0.18 * genre_score
                    + 0.15 * rating_score
                    + 0.10 * popularity_score
                    + 0.09 * newness
                )
            else:
                score = (
                    0.55 * rating_score
                    + 0.25 * popularity_score
                    + 0.12 * newness
                    + 0.08 * similarity
                )

            reason = "Una de las mejor valoradas de la biblioteca"
            if query_vector and query_similarity > 0.08:
                reason = "Afinidad con tu búsqueda"
            if top_genre and book.get("genre") == top_genre:
                reason = f"Porque disfrutas de {top_genre}"
            elif last_read and similarity > 0.18:
                reason = f"Se parece a «{last_read['title']}»"

            candidate = dict(book)
            candidate["match_score"] = round(score, 4)
            candidate["reason"] = reason
            candidates.append(candidate)

        candidates.sort(key=lambda item: item["match_score"], reverse=True)
        return candidates[: max(1, min(limit, 12))]

    def similar_to(
        self,
        book: dict[str, Any],
        books: list[dict[str, Any]],
        limit: int = 3,
    ) -> list[dict[str, Any]]:
        vectors, _ = self._vectors(books)
        source = vectors.get(book["id"], {})
        scored = []
        for candidate in books:
            if candidate["id"] == book["id"]:
                continue
            similarity = self._cosine(source, vectors.get(candidate["id"], {}))
            if candidate.get("genre") == book.get("genre"):
                similarity += 0.18
            if candidate.get("author") == book.get("author"):
                similarity += 0.12
            result = dict(candidate)
            result["match_score"] = round(similarity, 4)
            result["reason"] = "Universo y atmósfera similares"
            scored.append(result)
        scored.sort(key=lambda item: item["match_score"], reverse=True)
        return scored[:limit]

    def reading_insights(
        self,
        books: list[dict[str, Any]],
        loans: list[dict[str, Any]],
        borrower: str,
    ) -> dict[str, Any]:
        by_id = {book["id"]: book for book in books}
        own_loans = [
            loan for loan in loans if normalize(loan.get("borrower", "")) == normalize(borrower)
        ]
        read_books = [by_id[loan["book_id"]] for loan in own_loans if loan["book_id"] in by_id]
        genres = Counter(book.get("genre", "") for book in read_books)
        authors = Counter(book.get("author", "") for book in read_books)
        active = sum(1 for loan in own_loans if loan.get("returned_at") is None)
        pages = sum(book.get("pages", 0) for book in read_books)
        top_genres = [{"genre": genre, "count": count} for genre, count in genres.most_common(3)]
        top_authors = [
            {"author": author, "count": count} for author, count in authors.most_common(3)
        ]
        favorite = max(read_books, key=lambda item: item.get("rating", 0), default=None)

        if not read_books:
            summary = (
                "Todavía no conozco tus gustos. Toma prestado tu primer libro y empezaré "
                "a construir tu perfil lector para recomendarte historias cada vez más afines."
            )
        else:
            favorite_genre = top_genres[0]["genre"]
            reader_name = borrower.strip().split()[0]
            favorite_title = favorite["title"] if favorite else ""
            summary = (
                f"{reader_name}, has explorado {len(read_books)} título"
                f"{'s' if len(read_books) != 1 else ''} y {pages} páginas. "
                f"Tu brújula apunta hacia {favorite_genre.lower()} "
                f"y disfrutas especialmente de {top_authors[0]['author']}. "
                f"Tu lectura mejor valorada hasta ahora es «{favorite_title}». "
                "La próxima recomendación mezclará esa afinidad con una pizca de sorpresa."
            )

        return {
            "borrower": borrower,
            "total_books": len(read_books),
            "pages": pages,
            "active_loans": active,
            "top_genres": top_genres,
            "top_authors": top_authors,
            "favorite_book": favorite,
            "summary": summary,
        }

    def _detect_genre(self, text: str) -> str:
        normalized = normalize(text)
        for genre, keywords in GENRE_KEYWORDS.items():
            if any(normalize(keyword) in normalized for keyword in keywords):
                return genre
        for alias, genre in GENRE_ALIASES.items():
            if re.search(rf"\b{re.escape(alias)}\b", normalized):
                return genre
        return ""

    @staticmethod
    def _detect_title(text: str, books: Iterable[dict[str, Any]]) -> dict[str, Any] | None:
        normalized = normalize(text)
        matches = [
            book for book in books if normalize(book.get("title", "")) in normalized
        ]
        return max(matches, key=lambda book: len(book.get("title", "")), default=None)

    @staticmethod
    def _detect_author(text: str, books: Iterable[dict[str, Any]]) -> dict[str, Any] | None:
        normalized = normalize(text)
        matches = [
            book for book in books if normalize(book.get("author", "")) in normalized
        ]
        return max(matches, key=lambda book: len(book.get("author", "")), default=None)

    def chat(
        self,
        message: str,
        books: list[dict[str, Any]],
        loans: list[dict[str, Any]],
        borrower: str = "",
    ) -> dict[str, Any]:
        normalized = normalize(message)
        first_name = borrower.split()[0] if borrower.strip() else ""
        greeting = f", {first_name}" if first_name else ""

        if not normalized:
            return {
                "intent": "empty",
                "reply": "Escríbeme qué te apetece leer y buscaré entre los estantes.",
                "books": [],
                "suggestions": SUGGESTIONS,
            }

        if normalized in GREETINGS or any(normalized.startswith(g) for g in GREETINGS):
            return {
                "intent": "greeting",
                "reply": (
                    f"Hola{greeting}. Soy Lumen, tu bibliotecario digital. "
                    "Puedo recomendarte por género, estado de ánimo, extensión o parecido "
                    "con un libro que ya hayas disfrutado. ¿Qué te apetece hoy?"
                ),
                "books": self.recommend(books, loans, borrower, limit=3),
                "suggestions": SUGGESTIONS,
            }

        if any(word in normalized for word in ("ayuda", "que puedes hacer", "como funciona", "opciones")):
            return {
                "intent": "help",
                "reply": (
                    "Puedo hacer tres cosas: recomendarte libros según tus préstamos, "
                    "encontrar títulos por tema o extensión, y comparar un libro con otros "
                    "de la biblioteca. Prueba con «algo corto de misterio», «parecido a Dune» "
                    "o pregúntame cuántos títulos hay disponibles."
                ),
                "books": [],
                "suggestions": SUGGESTIONS,
            }

        if any(word in normalized for word in ("quien eres", "que eres", "tu nombre")):
            return {
                "intent": "identity",
                "reply": (
                    "Soy Lumen, un motor de recomendación local. Combino tus lecturas con "
                    "TF-IDF y similitud de contenido para entender temas, atmósferas y estilos. "
                    "No envío tus datos a ningún servicio externo."
                ),
                "books": [],
                "suggestions": SUGGESTIONS,
            }

        if "disponible" in normalized and not any(
            word in normalized for word in ("recomienda", "sugiere", "que leo", "quiero leer")
        ):
            available = [book for book in books if book.get("available")]
            examples = ", ".join(f"«{book['title']}»" for book in available[:4])
            return {
                "intent": "availability",
                "reply": (
                    f"Ahora mismo hay {len(available)} de {len(books)} títulos disponibles. "
                    f"Entre ellos: {examples}. ¿Te recomiendo alguno según tus gustos?"
                ),
                "books": available[:4],
                "suggestions": SUGGESTIONS,
            }

        if any(word in normalized for word in ("cuantos", "total de libros", "catalogo")):
            return {
                "intent": "stats",
                "reply": (
                    f"La biblioteca reúne {len(books)} títulos, de {len({b['genre'] for b in books})} "
                    f"géneros distintos. Quedan {sum(1 for b in books if b.get('available'))} "
                    "disponibles para llevar a casa."
                ),
                "books": [],
                "suggestions": SUGGESTIONS,
            }

        detected_book = self._detect_title(message, books)
        if detected_book and any(
            phrase in normalized
            for phrase in ("de que trata", "resumen", "sobre que", "cuentame", "hablame")
        ):
            status = (
                "Está disponible en la biblioteca."
                if detected_book.get("available")
                else f"Ahora mismo está prestado a {detected_book.get('borrowed_by', 'otra persona')}."
            )
            similar = [
                book for book in self.similar_to(detected_book, books, limit=3)
                if book.get("available")
            ]
            return {
                "intent": "book_summary",
                "reply": (
                    f"«{detected_book['title']}», de {detected_book['author']}, es una obra de "
                    f"{detected_book['genre'].lower()} publicada en {detected_book['year']}. "
                    f"{detected_book['description']} {status}"
                ),
                "books": [detected_book] + similar[:2],
                "suggestions": [
                    f"¿Qué se parece a {detected_book['title']}?",
                    "Recomiéndame algo diferente",
                    "¿Qué tienes disponible?",
                ],
            }

        if detected_book:
            similar = [
                book for book in self.similar_to(detected_book, books, limit=4)
                if book.get("available")
            ]
            return {
                "intent": "similar",
                "reply": (
                    f"Si te interesa «{detected_book['title']}», estas lecturas comparten su "
                    "atmósfera o exploran temas cercanos. Las he ordenado por afinidad."
                ),
                "books": similar[:3],
                "suggestions": [
                    f"¿De qué trata {detected_book['title']}?",
                    "Busco algo más ligero",
                    "Recomiéndame una novela corta",
                ],
            }

        detected_author = self._detect_author(message, books)
        detected_genre = self._detect_genre(message)
        short_request = any(
            word in normalized
            for word in ("corto", "corta", "cortos", "cortas", "breve", "breves", "ligero", "ligera")
        )
        long_request = any(
            word in normalized
            for word in ("largo", "larga", "extenso", "extensa", "denso", "densa")
        )
        max_pages = 360 if short_request else None
        min_pages = 500 if long_request else None
        prefer_new = any(word in normalized for word in ("nuevo", "novedad", "reciente", "moderno"))
        mood_words = any(
            phrase in normalized
            for phrase in ("sentir bien", "optimista", "feliz", "acogedor", "ternura", "ligero")
        )

        if detected_author:
            books_by_author = [book for book in books if book.get("author") == detected_author["author"]]
            available = [book for book in books_by_author if book.get("available")]
            if available:
                return {
                    "intent": "author",
                    "reply": (
                        f"Tengo {len(available)} título{'s' if len(available) != 1 else ''} de "
                        f"{detected_author['author']} disponible{'s' if len(available) != 1 else ''}. "
                        "¿Quieres que busque también autores con un estilo parecido?"
                    ),
                    "books": available[:4],
                    "suggestions": [
                        f"Algo parecido a {detected_author['author']}",
                        "¿Qué tienes disponible?",
                        "Recomiéndame algo breve",
                    ],
                }

        needs_recommendation = any(
            phrase in normalized
            for phrase in (
                "recomienda", "sugiere", "que leo", "quiero leer", "busco", "dame",
                "algo de", "libro de", "mejor", "parecido", "similar", "apetece",
                "novedad", "corto", "corta", "breve", "largo", "larga",
            )
        )

        if detected_genre or needs_recommendation or mood_words:
            query = " ".join(
                part for part in [message, detected_genre, "ternura amistad esperanza" if mood_words else ""]
                if part
            )
            recommendations = self.recommend(
                books,
                loans,
                borrower,
                query=query,
                limit=4,
                max_pages=max_pages,
                min_pages=min_pages,
                prefer_new=prefer_new,
                genre=detected_genre,
            )
            filters = []
            if detected_genre:
                filters.append(f"de {detected_genre.lower()}")
            if max_pages:
                filters.append(f"de menos de {max_pages} páginas")
            if min_pages:
                filters.append("de más de 500 páginas")
            if prefer_new:
                filters.append("recientes")
            filter_text = f" {', '.join(filters)}" if filters else ""
            if recommendations:
                plural = "lecturas" if len(recommendations) != 1 else "lectura"
                return {
                    "intent": "recommendation",
                    "reply": (
                        f"He seleccionado {len(recommendations)} {plural}{filter_text} "
                        "que encajan con lo que buscas. Todas están disponibles."
                    ),
                    "books": recommendations,
                    "suggestions": [
                        "¿Qué libro se parece a Dune?",
                        "Algo más ligero, por favor",
                        "¿Qué tienes disponible?",
                    ],
                }
            return {
                "intent": "no_results",
                "reply": (
                    "No he encontrado coincidencias disponibles con esos filtros. "
                    "Prueba con otro género, sin límite de extensión, o revisa los préstamos activos."
                ),
                "books": [],
                "suggestions": SUGGESTIONS,
            }

        semantic = self.recommend(books, loans, borrower, query=message, limit=4)
        if semantic and semantic[0].get("match_score", 0) > 0.14:
            return {
                "intent": "semantic_search",
                "reply": (
                    "He encontrado estos títulos por afinidad temática. Si afinas un poco más "
                    "—género, extensión o una emoción— puedo ajustar mejor la selección."
                ),
                "books": semantic[:3],
                "suggestions": SUGGESTIONS,
            }

        return {
            "intent": "fallback",
            "reply": (
                "No estoy seguro de haber entendido la petición. Puedo recomendarte por género, "
                "extensión, autor o parecido con otro libro. Por ejemplo: «algo de fantasía corto» "
                "o «parecido a La sombra del viento»."
            ),
            "books": self.recommend(books, loans, borrower, limit=3),
            "suggestions": SUGGESTIONS,
        }
