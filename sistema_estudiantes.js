(function () {
    "use strict";

    var CLAVE = "estudiantesSistema";
    var NOTA_APROBACION = 6;
    var estudiantes = [];
    var editandoId = null;
    var eliminandoId = null;
    var direccion = "asc"; // "asc" | "desc"

    // ---------- Referencias al DOM ----------
    var cuerpoTabla = document.getElementById("cuerpoTabla");
    var mensajeVacio = document.getElementById("mensajeVacio");
    var totalAlumnos = document.getElementById("totalAlumnos");
    var promedioGeneral = document.getElementById("promedioGeneral");
    var aprobados = document.getElementById("aprobados");
    var reprobados = document.getElementById("reprobados");
    var mejorPromedio = document.getElementById("mejorPromedio");
    var distribucionNotas = document.getElementById("distribucionNotas");
    var donutEstado = document.getElementById("donutEstado");
    var porcentajeAprobados = document.getElementById("porcentajeAprobados");
    var promedioCursos = document.getElementById("promedioCursos");

    var buscador = document.getElementById("buscador");
    var filtroEstado = document.getElementById("filtroEstado");
    var orden = document.getElementById("orden");
    var botonDireccion = document.getElementById("botonDireccion");

    var botonAgregar = document.getElementById("botonAgregar");
    var modal = document.getElementById("modal");
    var tituloModal = document.getElementById("tituloModal");
    var formulario = document.getElementById("formularioEstudiante");
    var campoNombre = document.getElementById("campoNombre");
    var campoEdad = document.getElementById("campoEdad");
    var campoCurso = document.getElementById("campoCurso");
    var campoNota = document.getElementById("campoNota");
    var botonCancelar = document.getElementById("botonCancelar");

    var modalEliminar = document.getElementById("modalEliminar");
    var textoEliminar = document.getElementById("textoEliminar");
    var botonCancelarEliminar = document.getElementById("botonCancelarEliminar");
    var botonConfirmarEliminar = document.getElementById("botonConfirmarEliminar");

    // ---------- Almacenamiento ----------
    function guardar() {
        localStorage.setItem(CLAVE, JSON.stringify(estudiantes));
    }

    function cargar() {
        try {
            var datos = localStorage.getItem(CLAVE);
            estudiantes = datos ? JSON.parse(datos) : [];
        } catch (e) {
            estudiantes = [];
        }
    }

    // ---------- Utilidades ----------
    function escapar(texto) {
        var div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    }

    function estadoDe(nota) {
        return nota >= NOTA_APROBACION ? "Aprobado" : "Reprobado";
    }

    function redondear(valor, decimales) {
        var factor = Math.pow(10, decimales);
        return Math.round(valor * factor) / factor;
    }

    // ---------- Filtros y orden ----------
    function estudiantesVisibles() {
        var texto = buscador.value.trim().toLowerCase();
        var estadoSeleccionado = filtroEstado.value;

        var lista = estudiantes.filter(function (e) {
            var coincideNombre = e.nombre.toLowerCase().indexOf(texto) !== -1;
            var coincideCurso = e.curso.toLowerCase().indexOf(texto) !== -1;
            var coincideTexto = coincideNombre || coincideCurso;
            var coincideEstado = estadoSeleccionado === "todos" || estadoDe(e.nota) === estadoSeleccionado;
            return coincideTexto && coincideEstado;
        });

        var factor = direccion === "asc" ? 1 : -1;
        lista.sort(function (a, b) {
            var resultado = 0;
            if (orden.value === "nombre") {
                resultado = a.nombre.localeCompare(b.nombre, "es");
            } else if (orden.value === "edad") {
                resultado = a.edad - b.edad;
            } else {
                resultado = a.nota - b.nota;
            }
            return resultado * factor;
        });

        return lista;
    }

    // ---------- Render de la tabla ----------
    function render() {
        var visibles = estudiantesVisibles();
        cuerpoTabla.innerHTML = "";

        visibles.forEach(function (e) {
            var estado = estadoDe(e.nota);
            var tr = document.createElement("tr");
            tr.className = estado === "Aprobado" ? "aprobado" : "reprobado";
            tr.innerHTML =
                "<td>" + escapar(e.nombre) + "</td>" +
                "<td>" + e.edad + "</td>" +
                "<td>" + escapar(e.curso) + "</td>" +
                '<td>' + redondear(e.nota, 1) + "</td>" +
                '<td><span class="badge-estado ' + estado + '">' + estado + "</span></td>" +
                '<td><div class="acciones">' +
                    '<button class="editar" data-accion="editar" data-id="' + e.id + '" aria-label="Editar estudiante">✏️</button>' +
                    '<button class="eliminar" data-accion="eliminar" data-id="' + e.id + '" aria-label="Eliminar estudiante">🗑️</button>' +
                "</div></td>";
            cuerpoTabla.appendChild(tr);
        });

        mensajeVacio.classList.toggle("oculto", visibles.length > 0);
        renderEstadisticas();
    }

    // ---------- Estadísticas automáticas ----------
    function renderEstadisticas() {
        totalAlumnos.textContent = estudiantes.length;

        if (estudiantes.length === 0) {
            promedioGeneral.textContent = "0";
            aprobados.textContent = "0";
            reprobados.textContent = "0";
            mejorPromedio.textContent = "0";
            distribucionNotas.innerHTML = '<p class="sin-datos">Sin datos</p>';
            promedioCursos.innerHTML = '<p class="sin-datos">Sin datos</p>';
            donutEstado.style.background = "conic-gradient(#2e8b57 0%, #eef1f5 0%)";
            porcentajeAprobados.textContent = "0%";
            return;
        }

        var suma = estudiantes.reduce(function (acum, e) { return acum + e.nota; }, 0);
        promedioGeneral.textContent = redondear(suma / estudiantes.length, 1);

        var numAprobados = estudiantes.filter(function (e) { return estadoDe(e.nota) === "Aprobado"; }).length;
        var numReprobados = estudiantes.length - numAprobados;
        aprobados.textContent = numAprobados;
        reprobados.textContent = numReprobados;

        var mejor = estudiantes.reduce(function (max, e) { return e.nota > max ? e.nota : max; }, 0);
        mejorPromedio.textContent = redondear(mejor, 1);

        renderDistribucion(numAprobados, numReprobados);
        renderPromedioCursos();
    }

    function renderDistribucion(numAprobados) {
        var porcentaje = estudiantes.length === 0 ? 0 : Math.round((numAprobados / estudiantes.length) * 100);
        donutEstado.style.background =
            "conic-gradient(#2e8b57 0% " + porcentaje + "%, #c0392b " + porcentaje + "% 100%)";
        porcentajeAprobados.textContent = porcentaje + "%";

        var rangos = [
            { nombre: "0 – 4.9", min: 0, max: 4.9, color: "#c0392b" },
            { nombre: "5 – 5.9", min: 5, max: 5.9, color: "#e67e22" },
            { nombre: "6 – 6.9", min: 6, max: 6.9, color: "#2f6db5" },
            { nombre: "7 – 8.9", min: 7, max: 8.9, color: "#8e44ad" },
            { nombre: "9 – 10", min: 9, max: 10, color: "#2e8b57" }
        ];

        var conteos = rangos.map(function (rango) {
            return {
                nombre: rango.nombre,
                color: rango.color,
                cantidad: estudiantes.filter(function (e) { return e.nota >= rango.min && e.nota <= rango.max; }).length
            };
        });

        var maximo = Math.max.apply(null, conteos.map(function (c) { return c.cantidad; }));

        distribucionNotas.innerHTML = conteos.map(function (c) {
            var alto = c.cantidad === 0 ? 0 : Math.max(6, (c.cantidad / maximo) * 100);
            return '<div class="fila-barra">' +
                '<span class="nombre">' + c.nombre + '</span>' +
                '<div class="pista"><div class="relleno" style="width:' + alto + '%;background:' + c.color + '"></div></div>' +
                '<span class="valor">' + c.cantidad + '</span>' +
            "</div>";
        }).join("");
    }

    function renderPromedioCursos() {
        var cursos = {};
        estudiantes.forEach(function (e) {
            if (!cursos[e.curso]) {
                cursos[e.curso] = { suma: 0, cantidad: 0 };
            }
            cursos[e.curso].suma += e.nota;
            cursos[e.curso].cantidad += 1;
        });

        var lista = Object.keys(cursos).map(function (curso) {
            return {
                nombre: curso,
                promedio: cursos[curso].suma / cursos[curso].cantidad
            };
        }).sort(function (a, b) {
            return b.promedio - a.promedio;
        });

        var maximo = Math.max.apply(null, lista.map(function (c) { return c.promedio; }));

        promedioCursos.innerHTML = lista.length === 0
            ? '<p class="sin-datos">Sin datos</p>'
            : lista.map(function (c) {
                var alto = Math.max(8, (c.promedio / maximo) * 100);
                var color = c.promedio >= NOTA_APROBACION ? "#2e8b57" : "#c0392b";
                return '<div class="fila-barra">' +
                    '<span class="nombre" title="' + escapar(c.nombre) + '">' + escapar(c.nombre) + "</span>" +
                    '<div class="pista"><div class="relleno" style="width:' + alto + "%;background:" + color + '"></div></div>' +
                    '<span class="valor">' + redondear(c.promedio, 1) + "</span>" +
                "</div>";
            }).join("");
    }

    // ---------- Formulario agregar/editar ----------
    function abrirModal(estudiante) {
        tituloModal.textContent = estudiante ? "Editar estudiante" : "Agregar estudiante";
        editandoId = estudiante ? estudiante.id : null;
        campoNombre.value = estudiante ? estudiante.nombre : "";
        campoEdad.value = estudiante ? estudiante.edad : "";
        campoCurso.value = estudiante ? estudiante.curso : "";
        campoNota.value = estudiante ? estudiante.nota : "";
        modal.classList.remove("oculto");
        campoNombre.focus();
    }

    function cerrarModal() {
        modal.classList.add("oculto");
        editandoId = null;
        formulario.reset();
    }

    function guardarEstudiante(evento) {
        evento.preventDefault();
        var nombre = campoNombre.value.trim();
        var edad = parseInt(campoEdad.value, 10);
        var curso = campoCurso.value.trim();
        var nota = parseFloat(campoNota.value);

        if (!nombre || !curso || isNaN(edad) || edad < 1 || edad > 120 || isNaN(nota) || nota < 0 || nota > 10) {
            return;
        }

        var registro = {
            id: editandoId || Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            nombre: nombre,
            edad: edad,
            curso: curso,
            nota: redondear(nota, 1)
        };

        if (editandoId) {
            var indice = estudiantes.findIndex(function (e) { return e.id === editandoId; });
            estudiantes[indice] = registro;
        } else {
            estudiantes.push(registro);
        }

        guardar();
        cerrarModal();
        render();
    }

    // ---------- Eliminar ----------
    function pedirConfirmacion(id) {
        var estudiante = estudiantes.find(function (e) { return e.id === id; });
        if (!estudiante) return;
        eliminandoId = id;
        textoEliminar.textContent = "¿Seguro que deseas eliminar a " + estudiante.nombre + "?";
        modalEliminar.classList.remove("oculto");
    }

    function eliminarConfirmada() {
        estudiantes = estudiantes.filter(function (e) { return e.id !== eliminandoId; });
        guardar();
        modalEliminar.classList.add("oculto");
        eliminandoId = null;
        render();
    }

    // ---------- Eventos ----------
    cuerpoTabla.addEventListener("click", function (evento) {
        var boton = evento.target.closest("button[data-accion]");
        if (!boton) return;
        var id = boton.dataset.id;

        if (boton.dataset.accion === "editar") {
            var estudiante = estudiantes.find(function (e) { return e.id === id; });
            if (estudiante) abrirModal(estudiante);
        } else if (boton.dataset.accion === "eliminar") {
            pedirConfirmacion(id);
        }
    });

    botonAgregar.addEventListener("click", function () { abrirModal(null); });
    botonCancelar.addEventListener("click", cerrarModal);
    modal.addEventListener("click", function (evento) {
        if (evento.target === modal) cerrarModal();
    });
    formulario.addEventListener("submit", guardarEstudiante);

    botonCancelarEliminar.addEventListener("click", function () {
        modalEliminar.classList.add("oculto");
        eliminandoId = null;
    });
    botonConfirmarEliminar.addEventListener("click", eliminarConfirmada);
    modalEliminar.addEventListener("click", function (evento) {
        if (evento.target === modalEliminar) {
            modalEliminar.classList.add("oculto");
            eliminandoId = null;
        }
    });

    buscador.addEventListener("input", render);
    filtroEstado.addEventListener("change", render);
    orden.addEventListener("change", render);
    botonDireccion.addEventListener("click", function () {
        direccion = direccion === "asc" ? "desc" : "asc";
        botonDireccion.textContent = direccion === "asc" ? "↑" : "↓";
        render();
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            cerrarModal();
            if (!modalEliminar.classList.contains("oculto")) {
                modalEliminar.classList.add("oculto");
                eliminandoId = null;
            }
        }
    });

    // ---------- Inicio ----------
    cargar();
    render();
})();