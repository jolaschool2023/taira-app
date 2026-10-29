(function () {
    "use strict";

    // ---------- Datos de la historia ----------
    var PERSONAJES = [
        { id: "lira", nombre: "Lira", titulo: "cartógrafa itinerante" },
        { id: "tomas", nombre: "Tomás", titulo: "reparador de faros" },
        { id: "nadia", nombre: "Nadia", titulo: "mensajera nocturna" },
        { id: "bruno", nombre: "Bruno", titulo: "cocinero de guardia" },
        { id: "selene", nombre: "Selene", titulo: "archivista curiosa" }
    ];

    var LUGARES = [
        { id: "valle", nombre: "el Valle de Niebla", desc: "un valle donde la niebla nunca deja ver más allá de unos pasos" },
        { id: "puerto", nombre: "el Puerto de Sal Negra", desc: "un puerto de aguas oscuras donde los barcos llegan cargados de misterios" },
        { id: "relojes", nombre: "la Ciudad de los Relojes", desc: "una ciudad donde cada campanada suena a una hora distinta" },
        { id: "bosque", nombre: "el Bosque de Cristal", desc: "un bosque cuyos árboles reflejan aquello que no deberían" },
        { id: "azoteas", nombre: "las Azoteas de Viento", desc: "las azoteas más altas de la ciudad, unidas por puentes de cuerda" }
    ];

    var OBJETOS = [
        { id: "brujula", nombre: "la Brújula Rota", desc: "una aguja que gira sin parar, salvo cuando algo importante está cerca", efecto: "la brújula señaló el camino exacto con un seco clic" },
        { id: "farol", nombre: "el Farol de Aceite Azul", desc: "una llama que no se apaga ni con el viento más fuerte", efecto: "la llama azul iluminó todo lo que la oscuridad escondía" },
        { id: "llave", nombre: "la Llave de Cobre", desc: "una llave que no abre ninguna puerta conocida", efecto: "la llave giró en el aire y abrió aquello que no se veía" },
        { id: "reloj", nombre: "el Reloj de Bolsillo", desc: "un reloj que se detiene justo antes del peligro", efecto: "el reloj se detuvo un segundo antes del desastre" },
        { id: "cuerda", nombre: "la Cuerda de Seda", desc: "una cuerda delgada que resiste mucho más de lo que aparenta", efecto: "la cuerda sostuvo el peso de todos sin ceder" }
    ];

    var SITUACIONES = [
        {
            id: "niebla",
            nombre: "la Niebla Que Habla",
            desc: "la niebla comenzó a susurrar nombres que nadie debía recordar",
            cierre: "La niebla se retiró antes del amanecer y el valle volvió a callar."
        },
        {
            id: "barco",
            nombre: "el Barco sin Tripulación",
            desc: "un barco llegó con las luces encendidas y sin nadie a bordo",
            cierre: "El barco quedó vacío en el muelle, y por fin nadie quiso hablar de él."
        },
        {
            id: "campanada",
            nombre: "la Campanada Extra",
            desc: "una campanada sonó fuera de hora y todos los relojes de la ciudad se detuvieron",
            cierre: "Los relojes volvieron a dar la hora, y esta vez coincidieron todos."
        },
        {
            id: "reflejo",
            nombre: "el Reflejo Ajeno",
            desc: "los reflejos del bosque empezaron a moverse sin sus dueños",
            cierre: "Los reflejos volvieron a obedecer, como si nunca hubieran dejado de hacerlo."
        },
        {
            id: "puente",
            nombre: "el Puente Colgado",
            desc: "uno de los puentes de cuerda apareció cortado, con una nota atada a la riel",
            cierre: "El puente fue reparado antes del mediodía, y la nota desapareció con él."
        }
    ];

    // ---------- Grafo de escenas con decisiones ----------
    var ESCENAS = {
        inicio: {
            texto: function () {
                return [
                    montar("Todo empezó en {lugar}: {lugarDesc}."),
                    montar("Allí, {personaje}, {titulo}, creía que sería un día igual que los demás. Entonces {situacionDesc}."),
                    montar("Antes de poder entender qué ocurría, {objeto} apareció en su camino: {objetoDesc}.")
                ];
            },
            opciones: [
                { etiqueta: "Seguir el rastro del suceso", siguiente: "pista" },
                { etiqueta: "Buscar a alguien que sepa qué ocurre", siguiente: "aliado" },
                { etiqueta: "Reunir recursos antes de moverse", siguiente: "preparacion" }
            ]
        },

        pista: {
            texto: function () {
                return [
                    montar("{personaje} siguió el rastro hasta el corazón de {lugar}. Las huellas eran claras: alguien —o algo— había pasado justo antes."),
                    montar("Cada paso confirmaba lo que ya se sospechaba. {situacion} no era casualidad: tenía un orden.")
                ];
            },
            opciones: [
                { etiqueta: "Acercarse, aunque el riesgo sea alto", siguiente: "confrontacion", marca: "valentia" },
                { etiqueta: "Anotar todo y retirarse con cuidado", siguiente: "refugio", marca: "cautela" }
            ]
        },

        aliado: {
            texto: function () {
                return [
                    montar("En {lugar} poca gente habla claro, pero Sera siempre supo más de lo que contaba. Escuchó la historia entera sin interrumpir."),
                    montar("«Si es por lo que está pasando aquí, sé dónde empezar», dijo por fin. Esta vez no parecía broma.")
                ];
            },
            opciones: [
                { etiqueta: "Confiar en el consejo de Sera", siguiente: "confrontacion", marca: "aliado" },
                { etiqueta: "Agradecer y seguir en solitario", siguiente: "refugio", marca: "solitario" }
            ]
        },

        preparacion: {
            texto: function () {
                return [
                    montar("El plan era simple: prepararse bien y llegar con ventaja. En la mochila, {objeto} seguía listo: {objetoDesc}."),
                    montar("Cuando todo estuvo resuelto, solo quedaba decidir cuándo empezar.")
                ];
            },
            opciones: [
                { etiqueta: "Usar {objeto} desde el principio", siguiente: "confrontacion", marca: "objetoUsado" },
                { etiqueta: "Reservarlo para el momento exacto", siguiente: "refugio", marca: "objetoReservado" }
            ]
        },

        confrontacion: {
            texto: function () {
                var partes = [
                    montar("No había forma de seguir evitándolo. Frente a {personaje}, el peligro tomó forma por fin.")
                ];
                if (tiene("aliado")) {
                    partes.push("Sera apareció a un lado sin decir una palabra: cumplía su parte.");
                }
                if (tiene("objetoUsado")) {
                    partes.push(montar("Entonces {objetoEfecto} y abrió un camino donde antes no lo había."));
                }
                if (tiene("cautela")) {
                    partes.push("La información recogida antes marcaba la diferencia: nada era sorpresa.");
                }
                return partes;
            },
            opciones: [
                { etiqueta: "Plantarse y enfrentar el peligro de frente", siguiente: "final_desafio" },
                { etiqueta: "Buscar una salida ingeniosa, sin fuerza", siguiente: "final_astuto" }
            ]
        },

        refugio: {
            texto: function () {
                return [
                    montar("Con el plan en mente, {personaje} esperó en un lugar seguro, lo más lejos posible de {lugar}."),
                    montar("El tiempo pasó en silencio. {situacion} seguía allí afuera, esperando el momento exacto para actuar.")
                ];
            },
            opciones: [
                { etiqueta: "Salir al encuentro y plantar cara", siguiente: "final_desafio" },
                { etiqueta: "Resolverlo en silencio, sin que nadie lo note", siguiente: "final_paz" }
            ]
        },

        final_desafio: {
            final: true,
            titulo: "Final: El Desafío",
            texto: function () {
                var partes = [
                    montar("{personaje} se plantó de frente y no apartó la mirada.")
                ];
                if (tiene("aliado")) {
                    partes.push("Sera estaba ahí, y eso cambió las probabilidades.");
                }
                partes.push(montar("{situacionCierre}"));
                if (tiene("objetoReservado")) {
                    partes.push(montar("Llegó el momento exacto: {objetoEfecto}."));
                } else if (tiene("objetoUsado")) {
                    partes.push(montar("Después, {objeto} volvió a quedarse quieto, como si nada hubiera pasado."));
                }
                partes.push(montar("Y así, {situacion} pasó a ser solo un recuerdo de {lugar}."));
                return partes;
            },
            opciones: []
        },

        final_astuto: {
            final: true,
            titulo: "Final: La Salida Ingeniosa",
            texto: function () {
                var partes = [
                    montar("Nada de golpes: {personaje} observó, calculó y actuó en el momento justo.")
                ];
                if (tiene("objetoUsado")) {
                    partes.push(montar("{objetoEfecto}, y nadie vio venir lo que vino después."));
                } else {
                    partes.push("Sin depender del azar, la solución apareció justo donde nadie la buscaba.");
                }
                partes.push(montar("{situacionCierre}"));
                partes.push(montar("Al final, {personaje} volvió a {lugar} con algo que no tenía antes: certeza."));
                return partes;
            },
            opciones: []
        },

        final_paz: {
            final: true,
            titulo: "Final: La Calma",
            texto: function () {
                var partes = [
                    montar("Sin ruido y sin testigos, {personaje} resolvió lo que otros no supieron ver.")
                ];
                if (tiene("solitario")) {
                    partes.push("Lo hizo en soledad, y esa soledad resultó ser su mejor aliado.");
                }
                if (tiene("objetoReservado")) {
                    partes.push(montar("De repente, llegó el instante de {objeto}: {objetoEfecto}."));
                }
                partes.push(montar("{situacionCierre}"));
                partes.push(montar("Nadie supo cómo terminó. Solo {personaje} lo sabe, y así le parece bien."));
                return partes;
            },
            opciones: []
        }
    };

    // ---------- Estado ----------
    var selecciones = { personaje: null, lugar: null, objeto: null, situacion: null };
    var partida = { escena: null, marcas: [], decisiones: [], terminada: false };

    // ---------- Referencias al DOM ----------
    var rejillas = {
        personaje: document.getElementById("rejillaPersonajes"),
        lugar: document.getElementById("rejillaLugares"),
        objeto: document.getElementById("rejillaObjetos"),
        situacion: document.getElementById("rejillaSituaciones")
    };

    var avisoFaltan = document.getElementById("avisoFaltan");
    var botonGenerar = document.getElementById("botonGenerar");
    var botonAleatorio = document.getElementById("botonAleatorio");
    var pantallaSeleccion = document.getElementById("pantallaSeleccion");
    var pantallaHistoria = document.getElementById("pantallaHistoria");
    var chipsResumen = document.getElementById("chipsResumen");
    var progresoPaso = document.getElementById("progresoPaso");
    var cajaHistoria = document.getElementById("cajaHistoria");
    var cajaDecisiones = document.getElementById("cajaDecisiones");
    var panelFinal = document.getElementById("panelFinal");
    var tituloFinal = document.getElementById("tituloFinal");
    var listaDecisiones = document.getElementById("listaDecisiones");
    var botonReiniciar = document.getElementById("botonReiniciar");
    var botonOtraVez = document.getElementById("botonOtraVez");
    var botonCambiar = document.getElementById("botonCambiar");

    // ---------- Utilidades ----------
    function montar(texto) {
        return texto
            .replace("{personaje}", selecciones.personaje.nombre)
            .replace("{titulo}", selecciones.personaje.titulo)
            .replace("{lugar}", selecciones.lugar.nombre)
            .replace("{lugarDesc}", selecciones.lugar.desc)
            .replace("{objeto}", selecciones.objeto.nombre)
            .replace("{objetoDesc}", selecciones.objeto.desc)
            .replace("{objetoEfecto}", selecciones.objeto.efecto)
            .replace("{situacion}", selecciones.situacion.nombre)
            .replace("{situacionDesc}", selecciones.situacion.desc)
            .replace("{situacionCierre}", selecciones.situacion.cierre);
    }

    function tiene(marca) {
        return partida.marcas.indexOf(marca) !== -1;
    }

    function aleatorio(catalogo) {
        return catalogo[Math.floor(Math.random() * catalogo.length)];
    }

    function faltantes() {
        var nombres = { personaje: "personaje", lugar: "lugar", objeto: "objeto", situacion: "situación" };
        var lista = [];
        for (var clave in selecciones) {
            if (!selecciones[clave]) {
                lista.push(nombres[clave]);
            }
        }
        return lista;
    }

    // ---------- Pantalla de selección ----------
    function crearTarjeta(item, clave) {
        var tarjeta = document.createElement("button");
        tarjeta.type = "button";
        tarjeta.className = "tarjeta";
        tarjeta.setAttribute("aria-pressed", "false");
        var titulo = document.createElement("strong");
        titulo.textContent = item.nombre;
        var desc = document.createElement("span");
        desc.textContent = item.desc || item.titulo || "";
        tarjeta.appendChild(titulo);
        tarjeta.appendChild(desc);
        tarjeta.addEventListener("click", function () {
            selecciones[clave] = item;
            pintarSeleccion(clave);
            actualizarBoton();
        });
        return tarjeta;
    }

    function pintarSeleccion(clave) {
        var tarjetas = rejillas[clave].children;
        for (var i = 0; i < tarjetas.length; i++) {
            var activa = selecciones[clave] && tarjetas[i].querySelector("strong").textContent === selecciones[clave].nombre;
            tarjetas[i].classList.toggle("seleccionada", activa);
            tarjetas[i].setAttribute("aria-pressed", activa ? "true" : "false");
        }
    }

    function actualizarBoton() {
        var falta = faltantes();
        botonGenerar.disabled = falta.length > 0;
        avisoFaltan.textContent = falta.length
            ? "Faltan: " + falta.join(", ")
            : "";
    }

    function montarRejillas() {
        var claves = ["personaje", "lugar", "objeto", "situacion"];
        var catalogos = { personaje: PERSONAJES, lugar: LUGARES, objeto: OBJETOS, situacion: SITUACIONES };
        for (var i = 0; i < claves.length; i++) {
            var clave = claves[i];
            for (var j = 0; j < catalogos[clave].length; j++) {
                rejillas[clave].appendChild(crearTarjeta(catalogos[clave][j], clave));
            }
        }
    }

    function seleccionAleatoria() {
        selecciones.personaje = aleatorio(PERSONAJES);
        selecciones.lugar = aleatorio(LUGARES);
        selecciones.objeto = aleatorio(OBJETOS);
        selecciones.situacion = aleatorio(SITUACIONES);
        pintarSeleccion("personaje");
        pintarSeleccion("lugar");
        pintarSeleccion("objeto");
        pintarSeleccion("situacion");
        actualizarBoton();
    }

    // ---------- Historia ----------
    function generarHistoria() {
        partida = { escena: null, marcas: [], decisiones: [], terminada: false };
        cajaHistoria.innerHTML = "";
        cajaDecisiones.innerHTML = "";
        panelFinal.hidden = true;
        document.getElementById("barraHistoria").hidden = false;
        pintarChips();
        pantallaSeleccion.hidden = true;
        pantallaHistoria.hidden = false;
        mostrarEscena("inicio");
        window.scrollTo(0, 0);
    }

    function pintarChips() {
        chipsResumen.innerHTML = "";
        var datos = [
            selecciones.personaje.nombre,
            selecciones.lugar.nombre,
            selecciones.objeto.nombre,
            selecciones.situacion.nombre
        ];
        for (var i = 0; i < datos.length; i++) {
            var chip = document.createElement("span");
            chip.className = "chip";
            chip.textContent = datos[i];
            chipsResumen.appendChild(chip);
        }
    }

    function mostrarEscena(id) {
        partida.escena = id;
        var escena = ESCENAS[id];
        var parrafos = escena.texto();
        for (var i = 0; i < parrafos.length; i++) {
            var parr = document.createElement("p");
            parr.textContent = parrafos[i];
            if (parrafos[i].charAt(0) === "\u00AB") {
                parr.className = "dialogo";
            }
            cajaHistoria.appendChild(parr);
        }
        cajaDecisiones.innerHTML = "";
        if (escena.final) {
            cerrarHistoria(escena);
            return;
        }
        for (var j = 0; j < escena.opciones.length; j++) {
            cajaDecisiones.appendChild(crearBotonDecision(escena.opciones[j], j));
        }
        progresoPaso.textContent = "Paso " + partida.decisiones.length;
    }

    function crearBotonDecision(opcion, indice) {
        var boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton-decision";
        boton.style.animationDelay = (indice * 0.12) + "s";
        var texto = opcion.etiqueta.replace("{objeto}", selecciones.objeto.nombre);
        boton.textContent = texto;
        boton.addEventListener("click", function () {
            if (partida.terminada) {
                return;
            }
            partida.decisiones.push(texto);
            if (opcion.marca) {
                partida.marcas.push(opcion.marca);
            }
            cajaDecisiones.innerHTML = "";
            mostrarEscena(opcion.siguiente);
            cajaHistoria.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
        return boton;
    }

    function cerrarHistoria(escena) {
        partida.terminada = true;
        tituloFinal.textContent = escena.titulo;
        listaDecisiones.innerHTML = "";
        for (var i = 0; i < partida.decisiones.length; i++) {
            var item = document.createElement("li");
            item.textContent = partida.decisiones[i];
            listaDecisiones.appendChild(item);
        }
        panelFinal.hidden = false;
        document.getElementById("barraHistoria").hidden = true;
        progresoPaso.textContent = "Historia terminada en " + partida.decisiones.length + " decisiones";
    }

    function volverAEmpezar() {
        generarHistoria();
    }

    function cambiarSeleccion() {
        pantallaHistoria.hidden = true;
        pantallaSeleccion.hidden = false;
        window.scrollTo(0, 0);
    }

    // ---------- Eventos ----------
    botonGenerar.addEventListener("click", function () {
        if (faltantes().length === 0) {
            generarHistoria();
        }
    });

    botonAleatorio.addEventListener("click", function () {
        seleccionAleatoria();
        generarHistoria();
    });

    botonReiniciar.addEventListener("click", volverAEmpezar);
    botonOtraVez.addEventListener("click", volverAEmpezar);
    botonCambiar.addEventListener("click", cambiarSeleccion);

    // ---------- Inicio ----------
    montarRejillas();
    actualizarBoton();
})();
