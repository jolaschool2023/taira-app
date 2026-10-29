const API_BASE = "/api/games";

const gamesBody = document.getElementById("games-body");
const resultCount = document.getElementById("result-count");
const statusMessage = document.getElementById("status");
const detailPanel = document.getElementById("detail-panel");
const detailJson = document.getElementById("detail-json");
const addFeedback = document.getElementById("add-feedback");

function setStatus(message, kind = "") {
    statusMessage.textContent = message;
    statusMessage.className = `feedback ${kind}`.trim();
}

function renderGames(games) {
    gamesBody.innerHTML = "";
    resultCount.textContent = `(${games.length})`;
    if (!games.length) {
        setStatus("No records found.", "error");
        return;
    }
    setStatus(`Loaded ${games.length} record(s).`, "ok");
    for (const game of games) {
        const row = document.createElement("tr");
        row.dataset.id = game.id;
        row.innerHTML = `
            <td>${game.id}</td>
            <td>${escapeHtml(game.title)}</td>
            <td>${escapeHtml(game.genre)}</td>
            <td>${escapeHtml(game.platform)}</td>
            <td>${game.year}</td>
            <td>${game.rating}</td>
            <td>$${Number(game.price).toFixed(2)}</td>`;
        row.addEventListener("click", () => showDetail(game.id, row));
        gamesBody.appendChild(row);
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = data.errors ? data.errors.join(" ") : (data.error || `Request failed (${response.status}).`);
        throw new Error(message);
    }
    return data;
}

async function loadAll() {
    try {
        setStatus("Loading...");
        const data = await fetchJson(API_BASE);
        renderGames(data.results);
    } catch (error) {
        setStatus(error.message, "error");
    }
}

async function runSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    const query = document.getElementById("search-query").value.trim();
    const genre = document.getElementById("search-genre").value.trim();
    const year = document.getElementById("search-year").value.trim();
    if (query) params.set("q", query);
    if (genre) params.set("genre", genre);
    if (year) params.set("year", year);
    try {
        setStatus("Searching...");
        const data = await fetchJson(`${API_BASE}/search?${params.toString()}`);
        renderGames(data.results);
    } catch (error) {
        setStatus(error.message, "error");
    }
}

async function showDetail(id, row) {
    try {
        const game = await fetchJson(`${API_BASE}/${id}`);
        document.querySelectorAll("#games-body tr").forEach((tr) => tr.classList.remove("selected"));
        if (row) row.classList.add("selected");
        detailJson.textContent = JSON.stringify(game, null, 2);
        detailPanel.hidden = false;
    } catch (error) {
        setStatus(error.message, "error");
    }
}

async function addGame(event) {
    event.preventDefault();
    const payload = {
        title: document.getElementById("add-title").value,
        genre: document.getElementById("add-genre").value,
        platform: document.getElementById("add-platform").value,
        developer: document.getElementById("add-developer").value,
        year: Number(document.getElementById("add-year").value),
        rating: document.getElementById("add-rating").value === "" ? undefined : Number(document.getElementById("add-rating").value),
        price: document.getElementById("add-price").value === "" ? undefined : Number(document.getElementById("add-price").value),
    };
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
    try {
        const created = await fetchJson(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        addFeedback.textContent = `Added record #${created.id}: ${created.title}`;
        addFeedback.className = "feedback ok";
        event.target.reset();
        await loadAll();
    } catch (error) {
        addFeedback.textContent = error.message;
        addFeedback.className = "feedback error";
    }
}

document.getElementById("search-form").addEventListener("submit", runSearch);
document.getElementById("load-all").addEventListener("click", loadAll);
document.getElementById("add-form").addEventListener("submit", addGame);

loadAll();
