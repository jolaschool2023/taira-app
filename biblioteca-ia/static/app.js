const API = "/api";
const STORAGE_KEY = "lumen.borrower";
const COVERS = new Set([
    "aurora", "ember", "cosmos", "sand", "rose",
    "ocean", "violet", "night", "moss", "forest",
]);

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
    user: localStorage.getItem(STORAGE_KEY) || "",
    view: "discover",
    books: [],
    genres: [],
    recommendations: [],
    loans: [],
    insights: null,
    stats: null,
    suggestions: [],
    chatBusy: false,
    detailBookId: null,
    pendingBorrowId: null,
    catalogRequest: 0,
    searchTimer: null,
};

const viewMeta = {
    discover: { title: "Descubrir", eyebrow: "Biblioteca inteligente" },
    reading: { title: "Mi lectura", eyebrow: "Tu espacio personal" },
    assistant: { title: "Asistente IA", eyebrow: "Conversación con Lumen" },
};

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
}

function icon(name) {
    return `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

function coverFor(book) {
    return COVERS.has(book.cover) ? book.cover : "forest";
}

function formatNumber(value) {
    return new Intl.NumberFormat("es-ES").format(Number(value) || 0);
}

function formatRating(value) {
    return new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(Number(value) || 0);
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function firstName() {
    return state.user.trim().split(/\s+/)[0] || "";
}

async function api(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = data.error || (data.errors ? data.errors.join(" ") : "");
        throw new Error(message || `No se pudo completar la petición (${response.status}).`);
    }
    return data;
}

function showToast(message, isError = false) {
    const toast = $("#toast");
    $("#toast-message").textContent = message;
    toast.classList.toggle("is-error", isError);
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
        toast.classList.remove("is-visible");
    }, 3800);
}

function bookCard(book) {
    const cover = coverFor(book);
    const available = Boolean(book.available);
    const reason = book.reason
        ? `<p class="book-reason">${escapeHtml(book.reason)}</p>`
        : "";
    return `
        <article class="book-card" data-book-id="${book.id}" tabindex="0" role="button"
                 aria-label="Ver ficha de ${escapeHtml(book.title)}">
            <div class="book-cover-wrap">
                <div class="book-cover cover-${cover}">
                    <span class="cover-mark"></span>
                    <span class="cover-category">${escapeHtml(book.genre)}</span>
                    <span class="cover-title">${escapeHtml(book.title)}</span>
                    <span class="cover-author">${escapeHtml(book.author)}</span>
                </div>
                <span class="availability-badge ${available ? "" : "is-borrowed"}">
                    ${available ? "Disponible" : "Prestado"}
                </span>
            </div>
            <div class="book-body">
                <div class="book-kicker">
                    <span>${escapeHtml(book.genre)}</span>
                    <span>${book.year}</span>
                </div>
                <h3>${escapeHtml(book.title)}</h3>
                <p class="book-author">${escapeHtml(book.author)}</p>
                <div class="book-foot">
                    <span class="book-rating">${icon("star")} ${formatRating(book.rating)}</span>
                    <span>${formatNumber(book.pages)} pág.</span>
                </div>
                ${reason}
            </div>
        </article>
    `;
}

function renderProfile() {
    const name = state.user || "Lector invitado";
    $("#profile-name").textContent = name;
    $("#profile-avatar").textContent = (name[0] || "L").toUpperCase();
    $("#assistant-context-name").textContent = name;

    const greeting = state.user
        ? `Tu recorrido, ${firstName()}`
        : "Tu recorrido lector";
    $("#reading-greeting").textContent = greeting;

    if ($("#chat-messages").children.length <= 1) {
        $("#chat-welcome").textContent = state.user
            ? `Hola, ${firstName()}. Soy Lumen. Cuéntame qué te apetece leer y buscaré entre los estantes.`
            : "Hola. Soy Lumen, tu bibliotecario digital. Cuéntame qué te apetece leer y buscaré entre los estantes.";
    }
}

function renderStats() {
    if (!state.stats) return;
    $("#stat-books").textContent = formatNumber(state.stats.total_books);
    $("#stat-available").textContent = formatNumber(state.stats.available_books);
    $("#stat-readers").textContent = formatNumber(state.stats.readers);
    $("#stat-rating").textContent = formatRating(state.stats.average_rating);
    $("#hero-reader-count").textContent = formatNumber(state.stats.readers);
}

async function loadStats() {
    try {
        state.stats = await api("/stats");
        renderStats();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function loadGenres() {
    try {
        const data = await api("/genres");
        state.genres = data.genres;
        const select = $("#genre-filter");
        const current = select.value;
        select.innerHTML = '<option value="">Todos los géneros</option>';
        for (const genre of state.genres) {
            const option = document.createElement("option");
            option.value = genre;
            option.textContent = genre;
            select.appendChild(option);
        }
        if (state.genres.includes(current)) select.value = current;
    } catch (error) {
        showToast(error.message, true);
    }
}

function catalogParams() {
    const params = new URLSearchParams();
    const query = $("#catalog-search").value.trim();
    const genre = $("#genre-filter").value;
    const availability = $("#availability-filter").value;
    const sort = $("#sort-filter").value;
    if (query) params.set("q", query);
    if (genre) params.set("genre", genre);
    if (availability !== "all") params.set("availability", availability);
    if (sort) params.set("sort", sort);
    return params;
}

async function loadCatalog() {
    const requestId = ++state.catalogRequest;
    const params = catalogParams();
    try {
        const data = await api(`/books?${params.toString()}`);
        if (requestId !== state.catalogRequest) return;
        state.books = data.results;
        const grid = $("#catalog-grid");
        grid.innerHTML = data.results.map(bookCard).join("");
        $("#catalog-empty").hidden = data.results.length > 0;
        const suffix = params.toString() ? " con los filtros actuales" : " en la colección";
        $("#catalog-count").textContent = `${data.count} ${data.count === 1 ? "título" : "títulos"}${suffix}`;
    } catch (error) {
        if (requestId !== state.catalogRequest) return;
        showToast(error.message, true);
    }
}

function recommendationSkeleton() {
    $("#recommendation-grid").innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;
}

async function loadRecommendations() {
    try {
        const borrower = encodeURIComponent(state.user);
        const data = await api(`/recommendations?borrower=${borrower}&limit=4`);
        state.recommendations = data.results;
        $("#recommendation-grid").innerHTML = data.results.map(bookCard).join("");
        const personalized = data.strategy === "historial-personal" && state.user;
        $("#recommendation-title").textContent = personalized
            ? `Elegido para ti, ${firstName()}`
            : "Joyas de la biblioteca";
        $("#recommendation-copy").textContent = personalized
            ? "Una mezcla de tus afinidades, tus autores favoritos y una pizca de sorpresa."
            : "Los títulos mejor valorados, listos para viajar contigo. Toma uno y la IA aprenderá de ti.";
    } catch (error) {
        showToast(error.message, true);
        $("#recommendation-grid").innerHTML = "";
    }
}

function emptyInsights() {
    return {
        total_books: 0,
        pages: 0,
        active_loans: 0,
        top_genres: [],
        top_authors: [],
        summary: state.user
            ? "Todavía no conozco tus gustos. Toma prestado tu primer libro y empezaré a construir tu perfil lector."
            : "Añade tu nombre y toma prestado tu primer libro para activar tu perfil lector personalizado.",
    };
}

async function loadPersonalData() {
    if (!state.user) {
        state.loans = [];
        state.insights = emptyInsights();
        renderReading();
        return;
    }
    try {
        const borrower = encodeURIComponent(state.user);
        const [loans, insights] = await Promise.all([
            api(`/loans?borrower=${borrower}`),
            api(`/insights?borrower=${borrower}`),
        ]);
        state.loans = loans.results;
        state.insights = insights;
    } catch (error) {
        state.loans = [];
        state.insights = emptyInsights();
        showToast(error.message, true);
    }
    renderReading();
}

function loanBookButton(loan, label = "Ver ficha") {
    return `<button class="small-button" type="button" data-view-book="${loan.book_id}">${label}</button>`;
}

function renderReading() {
    const insights = state.insights || emptyInsights();
    const activeLoans = state.loans.filter((loan) => loan.active);
    const totalLoans = state.loans.length;

    $("#active-loan-count").textContent = `${activeLoans.length} ${activeLoans.length === 1 ? "libro" : "libros"}`;
    $("#insight-books").textContent = formatNumber(insights.total_books);
    $("#insight-pages").textContent = formatNumber(insights.pages);
    $("#insight-summary").textContent = insights.summary;
    $("#context-loans").textContent = formatNumber(totalLoans);
    $("#context-genre").textContent = insights.top_genres?.[0]?.genre || "—";

    const badge = $("#active-loan-badge");
    badge.textContent = activeLoans.length;
    badge.hidden = activeLoans.length === 0;

    const activeList = $("#active-loans-list");
    if (!state.user) {
        activeList.innerHTML = `
            <div class="empty-inline">
                Configura tu perfil de lector para guardar préstamos y recibir recomendaciones personalizadas.
            </div>
        `;
    } else if (!activeLoans.length) {
        activeList.innerHTML = `
            <div class="empty-inline">
                No tienes préstamos activos. Elige una historia del catálogo y tráela contigo.
            </div>
        `;
    } else {
        activeList.innerHTML = activeLoans.map((loan) => `
            <div class="loan-item">
                <div class="loan-thumb cover-${COVERS.has(loan.cover) ? loan.cover : "forest"}">
                    <strong>${escapeHtml(loan.title)}</strong>
                </div>
                <div class="loan-copy">
                    <h3>${escapeHtml(loan.title)}</h3>
                    <p>${escapeHtml(loan.author)} · desde ${formatDate(loan.borrowed_at)}</p>
                </div>
                <div class="loan-actions">
                    ${loanBookButton(loan)}
                    <button class="small-button return-button" type="button" data-return-book="${loan.book_id}">Devolver</button>
                </div>
            </div>
        `).join("");
    }

    const genreProfile = $("#genre-profile");
    if (!insights.top_genres?.length) {
        genreProfile.innerHTML = `<span class="genre-chip">Aún sin géneros favoritos</span>`;
    } else {
        genreProfile.innerHTML = insights.top_genres.map((item) => `
            <span class="genre-chip">${escapeHtml(item.genre)} <span>${item.count}</span></span>
        `).join("");
    }

    const history = $("#loan-history");
    if (!state.loans.length) {
        history.innerHTML = `
            <div class="empty-inline">
                ${state.user
                    ? "Tu historial aparecerá aquí después del primer préstamo."
                    : "Tu historial aparecerá aquí cuando configures tu perfil y tomes un libro."}
            </div>
        `;
    } else {
        history.innerHTML = state.loans.map((loan) => `
            <div class="history-row">
                <div class="history-title">
                    <span class="history-dot"></span>
                    <strong>${escapeHtml(loan.title)}</strong>
                </div>
                <div class="history-meta">${escapeHtml(loan.author)}</div>
                <div class="history-meta">
                    ${loan.active ? "Desde" : "Devuelto"} ${formatDate(loan.active ? loan.borrowed_at : loan.returned_at)}
                </div>
                <div class="history-status ${loan.active ? "" : "returned"}">
                    ${icon(loan.active ? "book" : "check")}
                    ${loan.active ? "En curso" : "Completado"}
                </div>
            </div>
        `).join("");
    }

    $("#reading-summary").textContent = insights.summary;
}

async function loadSuggestions() {
    try {
        const data = await api("/assistant/suggestions");
        state.suggestions = data.suggestions;
        renderSuggestions(state.suggestions);
    } catch {
        state.suggestions = [];
    }
}

function renderSuggestions(suggestions) {
    const container = $("#chat-suggestions");
    container.innerHTML = suggestions.map((suggestion) => `
        <button class="suggestion-chip" type="button" data-suggestion="${escapeHtml(suggestion)}">
            ${escapeHtml(suggestion)}
        </button>
    `).join("");
}

function appendMessage(role, text, books = []) {
    const container = $("#chat-messages");
    const message = document.createElement("div");
    message.className = `message message-${role}`;

    if (role === "assistant") {
        const avatar = document.createElement("span");
        avatar.className = "message-avatar";
        avatar.innerHTML = icon("sparkles");
        message.appendChild(avatar);
    }

    const body = document.createElement("div");
    body.className = "message-body";
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    body.appendChild(paragraph);

    if (books.length) {
        const list = document.createElement("div");
        list.className = "message-books";
        for (const book of books) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "message-book";
            button.dataset.bookId = book.id;
            button.innerHTML = `
                <span class="message-book-cover cover-${coverFor(book)}">
                    <span>${escapeHtml(book.title)}</span>
                </span>
                <span class="message-book-copy">
                    <strong>${escapeHtml(book.title)}</strong>
                    <small>${escapeHtml(book.author)} · ${book.available ? "Disponible" : "Prestado"}</small>
                </span>
                <svg class="message-book-arrow" aria-hidden="true"><use href="#i-arrow-up"></use></svg>
            `;
            list.appendChild(button);
        }
        body.appendChild(list);
    }

    message.appendChild(body);
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    const container = $("#chat-messages");
    const message = document.createElement("div");
    message.className = "message message-assistant";
    message.id = "typing-message";
    message.innerHTML = `
        <span class="message-avatar"><svg aria-hidden="true"><use href="#i-sparkles"></use></svg></span>
        <div class="message-body">
            <span class="typing"><span></span><span></span><span></span></span>
        </div>
    `;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
}

function removeTyping() {
    $("#typing-message")?.remove();
}

async function sendChat(rawMessage) {
    const message = rawMessage.trim();
    if (!message || state.chatBusy) return;

    state.chatBusy = true;
    $("#chat-input").value = "";
    resizeChatInput();
    appendMessage("user", message);
    renderSuggestions([]);
    showTyping();

    try {
        const result = await api("/assistant", {
            method: "POST",
            body: JSON.stringify({ message, borrower: state.user }),
        });
        removeTyping();
        appendMessage("assistant", result.reply, result.books || []);
        renderSuggestions(result.suggestions || []);
    } catch (error) {
        removeTyping();
        appendMessage("assistant", `No he podido responder: ${error.message}`);
    } finally {
        state.chatBusy = false;
        $("#chat-input").focus();
    }
}

function resizeChatInput() {
    const input = $("#chat-input");
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
}

function clearChat() {
    const container = $("#chat-messages");
    container.innerHTML = `
        <div class="message message-assistant">
            <span class="message-avatar"><svg aria-hidden="true"><use href="#i-sparkles"></use></svg></span>
            <div class="message-body">
                <p id="chat-welcome">${escapeHtml(
                    state.user
                        ? `Hola, ${firstName()}. Soy Lumen. Cuéntame qué te apetece leer y buscaré entre los estantes.`
                        : "Hola. Soy Lumen, tu bibliotecario digital. Cuéntame qué te apetece leer y buscaré entre los estantes."
                )}</p>
            </div>
        </div>
    `;
    renderSuggestions(state.suggestions);
}

function switchView(view) {
    if (!viewMeta[view]) return;
    state.view = view;
    for (const button of $$(".nav-item")) {
        button.classList.toggle("is-active", button.dataset.view === view);
    }
    for (const panel of $$("[data-view-panel]")) {
        const active = panel.dataset.viewPanel === view;
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);
    }
    $("#page-title").textContent = viewMeta[view].title;
    $("#page-eyebrow").textContent = viewMeta[view].eyebrow;
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (view === "assistant") {
        window.setTimeout(() => $("#chat-input").focus(), 250);
    }
}

function openAssistantWith(message) {
    switchView("assistant");
    window.setTimeout(() => sendChat(message), 260);
}

function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
}

function closeDialog(id) {
    document.getElementById(id)?.close();
}

function ensureProfile(pendingBorrowId = null) {
    if (state.user) return true;
    state.pendingBorrowId = pendingBorrowId;
    $("#profile-form").reset();
    $("#profile-form [name=borrower]").value = "";
    $("#profile-dialog .form-hint").textContent =
        "Guarda tu perfil para completar el préstamo y activar las recomendaciones personalizadas.";
    openDialog("profile-dialog");
    window.setTimeout(() => $("#profile-form [name=borrower]").focus(), 50);
    return false;
}

async function refreshAfterChange() {
    await Promise.all([
        loadStats(),
        loadCatalog(),
        loadRecommendations(),
        loadPersonalData(),
    ]);
}

async function borrowBook(bookId) {
    if (!ensureProfile(bookId)) return;
    try {
        await api(`/books/${bookId}/borrow`, {
            method: "POST",
            body: JSON.stringify({ borrower: state.user }),
        });
        closeDialog("book-dialog");
        showToast("Préstamo registrado. Disfruta de la lectura.");
        await refreshAfterChange();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function returnBook(bookId) {
    if (!state.user) {
        ensureProfile();
        return;
    }
    try {
        await api(`/books/${bookId}/return`, {
            method: "POST",
            body: JSON.stringify({ borrower: state.user }),
        });
        closeDialog("book-dialog");
        showToast("Libro devuelto. Tu perfil lector se ha actualizado.");
        await refreshAfterChange();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function openBook(bookId) {
    try {
        const book = await api(`/books/${bookId}`);
        state.detailBookId = book.id;
        renderBookDetail(book);
        openDialog("book-dialog");
    } catch (error) {
        showToast(error.message, true);
    }
}

function renderBookDetail(book) {
    const available = Boolean(book.available);
    const ownLoan = state.user && book.borrowed_by
        && book.borrowed_by.toLowerCase() === state.user.toLowerCase();
    const cover = coverFor(book);
    const tags = (book.tags || []).map((tag) => `<span class="detail-tag">${escapeHtml(tag)}</span>`).join("");
    const matching = state.recommendations.find((item) => item.id === book.id);
    const reason = matching?.reason || "Lumen puede comparar esta obra con tus lecturas y encontrar afinidades inesperadas.";

    let statusTitle = "Disponible para préstamo";
    let statusText = "Puedes llevártelo hoy.";
    if (!available) {
        statusTitle = ownLoan ? "Lo tienes en préstamo" : `Prestado a ${book.borrowed_by}`;
        statusText = ownLoan ? "Devuélvelo cuando termines." : "Vuelve a consultar más adelante.";
    }

    let action = "";
    if (available) {
        action = `<button class="button button-primary" type="button" data-detail-action="borrow">
            ${icon("book")} Tomar prestado
        </button>`;
    } else if (ownLoan) {
        action = `<button class="button button-primary" type="button" data-detail-action="return">
            ${icon("check")} Devolver libro
        </button>`;
    } else {
        action = `<button class="button button-secondary" type="button" disabled>No disponible</button>`;
    }

    $("#book-detail").innerHTML = `
        <div class="book-detail-grid">
            <div class="detail-cover-column">
                <div class="book-cover detail-cover cover-${cover}">
                    <span class="cover-mark"></span>
                    <span class="cover-category">${escapeHtml(book.genre)}</span>
                    <span class="cover-title">${escapeHtml(book.title)}</span>
                    <span class="cover-author">${escapeHtml(book.author)}</span>
                </div>
                <div class="detail-availability ${available ? "" : "is-borrowed"}">
                    <span class="status-dot"></span>
                    <div>
                        <strong>${escapeHtml(statusTitle)}</strong>
                        <span>${escapeHtml(statusText)}</span>
                    </div>
                </div>
            </div>
            <div class="detail-content">
                <span class="eyebrow">${icon("library")} Ficha de la biblioteca</span>
                <h2>${escapeHtml(book.title)}</h2>
                <p class="detail-author">${escapeHtml(book.author)}</p>
                <div class="detail-meta">
                    <span class="detail-pill">${escapeHtml(book.genre)}</span>
                    <span class="detail-pill">${book.year}</span>
                    <span class="detail-pill">${formatNumber(book.pages)} páginas</span>
                    <span class="detail-pill">${formatRating(book.rating)} / 5</span>
                </div>
                <p class="detail-description">${escapeHtml(book.description || "Sin descripción disponible.")}</p>
                <div class="detail-tags">${tags}</div>
                <div class="detail-ai">
                    ${icon("sparkles")}
                    <p><strong>Nota de Lumen.</strong> ${escapeHtml(reason)}</p>
                </div>
                <div class="detail-actions">
                    ${action}
                    <button class="button button-secondary" type="button" data-detail-action="ask">
                        ${icon("sparkles")} Preguntar a Lumen
                    </button>
                </div>
            </div>
        </div>
    `;
}

function openProfileDialog() {
    $("#profile-form").reset();
    $("#profile-form [name=borrower]").value = state.user;
    $("#profile-dialog .form-hint").textContent =
        "Puedes usar un apodo. No necesitas contraseña y el dato se guarda solo en este navegador.";
    openDialog("profile-dialog");
    window.setTimeout(() => $("#profile-form [name=borrower]").focus(), 50);
}

async function saveProfile(event) {
    event.preventDefault();
    const name = new FormData(event.target).get("borrower").toString().trim();
    if (name.length < 2 || name.length > 60) {
        showToast("El nombre debe tener entre 2 y 60 caracteres.", true);
        return;
    }
    state.user = name;
    localStorage.setItem(STORAGE_KEY, name);
    closeDialog("profile-dialog");
    renderProfile();
    showToast(`Perfil guardado. Hola, ${firstName()}.`);
    await Promise.all([loadRecommendations(), loadPersonalData()]);

    if (state.pendingBorrowId) {
        const bookId = state.pendingBorrowId;
        state.pendingBorrowId = null;
        await borrowBook(bookId);
    }
}

async function addBook(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const errorBox = $("#add-form-error");
    errorBox.textContent = "";
    const payload = {
        title: data.get("title").toString().trim(),
        author: data.get("author").toString().trim(),
        genre: data.get("genre").toString().trim(),
        year: Number(data.get("year")),
        pages: Number(data.get("pages")),
        rating: Number(data.get("rating") || 0),
        description: data.get("description").toString().trim(),
        tags: data.get("tags").toString().split(",").map((tag) => tag.trim()).filter(Boolean),
        cover: data.get("cover").toString(),
    };
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    submit.textContent = "Añadiendo...";
    try {
        await api("/books", { method: "POST", body: JSON.stringify(payload) });
        closeDialog("add-dialog");
        form.reset();
        form.querySelector("[name=year]").value = new Date().getFullYear();
        showToast(`«${payload.title}» ya forma parte de la colección.`);
        await Promise.all([loadStats(), loadGenres(), loadCatalog(), loadRecommendations()]);
    } catch (error) {
        errorBox.textContent = error.message;
    } finally {
        submit.disabled = false;
        submit.textContent = "Añadir libro";
    }
}

function bindEvents() {
    for (const button of $$("[data-view]")) {
        button.addEventListener("click", () => switchView(button.dataset.view));
    }
    for (const link of $$("[data-view-link]")) {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            switchView(link.dataset.viewLink);
        });
    }
    for (const button of $$("[data-go-assistant]")) {
        button.addEventListener("click", () => switchView("assistant"));
    }
    $("#go-reading")?.addEventListener("click", () => switchView("reading"));

    $("#profile-button").addEventListener("click", openProfileDialog);
    $("#profile-form").addEventListener("submit", saveProfile);
    $("#add-book-button").addEventListener("click", () => {
        $("#add-book-form").reset();
        $("#add-book-form [name=year]").value = new Date().getFullYear();
        $("#add-form-error").textContent = "";
        openDialog("add-dialog");
    });
    $("#add-book-form").addEventListener("submit", addBook);

    $("#hero-ai-button").addEventListener("click", () => switchView("assistant"));
    $("#hero-catalog-button").addEventListener("click", () => {
        $("#catalog-section").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("#refresh-recommendations").addEventListener("click", async () => {
        recommendationSkeleton();
        await loadRecommendations();
        showToast("Selección renovada por Lumen.");
    });

    $("#catalog-search").addEventListener("input", () => {
        window.clearTimeout(state.searchTimer);
        state.searchTimer = window.setTimeout(loadCatalog, 280);
    });
    for (const id of ["#genre-filter", "#availability-filter", "#sort-filter"]) {
        $(id).addEventListener("change", loadCatalog);
    }
    $("#clear-filters").addEventListener("click", () => {
        $("#catalog-search").value = "";
        $("#genre-filter").value = "";
        $("#availability-filter").value = "all";
        $("#sort-filter").value = "featured";
        loadCatalog();
    });

    $("#global-search").addEventListener("input", (event) => {
        $("#catalog-search").value = event.target.value;
        if (state.view !== "discover") switchView("discover");
        window.clearTimeout(state.searchTimer);
        state.searchTimer = window.setTimeout(loadCatalog, 280);
    });

    document.addEventListener("keydown", (event) => {
        const tag = document.activeElement?.tagName;
        if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
            event.preventDefault();
            $("#global-search").focus();
        }
    });

    for (const grid of $$(".book-grid")) {
        grid.addEventListener("click", (event) => {
            const card = event.target.closest("[data-book-id]");
            if (card) openBook(Number(card.dataset.bookId));
        });
        grid.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            const card = event.target.closest("[data-book-id]");
            if (!card) return;
            event.preventDefault();
            openBook(Number(card.dataset.bookId));
        });
    }

    $("#book-detail").addEventListener("click", (event) => {
        const action = event.target.closest("[data-detail-action]");
        if (!action || !state.detailBookId) return;
        if (action.dataset.detailAction === "borrow") borrowBook(state.detailBookId);
        if (action.dataset.detailAction === "return") returnBook(state.detailBookId);
        if (action.dataset.detailAction === "ask") {
            const title = $(".detail-content h2")?.textContent || "";
            closeDialog("book-dialog");
            openAssistantWith(`¿De qué trata «${title}»?`);
        }
    });

    $("#active-loans-list").addEventListener("click", (event) => {
        const returnButton = event.target.closest("[data-return-book]");
        if (returnButton) {
            returnBook(Number(returnButton.dataset.returnBook));
            return;
        }
        const viewButton = event.target.closest("[data-view-book]");
        if (viewButton) openBook(Number(viewButton.dataset.viewBook));
    });

    $("#chat-messages").addEventListener("click", (event) => {
        const bookButton = event.target.closest("[data-book-id]");
        if (bookButton) openBook(Number(bookButton.dataset.bookId));
    });

    $("#chat-form").addEventListener("submit", (event) => {
        event.preventDefault();
        sendChat($("#chat-input").value);
    });
    $("#chat-input").addEventListener("input", resizeChatInput);
    $("#chat-input").addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendChat(event.target.value);
        }
    });
    $("#chat-suggestions").addEventListener("click", (event) => {
        const chip = event.target.closest("[data-suggestion]");
        if (chip) sendChat(chip.dataset.suggestion);
    });
    $("#clear-chat").addEventListener("click", clearChat);

    for (const closer of $$("[data-close-dialog]")) {
        closer.addEventListener("click", () => closeDialog(closer.dataset.closeDialog));
    }
    for (const dialog of $$("dialog.modal")) {
        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) dialog.close();
        });
    }
}

async function init() {
    renderProfile();
    bindEvents();
    renderReading();
    $("#profile-form [name=borrower]").value = state.user;
    await Promise.allSettled([
        loadStats(),
        loadGenres(),
        loadCatalog(),
        loadRecommendations(),
        loadPersonalData(),
        loadSuggestions(),
    ]);
}

init();
