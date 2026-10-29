(function () {
    "use strict";

    var CLAVE_HISTORIAL = "roboChatHistorial";
    var CLAVE_RESPUESTAS = "roboChatRespuestas";

    // ---------- Base de datos de preguntas y respuestas ----------
    var BASE_RESPUESTAS = [
        {
            palabras: ["que es el club", "que es el club de robotica", "que hacen", "que se hace", "de que trata"],
            respuesta: "El Club de Robótica Escolar es un grupo de estudiantes que diseñan, construyen y programan robots. Aprendemos ingeniería, electrónica, programación y trabajo en equipo mientras creamos proyectos reales."
        },
        {
            palabras: ["quienes somos", "quienes son", "quien soy", "integrantes"],
            respuesta: "Somos estudiantes apasionados por la tecnología y la creatividad. El club está dividido en equipos y cada equipo trabaja en un proyecto distinto, guiado por un asesor."
        },
        {
            palabras: ["como me uno", "como me inscribo", "como entrar", "inscripcion", "inscribirme", "unirme", "quiero participar", "registro", "registrarme"],
            respuesta: "Para unirte, visita la sala de tecnología en el recreo, habla con el asesor del club o acude a la dirección donde te darán la ficha de inscripción. ¡No hay examen de admisión!"
        },
        {
            palabras: ["requisitos", "necesito", "que necesito", "requisito", "condiciones", "conocimientos previos", "nivel"],
            respuesta: "No necesitas experiencia previa. Basta tener interés, ganas de aprender y asistir con regularidad. A los nuevos se les enseñan las bases: componentes, seguridad y programación inicial."
        },
        {
            palabras: ["principiantes", "no se nada", "no entiendo", "practico poco", "nivel cero"],
            respuesta: "¡Tranquilo! La mayoría empezamos sin saber nada. El club tiene nivel de iniciación para principiantes: aprende las bases paso a paso y ve avanzando a tu ritmo."
        },
        {
            palabras: ["horario", "horarios", "cuando nos reunimos", "dias", "dia de reuniones", "a que hora", "cuando se junta", "frecuencia"],
            respuesta: "Sesiones los martes y jueves de 4:00 a 6:00 p. m. En la sala de tecnología de la escuela. Los sábados hay sesión opcional de competencia de 10:00 a 12:30."
        },
        {
            palabras: ["donde", "ubicacion", "lugar", "sede", "salon", "aula", "donde se junta", "donde es"],
            respuesta: "Somos de la sala de tecnología (edificio B, segundo piso) del Club Escolar. Es el salón con las impresoras 3D y los tableros de circuitos."
        },
        {
            palabras: ["cuanto cuesta", "costo", "cuota", "cobran", "pago", "material", "cuanto pagar", "caro", "gratis"],
            respuesta: "La inscripción es gratuita. La cuota opcional de $50 por semestre cubre materiales compartidos como sensores y baterías. Los robots personales se construyen con material reciclado siempre que sea posible."
        },
        {
            palabras: ["que aprendo", "que voy a aprender", "que me ensenan", "que se aprende", "actividades", "beneficios", "para que sirve"],
            respuesta: "Aprendes 5 cosas: diseño 3D, construcción mecánica, electrónica básica, programación (Scratch, Python y Arduino) y presentación de proyectos. También desarrollas liderazgo y trabajo en equipo."
        },
        {
            palabras: ["proyectos", "que robots", "que hacen de robots", "robot luchador", "sigue lineas", "siguelineas", "brazo robotico", "proyecto"],
            respuesta: "Tenemos 3 proyectos estrella: el Robot Luchador (batallas 1 vs 1), el Robot Sigue Líneas (velocidad pista) y el Brazo Robótico (precision con pinzas). Cada semestre se agrega un proyecto nuevo."
        },
        {
            palabras: ["herramientas", "materiales", "que usan", "software", "programas", "aplicaciones", "arduino", "lego", "sensores", "motores"],
            respuesta: "Usamos kits de Arduino, sensores, motores y servos, con software como Tinkercad, Scratch, Python y el IDE de Arduino. Las piezas las diseñamos en Tinkercad y las imprimimos en nuestras 2 impresoras 3D."
        },
        {
            palabras: ["edad", "para quien", "quien puede", "mayores", "secundaria", "primaria", "nivel escolar"],
            respuesta: "El club acepta estudiantes de 10 a 17 años (de 5º de primaria a 3º de secundaria). Si eres más pequeño puedes apuntarte en la lista de espera para el próximo ciclo."
        },
        {
            palabras: ["cuantos integrantes", "cuantos son", "que cupo", "capacidad", "cuantos alumnos", "grupo"],
            respuesta: "Tenemos cupo para 30 integrantes, organizados en 6 equipos de 5. Si el grupo se llena, se abre una segunda sección los viernes según la demanda."
        },
        {
            palabras: ["torneos", "competencia", "competencias", "concursos", "participar torneo", "campeonato", "oly"],
            respuesta: "Participamos en la Olimpiada Regional de Robótica cada marzo y en torneos internos cada fin de semestre. Los 3 mejores equipos representan a la escuela en el estatal."
        },
        {
            palabras: ["asesor", "profesor", "maestro", "quien guia", "coordinador", "quien esta a cargo", "orientador"],
            respuesta: "El asesor principal es el Ing. Roberto Luna, docente de tecnología, con el apoyo de 2 mentores estudiantes de últimos grados que entrenan a los equipos nuevos."
        },
        {
            palabras: ["seguridad", "peligro", "accidente", "reglas", "cuidado", "precauciones"],
            respuesta: "La seguridad es prioridad: usamos gafas, nada de conectores expuestos sin revisión, y una regla clara: nunca programar ni alimentar un robot sin el visto bueno del asesor."
        },
        {
            palabras: ["certificado", "constancia", "reconocimiento", "titulo", "credito"],
            respuesta: "Cada semestre se entrega una constancia de participación a quien cumple 80% de asistencia, y un reconocimiento especial a los mejores proyectos en la demostración final."
        },
        {
            palabras: ["contacto", "correo", "email", "telefono", "redes", "facebook", "instagram", "como contacto"],
            respuesta: "Escríbenos al correo del club: robotica@clubescolar.edu o mándanos mensaje en Instagram como @robotica_escolar. Respondemos entre semana."
        },
        {
            palabras: ["cuando inicia", "cuando empieza", "fecha de inicio", "inicia", "empieza", "inscripcion abierta", "ciclo"],
            respuesta: "El nuevo ciclo inicia el primer martes de cada semestre. Las inscripciones abren 2 semanas antes con la dirección. ¡Mantente atento a los avisos del pasillo!"
        },
        {
            palabras: ["cuanto dura", "cuanto tiempo", "duracion", "tiempo de sesion", "cuantas horas", "cada cuanto"],
            respuesta: "Cada sesión dura 2 horas. El programa completo del semestre son 13 semanas = 26 horas de club, más la demostración final abierta a las familias."
        },
        {
            palabras: ["uniforme", "ropa", "vestimenta", "que me pongo", "playera", "camiseta"],
            respuesta: "La única recomendación es ropa cómoda y zapatos cerrados. Optamos por vestir la playera del club en los torneos (se vende a $120)."
        },
        {
            palabras: ["retirarme", "salir del club", "dejar el club", "baja", "cancelar"],
            respuesta: "Puedes retirarte cuando quieras; solo avisa al asesor. Si desertas sin aviso más de 3 sesiones seguidas, el lugar se libera para un nuevo integrante."
        },
        {
            palabras: ["consejo", "recomendaciones", "como puedo mejorar", "tips", "sugerencias"],
            respuesta: "Mi mejor consejo: practica 15 minutos de programación al día y jamás le temas a los errores. En robótica, cada error es una pista para mejorar. ¡Pregunta a los mentores!"
        },
        {
            palabras: ["hola", "buenos dias", "buenas tardes", "buenas noches", "saludos", "que tal", "hey"],
            respuesta: "¡Hola! 👋 Soy BibliaBot, el asistente del Club de Robótica. Pregúntame sobre horarios, inscripciones, proyectos o lo que quieras saber del club."
        },
        {
            palabras: ["gracias", "muchas gracias", "te lo agradezco", "excelente", "genial", "perfecto", "esta bien", "me sirvio"],
            respuesta: "¡De nada! 😄 Siempre que quieras saber algo más del club, aquí estoy. También puedes enseñarme respuestas nuevas con el botón ➕."
        },
        {
            palabras: ["adios", "chao", "hasta luego", "nos vemos", "bye", "me voy"],
            respuesta: "¡Hasta luego! 🤖✨ Te esperamos en la sala de tecnología. ¡Nos vemos en la próxima sesión del club!"
        },
        {
            palabras: ["que puedes hacer", "ayuda", "que sabes", "comandos", "para que sirves", "funciones"],
            respuesta: "Respondo preguntas sobre el Club de Robótica: inscripciones, horario, proyectos, materiales, torneos y más. Si no sé algo, puedes enseñármelo con el botón ➕ Enseñar."
        }
    ];

    // ---------- Estado ----------
    var historial = [];
    var ultimaPreguntaUsuario = "";
    var escribiendo = false;

    // ---------- Referencias al DOM ----------
    var mensajes = document.getElementById("mensajes");
    var campoMensaje = document.getElementById("campoMensaje");
    var botonEnviar = document.getElementById("botonEnviar");
    var botonLimpiar = document.getElementById("botonLimpiar");
    var botonEnsenar = document.getElementById("botonEnsenar");
    var sugerencias = document.getElementById("sugerencias");
    var modalEnsenar = document.getElementById("modalEnsenar");
    var formularioEnsenar = document.getElementById("formularioEnsenar");
    var campoPregunta = document.getElementById("campoPregunta");
    var campoRespuesta = document.getElementById("campoRespuesta");
    var botonCancelar = document.getElementById("botonCancelar");

    // ---------- Utilidades ----------
    function normalizar(texto) {
        return String(texto)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[¿?!¡.,;:()/-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function horaActual() {
        var ahora = new Date();
        var h = ("0" + ahora.getHours()).slice(-2);
        var m = ("0" + ahora.getMinutes()).slice(-2);
        return h + ":" + m;
    }

    function escapar(texto) {
        var div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    }

    // ---------- Persistencia ----------
    function cargarHistorial() {
        try {
            var datos = localStorage.getItem(CLAVE_HISTORIAL);
            if (datos) historial = JSON.parse(datos);
        } catch (e) {
            historial = [];
        }
    }

    function guardarHistorial() {
        try {
            localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
        } catch (e) { }
    }

    function cargarRespuestasGuardadas() {
        try {
            var datos = localStorage.getItem(CLAVE_RESPUESTAS);
            var lista = datos ? JSON.parse(datos) : [];
            return lista;
        } catch (e) {
            return [];
        }
    }

    function guardarRespuestasAprendidas(lista) {
        try {
            localStorage.setItem(CLAVE_RESPUESTAS, JSON.stringify(lista));
        } catch (e) { }
    }

    // ---------- Base de datos completa (incorporadas + aprendidas) ----------
    function obtenerBaseCompleta() {
        var personalizadas = cargarRespuestasGuardadas();
        var todas = personalizadas.slice();

        // Las respuestas aprendidas tienen prioridad: se preguntan primero
        BASE_RESPUESTAS.forEach(function (entrada) {
            todas.push(entrada);
        });
        return todas;
    }

    // ---------- Motor de coincidencias ----------
    function palabrasDePregunta(pregunta) {
        // Genera palabras clave a partir del texto de la pregunta aprendida
        var comunes = ["que", "de", "el", "la", "los", "las", "del", "al", "como",
                       "cuando", "donde", "cuanto", "para", "por", "con", "y", "o",
                       "a", "cual", "cuales", "hay", "en", "un", "una", "es", "se",
                       "me", "mi", "tu", "respondo", "pregunta", "sobre"];
        return normalizar(pregunta)
            .split(" ")
            .filter(function (palabra) {
                return palabra.length > 2 && comunes.indexOf(palabra) === -1;
            });
    }

    function buscarRespuesta(mensaje) {
        var texto = normalizar(mensaje);
        var base = obtenerBaseCompleta();

        var mejor = null;
        var mejorPuntaje = 0;

        base.forEach(function (entrada) {
            var puntaje = 0;
            entrada.palabras.forEach(function (clave) {
                if (texto.indexOf(normalizar(clave)) !== -1) {
                    puntaje += clave.length;
                }
            });
            if (puntaje > mejorPuntaje) {
                mejorPuntaje = puntaje;
                mejor = entrada;
            }
        });

        if (mejor && mejorPuntaje > 0) {
            return { respuesta: mejor.respuesta, encontrada: true };
        }

        return { respuesta: null, encontrada: false };
    }

    // ---------- Render de mensajes ----------
    function agregarMensaje(autor, texto, extra) {
        var mensaje = {
            autor: autor,
            texto: texto,
            hora: horaActual()
        };
        historial.push(mensaje);
        guardarHistorial();
        renderMensaje(mensaje, extra);
        desplazarAlFinal();
    }

    function renderMensaje(mensaje, extra) {
        var div = document.createElement("div");
        div.className = "mensaje " + mensaje.autor;

        if (mensaje.autor === "bot") {
            div.innerHTML = escapar(mensaje.texto);
        } else {
            div.innerHTML = escapar(mensaje.texto);
        }

        if (extra) {
            var contenedorExtra = document.createElement("div");
            contenedorExtra.className = "respuesta-extra";
            contenedorExtra.innerHTML = extra;
            div.appendChild(contenedorExtra);
        }

        var hora = document.createElement("span");
        hora.className = "hora";
        hora.textContent = mensaje.hora;
        div.appendChild(hora);

        mensajes.appendChild(div);
    }

    function desplazarAlFinal() {
        mensajes.scrollTop = mensajes.scrollHeight;
    }

    function renderTodo() {
        mensajes.innerHTML = "";
        historial.forEach(function (mensaje) {
            renderMensaje(mensaje);
        });
        desplazarAlFinal();
    }

    // ---------- Indicador de escritura ----------
    function mostrarEscritura(mostrar) {
        var existente = mensajes.querySelector("#escribiendo");
        if (existente) existente.remove();

        if (mostrar) {
            var div = document.createElement("div");
            div.className = "mensaje bot escribiendo";
            div.id = "escribiendo";
            div.innerHTML = "<p>✍️ escribiendo...</p>";
            mensajes.appendChild(div);
            desplazarAlFinal();
        }
    }

    // ---------- Respuesta del bot ----------
    function responder(mensajeUsuario) {
        if (escribiendo) return;
        escribiendo = true;
        mostrarEscritura(true);

        setTimeout(function () {
            mostrarEscritura(false);
            escribiendo = false;

            var resultado = buscarRespuesta(mensajeUsuario);
            if (resultado.encontrada) {
                agregarMensaje("bot", resultado.respuesta);
            } else {
                ultimaPreguntaUsuario = mensajeUsuario;
                var mensaje = "Lo siento, aún no tengo información sobre eso. 😅 Pero puedo aprenderlo: si me enseñas la respuesta, la recordaré para los demás.";
                var boton = '<button class="boton-ensena" data-ensenar="1">➕ Enseñar respuesta</button>';
                agregarMensaje("bot", mensaje, boton);
            }
        }, 650);
    }

    // ---------- Enviar mensaje ----------
    function enviarMensaje() {
        var texto = campoMensaje.value.trim();
        if (!texto || escribiendo) return;
        campoMensaje.value = "";
        agregarMensaje("usuario", texto);
        responder(texto);
    }

    // ---------- Enseñar al chatbot ----------
    function abrirModalEnsenar() {
        if (ultimaPreguntaUsuario && !campoPregunta.value) {
            campoPregunta.value = ultimaPreguntaUsuario;
        }
        modalEnsenar.classList.remove("oculto");
        campoPregunta.focus();
    }

    function cerrarModalEnsenar() {
        modalEnsenar.classList.add("oculto");
        formularioEnsenar.reset();
    }

    function guardarRespuestaAprendida(evento) {
        evento.preventDefault();
        var pregunta = campoPregunta.value.trim();
        var respuesta = campoRespuesta.value.trim();
        if (!pregunta || !respuesta) return;

        var aprendidas = cargarRespuestasGuardadas();
        aprendidas.unshift({
            palabras: palabrasDePregunta(pregunta),
            respuesta: respuesta
        });
        guardarRespuestasAprendidas(aprendidas);

        cerrarModalEnsenar();
        agregarMensaje(
            "bot",
            "✅ ¡Listo! Ya aprendí:\n\n\"" + pregunta + "\"\n\nPregúntamelo de nuevo y te responderé con lo que me enseñaste."
        );
    }

    // ---------- Eventos ----------
    botonEnviar.addEventListener("click", enviarMensaje);
    campoMensaje.addEventListener("keydown", function (evento) {
        if (evento.key === "Enter") {
            evento.preventDefault();
            enviarMensaje();
        }
    });

    sugerencias.addEventListener("click", function (evento) {
        var chip = evento.target.closest(".chip");
        if (!chip) return;
        campoMensaje.value = chip.dataset.pregunta;
        enviarMensaje();
    });

    mensajes.addEventListener("click", function (evento) {
        if (evento.target.closest("[data-ensenar]")) {
            abrirModalEnsenar();
        }
    });

    botonEnsenar.addEventListener("click", abrirModalEnsenar);
    botonCancelar.addEventListener("click", cerrarModalEnsenar);
    modalEnsenar.addEventListener("click", function (evento) {
        if (evento.target === modalEnsenar) cerrarModalEnsenar();
    });
    formularioEnsenar.addEventListener("submit", guardarRespuestaAprendida);

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && !modalEnsenar.classList.contains("oculto")) {
            cerrarModalEnsenar();
        }
    });

    botonLimpiar.addEventListener("click", function () {
        if (!historial.length) return;
        if (window.confirm("¿Borrar toda la conversación?")) {
            historial = [];
            guardarHistorial();
            renderTodo();
            if (!historial.length) {
                agregarMensaje("bot", "He borrado la conversación. Cuando quieras seguimos hablando del club. 🤖");
            }
        }
    });

    // ---------- Inicio ----------
    cargarHistorial();
    if (historial.length === 0) {
        agregarMensaje(
            "bot",
            "¡Hola! 👋 Soy BibliaBot, el asistente del Club de Robótica Escolar.\n\n" +
            "Puedes preguntarme sobre inscripciones, horarios, proyectos, materiales, torneos y más. " +
            "Elige una pregunta sugerida o escribe la tuya. Si no sé algo, tú puedes enseñármelo. ➕"
        );
    } else {
        renderTodo();
    }
})();