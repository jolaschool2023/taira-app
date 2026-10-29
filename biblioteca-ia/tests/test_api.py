import json
import tempfile
import unittest
from pathlib import Path

from app import create_app


class LibraryApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        database = Path(self.temp_dir.name) / "test-library.db"
        self.app = create_app({"TESTING": True, "DATABASE": str(database)})
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp_dir.cleanup()

    def get_book_by_title(self, title):
        response = self.client.get("/api/books", query_string={"q": title})
        self.assertEqual(response.status_code, 200)
        return response.get_json()["results"][0]

    def test_health_and_seeded_catalog(self):
        health = self.client.get("/api/health").get_json()
        self.assertEqual(health["status"], "ok")
        self.assertEqual(health["ai"], "local-tfidf")

        stats = self.client.get("/api/stats").get_json()
        self.assertEqual(stats["total_books"], 16)
        self.assertEqual(stats["available_books"], 16)
        self.assertEqual(stats["average_rating"], 4.4)

        books = self.client.get("/api/books").get_json()
        self.assertEqual(books["count"], 16)
        self.assertTrue(all(book["available"] for book in books["results"]))

    def test_catalog_search_and_filters(self):
        search = self.client.get("/api/books", query_string={"q": "Dune"}).get_json()
        self.assertEqual(search["count"], 1)
        self.assertEqual(search["results"][0]["author"], "Frank Herbert")

        genre = self.client.get(
            "/api/books", query_string={"genre": "Ciencia ficción"}
        ).get_json()
        self.assertEqual(genre["count"], 3)

        genres = self.client.get("/api/genres").get_json()["genres"]
        self.assertIn("Fantasía", genres)
        self.assertIn("Misterio", genres)

    def test_borrow_and_return_flow(self):
        book = self.get_book_by_title("Dune")
        borrow = self.client.post(
            f"/api/books/{book['id']}/borrow", json={"borrower": "Ada Lovelace"}
        )
        self.assertEqual(borrow.status_code, 201)
        self.assertIsNone(borrow.get_json()["loan"]["returned_at"])
        self.assertFalse(borrow.get_json()["book"]["available"])

        duplicate = self.client.post(
            f"/api/books/{book['id']}/borrow", json={"borrower": "Grace Hopper"}
        )
        self.assertEqual(duplicate.status_code, 409)

        stats = self.client.get("/api/stats").get_json()
        self.assertEqual(stats["available_books"], 15)
        self.assertEqual(stats["active_loans"], 1)

        returned = self.client.post(
            f"/api/books/{book['id']}/return", json={"borrower": "Ada Lovelace"}
        )
        self.assertEqual(returned.status_code, 200)
        self.assertIsNotNone(returned.get_json()["loan"]["returned_at"])
        self.assertTrue(returned.get_json()["book"]["available"])

    def test_return_requires_active_loan(self):
        book = self.get_book_by_title("El principito")
        response = self.client.post(f"/api/books/{book['id']}/return", json={})
        self.assertEqual(response.status_code, 409)

    def test_recommendations_are_personalized_and_available(self):
        editorial = self.client.get(
            "/api/recommendations", query_string={"borrower": "Ada"}
        ).get_json()
        self.assertEqual(editorial["strategy"], "seleccion-editorial")
        self.assertEqual(len(editorial["results"]), 4)
        self.assertTrue(all(book["available"] for book in editorial["results"]))

        book = self.get_book_by_title("Dune")
        self.client.post(
            f"/api/books/{book['id']}/borrow", json={"borrower": "Ada Lovelace"}
        )
        personalized = self.client.get(
            "/api/recommendations", query_string={"borrower": "Ada Lovelace"}
        ).get_json()
        self.assertEqual(personalized["strategy"], "historial-personal")
        self.assertNotIn(book["id"], [item["id"] for item in personalized["results"]])
        self.assertTrue(all(item["available"] for item in personalized["results"]))

    def test_reading_insights(self):
        book = self.get_book_by_title("Cien años de soledad")
        self.client.post(
            f"/api/books/{book['id']}/borrow", json={"borrower": "Elena"}
        )
        insights = self.client.get(
            "/api/insights", query_string={"borrower": "Elena"}
        ).get_json()
        self.assertEqual(insights["borrower"], "Elena")
        self.assertEqual(insights["total_books"], 1)
        self.assertEqual(insights["active_loans"], 1)
        self.assertEqual(insights["top_genres"][0]["genre"], "Realismo mágico")
        self.assertIn("Cien años de soledad", insights["summary"])
        self.assertIn("Elena", insights["summary"])

    def test_assistant_recommends_and_explains(self):
        response = self.client.post(
            "/api/assistant",
            json={"message": "Recomiéndame una novela corta", "borrower": "Ada"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["intent"], "recommendation")
        self.assertEqual(len(data["books"]), 4)
        self.assertTrue(all(book["pages"] <= 360 for book in data["books"]))
        self.assertIn("Lumen AI local", data["generated_by"])

        science_fiction = self.client.post(
            "/api/assistant", json={"message": "Recomiéndame algo de ciencia ficción"}
        ).get_json()
        self.assertEqual(science_fiction["intent"], "recommendation")
        self.assertEqual(len(science_fiction["books"]), 3)
        self.assertTrue(
            all(book["genre"] == "Ciencia ficción" for book in science_fiction["books"])
        )

        summary = self.client.post(
            "/api/assistant", json={"message": "¿De qué trata Dune?"}
        ).get_json()
        self.assertEqual(summary["intent"], "book_summary")
        self.assertIn("Arrakis", summary["reply"])

        similar = self.client.post(
            "/api/assistant", json={"message": "Busco algo parecido a Dune"}
        ).get_json()
        self.assertEqual(similar["intent"], "similar")
        self.assertNotIn("Dune", [book["title"] for book in similar["books"]])

    def test_create_book_and_validation(self):
        payload = {
            "title": "La memoria del agua",
            "author": "Clara Ferrer",
            "genre": "Fantasía",
            "year": 2024,
            "pages": 288,
            "rating": 4.6,
            "description": "Una cartógrafa descubre que los ríos guardan recuerdos.",
            "tags": ["magia", "memoria", "aventura"],
            "cover": "aurora",
        }
        created = self.client.post("/api/books", json=payload)
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.get_json()["tags"], ["magia", "memoria", "aventura"])

        found = self.client.get("/api/books", query_string={"q": "memoria del agua"}).get_json()
        self.assertEqual(found["count"], 1)

        invalid = self.client.post(
            "/api/books", json={**payload, "title": "", "year": 3000, "pages": 0}
        )
        self.assertEqual(invalid.status_code, 400)
        self.assertGreaterEqual(len(invalid.get_json()["errors"]), 3)

        bad_cover = self.client.post(
            "/api/books", json={**payload, "title": "Otro libro", "cover": "neon"}
        )
        self.assertEqual(bad_cover.status_code, 400)

    def test_assistant_validation(self):
        empty = self.client.post("/api/assistant", json={"message": ""})
        self.assertEqual(empty.status_code, 400)
        missing = self.client.post("/api/assistant", data="nope")
        self.assertEqual(missing.status_code, 400)
        long_message = self.client.post("/api/assistant", json={"message": "x" * 601})
        self.assertEqual(long_message.status_code, 400)


if __name__ == "__main__":
    unittest.main()
