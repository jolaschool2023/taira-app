"""REST API for a video game dataset, plus the web application that consumes it.

Run with:  python api.py   and open http://127.0.0.1:5000/

Endpoints:
    GET  /api/games              retrieve all records (optional ?q=, ?genre=, ?year=)
    GET  /api/games/search?q=... search records
    GET  /api/games/<id>         retrieve one record
    POST /api/games              add a record
"""

from flask import Flask, jsonify, request, send_from_directory

GAMES = [
    {"id": 1, "title": "The Legend of Zelda: Tears of the Kingdom", "genre": "Action-Adventure",
     "platform": "Nintendo Switch", "year": 2023, "developer": "Nintendo EPD", "rating": 9.6, "price": 69.99},
    {"id": 2, "title": "Elden Ring", "genre": "Action RPG",
     "platform": "PC", "year": 2022, "developer": "FromSoftware", "rating": 9.5, "price": 59.99},
    {"id": 3, "title": "Hollow Knight", "genre": "Metroidvania",
     "platform": "PC", "year": 2017, "developer": "Team Cherry", "rating": 9.0, "price": 14.99},
    {"id": 4, "title": "Celeste", "genre": "Platformer",
     "platform": "PC", "year": 2018, "developer": "Maddy Makes Games", "rating": 9.2, "price": 19.99},
    {"id": 5, "title": "God of War Ragnarok", "genre": "Action-Adventure",
     "platform": "PlayStation 5", "year": 2022, "developer": "Santa Monica Studio", "rating": 9.4, "price": 69.99},
    {"id": 6, "title": "Hades", "genre": "Roguelike",
     "platform": "PC", "year": 2020, "developer": "Supergiant Games", "rating": 9.3, "price": 24.99},
    {"id": 7, "title": "Stardew Valley", "genre": "Simulation",
     "platform": "PC", "year": 2016, "developer": "ConcernedApe", "rating": 9.1, "price": 14.99},
    {"id": 8, "title": "Red Dead Redemption 2", "genre": "Action-Adventure",
     "platform": "PlayStation 4", "year": 2018, "developer": "Rockstar Games", "rating": 9.7, "price": 39.99},
    {"id": 9, "title": "Portal 2", "genre": "Puzzle",
     "platform": "PC", "year": 2011, "developer": "Valve", "rating": 9.5, "price": 9.99},
    {"id": 10, "title": "Metroid Dread", "genre": "Metroidvania",
     "platform": "Nintendo Switch", "year": 2021, "developer": "MercurySteam", "rating": 8.8, "price": 49.99},
]

NEXT_ID = max(game["id"] for game in GAMES) + 1

SEARCH_FIELDS = ("title", "genre", "platform", "developer")


def find_game(game_id):
    """Return the record with the given id, or None when it does not exist."""
    return next((game for game in GAMES if game["id"] == game_id), None)


def search_games(query="", genre="", year=""):
    """Return records matching the text query, genre and/or year."""
    text = query.strip().lower()
    results = GAMES
    if genre:
        results = [game for game in results if game["genre"].lower() == genre.lower()]
    if year:
        results = [game for game in results if str(game["year"]) == str(year).strip()]
    if text:
        results = [
            game for game in results
            if any(text in str(game[field]).lower() for field in SEARCH_FIELDS)
        ]
    return results


def validate_payload(payload):
    """Return a list of error messages for an invalid add/update request."""
    errors = []
    if not isinstance(payload, dict):
        return ["Request body must be a JSON object."]
    title = payload.get("title")
    if not isinstance(title, str) or not title.strip():
        errors.append("'title' is required and must be a non-empty string.")
    for field in ("genre", "platform", "developer"):
        value = payload.get(field)
        if value is not None and (not isinstance(value, str) or not value.strip()):
            errors.append(f"'{field}' must be a non-empty string.")
    year = payload.get("year")
    if not isinstance(year, int) or isinstance(year, bool) or not 1970 <= year <= 2100:
        errors.append("'year' must be an integer between 1970 and 2100.")
    price = payload.get("price")
    if price is not None and (not isinstance(price, (int, float)) or isinstance(price, bool) or price < 0):
        errors.append("'price' must be a non-negative number.")
    rating = payload.get("rating")
    if rating is not None and (not isinstance(rating, (int, float)) or isinstance(rating, bool)
                               or not 0 <= rating <= 10):
        errors.append("'rating' must be a number between 0 and 10.")
    return errors


def build_record(payload):
    """Create a new record from the request payload, filling optional fields."""
    record = {
        "title": payload["title"].strip(),
        "genre": (payload.get("genre") or "Uncategorized").strip(),
        "platform": (payload.get("platform") or "Unknown").strip(),
        "year": payload["year"],
        "developer": (payload.get("developer") or "Unknown").strip(),
        "rating": payload.get("rating", 0.0),
        "price": payload.get("price", 0.0),
    }
    return record


app = Flask(__name__, static_folder="static", static_url_path="")


@app.after_request
def add_cors_headers(response):
    """Allow any origin to consume the API."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.get("/")
def index():
    """Serve the web application."""
    return send_from_directory(app.static_folder, "index.html")


@app.get("/api/games")
def get_all_games():
    """Retrieve all records, optionally filtered by q, genre or year."""
    games = search_games(
        query=request.args.get("q", ""),
        genre=request.args.get("genre", ""),
        year=request.args.get("year", ""),
    )
    return jsonify({"count": len(games), "results": games})


@app.get("/api/games/search")
def search_endpoint():
    """Search records by text (q) and optional genre/year filters."""
    games = search_games(
        query=request.args.get("q", ""),
        genre=request.args.get("genre", ""),
        year=request.args.get("year", ""),
    )
    return jsonify({"count": len(games), "results": games})


@app.get("/api/games/<int:game_id>")
def get_game(game_id):
    """Retrieve one record by its id."""
    game = find_game(game_id)
    if game is None:
        return jsonify({"error": f"Game with id {game_id} was not found."}), 404
    return jsonify(game)


@app.post("/api/games")
def add_game():
    """Add a new record to the dataset."""
    global NEXT_ID
    payload = request.get_json(silent=True)
    errors = validate_payload(payload)
    if errors:
        return jsonify({"errors": errors}), 400
    record = build_record(payload)
    record["id"] = NEXT_ID
    NEXT_ID += 1
    GAMES.append(record)
    return jsonify(record), 201


if __name__ == "__main__":
    app.run(debug=True)
