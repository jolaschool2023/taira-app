(function () {
    "use strict";

    // ---------- Constantes y claves de almacenamiento ----------
    var CLAVES = {
        preguntas: "estudioPreguntas",
        tarjetas: "estudioTarjetas",
        quiz: "estudioQuiz",
        practica: "estudioPractica",
        iniciado: "estudioIniciado"
    };

    var DIFICULTADES = [
        { valor: "facil", etiqueta: "Fácil" },
        { valor: "medio", etiqueta: "Medio" },
        { valor: "dificil", etiqueta: "Difícil" }
    ];

    var ETIQUETA_DIFICULTAD = { facil: "Fácil", medio: "Medio", dificil: "Difícil" };

    // Umbral: un tema requiere práctica si su rendimiento es menor a esto
    var UMBRAL_PRACTICA = 70;

    // ---------- Datos de ejemplo ----------
    var EJEMPLO = {
        preguntas: [
            { tema: "Biología", dificultad: "medio", pregunta: "¿Qué es la fotosíntesis?", respuesta: "Es el proceso en que las plantas convierten la luz en energía química." },
            { tema: "Matemáticas", dificultad: "facil", pregunta: "¿Qué es un número primo?", respuesta: "Un número mayor que 1 que solo es divisible entre sí mismo y 1." },
            { tema: "Historia", dificultad: "medio", pregunta: "¿Para qué servían los muros de una ciudad amurallada?", respuesta: "Para protegerse de invasiones y delimitar el territorio." }
        ],
        tarjetas: [
            { tema: "Biología", dificultad: "facil", frente: "Proceso que usan las plantas para fabricar alimento", reverso: "Fotosíntesis" },
            { tema: "Biología", dificultad: "medio", frente: "¿Qué orgánulo produce energía en la célula?", reverso: "Mitocondria" },
            { tema: "Biología", dificultad: "dificil", frente: "Molécula que almacena la información genética", reverso: "ADN" },
            { tema: "Historia", dificultad: "facil", frente: "Año en que Cristóbal Colón llegó a América", reverso: "1492" },
            { tema: "Historia", dificultad: "medio", frente: "Civilización que construyó Machu Picchu", reverso: "Los incas" },
            { tema: "Historia", dificultad: "dificil", frente: "Emperador bajo el cual Roma se volvió imperio", reverso: "Augusto" },
            { tema: "Matemáticas", dificultad: "facil", frente: "¿Cuánto es 7 × 8?", reverso: "56" },
            { tema: "Matemáticas", dificultad: "medio", frente: "Área de un triángulo con base 4 y altura 6", reverso: "12" },
            { tema: "Matemáticas", dificultad: "dificil", frente: "Valor de la derivada de x² en x = 3", reverso: "6" }
        ]
    };

    // ---------- Estado ----------
    var preguntas = [];
    var tarjetas = [];
    var registrosQuiz = [];
    var registrosPractica = [];

    var editPreguntaId = null;
    var editTarjetaId = null;

    var sesionEstudio = null;      // tarjetas de la sesión de práctica
    var sesionExamen = null;       // preguntas del examen actual

    // ---------- Utilidades ----------
    function uuid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function normalizar(texto) {
        return String(texto)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[¿?!¡.,;:()/%*'"+-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function hoy() {
        var d = new Date();
        return d.toLocaleDateString("es-MX") + " " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    }

    function escapar(texto) {
        var div = document.createElement("div");
        div.textContent = texto == null ? "" : String(texto);
        return div.innerHTML;
    }

    // ---------- Almacenamiento ----------
    function cargarTodo() {
        try {
            preguntas = JSON.parse(localStorage.getItem(CLAVES.preguntas)) || [];
            tarjetas = JSON.parse(localStorage.getItem(CLAVES.tarjetas)) || [];
            registrosQuiz = JSON.parse(localStorage.getItem(CLAVES.quiz)) || [];
            registrosPractica = JSON.parse(localStorage.getItem(CLAVES.practica)) || [];
        } catch (e) {
            preguntas = []; tarjetas = []; registrosQuiz = []; registrosPractica = [];
        }
    }

    function guardarPreguntas() { localStorage.setItem(CLAVES.preguntas, JSON.stringify(preguntas)); }
    function guardarTarjetas() { localStorage.setItem(CLAVES.tarjetas, JSON.stringify(tarjetas)); }
    function guardarQuiz() { localStorage.setItem(CLAVES.quiz, JSON.stringify(registrosQuiz)); }
    function guardarPractica() { localStorage.setItem(CLAVES.practica, JSON.stringify(registrosPractica)); }

    // ---------- Temas ----------
    function temas() {
        var lista = {};
        preguntas.concat(tarjetas).forEach(function (item) {
            if (item.tema) lista[item.tema] = true;
        });
        return Object.keys(lista).sort(function (a, b) { return a.localeCompare(b, "es"); });
    }

    function rellenarSelectTemas(select, conservar) {
        var anterior = conservar && select.value;
        select.innerHTML = '<option value="todos">Todos los temas</option>';
        temas().forEach(function (t) {
            var op = document.createElement("option");
            op.value = t;
            op.textContent = t;
            select.appendChild(op);
        });
        if (anterior && temas().indexOf(anterior) !== -1) select.value = anterior;
    }

    function rellenarSelectDificultad(select, incluirTodas) {
        var anterior = select.value;
        select.innerHTML = "";
        if (incluirTodas) {
            var todos = document.createElement("option");
            todos.value = "todas";
            todos.textContent = "Todas las dificultades";
            select.appendChild(todos);
        }
        DIFICULTADES.forEach(function (d) {
            var op = document.createElement("option");
            op.value = d.valor;
            op.textContent = d.etiqueta;
            select.appendChild(op);
        });
        if (anterior) select.value = anterior;
    }

    function filtroDatalistTemas() {
        var lista = document.getElementById("listaTemas");
        if (!lista) return;
        lista.innerHTML = "";
        temas().forEach(function (t) {
            var op = document.createElement("option");
            op.value = t;
            lista.appendChild(op);
        });
    }

    // ---------- Resumen de dificultad ----------
    function badgeDificultad(valor) {
        return '<span class="badge ' + valor + '">' + ETIQUETA_DIFICULTAD[valor] + "</span>";
    }

    // ========================================================================
    // PESTAÑA: PREGUNTAS
    // ========================================================================
    function renderPreguntas() {
        var filtro = document.getElementById("filtroTemaPreguntas").value;
        var lista = document.getElementById("listaPreguntas");
        var vacio = document.getElementById("vacioPreguntas");

        lista.innerHTML = "";
        var visibles = preguntas.filter(function (p) {
            return filtro === "todos" || p.tema === filtro;
        });

        visibles.forEach(function (p) {
            var li = document.createElement("li");
            li.className = "item";
            li.innerHTML =
                '<div class="pregunta-texto">' + escapar(p.pregunta) + "</div>" +
                '<div class="respuesta"><strong>R:</strong> ' + escapar(p.respuesta) + "</div>" +
                '<div class="meta">' +
                    '<span class="badge tema">' + escapar(p.tema) + "</span> " +
                    badgeDificultad(p.dificultad) +
                "</div>" +
                '<div class="acciones-item">' +
                    '<button data-accion="editar" data-id="' + p.id + '">✏️ Editar</button>' +
                    '<button class="eliminar" data-accion="eliminar" data-id="' + p.id + '">🗑️ Eliminar</button>' +
                "</div>";
            lista.appendChild(li);
        });

        vacio.classList.toggle("oculto", visibles.length > 0);
    }

    function guardarPreguntaDesdeForm(evento) {
        evento.preventDefault();
        var tema = document.getElementById("temaPregunta").value.trim();
        var dificultad = document.getElementById("dificultadPregunta").value;
        var pregunta = document.getElementById("textoPregunta").value.trim();
        var respuesta = document.getElementById("respuestaPregunta").value.trim();
        if (!tema || !pregunta || !respuesta) return;

        if (editPreguntaId) {
            var idx = preguntas.findIndex(function (p) { return p.id === editPreguntaId; });
            preguntas[idx].tema = tema;
            preguntas[idx].dificultad = dificultad;
            preguntas[idx].pregunta = pregunta;
            preguntas[idx].respuesta = respuesta;
        } else {
            preguntas.push({ id: uuid(), tema: tema, dificultad: dificultad, pregunta: pregunta, respuesta: respuesta });
        }

        guardarPreguntas();
        document.getElementById("formPregunta").reset();
        cancelarEditPregunta();
        refrescarSelectoresYvistas();
    }

    // ========================================================================
    // PESTAÑA: TARJETAS
    // ========================================================================
    function renderTarjetas() {
        var filtro = document.getElementById("filtroTemaTarjetas").value;
        var grilla = document.getElementById("grillaTarjetas");
        var vacio = document.getElementById("vacioTarjetas");

        grilla.innerHTML = "";
        var visibles = tarjetas.filter(function (t) {
            return filtro === "todos" || t.tema === filtro;
        });

        visibles.forEach(function (t) {
            var div = document.createElement("div");
            div.className = "tarjeta-mini";
            div.innerHTML =
                '<div class="frente">' + escapar(t.frente) + "</div>" +
                '<div class="reverso"><strong>R:</strong> ' + escapar(t.reverso) + "</div>" +
                '<div class="meta">' +
                    '<span class="badge tema">' + escapar(t.tema) + "</span> " +
                    badgeDificultad(t.dificultad) +
                "</div>" +
                '<div class="acciones-item">' +
                    '<button data-accion="editar" data-id="' + t.id + '">✏️ Editar</button>' +
                    '<button class="eliminar" data-accion="eliminar" data-id="' + t.id + '">🗑️</button>' +
                "</div>";
            grilla.appendChild(div);
        });

        vacio.classList.toggle("oculto", visibles.length > 0);
        var boton = document.getElementById("botonEstudiar");
        boton.disabled = visibles.length === 0;
        boton.style.opacity = visibles.length === 0 ? 0.5 : 1;
    }

    function guardarTarjetaDesdeForm(evento) {
        evento.preventDefault();
        var tema = document.getElementById("temaTarjeta").value.trim();
        var dificultad = document.getElementById("dificultadTarjeta").value;
        var frente = document.getElementById("frenteTarjeta").value.trim();
        var reverso = document.getElementById("reversoTarjeta").value.trim();
        if (!tema || !frente || !reverso) return;

        if (editTarjetaId) {
            var idx = tarjetas.findIndex(function (t) { return t.id === editTarjetaId; });
            tarjetas[idx].tema = tema;
            tarjetas[idx].dificultad = dificultad;
            tarjetas[idx].frente = frente;
            tarjetas[idx].reverso = reverso;
        } else {
            tarjetas.push({ id: uuid(), tema: tema, dificultad: dificultad, frente: frente, reverso: reverso });
        }

        guardarTarjetas();
        document.getElementById("formTarjeta").reset();
        cancelarEditTarjeta();
        refrescarSelectoresYvistas();
    }

    // ========================================================================
    // MODAL: ESTUDIO DE TARJETAS
    // ========================================================================
    function abrirEstudio() {
        var filtro = document.getElementById("filtroTemaTarjetas").value;
        var pool = tarjetas.filter(function (t) {
            return filtro === "todos" || t.tema === filtro;
        });
        if (!pool.length) return;

        var barajadas = pool.slice().sort(function () { return Math.random() - 0.5; });
        sesionEstudio = { tarjetas: barajadas, indice: 0, aciertos: 0, total: barajadas.length };

        document.getElementById("modalEstudio").classList.remove("oculto");
        document.getElementById("botonSabia").style.display = "inline-block";
        document.getElementById("botonNoSabia").style.display = "inline-block";
        mostrarTarjetaEstudio();
    }

    function mostrarTarjetaEstudio() {
        var sesion = sesionEstudio;
        var tarjeta = sesion.tarjetas[sesion.indice];
        var contador = document.getElementById("contadorEstudio");
        contador.textContent = "Tarjeta " + (sesion.indice + 1) + " de " + sesion.total;

        var caja = document.getElementById("tarjetaEstudio");
        caja.classList.remove("girada");
        document.getElementById("inicioTarjeta").textContent = tarjeta.frente;
    }

    function voltearTarjetaEstudio() {
        var tarjeta = sesionEstudio.tarjetas[sesionEstudio.indice];
        var caja = document.getElementById("tarjetaEstudio");
        var girada = caja.classList.toggle("girada");
        document.getElementById("inicioTarjeta").textContent = girada ? tarjeta.reverso : tarjeta.frente;
    }

    function registrarPractica(acerto) {
        var sesion = sesionEstudio;
        var tarjeta = sesion.tarjetas[sesion.indice];
        if (acerto) sesion.aciertos++;

        registrosPractica.push({
            id: uuid(),
            fecha: hoy(),
            tarjetaId: tarjeta.id,
            tema: tarjeta.tema,
            dificultad: tarjeta.dificultad,
            correcto: acerto
        });
        guardarPractica();

        sesion.indice++;
        if (sesion.indice < sesion.total) {
            mostrarTarjetaEstudio();
        } else {
            finalizarEstudio();
        }
    }

    function finalizarEstudio() {
        document.getElementById("inicioTarjeta").textContent =
            "¡Sesión terminada! Respondiste bien " + sesionEstudio.aciertos + " de " + sesionEstudio.total + " tarjetas.";
        document.getElementById("contadorEstudio").textContent = "Estudio completado 🎉";
        document.getElementById("botonSabia").style.display = "none";
        document.getElementById("botonNoSabia").style.display = "none";
        sesionEstudio = null;
    }

    // ========================================================================
    // PESTAÑA: EXÁMENES
    // ========================================================================
    function itemsExamenDisponibles() {
        // Une tarjetas y preguntas con el mismo formato
        var items = [];
        tarjetas.forEach(function (t) {
            items.push({ tipo: "tarjeta", id: t.id, tema: t.tema, dificultad: t.dificultad, pregunta: t.frente, respuesta: t.reverso });
        });
        preguntas.forEach(function (p) {
            items.push({ tipo: "pregunta", id: p.id, tema: p.tema, dificultad: p.dificultad, pregunta: p.pregunta, respuesta: p.respuesta });
        });
        return items;
    }

    function iniciarExamen() {
        var tema = document.getElementById("temaExamen").value;
        var dificultad = document.getElementById("dificultadExamen").value;
        var cantidad = Math.max(1, parseInt(document.getElementById("cantidadExamen").value, 10) || 5);

        var pool = itemsExamenDisponibles().filter(function (item) {
            var coincideTema = tema === "todos" || item.tema === tema;
            var coincideDificultad = dificultad === "todas" || item.dificultad === dificultad;
            return coincideTema && coincideDificultad;
        });

        if (!pool.length) {
            window.alert("No hay tarjetas ni preguntas para ese tema/dificultad. Crea algunas primero.");
            return;
        }

        var seleccion = pool.slice().sort(function () { return Math.random() - 0.5; }).slice(0, cantidad);

        sesionExamen = {
            items: seleccion,
            indice: 0,
            correctas: 0,
            tema: tema === "todos" ? "Todos" : tema,
            dificultad: dificultad === "todas" ? "Mixta" : ETIQUETA_DIFICULTAD[dificultad]
        };

        document.getElementById("configExamen").classList.add("oculto");
        document.getElementById("resultadoExamen").classList.add("oculto");
        document.getElementById("areaExamen").classList.remove("oculto");
        document.getElementById("botonSiguiente").classList.add("oculto");
        mostrarPreguntaExamen();
    }

    function respuestasDisponibles() {
        // Respuestas únicas de todo el contenido (para distractores)
        var respuestas = [];
        itemsExamenDisponibles().forEach(function (item) {
            var r = normalizar(item.respuesta);
            if (r && respuestas.indexOf(r) === -1) respuestas.push(r);
        });
        return respuestas;
    }

    function mostrarPreguntaExamen() {
        var s = sesionExamen;
        var item = s.items[s.indice];

        document.getElementById("contadorPregunta").textContent =
            "Pregunta " + (s.indice + 1) + " de " + s.items.length;
        document.getElementById("textoPreguntaExamen").textContent = item.pregunta;

        document.getElementById("rellenoProgreso").style.width =
            ((s.indice) / s.items.length) * 100 + "%";

        var respuestas = respuestasDisponibles();
        var correctoN = normalizar(item.respuesta);

        document.getElementById("feedbackExamen").classList.add("oculto");
        document.getElementById("feedbackExamen").innerHTML = "";
        document.getElementById("botonSiguiente").classList.add("oculto");

        // ¿Hay suficientes respuestas distintas para opción múltiple?
        var distintas = respuestas.filter(function (r) { return r !== correctoN; });
        document.getElementById("opcionesExamen").innerHTML = "";
        document.getElementById("zonaLibre").classList.add("oculto");

        if (distintas.length >= 3) {
            var distractores = barajar(distintas).slice(0, 3);
            var opciones = barajar([correctoN].concat(distractores));
            var cont = document.getElementById("opcionesExamen");
            opciones.forEach(function (op) {
                var boton = document.createElement("button");
                boton.className = "opcion";
                boton.textContent = op;
                boton.addEventListener("click", function () {
                    responderExamen(boton, item);
                });
                cont.appendChild(boton);
            });
        } else {
            var zona = document.getElementById("zonaLibre");
            zona.classList.remove("oculto");
            var input = document.getElementById("respuestaLibre");
            input.value = "";
            input.focus();
        }
    }

    function barajar(lista) {
        return lista.slice().sort(function () { return Math.random() - 0.5; });
    }

    function responderExamen(boton, item) {
        if (!sesionExamen) return;
        var correcto = normalizar(boton.textContent) === normalizar(item.respuesta);
        if (!correcto) boton.classList.add("incorrecta");
        evaluarRespuestaExamen(correcto, item);
    }

    function responderLibre(evento) {
        evento.preventDefault();
        var input = document.getElementById("respuestaLibre");
        var respuestaUsuario = input.value.trim();
        if (!respuestaUsuario) return;
        var item = sesionExamen.items[sesionExamen.indice];
        var correcto = normalizar(respuestaUsuario) === normalizar(item.respuesta);
        evaluarRespuestaExamen(correcto, item);
    }

    function evaluarRespuestaExamen(correcto, item) {
        var s = sesionExamen;
        if (correcto) s.correctas++;

        var feedback = document.getElementById("feedbackExamen");
        feedback.classList.remove("oculto");
        feedback.className = "feedback " + (correcto ? "acierto" : "fallo");
        feedback.innerHTML = correcto
            ? "<strong>¡Correcto!</strong> Bien hecho."
            : "<strong>Incorrecto.</strong> Respuesta correcta: " + escapar(item.respuesta);

        // Deshabilitar opciones
        var opciones = document.querySelectorAll("#opcionesExamen .opcion");
        opciones.forEach(function (b) {
            b.disabled = true;
            if (normalizar(b.textContent) === normalizar(item.respuesta)) b.classList.add("correcta");
        });
        document.getElementById("zonaLibre").classList.add("oculto");

        var botonSiguiente = document.getElementById("botonSiguiente");
        botonSiguiente.classList.remove("oculto");
        botonSiguiente.textContent = s.indice === s.items.length - 1 ? "Ver resultado 🏁" : "Siguiente ➤";
    }

    function siguientePregunta() {
        sesionExamen.indice++;
        if (sesionExamen.indice < sesionExamen.items.length) {
            mostrarPreguntaExamen();
        } else {
            finalizarExamen();
        }
    }

    function finalizarExamen() {
        var s = sesionExamen;
        var porcentaje = Math.round((s.correctas / s.items.length) * 100);

        registrosQuiz.push({
            id: uuid(),
            fecha: hoy(),
            tema: s.tema,
            dificultad: s.dificultad,
            total: s.items.length,
            correctas: s.correctas,
            porcentaje: porcentaje
        });
        guardarQuiz();

        document.getElementById("areaExamen").classList.add("oculto");
        document.getElementById("resultadoExamen").classList.remove("oculto");

        var textoResultado = document.getElementById("textoResultado");
        textoResultado.textContent = porcentaje + "%";
        textoResultado.style.color = porcentaje >= UMBRAL_PRACTICA ? "#2e8b57" : "#c0392b";

        document.getElementById("detalleResultado").textContent =
            "Acertaste " + s.correctas + " de " + s.items.length +
            " preguntas (" + s.tema + "). Tu resultado se guardó en tu historial.";

        document.getElementById("botonRepetir").onclick = function () {
            document.getElementById("configExamen").classList.remove("oculto");
            document.getElementById("resultadoExamen").classList.add("oculto");
            sesionExamen = null;
        };

        document.getElementById("botonProgreso").onclick = function () {
            document.getElementById("resultadoExamen").classList.add("oculto");
            document.getElementById("configExamen").classList.remove("oculto");
            sesionExamen = null;
            activarVista("progreso");
        };

        // Limpiar referencia para no alterar el siguiente examen
        sesionExamen = null;
    }

    function salirExamen() {
        sesionExamen = null;
        document.getElementById("areaExamen").classList.add("oculto");
        document.getElementById("configExamen").classList.remove("oculto");
    }

    // ========================================================================
    // PESTAÑA: PROGRESO
    // ========================================================================
    function analizarProgreso() {
        var promedioExamenes = 0;
        if (registrosQuiz.length) {
            promedioExamenes = Math.round(
                registrosQuiz.reduce(function (a, r) { return a + r.porcentaje; }, 0) / registrosQuiz.length
            );
        }

        var practicadas = registrosPractica.length;
        var aciertosPantalla = registrosPractica.filter(function (r) { return r.correcto; }).length;
        var precision = practicadas ? Math.round((aciertosPantalla / practicadas) * 100) : 0;

        document.getElementById("totalExamenes").textContent = registrosQuiz.length;
        document.getElementById("promedioExamenes").textContent = promedioExamenes + "%";
        document.getElementById("totalPracticadas").textContent = practicadas;
        document.getElementById("precisionPractica").textContent = precision + "%";

        rendimientoPorTema();
        temasAPracticar();
        renderTablaExamenes();
    }

    function rendimientoTema(tema) {
        var quizzesTema = registrosQuiz.filter(function (r) { return r.tema === tema; });
        var practicasTema = registrosPractica.filter(function (r) { return r.tema === tema; });

        var porcentajeQuiz = quizzesTema.length
            ? Math.round(quizzesTema.reduce(function (a, r) { return a + r.porcentaje; }, 0) / quizzesTema.length)
            : null;
        var porcentajePractica = practicasTema.length
            ? Math.round(practicasTema.filter(function (r) { return r.correcto; }).length / practicasTema.length * 100)
            : null;

        var totalIntentos = (quizzesTema.length ? quizzesTema.length : 0) + practicasTema.length;
        return { porcentajeQuiz: porcentajeQuiz, porcentajePractica: porcentajePractica, intentos: totalIntentos };
    }

    function rendimientoPorTema() {
        var contenedor = document.getElementById("rendimientoTemas");
        contenedor.innerHTML = "";
        var listaTemas = temas();
        if (!listaTemas.length) {
            contenedor.innerHTML = '<div class="mensaje-vacio"><p>Sin temas todavía.</p></div>';
            return;
        }

        listaTemas.forEach(function (tema) {
            var rend = rendimientoTema(tema);
            var valores = [];
            if (rend.porcentajeQuiz !== null) valores.push(rend.porcentajeQuiz);
            if (rend.porcentajePractica !== null) valores.push(rend.porcentajePractica);
            var general = valores.length ? Math.round(valores.reduce(function (a, b) { return a + b; }, 0) / valores.length) : null;
            var mostrado = general === null ? 0 : general;
            var color = mostrado >= UMBRAL_PRACTICA ? "#2e8b57" : "#c0392b";

            var fila = document.createElement("div");
            fila.className = "fila-tema";
            fila.innerHTML =
                '<span class="nombre" title="' + escapar(tema) + '">' + escapar(tema) + "</span>" +
                '<div class="pista"><div class="relleno" style="width:' + mostrado + "%;background:" + color + '"></div></div>' +
                '<span class="valor">' + (general === null ? "—" : mostrado + "%") + "</span>";
            contenedor.appendChild(fila);
        });
    }

    function temasAPracticar() {
        var listaTemas = temas();
        var practicar = [];

        listaTemas.forEach(function (tema) {
            var rend = rendimientoTema(tema);
            if (rend.intentos === 0) return;

            var alcance = [rend.porcentajeQuiz, rend.porcentajePractica]
                .filter(function (v) { return v !== null; });
            var promedio = alcance.length ? alcance.reduce(function (a, b) { return a + b; }, 0) / alcance.length : 0;
            if (promedio < UMBRAL_PRACTICA) {
                practicar.push({ tema: tema, promedio: promedio });
            }
        });

        var lista = document.getElementById("listaPracticar");
        var vacio = document.getElementById("vacioPracticar");
        lista.innerHTML = "";
        practicar.sort(function (a, b) { return a.promedio - b.promedio; });
        practicar.forEach(function (p) {
            var li = document.createElement("li");
            li.innerHTML = "<strong>" + escapar(p.tema) + "</strong> precisa más práctica (rendimiento " +
                Math.round(p.promedio) + "%, debajo del " + UMBRAL_PRACTICA + "%).";
            lista.appendChild(li);
        });

        vacio.classList.toggle("oculto", practicar.length > 0);
    }

    function renderTablaExamenes() {
        var tbody = document.getElementById("tablaExamenes");
        tbody.innerHTML = "";
        var recientes = registrosQuiz.slice().reverse();
        recientes.forEach(function (r) {
            var tr = document.createElement("tr");
            var color = r.porcentaje >= UMBRAL_PRACTICA ? "#2e8b57" : "#c0392b";
            tr.innerHTML =
                "<td>" + escapar(r.fecha) + "</td>" +
                "<td>" + escapar(r.tema) + "</td>" +
                "<td>" + escapar(r.dificultad) + "</td>" +
                '<td class="num">' + r.correctas + " / " + r.total + "</td>" +
                '<td class="num" style="color:' + color + ';font-weight:700">' + r.porcentaje + "%</td>";
            tbody.appendChild(tr);
        });
        if (!recientes.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999">Aún no has tomado exámenes.</td></tr>';
        }
    }

    // ========================================================================
    // Vista / selectores / ejemplo / vaciado
    // ========================================================================
    function activarVista(nombre) {
        var pestanas = document.querySelectorAll(".pestana");
        pestanas.forEach(function (b) {
            b.classList.toggle("activa", b.dataset.vista === nombre);
        });
        var vistas = document.querySelectorAll(".vista");
        vistas.forEach(function (v) {
            v.classList.toggle("activa", v.id === "vista-" + nombre);
        });
    }

    function refrescarSelectoresYvistas() {
        filtroDatalistTemas();
        rellenarSelectTemas(document.getElementById("filtroTemaPreguntas"), true);
        rellenarSelectTemas(document.getElementById("filtroTemaTarjetas"), true);
        rellenarSelectTemas(document.getElementById("temaExamen"), true);
        renderPreguntas();
        renderTarjetas();
    }

    function rellenarFormulariosDificultad() {
        rellenarSelectDificultad(document.getElementById("dificultadPregunta"));
        rellenarSelectDificultad(document.getElementById("dificultadTarjeta"));
        rellenarSelectDificultad(document.getElementById("dificultadExamen"), true);
    }

    function cargarEjemplo() {
        var agregadas = 0;
        EJEMPLO.preguntas.forEach(function (p) {
            var existe = preguntas.some(function (x) {
                return x.pregunta === p.pregunta && x.tema === p.tema;
            });
            if (!existe) {
                preguntas.push({ id: uuid(), tema: p.tema, dificultad: p.dificultad, pregunta: p.pregunta, respuesta: p.respuesta });
                agregadas++;
            }
        });
        EJEMPLO.tarjetas.forEach(function (t) {
            var existe = tarjetas.some(function (x) {
                return x.frente === t.frente && x.tema === t.tema;
            });
            if (!existe) {
                tarjetas.push({ id: uuid(), tema: t.tema, dificultad: t.dificultad, frente: t.frente, reverso: t.reverso });
                agregadas++;
            }
        });
        guardarPreguntas();
        guardarTarjetas();
        localStorage.setItem(CLAVES.iniciado, "1");
        refrescarSelectoresYvistas();
        window.alert("Se agregaron " + agregadas + " elementos de ejemplo de Biología, Historia y Matemáticas.");
    }

    function vaciarTodo() {
        if (!window.confirm("¿Borrar TODAS las preguntas, tarjetas, exámenes y práctica?")) return;
        preguntas = [];
        tarjetas = [];
        registrosQuiz = [];
        registrosPractica = [];
        Object.keys(CLAVES).forEach(function (k) {
            localStorage.removeItem(CLAVES[k]);
        });
        refrescarSelectoresYvistas();
        analizarProgreso();
    }

    // ========================================================================
    // Eventos
    // ========================================================================
    function urlEventHandler(evento) {
        var boton = evento.target.closest("button[data-accion]");
        if (!boton) return;
        var id = boton.dataset.id;
        var accion = boton.dataset.accion && boton.dataset.accion === "editar";

        if (boton.dataset.accion === "editar") {
            if (evento.currentTarget === document.getElementById("listaPreguntas")) {
                var p = preguntas.find(function (x) { return x.id === id; });
                if (p) editarPregunta(p);
            } else {
                var t = tarjetas.find(function (x) { return x.id === id; });
                if (t) editarTarjeta(t);
            }
        } else if (boton.dataset.accion === "eliminar") {
            if (window.confirm("¿Eliminar este elemento?")) {
                if (evento.currentTarget === document.getElementById("listaPreguntas")) {
                    preguntas = preguntas.filter(function (x) { return x.id !== id; });
                    guardarPreguntas();
                } else {
                    tarjetas = tarjetas.filter(function (x) { return x.id !== id; });
                    guardarTarjetas();
                }
                refrescarSelectoresYvistas();
            }
        }
    }

    function editarPregunta(p) {
        editPreguntaId = p.id;
        document.getElementById("tituloFormPregunta").textContent = "Editar pregunta";
        document.getElementById("temaPregunta").value = p.tema;
        document.getElementById("dificultadPregunta").value = p.dificultad;
        document.getElementById("textoPregunta").value = p.pregunta;
        document.getElementById("respuestaPregunta").value = p.respuesta;
        document.getElementById("cancelarEditPregunta").classList.remove("oculto");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function cancelarEditPregunta() {
        editPreguntaId = null;
        document.getElementById("tituloFormPregunta").textContent = "Crear pregunta";
        document.getElementById("cancelarEditPregunta").classList.add("oculto");
    }

    function editarTarjeta(t) {
        editTarjetaId = t.id;
        document.getElementById("tituloFormTarjeta").textContent = "Editar tarjeta";
        document.getElementById("temaTarjeta").value = t.tema;
        document.getElementById("dificultadTarjeta").value = t.dificultad;
        document.getElementById("frenteTarjeta").value = t.frente;
        document.getElementById("reversoTarjeta").value = t.reverso;
        document.getElementById("cancelarEditTarjeta").classList.remove("oculto");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function cancelarEditTarjeta() {
        editTarjetaId = null;
        document.getElementById("tituloFormTarjeta").textContent = "Crear tarjeta de estudio";
        document.getElementById("cancelarEditTarjeta").classList.add("oculto");
    }

    function conectarEventos() {
        document.querySelectorAll(".pestana").forEach(function (b) {
            b.addEventListener("click", function () { activarVista(b.dataset.vista); });
        });

        document.getElementById("formPregunta").addEventListener("submit", guardarPreguntaDesdeForm);
        document.getElementById("formTarjeta").addEventListener("submit", guardarTarjetaDesdeForm);
        document.getElementById("cancelarEditPregunta").addEventListener("click", cancelarEditPregunta);
        document.getElementById("cancelarEditTarjeta").addEventListener("click", cancelarEditTarjeta);

        document.getElementById("listaPreguntas").addEventListener("click", urlEventHandler);
        document.getElementById("grillaTarjetas").addEventListener("click", urlEventHandler);

        document.getElementById("filtroTemaPreguntas").addEventListener("change", renderPreguntas);
        document.getElementById("filtroTemaTarjetas").addEventListener("change", renderTarjetas);

        document.getElementById("botonEstudiar").addEventListener("click", abrirEstudio);
        document.getElementById("cerrarEstudio").addEventListener("click", function () {
            document.getElementById("modalEstudio").classList.add("oculto");
            sesionEstudio = null;
        });
        document.getElementById("tarjetaEstudio").addEventListener("click", voltearTarjetaEstudio);
        document.getElementById("tarjetaEstudio").addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                voltearTarjetaEstudio();
            }
        });
        document.getElementById("botonSabia").addEventListener("click", function () { registrarPractica(true); });
        document.getElementById("botonNoSabia").addEventListener("click", function () { registrarPractica(false); });

        document.getElementById("botonIniciarExamen").addEventListener("click", iniciarExamen);
        document.getElementById("botonSiguiente").addEventListener("click", siguientePregunta);
        document.getElementById("botonSalirExamen").addEventListener("click", salirExamen);
        document.getElementById("botonResponderLibre").addEventListener("click", responderLibre);
        document.getElementById("respuestaLibre").addEventListener("keydown", function (e) {
            if (e.key === "Enter") responderLibre(e);
        });

        document.getElementById("botonEjemplo").addEventListener("click", cargarEjemplo);
        document.getElementById("botonVaciar").addEventListener("click", vaciarTodo);

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                var modal = document.getElementById("modalEstudio");
                if (!modal.classList.contains("oculto")) {
                    modal.classList.add("oculto");
                    sesionEstudio = null;
                }
            }
        });
    }

    // ========================================================================
    // Inicio
    // ========================================================================
    function init() {
        cargarTodo();
        var iniciado = false;
        try { iniciado = !!localStorage.getItem(CLAVES.iniciado); } catch (e) { }

        conectarEventos();
        rellenarFormulariosDificultad();
        refrescarSelectoresYvistas();
        analizarProgreso();

        // Primer uso: cargar ejemplo automáticamente
        if (!iniciado && !preguntas.length && !tarjetas.length) {
            cargarEjemplo();
        }
    }

    init();
})();