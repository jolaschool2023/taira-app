(function () {
    "use strict";

    // ---------- Datos de ejemplo (libros) ----------
    var EJEMPLO = {
        encabezados: ["Título", "Autor", "Género", "Año", "Precio", "Calificación", "Páginas", "Existencias"],
        filas: [
            ["Cien años de soledad", "Gabriel García Márquez", "Realismo mágico", "1967", 350, 4.8, 417, 120],
            ["Don Quijote de la Mancha", "Miguel de Cervantes", "Clásico", "1605", 480, 4.7, 863, 85],
            ["El principito", "Antoine de Saint-Exupéry", "Infantil", "1943", 220, 4.9, 96, 200],
            ["1984", "George Orwell", "Ciencia ficción", "1949", 310, 4.6, 328, 90],
            ["Orgullo y prejuicio", "Jane Austen", "Romance", "1813", 260, 4.5, 398, 60],
            ["El código Da Vinci", "Dan Brown", "Misterio", "2003", 340, 4.2, 550, 110],
            ["Harry Potter y la piedra filosofal", "J. K. Rowling", "Fantasía", "1997", 400, 4.9, 309, 175],
            ["El nombre del viento", "Patrick Rothfuss", "Fantasía", "2007", 390, 4.7, 662, 140],
            ["Ensayo sobre la ceguera", "José Saramago", "Ficción contemporánea", "1995", 330, 4.4, 372, 45],
            ["La sombra del viento", "Carlos Ruiz Zafón", "Misterio", "2001", 320, 4.6, 478, 95],
            ["Sapiens", "Yuval Noah Harari", "Historia", "2011", 520, 4.5, 498, 130],
            ["El arte de la guerra", "Sun Tzu", "Filosofía", "-500", 180, 4.3, 224, 220],
            ["Los juegos del hambre", "Suzanne Collins", "Ciencia ficción", "2008", 290, 4.4, 376, 105],
            ["Patchwork", "Aurora Reyes", "Personal", "2019", 250, 4.0, 180, 12]
        ]
    };

    var columnas = [];        // { nombre, tipo }
    var filasDatos = [];      // objetos con valores ya tipados
    var filtrosTexto = {};    // nombreColumna -> valor seleccionado
    var busqueda = "";
    var ordenColumna = 0;
    var ordenDireccion = "asc";

    var PALETA = ["#2f6db5", "#8e44ad", "#c0392b", "#2e8b57", "#e67e22", "#1e3a5f", "#16a085", "#7f8c8d"];

    // ---------- Referencias al DOM ----------
    var importador = document.getElementById("importador");
    var botonEjemplo = document.getElementById("botonEjemplo");
    var nombreArchivo = document.getElementById("nombreArchivo");
    var totalRegistros = document.getElementById("totalRegistros");
    var totalFiltrados = document.getElementById("totalFiltrados");
    var metrica = document.getElementById("metrica");
    var valorPromedio = document.getElementById("valorPromedio");
    var valorMaximo = document.getElementById("valorMaximo");
    var valorMinimo = document.getElementById("valorMinimo");
    var columnaMaximo = document.getElementById("columnaMaximo");
    var columnaMinimo = document.getElementById("columnaMinimo");
    var tipoGrafica = document.getElementById("tipoGrafica");
    var campoGrafica = document.getElementById("campoGrafica");
    var contenedorGrafica = document.getElementById("contenedorGrafica");
    var cuerpoResumen = document.getElementById("cuerpoResumen");
    var buscador = document.getElementById("buscador");
    var filtrosDinamicos = document.getElementById("filtrosDinamicos");
    var botonLimpiarFiltros = document.getElementById("botonLimpiarFiltros");
    var cabeceraTabla = document.getElementById("cabeceraTabla");
    var cuerpoTabla = document.getElementById("cuerpoTabla");
    var mensajeVacio = document.getElementById("mensajeVacio");

    // ---------- Utilidades ----------
    function escapar(texto) {
        var div = document.createElement("div");
        div.textContent = texto == null ? "" : String(texto);
        return div.innerHTML;
    }

    function redondear(valor, decimales) {
        var factor = Math.pow(10, decimales);
        return Math.round(valor * factor) / factor;
    }

    function esNumero(cadena) {
        if (cadena == null || String(cadena).trim() === "") return false;
        return !isNaN(Number(cadena));
    }

    function formatearNumero(colIndex, valor) {
        return Number(valor).toLocaleString("es-MX", { maximumFractionDigits: 2 });
    }

    // ---------- Parseo de CSV ----------
    function parsearCSV(texto) {
        var filas = [];
        var fila = [];
        var celda = "";
        var entreComillas = false;

        for (var i = 0; i < texto.length; i++) {
            var c = texto[i];
            if (entreComillas) {
                if (c === '"') {
                    if (texto[i + 1] === '"') {
                        celda += '"';
                        i++;
                    } else {
                        entreComillas = false;
                    }
                } else {
                    celda += c;
                }
            } else {
                if (c === '"') {
                    entreComillas = true;
                } else if (c === ",") {
                    fila.push(celda);
                    celda = "";
                } else if (c === "\n" || c === "\r") {
                    if (c === "\r" && texto[i + 1] === "\n") i++;
                    fila.push(celda);
                    celda = "";
                    filas.push(fila);
                    fila = [];
                } else {
                    celda += c;
                }
            }
        }

        fila.push(celda);
        filas.push(fila);

        return filas
            .filter(function (f) { return f.some(function (c) { return String(c).trim() !== ""; }); })
            .map(function (f) { return f.map(function (c) { return c.trim(); }); });
    }

    // ---------- Carga de datos ----------
    function detectarTipos(encabezados, filas) {
        return encabezados.map(function (_, i) {
            var numericos = 0;
            var total = 0;
            filas.forEach(function (fila) {
                var valor = fila[i];
                if (valor == null || valor === "") return;
                total++;
                if (esNumero(valor)) numericos++;
            });
            return { tipo: total > 0 && numericos / total >= 0.6 ? "numero" : "texto" };
        });
    }

    function procesarFilas(encabezados, filas) {
        return filas.map(function (fila) {
            var objeto = {};
            encabezados.forEach(function (nombre, i) {
                var valor = fila[i];
                objeto[nombre] = (columnas[i].tipo === "numero" && esNumero(valor)) ? Number(valor) : (valor || "");
            });
            return objeto;
        });
    }

    function cargarDatos(encabezados, filas) {
        if (!encabezados.length || !filas.length) {
            alert("El archivo no contiene datos válidos.");
            return false;
        }

        columnas = encabezados.map(function (nombre, i) {
            return { nombre: nombre, tipo: detectarTipos(encabezados, filas)[i].tipo };
        });
        filasDatos = procesarFilas(encabezados, filas);
        filtrosTexto = {};
        busqueda = "";
        buscador.value = "";
        ordenColumna = 0;
        ordenDireccion = "asc";
        return true;
    }

    // ---------- Filtros ----------
    function aplicarFiltros() {
        var resultados = filasDatos.filter(function (fila) {
            if (busqueda) {
                var coincideBusqueda = columnas.some(function (col) {
                    return String(fila[col.nombre]).toLowerCase().indexOf(busqueda) !== -1;
                });
                if (!coincideBusqueda) return false;
            }

            for (var nombre in filtrosTexto) {
                if (!filtrosTexto.hasOwnProperty(nombre)) continue;
                var valorBuscado = filtrosTexto[nombre];
                if (valorBuscado && String(fila[nombre]) !== valorBuscado) return false;
            }

            return true;
        });
        return resultados;
    }

    // ---------- Render general ----------
    function renderTodo() {
        var filtradas = aplicarFiltros();
        renderControles();
        renderTarjetas(filtradas);
        renderResumen(filtradas);
        renderGrafica(filtradas);
        renderTabla(filtradas);
    }

    function renderControles() {
        var metricaAnterior = metrica.value;
        var graficaAnterior = campoGrafica.value;

        var numericas = columnas.filter(function (c) { return c.tipo === "numero"; });
        var texto = columnas.filter(function (c) { return c.tipo === "texto"; });

        // Selector de métrica
        var opciones = numericas.map(function (c) {
            return '<option value="' + escapar(c.nombre) + '">' + escapar(c.nombre) + "</option>";
        });
        metrica.innerHTML = opciones.join("");
        if (numericas.some(function (c) { return c.nombre === metricaAnterior; })) {
            metrica.value = metricaAnterior;
        }

        // Selector de columna para la gráfica
        var opcionesGrafica =
            (tipoGrafica.value === "barras" ? texto : numericas).map(function (c) {
                return '<option value="' + escapar(c.nombre) + '">' + escapar(c.nombre) + "</option>";
            }).join("");
        campoGrafica.innerHTML = opcionesGrafica;
        var disponibles = (tipoGrafica.value === "barras" ? texto : numericas);
        if (disponibles.some(function (c) { return c.nombre === graficaAnterior; })) {
            campoGrafica.value = graficaAnterior;
        }

        // Repoblar selectores de filtro sin perder selección
        construirFiltros();
    }

    function construirFiltros() {
        filtrosDinamicos.innerHTML = "";
        columnas.forEach(function (col) {
            if (col.tipo !== "texto") return;

            var valores = [];
            filasDatos.forEach(function (fila) {
                var v = String(fila[col.nombre]);
                if (v && valores.indexOf(v) === -1) valores.push(v);
            });
            valores.sort(function (a, b) { return a.localeCompare(b, "es"); });

            var seleccionado = filtrosTexto[col.nombre] || "";
            var select = document.createElement("select");
            select.setAttribute("aria-label", "Filtrar por " + col.nombre);

            var opcionTodas = document.createElement("option");
            opcionTodas.value = "";
            opcionTodas.textContent = col.nombre + ": todos";
            select.appendChild(opcionTodas);

            valores.forEach(function (v) {
                var opcion = document.createElement("option");
                opcion.value = v;
                opcion.textContent = v;
                if (v === seleccionado) opcion.selected = true;
                select.appendChild(opcion);
            });

            select.addEventListener("change", function () {
                filtrosTexto[col.nombre] = select.value;
                renderTodo();
            });

            filtrosDinamicos.appendChild(select);
        });
    }

    // ---------- Tarjetas de resumen ----------
    function renderTarjetas(filtradas) {
        totalRegistros.textContent = filtradas.length;
        totalFiltrados.textContent = filtradas.length === filasDatos.length
            ? ""
            : "tras filtrar " + filasDatos.length;

        var numericas = columnas.filter(function (c) { return c.tipo === "numero"; });
        var nombre = numericas.length ? numericas[0].nombre : null;

        if (!nombre || filtradas.length === 0) {
            valorPromedio.textContent = "0";
            valorMaximo.textContent = "0";
            valorMinimo.textContent = "0";
            columnaMaximo.textContent = nombre || "—";
            columnaMinimo.textContent = nombre || "—";
            return;
        }

        var suma = filtradas.reduce(function (acum, f) { return acum + f[nombre]; }, 0);
        var maximo = filtradas.reduce(function (m, f) { return f[nombre] > m ? f[nombre] : m; }, Number.NEGATIVE_INFINITY);
        var minimo = filtradas.reduce(function (m, f) { return f[nombre] < m ? f[nombre] : m; }, Number.POSITIVE_INFINITY);

        valorPromedio.textContent = redondear(suma / filtradas.length, 2);
        valorMaximo.textContent = formatearNumero(0, maximo);
        valorMinimo.textContent = formatearNumero(0, minimo);
        columnaMaximo.textContent = "(" + nombre + ")";
        columnaMinimo.textContent = "(" + nombre + ")";
    }

    // ---------- Tabla de estadísticas por columna ----------
    function renderResumen(filtradas) {
        cuerpoResumen.innerHTML = "";
        columnas.forEach(function (col) {
            if (col.tipo !== "numero") return;

            var tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" + escapar(col.nombre) + "</td>";

            if (filtradas.length === 0) {
                tr.innerHTML += "<td class='numero'>0</td><td class='numero'>0</td><td class='numero'>0</td>";
            } else {
                var valores = filtradas.map(function (f) { return f[col.nombre]; });
                var suma = valores.reduce(function (a, b) { return a + b; }, 0);
                var max = Math.max.apply(null, valores);
                var min = Math.min.apply(null, valores);
                tr.innerHTML +=
                    "<td class='numero'>" + redondear(suma / valores.length, 2) + "</td>" +
                    "<td class='numero'>" + formatearNumero(0, max) + "</td>" +
                    "<td class='numero'>" + formatearNumero(0, min) + "</td>";
            }

            cuerpoResumen.appendChild(tr);
        });
    }

    // ---------- Gráfica ----------
    function renderGrafica(filtradas) {
        var nombre = campoGrafica.value;
        if (!nombre) {
            contenedorGrafica.innerHTML = '<p class="sin-datos">Sin datos</p>';
            return;
        }
        contenedorGrafica.innerHTML = "";
        if (!filtradas.length) {
            contenedorGrafica.innerHTML = '<p class="sin-datos">Sin datos para mostrar</p>';
            return;
        }

        var col = columnas.filter(function (c) { return c.nombre === nombre; })[0];
        if (!col) return;

        if (tipoGrafica.value === "barras") {
            var conteos = {};
            filtradas.forEach(function (fila) {
                var v = String(fila[nombre]);
                if (!v) return;
                conteos[v] = (conteos[v] || 0) + 1;
            });

            var lista = Object.keys(conteos).map(function (clave) {
                return { nombre: clave, cantidad: conteos[clave] };
            }).sort(function (a, b) { return b.cantidad - a.cantidad; }).slice(0, 12);

            var maximo = Math.max.apply(null, lista.map(function (l) { return l.cantidad; }));

            lista.forEach(function (item, i) {
                var alto = item.cantidad === 0 ? 0 : Math.max(6, (item.cantidad / maximo) * 100);
                contenedorGrafica.innerHTML +=
                    '<div class="fila-barra">' +
                        '<span class="nombre" title="' + escapar(item.nombre) + '">' + escapar(item.nombre) + "</span>" +
                        '<div class="pista"><div class="relleno" style="width:' + alto + '%;background:' + PALETA[i % PALETA.length] + '"></div></div>' +
                        '<span class="valor">' + item.cantidad + "</span>" +
                    "</div>";
            });
        } else {
            // Histograma
            var numeros = filtradas.map(function (fila) { return fila[nombre]; })
                .filter(function (v) { return isFinite(v); });
            if (!numeros.length) {
                contenedorGrafica.innerHTML = '<p class="sin-datos">La columna no tiene valores numéricos</p>';
                return;
            }

            var minimo = Math.min.apply(null, numeros);
            var maximo = Math.max.apply(null, numeros);
            var cajas = 8;
            var ancho = (maximo - minimo) / cajas || 1;
            var conteos = new Array(cajas).fill(0);

            numeros.forEach(function (v) {
                var indice = Math.min(cajas - 1, Math.max(0, Math.floor((v - minimo) / ancho)));
                conteos[indice]++;
            });

            var maxConteo = Math.max.apply(null, conteos);

            conteos.forEach(function (cuenta, i) {
                var inicio = redondear(minimo + i * ancho, 2);
                var fin = redondear(minimo + (i + 1) * ancho, 2);
                var etiqueta = i === 0 ? "[" + inicio + " – " + fin + ")" : inicio + " – " + fin;
                if (i === cajas - 1 && fin === minimo + cajas * ancho) etiqueta = inicio + " – " + fin;
                var alto = cuenta === 0 ? 0 : Math.max(6, (cuenta / maxConteo) * 100);
                contenedorGrafica.innerHTML +=
                    '<div class="fila-barra">' +
                        '<span class="nombre" title="Rango">' + escapar(etiqueta) + "</span>" +
                        '<div class="pista"><div class="relleno" style="width:' + alto + '%;background:' + PALETA[i % PALETA.length] + '"></div></div>' +
                        '<span class="valor">' + cuenta + "</span>" +
                    "</div>";
            });
        }
    }

    // ---------- Tabla de datos ----------
    function renderTabla(filtradas) {
        var numericas = columnas.map(function (c) { return c.tipo === "numero"; });

        cabeceraTabla.innerHTML = "";
        var filaCabecera = document.createElement("tr");
        columnas.forEach(function (col, i) {
            var th = document.createElement("th");
            var flecha = "▾";
            if (i !== ordenColumna) {
                flecha = "▾";
                th.innerHTML = escapar(col.nombre) + '<span class="flecha vacia">▾</span>';
            } else {
                th.innerHTML = escapar(col.nombre) +
                    '<span class="flecha">' + (ordenDireccion === "asc" ? "▲" : "▼") + "</span>";
            }
            th.dataset.indice = i;
            th.addEventListener("click", function () {
                if (i === ordenColumna) {
                    ordenDireccion = ordenDireccion === "asc" ? "desc" : "asc";
                } else {
                    ordenColumna = i;
                    ordenDireccion = "asc";
                }
                renderTodo();
            });
            filaCabecera.appendChild(th);
        });
        cabeceraTabla.appendChild(filaCabecera);

        // Ordenamiento
        var ordenadas = filtradas.slice().sort(function (a, b) {
            var va = a[columnas[ordenColumna].nombre];
            var vb = b[columnas[ordenColumna].nombre];
            var resultado;
            if (columnas[ordenColumna].tipo === "numero") {
                resultado = va - vb;
            } else {
                resultado = String(va).localeCompare(String(vb), "es");
            }
            return ordenDireccion === "asc" ? resultado : -resultado;
        });

        cuerpoTabla.innerHTML = "";
        ordenadas.forEach(function (fila) {
            var tr = document.createElement("tr");
            columnas.forEach(function (col, i) {
                var valor = fila[col.nombre];
                var clase = col.tipo === "numero" ? ' class="numero"' : "";
                tr.innerHTML += "<td" + clase + ">" + escapar(valor) + "</td>";
            });
            cuerpoTabla.appendChild(tr);
        });

        mensajeVacio.classList.toggle("oculto", ordenadas.length > 0);
    }

    // ---------- Importación de CSV ----------
    function leerArchivo(archivo) {
        var lector = new FileReader();
        lector.onload = function (evento) {
            var filas = parsearCSV(evento.target.result);
            if (filas.length < 2) {
                alert("El archivo debe tener al menos un encabezado y un registro.");
                return;
            }
            var encabezados = filas[0];
            var datos = filas.slice(1);
            if (cargarDatos(encabezados, datos)) {
                nombreArchivo.textContent = "✔ " + archivo.name;
                renderTodo();
            }
        };
        lector.onerror = function () {
            alert("No se pudo leer el archivo.");
        };
        lector.readAsText(archivo, "UTF-8");
    }

    // ---------- Eventos ----------
    importador.addEventListener("change", function () {
        if (importador.files.length) {
            leerArchivo(importador.files[0]);
        }
        importador.value = "";
    });

    botonEjemplo.addEventListener("click", function () {
        if (cargarDatos(EJEMPLO.encabezados, EJEMPLO.filas)) {
            nombreArchivo.textContent = "Datos de ejemplo (libros)";
            renderTodo();
        }
    });

    buscador.addEventListener("input", function () {
        busqueda = buscador.value.trim().toLowerCase();
        renderTodo();
    });

    botonLimpiarFiltros.addEventListener("click", function () {
        busqueda = "";
        buscador.value = "";
        filtrosTexto = {};
        renderTodo();
    });

    metrica.addEventListener("change", renderTodo);
    tipoGrafica.addEventListener("change", renderTodo);
    campoGrafica.addEventListener("change", renderTodo);

    // ---------- Inicio ----------
    if (cargarDatos(EJEMPLO.encabezados, EJEMPLO.filas)) {
        nombreArchivo.textContent = "Datos de ejemplo (libros)";
        totalFiltrados.textContent = "";
        renderTodo();
    }
})();