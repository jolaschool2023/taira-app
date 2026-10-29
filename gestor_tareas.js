(function () {
    "use strict";

    var CLAVE = "gestorTareas";
    var tareas = [];
    var editandoId = null;
    var eliminandoId = null;

    var prioridadPeso = { alta: 0, media: 1, baja: 2 };

    // ---------- Referencias al DOM ----------
    var lista = document.getElementById("listaTareas");
    var mensajeVacio = document.getElementById("mensajeVacio");
    var contadorPendientes = document.getElementById("contadorPendientes");
    var contadorCompletadas = document.getElementById("contadorCompletadas");
    var buscador = document.getElementById("buscador");
    var filtroCategoria = document.getElementById("filtroCategoria");
    var filtroEstado = document.getElementById("filtroEstado");

    var botonAgregar = document.getElementById("botonAgregar");
    var modal = document.getElementById("modal");
    var tituloModal = document.getElementById("tituloModal");
    var formulario = document.getElementById("formularioTarea");
    var campoTitulo = document.getElementById("campoTitulo");
    var campoCategoria = document.getElementById("campoCategoria");
    var campoPrioridad = document.getElementById("campoPrioridad");
    var campoFecha = document.getElementById("campoFecha");
    var botonCancelar = document.getElementById("botonCancelar");

    var modalEliminar = document.getElementById("modalEliminar");
    var botonCancelarEliminar = document.getElementById("botonCancelarEliminar");
    var botonConfirmarEliminar = document.getElementById("botonConfirmarEliminar");

    // ---------- Almacenamiento ----------
    function guardar() {
        localStorage.setItem(CLAVE, JSON.stringify(tareas));
    }

    function cargar() {
        try {
            var datos = localStorage.getItem(CLAVE);
            tareas = datos ? JSON.parse(datos) : [];
        } catch (e) {
            tareas = [];
        }
    }

    // ---------- Utilidades ----------
    function escapar(texto) {
        var div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    }

    function formatoFecha(fecha) {
        if (!fecha) return "";
        var partes = fecha.split("-");
        if (partes.length !== 3) return fecha;
        return partes[2] + "/" + partes[1] + "/" + partes[0];
    }

    function estaVencida(tarea) {
        if (!tarea.fecha || tarea.completada) return false;
        var hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        var fecha = new Date(tarea.fecha + "T00:00:00");
        return fecha < hoy;
    }

    // ---------- Ordenamiento automático ----------
    function ordenar(a, b) {
        if (a.completada !== b.completada) {
            return a.completada ? 1 : -1;
        }

        var aVencida = estaVencida(a) ? 0 : 1;
        var bVencida = estaVencida(b) ? 0 : 1;
        if (aVencida !== bVencida) {
            return aVencida - bVencida;
        }

        if (a.fecha && b.fecha && a.fecha !== b.fecha) {
            return a.fecha < b.fecha ? -1 : 1;
        }
        if (a.fecha && !b.fecha) return -1;
        if (!a.fecha && b.fecha) return 1;

        var diferenciaPrioridad = prioridadPeso[a.prioridad] - prioridadPeso[b.prioridad];
        if (diferenciaPrioridad !== 0) return diferenciaPrioridad;

        return a.titulo.localeCompare(b.titulo, "es");
    }

    // ---------- Filtros ----------
    function tareasVisibles() {
        var texto = buscador.value.trim().toLowerCase();
        var categoria = filtroCategoria.value;
        var estado = filtroEstado.value;

        return tareas.filter(function (tarea) {
            var coincideTexto = tarea.titulo.toLowerCase().indexOf(texto) !== -1;
            var coincideCategoria = categoria === "todas" || tarea.categoria === categoria;
            var coincideEstado =
                estado === "todas" ||
                (estado === "pendientes" && !tarea.completada) ||
                (estado === "completadas" && tarea.completada);
            return coincideTexto && coincideCategoria && coincideEstado;
        }).sort(ordenar);
    }

    // ---------- Renderizado ----------
    function render() {
        var visibles = tareasVisibles();
        lista.innerHTML = "";

        visibles.forEach(function (tarea) {
            var li = document.createElement("li");
            li.className = "tarea";
            if (tarea.completada) li.classList.add("completada");
            if (estaVencida(tarea)) {
                li.classList.add("atrasada", "tarea-vencida-pinta");
            }

            li.innerHTML =
                '<input type="checkbox" id="chk-' + tarea.id + '"' + (tarea.completada ? " checked" : "") + ' aria-label="Completar tarea">' +
                '<div class="tarea-info">' +
                    '<div class="tarea-titulo">' + escapar(tarea.titulo) + "</div>" +
                    '<div class="tarea-detalles">' +
                        '<span class="insignia cat-' + escapar(tarea.categoria) + '">' + escapar(tarea.categoria) + "</span>" +
                        '<span class="insignia prio-' + tarea.prioridad + '">Prioridad ' +
                            (tarea.prioridad === "alta" ? "Alta" : tarea.prioridad === "media" ? "Media" : "Baja") +
                        "</span>" +
                        (tarea.fecha
                            ? '<span class="fecha' + (estaVencida(tarea) ? " vencida" : "") + '">' +
                              (estaVencida(tarea) ? "Vencida: " : "Fecha límite: ") + formatoFecha(tarea.fecha) +
                              "</span>"
                            : "") +
                    "</div>" +
                "</div>" +
                '<div class="acciones">' +
                    '<button class="editar" data-accion="editar" aria-label="Editar tarea">✏️</button>' +
                    '<button class="eliminar" data-accion="eliminar" aria-label="Eliminar tarea">🗑️</button>' +
                "</div>";

            lista.appendChild(li);
        });

        actualizarContadores();
        mensajeVacio.classList.toggle("oculto", visibles.length > 0);
    }

    function actualizarContadores() {
        var pendientes = tareas.filter(function (t) { return !t.completada; }).length;
        var completadas = tareas.length - pendientes;
        contadorPendientes.textContent = pendientes;
        contadorCompletadas.textContent = completadas;
    }

    // ---------- ABM: Agregar / Editar ----------
    function abrirModal(tarea) {
        tituloModal.textContent = tarea ? "Editar tarea" : "Nueva tarea";
        editandoId = tarea ? tarea.id : null;
        campoTitulo.value = tarea ? tarea.titulo : "";
        campoCategoria.value = tarea ? tarea.categoria : "Personal";
        campoPrioridad.value = tarea ? tarea.prioridad : "media";
        campoFecha.value = tarea && tarea.fecha ? tarea.fecha : "";
        modal.classList.remove("oculto");
        campoTitulo.focus();
    }

    function cerrarModal() {
        modal.classList.add("oculto");
        editandoId = null;
        formulario.reset();
    }

    function guardarTarea(evento) {
        evento.preventDefault();
        var titulo = campoTitulo.value.trim();
        if (!titulo) {
            campoTitulo.focus();
            return;
        }

        var nueva = {
            id: editandoId || Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            titulo: titulo,
            categoria: campoCategoria.value,
            prioridad: campoPrioridad.value,
            fecha: campoFecha.value,
            completada: false,
            creada: Date.now()
        };

        if (editandoId) {
            var indice = tareas.findIndex(function (t) { return t.id === editandoId; });
            nueva.completada = tareas[indice].completada;
            nueva.creada = tareas[indice].creada;
            tareas[indice] = nueva;
        } else {
            tareas.push(nueva);
        }

        guardar();
        cerrarModal();
        render();
    }

    // ---------- Eliminar ----------
    var tareaAEliminar = null;

    function pedirConfirmacion(id) {
        tareaAEliminar = id;
        modalEliminar.classList.remove("oculto");
    }

    function eliminarConfirmada() {
        tareas = tareas.filter(function (t) { return t.id !== tareaAEliminar; });
        guardar();
        modalEliminar.classList.add("oculto");
        tareaAEliminar = null;
        render();
    }

    // ---------- Eventos ----------
    lista.addEventListener("click", function (evento) {
        var boton = evento.target.closest("button[data-accion]");
        var casilla = evento.target.closest("input[type=checkbox]");

        if (boton) {
            var li = boton.closest(".tarea");
            var id = li.querySelector("input[type=checkbox]").id.replace("chk-", "");

            if (boton.dataset.accion === "editar") {
                var tarea = tareas.find(function (t) { return t.id === id; });
                if (tarea) abrirModal(tarea);
            } else if (boton.dataset.accion === "eliminar") {
                pedirConfirmacion(id);
            }
        }

        if (casilla) {
            var tarea2 = tareas.find(function (t) { return t.id === casilla.id.replace("chk-", ""); });
            if (tarea2) {
                tarea2.completada = casilla.checked;
                guardar();
                render();
            }
        }
    });

    botonAgregar.addEventListener("click", function () { abrirModal(null); });
    botonCancelar.addEventListener("click", cerrarModal);
    modal.addEventListener("click", function (evento) {
        if (evento.target === modal) cerrarModal();
    });
    formulario.addEventListener("submit", guardarTarea);

    botonCancelarEliminar.addEventListener("click", function () {
        modalEliminar.classList.add("oculto");
        tareaAEliminar = null;
    });
    botonConfirmarEliminar.addEventListener("click", eliminarConfirmada);
    modalEliminar.addEventListener("click", function (evento) {
        if (evento.target === modalEliminar) {
            modalEliminar.classList.add("oculto");
            tareaAEliminar = null;
        }
    });

    buscador.addEventListener("input", render);
    filtroCategoria.addEventListener("change", render);
    filtroEstado.addEventListener("change", render);

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            cerrarModal();
            if (!modalEliminar.classList.contains("oculto")) {
                modalEliminar.classList.add("oculto");
                tareaAEliminar = null;
            }
        }
    });

    // ---------- Inicio ----------
    cargar();
    render();
})();