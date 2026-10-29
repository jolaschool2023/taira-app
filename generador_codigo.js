(function () {
    "use strict";

    // ============================================================
    //  Información de los lenguajes disponibles
    // ============================================================
    var LENGUAJES = {
        python: { etiqueta: "Python", extension: "py" },
        javascript: { etiqueta: "JavaScript", extension: "js" },
        htmlcss: { etiqueta: "HTML / CSS", extension: "html" }
    };

    var CLAVE_HISTORIAL = "historialGeneradorCodigo";

    // ============================================================
    //  Notas genéricas cuando no se reconoce la solicitud
    // ============================================================
    var NOTAS_GENERICAS = {
        python: "Python se ejecuta con el intérprete (python archivo.py). input() siempre devuelve texto, por eso se convierte con int() o float(), y print() muestra el resultado. La función main() junto con la guarda if __name__ == \"__main__\" mantienen el código ordenado y reutilizable.",
        javascript: "JavaScript se puede probar en la consola del navegador. prompt() pide datos al usuario, console.log() escribe en la consola y alert() muestra una ventana emergente con el resultado.",
        htmlcss: "HTML define la estructura de la página y CSS su aspecto visual. Para que la interfaz responda al usuario se añade un pequeño script JavaScript dentro de <script> que escucha eventos como click."
    };

    // ============================================================
    //  Base de plantillas: cada una genera código en 3 lenguajes
    // ============================================================
    var PLANTILLAS = [

        // ---------- 1. Promedio ----------
        {
            id: "promedio",
            titulo: "Promedio de cinco números",
            descripcion: "Calcula el promedio (media aritmética) de cinco valores: primero suma los cinco números y después divide el total entre la cantidad de valores.",
            patrones: [
                { re: /promedio|promedia|average|\bmean\b|media aritmetica/, peso: 3 },
                { re: /cinco numeros|five numbers|5 numeros|5 numbers|cinco valores|five values/, peso: 2 }
            ],
            pasos: [
                "Se piden al usuario cinco valores numéricos, uno por uno (o mediante cinco campos en la página).",
                "Se convierten los datos de texto a números y se comprueba que cada valor sea válido.",
                "Se suman los cinco números con un acumulador, con sum() en Python o con reduce() en JavaScript.",
                "Se divide la suma entre 5, la cantidad de valores, para obtener el promedio.",
                "Se muestra el resultado redondeado a dos decimales para que sea fácil de leer."
            ],
            notas: {
                python: "input() devuelve texto, por eso se usa float() antes de calcular. En Python, sum(valores) / len(valores) es la forma más corta de obtener el promedio.",
                javascript: "prompt() también devuelve texto; Number() lo convierte en número. reduce() recorre el arreglo acumulando la suma de sus elementos.",
                htmlcss: "HTML y CSS solo describen la interfaz: los cinco campos y los estilos. El cálculo lo realiza el script JavaScript dentro de <script>, porque las etiquetas HTML no pueden hacer operaciones aritméticas por sí solas."
            },
            codigo: {
                python: String.raw`# Calcula el promedio de cinco números
def promedio(valores):
    return sum(valores) / len(valores)

# Pedimos los cinco números al usuario
numeros = []
for i in range(5):
    numero = float(input("Ingrese el número " + str(i + 1) + ": "))
    numeros.append(numero)

resultado = promedio(numeros)
print(f"El promedio de los cinco números es: {resultado:.2f}")
`,
                javascript: String.raw`// Calcula el promedio de cinco números
function promedio(valores) {
  const suma = valores.reduce((acum, n) => acum + n, 0);
  return suma / valores.length;
}

function main() {
  const numeros = [];
  for (let i = 1; i <= 5; i++) {
    const entrada = prompt("Ingrese el número " + i + ":");
    const numero = Number(entrada);
    if (entrada === null || Number.isNaN(numero)) {
      alert("Debe ingresar un valor numérico válido.");
      return;
    }
    numeros.push(numero);
  }
  const resultado = promedio(numeros);
  const mensaje = "El promedio de los cinco números es: " + resultado.toFixed(2);
  console.log(mensaje);
  alert(mensaje);
}

main();
`,
                htmlcss: String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promedio de cinco números</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 320px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 16px; }
    input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #resultado { margin-top: 14px; font-weight: bold; text-align: center; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>Promedio de cinco números</h1>
    <input type="number" id="n1" placeholder="Número 1">
    <input type="number" id="n2" placeholder="Número 2">
    <input type="number" id="n3" placeholder="Número 3">
    <input type="number" id="n4" placeholder="Número 4">
    <input type="number" id="n5" placeholder="Número 5">
    <button id="calcular">Calcular promedio</button>
    <p id="resultado"></p>
  </div>
  <script>
    document.getElementById("calcular").addEventListener("click", function () {
      const cajas = ["n1", "n2", "n3", "n4", "n5"].map(function (id) {
        return document.getElementById(id);
      });
      const numeros = cajas.map(function (caja) { return parseFloat(caja.value); });
      const salida = document.getElementById("resultado");
      if (numeros.some(isNaN)) {
        salida.textContent = "Complete los cinco campos con números.";
        salida.style.color = "#c0392b";
        return;
      }
      const promedio = numeros.reduce(function (a, b) { return a + b; }, 0) / numeros.length;
      salida.textContent = "El promedio es: " + promedio.toFixed(2);
      salida.style.color = "#2e8b57";
    });
  </script>
</body>
</html>
`
            }
        },

        // ---------- 2. Suma ----------
        {
            id: "suma",
            titulo: "Suma de dos números",
            descripcion: "Pide dos números al usuario, los suma con el operador + y muestra el resultado de la operación.",
            patrones: [
                { re: /\bsuma\b|sumar|sumatorio|\bsum\b|\badd\b|addition|anadir|adicionar/, peso: 3 },
                { re: /dos numeros|two numbers|2 numeros|2 numbers/, peso: 2 }
            ],
            pasos: [
                "Se solicita al usuario el primer número y se convierte a tipo numérico.",
                "Se solicita el segundo número de la misma manera.",
                "Se aplica el operador + para obtener la suma de ambos valores.",
                "Se presenta el resultado indicando los dos números que se sumaron."
            ],
            notas: {
                python: "En Python el operador + suma números, pero también une texto; por eso float() asegura que los datos sean numéricos antes de sumar.",
                javascript: "Number(prompt(...)) convierte la respuesta del usuario; si escribe texto no numérico se obtiene NaN, que se comprueba con Number.isNaN().",
                htmlcss: "Se usan dos campos input type number y un botón; el evento click ejecuta la suma y escribe el resultado dentro de la página."
            },
            codigo: {
                python: String.raw`# Suma de dos números ingresados por el usuario
num1 = float(input("Ingrese el primer número: "))
num2 = float(input("Ingrese el segundo número: "))

resultado = num1 + num2

print("La suma de", num1, "y", num2, "es:", resultado)
`,
                javascript: String.raw`// Suma de dos números ingresados por el usuario
function main() {
  const num1 = Number(prompt("Ingrese el primer número:"));
  const num2 = Number(prompt("Ingrese el segundo número:"));
  if (Number.isNaN(num1) || Number.isNaN(num2)) {
    alert("Debe ingresar dos valores numéricos.");
    return;
  }
  const resultado = num1 + num2;
  const mensaje = "La suma de " + num1 + " y " + num2 + " es: " + resultado;
  console.log(mensaje);
  alert(mensaje);
}

main();
`,
                htmlcss: String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suma de dos números</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 300px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 16px; }
    input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #resultado { margin-top: 14px; font-weight: bold; text-align: center; color: #2e8b57; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>Suma de dos números</h1>
    <input type="number" id="num1" placeholder="Primer número">
    <input type="number" id="num2" placeholder="Segundo número">
    <button id="sumar">Sumar</button>
    <p id="resultado"></p>
  </div>
  <script>
    document.getElementById("sumar").addEventListener("click", function () {
      const a = parseFloat(document.getElementById("num1").value);
      const b = parseFloat(document.getElementById("num2").value);
      const salida = document.getElementById("resultado");
      if (Number.isNaN(a) || Number.isNaN(b)) {
        salida.textContent = "Ingrese los dos números.";
        salida.style.color = "#c0392b";
        return;
      }
      salida.style.color = "#2e8b57";
      salida.textContent = a + " + " + b + " = " + (a + b);
    });
  </script>
</body>
</html>
`
            }
        },

        // ---------- 3. Factorial ----------
        {
            id: "factorial",
            titulo: "Factorial de un número",
            descripcion: "Calcula el factorial de un número entero positivo: n! = 1 x 2 x ... x n, recorriendo los factores con un bucle.",
            patrones: [
                { re: /factorial/, peso: 4 },
                { re: /producto de los numeros|product of numbers/, peso: 2 }
            ],
            pasos: [
                "Se lee un número entero y se verifica que no sea negativo.",
                "Se inicializa una variable resultado con el valor 1, el elemento neutro de la multiplicación.",
                "Se recorre con un bucle for desde 2 hasta n multiplicando de forma acumulativa.",
                "Se muestra n!; si el número es negativo se informa que el factorial no está definido."
            ],
            notas: {
                python: "range(2, n + 1) genera los factores sin escribirlos uno por uno. Hay que pedir int() y no float(), porque range() solo acepta enteros.",
                javascript: "El bucle for (let i = 2; i <= n; i++) recorre los factores y Number.isInteger(n) comprueba que el dato sea un entero válido.",
                htmlcss: "El bucle se ejecuta en el navegador al pulsar el botón y el resultado se inserta en la página con textContent."
            },
            codigo: {
                python: String.raw`# Calcula el factorial de un número entero positivo
def factorial(n):
    resultado = 1
    for i in range(2, n + 1):
        resultado *= i
    return resultado

numero = int(input("Ingrese un número entero: "))

if numero < 0:
    print("El factorial no existe para números negativos.")
else:
    print(f"El factorial de {numero} es {factorial(numero)}")
`,
                javascript: String.raw`// Calcula el factorial de un número entero positivo
function factorial(n) {
  let resultado = 1;
  for (let i = 2; i <= n; i++) {
    resultado *= i;
  }
  return resultado;
}

function main() {
  const numero = Number(prompt("Ingrese un número entero:"));
  if (Number.isNaN(numero) || !Number.isInteger(numero) || numero < 0) {
    alert("Ingrese un número entero positivo.");
    return;
  }
  const mensaje = "El factorial de " + numero + " es " + factorial(numero);
  console.log(mensaje);
  alert(mensaje);
}

main();
`,
                htmlcss: String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factorial de un número</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 300px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 16px; }
    input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #resultado { margin-top: 14px; font-weight: bold; text-align: center; color: #2e8b57; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>Factorial de un número</h1>
    <input type="number" id="numero" placeholder="Número entero positivo">
    <button id="calcular">Calcular factorial</button>
    <p id="resultado"></p>
  </div>
  <script>
    function factorial(n) {
      let resultado = 1;
      for (let i = 2; i <= n; i++) {
        resultado *= i;
      }
      return resultado;
    }
    document.getElementById("calcular").addEventListener("click", function () {
      const n = parseInt(document.getElementById("numero").value, 10);
      const salida = document.getElementById("resultado");
      if (Number.isNaN(n) || n < 0) {
        salida.textContent = "Ingrese un número entero positivo.";
        salida.style.color = "#c0392b";
        return;
      }
      salida.style.color = "#2e8b57";
      salida.textContent = n + "! = " + factorial(n);
    });
  </script>
</body>
</html>
`
            }
        },

        // ---------- 4. Par o impar ----------
        {
            id: "parimpar",
            titulo: "Número par o impar",
            descripcion: "Determina si un número entero es par o impar calculando el resto de su división entre 2 con el operador de módulo.",
            patrones: [
                { re: /par o impar|even.?odd|numero par|numero impar|es par\b|es impar\b|\beven\b|\bodd\b/, peso: 3 },
                { re: /modulo|divisible entre 2|divisible by 2/, peso: 2 }
            ],
            pasos: [
                "Se lee el número entero proporcionado por el usuario.",
                "Se calcula el resto de la división entre 2 con el operador % (módulo).",
                "Si el resto es 0 el número es par; en caso contrario es impar.",
                "Se muestra el resultado con un mensaje claro."
            ],
            notas: {
                python: "El operador % devuelve el resto de la división: 4 % 2 da 0 y 7 % 2 da 1, por eso sirve para clasificar números pares e impares.",
                javascript: "En JavaScript % funciona igual; se usa un operador ternario (condición ? valor1 : valor2) para elegir el mensaje según el caso.",
                htmlcss: "El script del botón calcula el resto con % 2 y cambia también el color del resultado para que se distinga de un vistazo."
            },
            codigo: {
                python: String.raw`# Determina si un número es par o impar
numero = int(input("Ingrese un número entero: "))

if numero % 2 == 0:
    print(f"{numero} es PAR")
else:
    print(f"{numero} es IMPAR")
`,
                javascript: String.raw`// Determina si un número es par o impar
function main() {
  const numero = Number(prompt("Ingrese un número entero:"));
  if (Number.isNaN(numero)) {
    alert("Debe ingresar un número válido.");
    return;
  }
  const mensaje = numero + (numero % 2 === 0 ? " es PAR" : " es IMPAR");
  console.log(mensaje);
  alert(mensaje);
}

main();
`,
                htmlcss: String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Número par o impar</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 300px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); text-align: center; }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 16px; }
    input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #resultado { margin-top: 14px; font-weight: bold; font-size: 1.1rem; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>¿Par o impar?</h1>
    <input type="number" id="numero" placeholder="Ingrese un número">
    <button id="verificar">Verificar</button>
    <p id="resultado"></p>
  </div>
  <script>
    document.getElementById("verificar").addEventListener("click", function () {
      const n = parseInt(document.getElementById("numero").value, 10);
      const salida = document.getElementById("resultado");
      if (Number.isNaN(n)) {
        salida.textContent = "Ingrese un número válido.";
        salida.style.color = "#c0392b";
        return;
      }
      const esPar = n % 2 === 0;
      salida.textContent = n + (esPar ? " es PAR" : " es IMPAR");
      salida.style.color = esPar ? "#2e8b57" : "#c0392b";
    });
  </script>
</body>
</html>
`
            }
        },

        // ---------- 5. Tabla de multiplicar ----------
        {
            id: "tabla",
            titulo: "Tabla de multiplicar",
            descripcion: "Muestra la tabla de multiplicar de un número del 1 al 10 repitiendo la operación con un bucle.",
            patrones: [
                { re: /tabla de multiplicar|tabla multiplicativa|multiplication table|tabla del|tabla del \d/, peso: 4 },
                { re: /multiplicar del|tabla de \d/, peso: 1 }
            ],
            pasos: [
                "Se pide el número cuya tabla de multiplicar se desea ver.",
                "Se recorre con un bucle for los multiplicadores del 1 al 10.",
                "En cada vuelta se calcula numero x i y se agrega la línea a la salida.",
                "Se muestra la tabla completa, una operación por línea."
            ],
            notas: {
                python: "range(1, 11) genera los valores del 1 al 10 sin incluir el 11. Las f-strings (f\"...\") facilitan insertar variables dentro del texto.",
                javascript: "El bucle for (let i = 1; i <= 10; i++) recorre los multiplicadores y += agrega cada línea a la cadena de salida.",
                htmlcss: "Cada línea de la tabla se añade al HTML con insertAdjacentHTML, construyendo una lista ordenada dentro de la página."
            },
            codigo: {
                python: String.raw`# Muestra la tabla de multiplicar del 1 al 10
numero = int(input("Ingrese un número: "))

print(f"Tabla de multiplicar del {numero}:")
for i in range(1, 11):
    print(f"{numero} x {i} = {numero * i}")
`,
                javascript: String.raw`// Muestra la tabla de multiplicar del 1 al 10
function main() {
  const numero = Number(prompt("Ingrese un número:"));
  if (Number.isNaN(numero)) {
    alert("Debe ingresar un número válido.");
    return;
  }
  let salida = "Tabla de multiplicar del " + numero + ":\n";
  for (let i = 1; i <= 10; i++) {
    salida += numero + " x " + i + " = " + (numero * i) + "\n";
  }
  console.log(salida);
  alert(salida);
}

main();
`,
                htmlcss: String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tabla de multiplicar</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 300px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); text-align: center; }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 16px; }
    input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #tabla { margin-top: 14px; list-style: none; padding: 0; text-align: left; }
    #tabla li { padding: 5px 8px; border-bottom: 1px solid #eef1f6; font-family: monospace; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>Tabla de multiplicar</h1>
    <input type="number" id="numero" placeholder="Ingrese un número">
    <button id="generar">Generar tabla</button>
    <ul id="tabla"></ul>
  </div>
  <script>
    document.getElementById("generar").addEventListener("click", function () {
      const n = parseFloat(document.getElementById("numero").value);
      const lista = document.getElementById("tabla");
      lista.innerHTML = "";
      if (Number.isNaN(n)) {
        lista.innerHTML = "<li>Ingrese un número válido.</li>";
        return;
      }
      for (let i = 1; i <= 10; i++) {
        const item = document.createElement("li");
        item.textContent = n + " x " + i + " = " + (n * i);
        lista.appendChild(item);
      }
    });
  </script>
</body>
</html>
`
            }
        },

        // ---------- 6. Palíndromo ----------
        {
            id: "palindromo",
            titulo: "Verificación de palíndromos",
            descripcion: "Comprueba si una palabra se lee igual de izquierda a derecha que de derecha a izquierda, comparándola con su versión invertida.",
            patrones: [
                { re: /palindrom|palindrome|al reves/, peso: 4 },
                { re: /texto invertido|revertir la palabra/, peso: 2 }
            ],
            pasos: [
                "Se lee la palabra y se pasa a minúsculas para que no influyan las mayúsculas.",
                "Se invierte la cadena de texto con slice en Python o con split, reverse y join en JavaScript.",
                "Se compara el texto original con el texto invertido.",
                "Se informa si la palabra es un palíndromo o no lo es."
            ],
            notas: {
                python: "texto[::-1] crea una copia de la cadena invertida; .lower() normaliza las mayúsculas antes de comparar ambas versiones.",
                javascript: "texto.split(\"\") separa la palabra en letras, reverse() invierte el arreglo y join(\"\") lo vuelve a unir como cadena.",
                htmlcss: "Se toma el valor del campo con .value, se invierte con las mismas técnicas de JavaScript y el resultado se escribe en la página."
            },
            codigo: {
                python: String.raw`# Verifica si una palabra es un palíndromo
texto = input("Ingrese una palabra: ").lower()
texto = texto.replace(" ", "")

invertido = texto[::-1]

if texto == invertido:
    print(f"'{texto}' es un palíndromo")
else:
    print(f"'{texto}' no es un palíndromo")
`,
                javascript: String.raw`// Verifica si una palabra es un palíndromo
function main() {
  const entrada = prompt("Ingrese una palabra:");
  if (!entrada) {
    return;
  }
  const texto = entrada.toLowerCase().replace(/\s+/g, "");
  const invertido = texto.split("").reverse().join("");
  const mensaje = texto === invertido
    ? "'" + texto + "' es un palíndromo"
    : "'" + texto + "' no es un palíndromo";
  console.log(mensaje);
  alert(mensaje);
}

main();
`,
                htmlcss: String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Palíndromo</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 320px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); text-align: center; }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 16px; }
    input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #resultado { margin-top: 14px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>¿Es un palíndromo?</h1>
    <input type="text" id="palabra" placeholder="Ingrese una palabra">
    <button id="verificar">Verificar</button>
    <p id="resultado"></p>
  </div>
  <script>
    document.getElementById("verificar").addEventListener("click", function () {
      const palabra = document.getElementById("palabra").value.toLowerCase().replace(/\s+/g, "");
      const salida = document.getElementById("resultado");
      if (!palabra) {
        salida.textContent = "Ingrese una palabra.";
        salida.style.color = "#c0392b";
        return;
      }
      const invertido = palabra.split("").reverse().join("");
      const esPalindromo = palabra === invertido;
      salida.textContent = esPalindromo
        ? palabra + " sí es un palíndromo"
        : palabra + " no es un palíndromo";
      salida.style.color = esPalindromo ? "#2e8b57" : "#c0392b";
    });
  </script>
</body>
</html>
`
            }
        },

        // ---------- 7. Fibonacci ----------
        {
            id: "fibonacci",
            titulo: "Serie de Fibonacci",
            descripcion: "Genera la serie de Fibonacci, donde cada término es la suma de los dos anteriores: 0, 1, 1, 2, 3, 5, 8, 13...",
            patrones: [
                { re: /fibonacci|fibonachi|fibronacci/, peso: 4 },
                { re: /serie de numeros|sucesion de numeros/, peso: 1 }
            ],
            pasos: [
                "Se pide cuántos términos de la serie se desean y se valida que sea mayor que cero.",
                "Se inicializan dos variables a = 0 y b = 1, los primeros términos de la serie.",
                "En cada vuelta se guarda el valor de a y luego a toma el valor de b mientras b recibe la suma de ambos.",
                "Se repite el proceso hasta completar la cantidad pedida y se muestra la serie completa."
            ],
            notas: {
                python: "a, b = b, a + b intercambia y actualiza los dos valores en una sola línea, sin necesidad de una variable temporal.",
                javascript: "Se usa una variable temporal siguiente = a + b, porque las asignaciones simultáneas como en Python no existen en JavaScript.",
                htmlcss: "El navegador construye la serie con un bucle while y la muestra separada por comas dentro de un párrafo de la página."
            },
            codigo: {
                python: String.raw`# Genera la serie de Fibonacci
def fibonacci(cantidad):
    serie = []
    a, b = 0, 1
    while len(serie) < cantidad:
        serie.append(a)
        a, b = b, a + b
    return serie

cantidad = int(input("¿Cuántos términos desea? "))

if cantidad <= 0:
    print("Ingrese un número mayor que cero.")
else:
    print("Serie de Fibonacci:", fibonacci(cantidad))
`,
                javascript: String.raw`// Genera la serie de Fibonacci
function fibonacci(cantidad) {
  const serie = [];
  let a = 0;
  let b = 1;
  while (serie.length < cantidad) {
    serie.push(a);
    const siguiente = a + b;
    a = b;
    b = siguiente;
  }
  return serie;
}

function main() {
  const cantidad = Number(prompt("¿Cuántos términos desea?"));
  if (Number.isNaN(cantidad) || cantidad <= 0) {
    alert("Ingrese un número mayor que cero.");
    return;
  }
  const mensaje = "Serie de Fibonacci: " + fibonacci(cantidad).join(", ");
  console.log(mensaje);
  alert(mensaje);
}

main();
`,
                htmlcss: String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Serie de Fibonacci</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 340px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); text-align: center; }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 16px; }
    input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #resultado { margin-top: 14px; font-family: monospace; color: #2e8b57; word-wrap: break-word; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>Serie de Fibonacci</h1>
    <input type="number" id="cantidad" placeholder="¿Cuántos términos?">
    <button id="generar">Generar serie</button>
    <p id="resultado"></p>
  </div>
  <script>
    document.getElementById("generar").addEventListener("click", function () {
      const n = parseInt(document.getElementById("cantidad").value, 10);
      const salida = document.getElementById("resultado");
      if (Number.isNaN(n) || n <= 0) {
        salida.textContent = "Ingrese un número mayor que cero.";
        salida.style.color = "#c0392b";
        return;
      }
      const serie = [];
      let a = 0;
      let b = 1;
      while (serie.length < n) {
        serie.push(a);
        const siguiente = a + b;
        a = b;
        b = siguiente;
      }
      salida.style.color = "#2e8b57";
      salida.textContent = serie.join(", ");
    });
  </script>
</body>
</html>
`
            }
        },

        // ---------- 8. Temperatura ----------
        {
            id: "temperatura",
            titulo: "Conversión de temperatura",
            descripcion: "Convierte una temperatura de grados Celsius a Fahrenheit aplicando la fórmula F = C x 9 / 5 + 32.",
            patrones: [
                { re: /celsius|fahrenheit|temperatura|temperature|\bgrados\b/, peso: 3 },
                { re: /convertir.*grado|conversion.*temperatura|convert.*temperature/, peso: 2 }
            ],
            pasos: [
                "Se lee la temperatura en grados Celsius.",
                "Se aplica la fórmula de conversión: F = C x 9 / 5 + 32.",
                "Se redondea el resultado a un decimal para facilitar su lectura.",
                "Se muestra la temperatura convertida indicando las unidades."
            ],
            notas: {
                python: "El orden de la fórmula respeta la precedencia aritmética: primero se multiplican y dividen, y al final se suma 32.",
                javascript: "toFixed(1) devuelve una cadena con un decimal; además de calcular, sirve para presentar el resultado con formato.",
                htmlcss: "El resultado se muestra en la propia página y puede combinarse con CSS para resaltar las unidades °C y °F."
            },
            codigo: {
                python: String.raw`# Convierte grados Celsius a Fahrenheit
celsius = float(input("Ingrese la temperatura en °C: "))
fahrenheit = celsius * 9 / 5 + 32

print(f"{celsius}°C equivalen a {fahrenheit}°F")
`,
                javascript: String.raw`// Convierte grados Celsius a Fahrenheit
function main() {
  const celsius = Number(prompt("Ingrese la temperatura en °C:"));
  if (Number.isNaN(celsius)) {
    alert("Debe ingresar un valor numérico.");
    return;
  }
  const fahrenheit = celsius * 9 / 5 + 32;
  const mensaje = celsius + "°C equivalen a " + fahrenheit.toFixed(1) + "°F";
  console.log(mensaje);
  alert(mensaje);
}

main();
`,
                htmlcss: String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Celsius a Fahrenheit</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 300px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); text-align: center; }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 16px; }
    input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #resultado { margin-top: 14px; font-weight: bold; color: #2e8b57; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>Celsius a Fahrenheit</h1>
    <input type="number" id="celsius" placeholder="Temperatura en °C">
    <button id="convertir">Convertir</button>
    <p id="resultado"></p>
  </div>
  <script>
    document.getElementById("convertir").addEventListener("click", function () {
      const c = parseFloat(document.getElementById("celsius").value);
      const salida = document.getElementById("resultado");
      if (Number.isNaN(c)) {
        salida.textContent = "Ingrese una temperatura válida.";
        salida.style.color = "#c0392b";
        return;
      }
      const f = c * 9 / 5 + 32;
      salida.style.color = "#2e8b57";
      salida.textContent = c + "°C = " + f.toFixed(1) + "°F";
    });
  </script>
</body>
</html>
`
            }
        },

        // ---------- 9. Calculadora ----------
        {
            id: "calculadora",
            titulo: "Calculadora básica",
            descripcion: "Calculadora que suma, resta, multiplica o divide dos números según la operación elegida por el usuario, validando la división entre cero.",
            patrones: [
                { re: /calculadora|calculator|operaciones basicas|basic operations/, peso: 3 },
                { re: /suma.*resta|multiplic.*divis|cuatro operaciones|four operations/, peso: 2 },
                { re: /\bdivision\b|dividir|\bdivide\b/, peso: 1 }
            ],
            pasos: [
                "Se leen los dos números y el símbolo de la operación elegida.",
                "Se valida que los dos datos sean numéricos antes de operar.",
                "Con una estructura if/elif en Python o switch en JavaScript se ejecuta la operación solicitada.",
                "Se comprueba que no exista una división entre cero antes de dividir.",
                "Se muestra la expresión completa con su resultado, o un mensaje de error si la operación no es válida."
            ],
            notas: {
                python: "Las cadenas if / elif / else comparan el símbolo elegido y la validación del divisor evita la excepción ZeroDivisionError.",
                javascript: "Un switch evalúa la operación elegida y devuelve null cuando la opción no existe o cuando el divisor es 0.",
                htmlcss: "Un elemento select permite elegir la operación y el resultado se escribe en la interfaz al pulsar el botón calcular."
            },
            codigo: {
                python: String.raw`# Calculadora básica con las cuatro operaciones
num1 = float(input("Ingrese el primer número: "))
operacion = input("Ingrese la operación (+, -, *, /): ")
num2 = float(input("Ingrese el segundo número: "))

if operacion == "+":
    resultado = num1 + num2
elif operacion == "-":
    resultado = num1 - num2
elif operacion == "*":
    resultado = num1 * num2
elif operacion == "/" and num2 != 0:
    resultado = num1 / num2
else:
    resultado = None

if resultado is None:
    print("Operación no válida o división entre cero.")
else:
    print(f"Resultado: {num1} {operacion} {num2} = {resultado}")
`,
                javascript: String.raw`// Calculadora básica con las cuatro operaciones
function calcular(num1, operacion, num2) {
  switch (operacion) {
    case "+": return num1 + num2;
    case "-": return num1 - num2;
    case "*": return num1 * num2;
    case "/": return num2 === 0 ? null : num1 / num2;
    default: return null;
  }
}

function main() {
  const num1 = Number(prompt("Ingrese el primer número:"));
  const operacion = prompt("Ingrese la operación (+, -, *, /):");
  const num2 = Number(prompt("Ingrese el segundo número:"));
  if (Number.isNaN(num1) || Number.isNaN(num2)) {
    alert("Debe ingresar dos valores numéricos.");
    return;
  }
  const resultado = calcular(num1, operacion, num2);
  const mensaje = resultado === null
    ? "Operación no válida o división entre cero."
    : "Resultado: " + num1 + " " + operacion + " " + num2 + " = " + resultado;
  console.log(mensaje);
  alert(mensaje);
}

main();
`,
                htmlcss: String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calculadora básica</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 300px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); text-align: center; }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 16px; }
    input, select { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #resultado { margin-top: 14px; font-weight: bold; color: #2e8b57; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>Calculadora básica</h1>
    <input type="number" id="num1" placeholder="Primer número">
    <select id="operacion">
      <option value="+">Suma (+)</option>
      <option value="-">Resta (-)</option>
      <option value="*">Multiplicación (x)</option>
      <option value="/">División (/)</option>
    </select>
    <input type="number" id="num2" placeholder="Segundo número">
    <button id="calcular">Calcular</button>
    <p id="resultado"></p>
  </div>
  <script>
    document.getElementById("calcular").addEventListener("click", function () {
      const a = parseFloat(document.getElementById("num1").value);
      const b = parseFloat(document.getElementById("num2").value);
      const op = document.getElementById("operacion").value;
      const salida = document.getElementById("resultado");
      let resultado = null;
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        if (op === "+") resultado = a + b;
        else if (op === "-") resultado = a - b;
        else if (op === "*") resultado = a * b;
        else if (op === "/" && b !== 0) resultado = a / b;
      }
      if (resultado === null) {
        salida.textContent = "Datos inválidos o división entre cero.";
        salida.style.color = "#c0392b";
        return;
      }
      salida.style.color = "#2e8b57";
      salida.textContent = a + " " + op + " " + b + " = " + resultado;
    });
  </script>
</body>
</html>
`
            }
        },

        // ---------- 10. Mayor de tres ----------
        {
            id: "mayor",
            titulo: "Mayor de tres números",
            descripcion: "Compara tres valores entre sí y determina cuál es el mayor utilizando estructuras condicionales.",
            patrones: [
                { re: /\bmayor\b|mas grande|maximum|\bmaximo\b|largest|biggest|\bmenor\b|minimum|\bminimo\b|smallest/, peso: 3 },
                { re: /de tres|entre tres|three numbers|3 numeros|tres numeros/, peso: 2 }
            ],
            pasos: [
                "Se piden tres valores numéricos al usuario.",
                "Se compara el primer valor con los otros dos encadenando condiciones con && o and.",
                "Si el primer valor no es el mayor, se repite la comparación con el segundo.",
                "El valor restante es el mayor y se muestra como resultado."
            ],
            notas: {
                python: "Los operadores and y or permiten encadenar comparaciones: a >= b and a >= c se lee casi igual que en matemáticas.",
                javascript: "if (a >= b && a >= c) usa el operador && propio de JavaScript; el mismo resultado se obtendría con Math.max(a, b, c).",
                htmlcss: "Tres campos de entrada y una función que devuelve el máximo se ejecutan en el navegador al pulsar el botón."
            },
            codigo: {
                python: String.raw`# Encuentra el número mayor de tres números
a = float(input("Ingrese el número 1: "))
b = float(input("Ingrese el número 2: "))
c = float(input("Ingrese el número 3: "))

if a >= b and a >= c:
    mayor = a
elif b >= a and b >= c:
    mayor = b
else:
    mayor = c

print(f"El número mayor es {mayor}")
`,
                javascript: String.raw`// Encuentra el número mayor de tres números
function mayorDeTres(a, b, c) {
  if (a >= b && a >= c) return a;
  if (b >= a && b >= c) return b;
  return c;
}

function main() {
  const a = Number(prompt("Ingrese el número 1:"));
  const b = Number(prompt("Ingrese el número 2:"));
  const c = Number(prompt("Ingrese el número 3:"));
  if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) {
    alert("Debe ingresar tres valores numéricos.");
    return;
  }
  const mensaje = "El número mayor es " + mayorDeTres(a, b, c);
  console.log(mensaje);
  alert(mensaje);
}

main();
`,
                htmlcss: String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mayor de tres números</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 300px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); text-align: center; }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 16px; }
    input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #resultado { margin-top: 14px; font-weight: bold; color: #2e8b57; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>Mayor de tres números</h1>
    <input type="number" id="n1" placeholder="Número 1">
    <input type="number" id="n2" placeholder="Número 2">
    <input type="number" id="n3" placeholder="Número 3">
    <button id="buscar">Buscar mayor</button>
    <p id="resultado"></p>
  </div>
  <script>
    document.getElementById("buscar").addEventListener("click", function () {
      const a = parseFloat(document.getElementById("n1").value);
      const b = parseFloat(document.getElementById("n2").value);
      const c = parseFloat(document.getElementById("n3").value);
      const salida = document.getElementById("resultado");
      if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) {
        salida.textContent = "Ingrese los tres números.";
        salida.style.color = "#c0392b";
        return;
      }
      let mayor = a;
      if (b > mayor) mayor = b;
      if (c > mayor) mayor = c;
      salida.textContent = "El número mayor es " + mayor;
      salida.style.color = "#2e8b57";
    });
  </script>
</body>
</html>
`
            }
        }
    ];

    // ============================================================
    //  Conceptos que pueden detectarse en una solicitud genérica
    // ============================================================
    var CONCEPTOS = [
        { nombre: "entrada de datos", re: /\binput\b|ingresar|leer|prompt|pedir|recibir|datos del usuario/ },
        { nombre: "bucles o ciclos", re: /\bfor\b|\bwhile\b|bucle|ciclo|loop|repetir|iterar/ },
        { nombre: "condiciones", re: /\bif\b|condicion|validar|comprobar|verificar|según el caso/ },
        { nombre: "funciones", re: /funcion|function|\bdef\b|metodo|procedimiento/ },
        { nombre: "listas o arreglos", re: /lista|arreglo|\barray\b|conjunto|coleccion|elementos/ },
        { nombre: "texto o cadenas", re: /texto|cadena|\bstring\b|caracter|palabra/ },
        { nombre: "archivos", re: /archivo|\bfile\b|guardar en|leer de/ },
        { nombre: "cálculos matemáticos", re: /calcul|operacion|matematic|suma|resta|multiplic|divid|promedio|potencia/ }
    ];

    // ============================================================
    //  Utilidades
    // ============================================================
    function normalizar(texto) {
        return String(texto)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function escaparHtml(texto) {
        return texto
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function limpiarDescripcion(texto) {
        return String(texto)
            .replace(/\s+/g, " ")
            .trim()
            .replace(/`/g, "")
            .replace(/\$\{/g, "");
    }

    function recortar(texto, max) {
        var t = String(texto).replace(/\s+/g, " ").trim();
        return t.length > max ? t.slice(0, max - 1) + "…" : t;
    }

    // ============================================================
    //  Detección
    // ============================================================
    function detectarPlantilla(texto) {
        var t = normalizar(texto);
        var mejor = null;
        var mejorPuntaje = 0;

        PLANTILLAS.forEach(function (plantilla) {
            var puntaje = 0;
            plantilla.patrones.forEach(function (patron) {
                if (patron.re.test(t)) {
                    puntaje += patron.peso;
                }
            });
            if (puntaje > mejorPuntaje) {
                mejorPuntaje = puntaje;
                mejor = plantilla;
            }
        });

        return { plantilla: mejor, puntaje: mejorPuntaje };
    }

    function detectarLenguaje(texto) {
        var t = normalizar(texto);
        var puntos = {
            python: (t.match(/\bpython\b|\bpy\b/g) || []).length,
            javascript: (t.match(/\bjavascript\b|\becmascript\b|\bnode\b|\bjs\b/g) || []).length,
            htmlcss: (t.match(/\bhtml\b|\bcss\b|pagina web|sitio web|\bweb\b/g) || []).length
        };

        var mejor = null;
        var maximo = 0;
        Object.keys(puntos).forEach(function (clave) {
            if (puntos[clave] > maximo) {
                maximo = puntos[clave];
                mejor = clave;
            }
        });
        return maximo > 0 ? mejor : null;
    }

    function detectarConceptos(texto) {
        var t = normalizar(texto);
        var encontrados = [];
        CONCEPTOS.forEach(function (concepto) {
            if (concepto.re.test(t) && encontrados.length < 4) {
                encontrados.push(concepto.nombre);
            }
        });
        return encontrados;
    }

    // ============================================================
    //  Esqueletos para solicitudes no reconocidas
    // ============================================================
    function esqueletoPython(descripcion) {
        return String.raw`# Programa generado a partir de la descripción:
# "` + descripcion + String.raw`"

def procesar(datos):
    # TODO: escribir aquí la lógica del programa descrito
    return datos

def main():
    # 1. Entrada de datos
    datos = input("Ingrese los datos necesarios: ")

    # 2. Procesamiento
    resultado = procesar(datos)

    # 3. Salida
    print("Resultado:", resultado)

if __name__ == "__main__":
    main()
`;
    }

    function esqueletoJavascript(descripcion) {
        return String.raw`// Programa generado a partir de la descripción:
// "` + descripcion + String.raw`"

function procesar(datos) {
  // TODO: escribir aquí la lógica del programa descrito
  return datos;
}

function main() {
  // 1. Entrada de datos
  const datos = prompt("Ingrese los datos necesarios:");
  if (datos === null || datos === "") {
    return;
  }

  // 2. Procesamiento
  const resultado = procesar(datos);

  // 3. Salida
  console.log("Resultado:", resultado);
  alert("Resultado: " + resultado);
}

main();
`;
    }

    function esqueletoHtmlCss(descripcion) {
        return String.raw`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Programa generado</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f2f4f8; display: flex; justify-content: center; padding: 40px 16px; }
    .tarjeta { background: #fff; width: 360px; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); }
    h1 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 8px; }
    .descripcion { color: #666; font-size: 0.9rem; margin-bottom: 16px; }
    input { width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; background: #2f6db5; color: #fff; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e3a5f; }
    #salida { margin-top: 14px; font-weight: bold; color: #2e8b57; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>Programa generado</h1>
    <!-- Descripción: ` + descripcion + String.raw` -->
    <p class="descripcion">Interfaz base: completa la lógica en el script.</p>
    <input type="text" id="entrada" placeholder="Ingrese un valor">
    <button id="accion">Ejecutar</button>
    <p id="salida"></p>
  </div>
  <script>
    document.getElementById("accion").addEventListener("click", function () {
      const datos = document.getElementById("entrada").value;
      const salida = document.getElementById("salida");
      if (!datos) {
        salida.textContent = "Ingrese un valor.";
        salida.style.color = "#c0392b";
        return;
      }
      // TODO: reemplazar por la lógica del programa descrito
      const resultado = datos;
      salida.style.color = "#2e8b57";
      salida.textContent = "Resultado: " + resultado;
    });
  </script>
</body>
</html>
`;
    }

    function pasosGenericos(descripcion, conceptos) {
        var ultimo = "Procesar la información y preparar el resultado.";
        if (conceptos.length > 0) {
            ultimo = "Procesar la información atendiendo a estos aspectos detectados en tu solicitud: " +
                conceptos.join(", ") + ". Marca con TODO los puntos que faltan por implementar.";
        }
        return [
            "Interpretar la solicitud: " + recortar(descripcion, 120),
            "Entrada de datos: mostrar un mensaje al usuario para pedir la información necesaria (input en Python, prompt en JavaScript o un formulario en HTML).",
            "Validación: comprobar que los datos sean correctos antes de usarlos y avisar si el usuario se equivoca.",
            ultimo,
            "Salida: presentar el resultado con print(), console.log() o un párrafo dentro de la página."
        ];
    }

    // ============================================================
    //  Resaltado de sintaxis
    // ============================================================
    function resaltar(codigo, lenguaje) {
        var texto = escaparHtml(codigo);

        if (lenguaje === "python") {
            return texto.replace(
                /("(?:[^"\n])*"|'(?:[^'\n])*')|(#[^\n]*)|\b(def|return|if|elif|else|for|while|in|not|and|or|import|from|as|class|try|except|with|lambda|None|True|False|pass|break|continue|global|print|input|int|float|str|len|range|sum|min|max|abs|round|list|sorted|is)\b|(\b\d+(?:\.\d+)?\b)/g,
                function (m, cadena, comentario, palabra, numero) {
                    if (cadena) return '<span class="tok-cadena">' + cadena + "</span>";
                    if (comentario) return '<span class="tok-comentario">' + comentario + "</span>";
                    if (palabra) return '<span class="tok-palabra">' + palabra + "</span>";
                    if (numero) return '<span class="tok-numero">' + numero + "</span>";
                    return m;
                }
            );
        }

        if (lenguaje === "javascript") {
            return texto.replace(
                /("(?:[^"\n])*"|'(?:[^'\n])*')|(\/\/[^\n]*)|\b(const|let|var|function|return|if|else|for|while|of|in|new|class|try|catch|finally|throw|typeof|switch|case|break|continue|true|false|null|undefined|this)\b|\b(prompt|alert|console|document|window|Number|String|Math|Array|Object|parseFloat|parseInt|isNaN|isInteger|reduce|push|join|split|reverse|toFixed|addEventListener)\b|(\b\d+(?:\.\d+)?\b)/g,
                function (m, cadena, comentario, palabra, funcion, numero) {
                    if (cadena) return '<span class="tok-cadena">' + cadena + "</span>";
                    if (comentario) return '<span class="tok-comentario">' + comentario + "</span>";
                    if (palabra) return '<span class="tok-palabra">' + palabra + "</span>";
                    if (funcion) return '<span class="tok-funcion">' + funcion + "</span>";
                    if (numero) return '<span class="tok-numero">' + numero + "</span>";
                    return m;
                }
            );
        }

        return texto.replace(
            /(&lt;!--[\s\S]*?--&gt;)|("(?:[^"\n])*")|(&lt;\/?[\w-]+)|\b(const|let|var|function|return|if|else|for|while|of|in|true|false|null|this|document|addEventListener|Number|parseFloat|parseInt|isNaN|alert|prompt|console|createElement|appendChild|textContent)\b|(\b\d+(?:\.\d+)?\b)/g,
            function (m, comentario, cadena, etiqueta, palabra, numero) {
                if (comentario) return '<span class="tok-comentario">' + comentario + "</span>";
                if (cadena) return '<span class="tok-cadena">' + cadena + "</span>";
                if (etiqueta) return '<span class="tok-etiqueta">' + etiqueta + "</span>";
                if (palabra) return '<span class="tok-funcion">' + palabra + "</span>";
                if (numero) return '<span class="tok-numero">' + numero + "</span>";
                return m;
            }
        );
    }

    function pintarCodigo(codigo, lenguaje) {
        var resaltado = resaltar(codigo, lenguaje);
        var lineas = resaltado.split("\n");
        var html = "";

        // La última línea vacía del bloque final no se muestra
        if (lineas.length > 0 && lineas[lineas.length - 1] === "") {
            lineas.pop();
        }

        lineas.forEach(function (linea, i) {
            var contenido = linea.length > 0 ? linea : "&nbsp;";
            html += '<span class="linea" style="animation-delay:' + (i * 14) + 'ms">' + contenido + "</span>";
        });

        document.getElementById("codigoGenerado").innerHTML = html;
    }

    // ============================================================
    //  Estado de la aplicación
    // ============================================================
    var lenguajeActual = "python";
    var codigoActual = "";
    var nombreArchivoActual = "solucion";
    var historial = [];

    function cargarHistorial() {
        try {
            var guardado = localStorage.getItem(CLAVE_HISTORIAL);
            historial = guardado ? JSON.parse(guardado) : [];
        } catch (e) {
            historial = [];
        }
    }

    function guardarHistorial() {
        try {
            localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
        } catch (e) {
            // El navegador no permite almacenar; el historial solo vive en sesión
        }
    }

    function pintarHistorial() {
        var contenedor = document.getElementById("listaHistorial");
        contenedor.innerHTML = "";

        if (!historial.length) {
            var vacio = document.createElement("p");
            vacio.className = "historial-vacio";
            vacio.textContent = "Todavía no hay generaciones.";
            contenedor.appendChild(vacio);
            return;
        }

        historial.forEach(function (item, indice) {
            var boton = document.createElement("button");
            boton.type = "button";
            boton.className = "elemento-historial";

            var texto = document.createElement("span");
            texto.className = "texto-historial";
            texto.textContent = item.texto;

            var insignia = document.createElement("span");
            insignia.className = "mini-insignia";
            insignia.textContent = LENGUAJES[item.lenguaje].etiqueta;

            boton.appendChild(texto);
            boton.appendChild(insignia);
            boton.addEventListener("click", function () {
                document.getElementById("descripcion").value = item.texto;
                establecerLenguaje(item.lenguaje, false);
                generar();
            });
            contenedor.appendChild(boton);
        });
    }

    function establecerLenguaje(lenguaje, mostrarAviso) {
        lenguajeActual = lenguaje;
        var botones = document.querySelectorAll(".lenguaje");
        for (var i = 0; i < botones.length; i++) {
            var activo = botones[i].getAttribute("data-lenguaje") === lenguaje;
            botones[i].classList.toggle("activo", activo);
            botones[i].setAttribute("aria-checked", activo ? "true" : "false");
        }
        document.getElementById("avisoLenguaje").classList.toggle("oculto", !mostrarAviso);
    }

    function nivelConfianza(valor) {
        if (valor >= 85) return "alta";
        if (valor >= 60) return "media";
        return "baja";
    }

    // ============================================================
    //  Generación de la solución
    // ============================================================
    function construirSolucion(texto) {
        var deteccion = detectarPlantilla(texto);
        var lenguaje = lenguajeActual;
        var confianza;
        var titulo;
        var intro;
        var pasos;
        var nota;
        var codigo;
        var identificador = "personalizado";

        if (deteccion.plantilla) {
            var plantilla = deteccion.plantilla;
            confianza = Math.min(97, 52 + deteccion.puntaje * 9);
            titulo = plantilla.titulo;
            intro = plantilla.descripcion;
            pasos = plantilla.pasos;
            nota = plantilla.notas[lenguaje];
            codigo = plantilla.codigo[lenguaje];
            identificador = plantilla.id;
        } else {
            var limpio = limpiarDescripcion(texto);
            var conceptos = detectarConceptos(texto);
            confianza = 38;
            titulo = "Solución propuesta (estructura base)";
            intro = "No se reconoció una plantilla exacta para esta descripción, así que se generó una estructura base en " +
                LENGUAJES[lenguaje].etiqueta + " con los puntos esenciales del programa marcados como TODO.";
            pasos = pasosGenericos(texto, conceptos);
            nota = NOTAS_GENERICAS[lenguaje];
            if (lenguaje === "python") {
                codigo = esqueletoPython(limpio);
            } else if (lenguaje === "javascript") {
                codigo = esqueletoJavascript(limpio);
            } else {
                codigo = esqueletoHtmlCss(limpio);
            }
        }

        return {
            titulo: titulo,
            intro: intro,
            pasos: pasos,
            nota: nota,
            codigo: codigo,
            confianza: confianza,
            lenguaje: lenguaje,
            id: identificador
        };
    }

    function mostrarResultado(solucion) {
        document.getElementById("estadoVacio").classList.add("oculto");
        document.getElementById("cargando").classList.add("oculto");
        document.getElementById("resultado").classList.remove("oculto");

        document.getElementById("tituloSolucion").textContent = solucion.titulo;

        var insigniaLenguaje = document.getElementById("insigniaLenguaje");
        insigniaLenguaje.textContent = LENGUAJES[solucion.lenguaje].etiqueta;

        var insigniaConfianza = document.getElementById("insigniaConfianza");
        insigniaConfianza.textContent = "Confianza: " + solucion.confianza + "%";
        insigniaConfianza.className = "insignia confianza " + nivelConfianza(solucion.confianza);

        // Código
        codigoActual = solucion.codigo;
        nombreArchivoActual = "solucion_" + solucion.id;
        pintarCodigo(solucion.codigo, solucion.lenguaje);

        // Explicación
        document.getElementById("introSolucion").textContent = solucion.intro;
        var lista = document.getElementById("listaPasos");
        lista.innerHTML = "";
        solucion.pasos.forEach(function (paso) {
            var li = document.createElement("li");
            li.textContent = paso;
            lista.appendChild(li);
        });
        document.getElementById("notaLenguajeTitulo").textContent = LENGUAJES[solucion.lenguaje].etiqueta;
        document.getElementById("textoNota").textContent = solucion.nota;

        cambiarVista("codigo");
    }

    function cambiarVista(vista) {
        var pestanas = document.querySelectorAll(".pestana");
        for (var i = 0; i < pestanas.length; i++) {
            var activa = pestanas[i].getAttribute("data-vista") === vista;
            pestanas[i].classList.toggle("activa", activa);
            pestanas[i].setAttribute("aria-selected", activa ? "true" : "false");
        }
        document.getElementById("vistaCodigo").classList.toggle("oculto", vista !== "codigo");
        document.getElementById("vistaExplicacion").classList.toggle("oculto", vista !== "explicacion");
    }

    function generar() {
        var campo = document.getElementById("descripcion");
        var texto = campo.value.trim();
        var error = document.getElementById("errorEntrada");

        if (!texto) {
            error.classList.remove("oculto");
            campo.focus();
            return;
        }
        error.classList.add("oculto");

        var boton = document.getElementById("botonGenerar");
        boton.disabled = true;
        document.getElementById("estadoVacio").classList.add("oculto");
        document.getElementById("resultado").classList.add("oculto");
        document.getElementById("cargando").classList.remove("oculto");

        window.setTimeout(function () {
            var solucion = construirSolucion(texto);
            mostrarResultado(solucion);
            boton.disabled = false;

            historial.unshift({ texto: texto, lenguaje: solucion.lenguaje, fecha: Date.now() });
            if (historial.length > 6) {
                historial = historial.slice(0, 6);
            }
            guardarHistorial();
            pintarHistorial();
        }, 700);
    }

    // ============================================================
    //  Copiar y descargar
    // ============================================================
    function copiarCodigo() {
        var boton = document.getElementById("botonCopiar");

        function confirmar() {
            boton.textContent = "¡Copiado!";
            boton.classList.add("exito");
            window.setTimeout(function () {
                boton.textContent = "Copiar código";
                boton.classList.remove("exito");
            }, 1600);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codigoActual).then(confirmar, function () {
                copiarConRespaldo();
                confirmar();
            });
        } else {
            copiarConRespaldo();
            confirmar();
        }
    }

    function copiarConRespaldo() {
        var temporal = document.createElement("textarea");
        temporal.value = codigoActual;
        document.body.appendChild(temporal);
        temporal.select();
        try {
            document.execCommand("copy");
        } catch (e) {
            // Navegador antiguo: el usuario puede copiar manualmente
        }
        document.body.removeChild(temporal);
    }

    function descargarCodigo() {
        var lenguaje = lenguajeActual;
        var blob = new Blob([codigoActual], { type: "text/plain;charset=utf-8" });
        var enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = nombreArchivoActual + "." + LENGUAJES[lenguaje].extension;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(enlace.href);
    }

    // ============================================================
    //  Eventos
    // ============================================================
    function iniciar() {
        cargarHistorial();
        pintarHistorial();

        var campo = document.getElementById("descripcion");

        campo.addEventListener("input", function () {
            document.getElementById("errorEntrada").classList.add("oculto");
            var detectado = detectarLenguaje(campo.value);
            if (detectado && detectado !== lenguajeActual) {
                establecerLenguaje(detectado, true);
            } else if (!detectado) {
                document.getElementById("avisoLenguaje").classList.add("oculto");
            }
        });

        campo.addEventListener("keydown", function (evento) {
            if ((evento.ctrlKey || evento.metaKey) && evento.key === "Enter") {
                generar();
            }
        });

        var botonesLenguaje = document.querySelectorAll(".lenguaje");
        for (var i = 0; i < botonesLenguaje.length; i++) {
            botonesLenguaje[i].addEventListener("click", function (evento) {
                establecerLenguaje(evento.currentTarget.getAttribute("data-lenguaje"), false);
            });
        }

        var chips = document.querySelectorAll(".chip");
        for (var j = 0; j < chips.length; j++) {
            chips[j].addEventListener("click", function (evento) {
                campo.value = evento.currentTarget.getAttribute("data-texto");
                var detectado = detectarLenguaje(campo.value);
                if (detectado) {
                    establecerLenguaje(detectado, true);
                }
                generar();
            });
        }

        document.getElementById("botonGenerar").addEventListener("click", generar);

        var pestanas = document.querySelectorAll(".pestana");
        for (var k = 0; k < pestanas.length; k++) {
            pestanas[k].addEventListener("click", function (evento) {
                cambiarVista(evento.currentTarget.getAttribute("data-vista"));
            });
        }

        document.getElementById("botonCopiar").addEventListener("click", copiarCodigo);
        document.getElementById("botonDescargar").addEventListener("click", descargarCodigo);
    }

    if (typeof document !== "undefined") {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", iniciar);
        } else {
            iniciar();
        }
    }

    // Permite probar el motor de detección fuera del navegador
    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            PLANTILLAS: PLANTILLAS,
            detectarPlantilla: detectarPlantilla,
            detectarLenguaje: detectarLenguaje,
            resaltar: resaltar,
            construirSolucion: construirSolucion,
            esqueletoPython: esqueletoPython,
            esqueletoJavascript: esqueletoJavascript,
            esqueletoHtmlCss: esqueletoHtmlCss
        };
    }
})();
