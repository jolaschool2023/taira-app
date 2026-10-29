# -*- coding: utf-8 -*-
"""
Generador automático de reportes
--------------------------------
Lee datos (CSV o ejemplo de calificaciones de estudiantes), calcula
estadísticas e identifica valores importantes, y genera un reporte que
puede guardarse en TXT, HTML o CSV. El usuario elige el tipo de reporte.

Tipos de reporte:
    1. Resumen general
    2. Boletín por estudiante
    3. Ranking de estudiantes
    4. Distribución y aprobados
    5. Reporte completo

Uso:  python generador_reportes.py
Requiere: solo biblioteca estándar (tkinter, csv, statistics, datetime).
"""

import csv
import os
import statistics
import tkinter as tk
from datetime import datetime
from tkinter import filedialog, messagebox, ttk
from tkinter import scrolledtext

UMBRAL_POR_DEFECTO = 6.0
TOP_POR_DEFECTO = 5

# ----------------------------------------------------------------------------
# Datos de ejemplo: calificaciones de estudiantes
# ----------------------------------------------------------------------------
EJEMPLO = {
    "encabezados": ["Nombre", "Curso", "Matemáticas", "Ciencias", "Historia", "Inglés"],
    "filas": [
        ["Ana García", "1A", "9.0", "8.5", "7.5", "9.2"],
        ["Luis Pérez", "1A", "5.5", "6.0", "4.8", "6.1"],
        ["Marta Ruiz", "1A", "7.2", "7.8", "8.0", "7.5"],
        ["Carlos Díaz", "1A", "3.5", "4.0", "5.0", "4.5"],
        ["Sofía Molina", "1B", "9.5", "9.0", "9.2", "9.8"],
        ["Javier Soto", "1B", "6.5", "5.5", "6.0", "6.8"],
        ["Elena Vargas", "1B", "8.0", "8.5", "7.0", "8.2"],
        ["Diego Castro", "1B", "4.0", "5.5", "6.5", "5.0"],
        ["Lucía Romero", "1C", "10", "9.5", "9.0", "9.5"],
        ["Pedro Gil", "1C", "5.0", "5.5", "4.5", "5.5"],
        ["Nuria Blanco", "1C", "7.5", "6.5", "7.0", "6.8"],
        ["Iván Navarro", "1C", "6.0", "6.5", "7.5", "6.0"],
    ],
}


# ----------------------------------------------------------------------------
# Utilidades
# ----------------------------------------------------------------------------
def es_numero(cadena):
    if cadena is None:
        return False
    texto = str(cadena).strip()
    if texto == "":
        return False
    try:
        float(texto)
        return True
    except ValueError:
        return False


def redondear(valor, decimales=2):
    return round(float(valor), decimales)


def formato(valor, decimales=2):
    if valor is None:
        return "-"
    return ("{:.%df}" % decimales).format(valor)


def detectar_encabezado_y_tipos(encabezados, filas):
    """Devuelve una lista [{nombre, tipo}] clasificando cada columna."""
    columnas = []
    for i, nombre in enumerate(encabezados):
        numericos = 0
        total = 0
        for fila in filas:
            if i >= len(fila):
                continue
            valor = fila[i]
            if valor is None or str(valor).strip() == "":
                continue
            total += 1
            if es_numero(valor):
                numericos += 1
        tipo = "numero" if total > 0 and (numericos / total) >= 0.6 else "texto"
        columnas.append({"nombre": nombre, "tipo": tipo})
    return columnas


def parsear_csv(texto):
    """Parsea texto CSV detectando el delimitador (, ; o tabulador)."""
    primera = texto.splitlines()[0] if texto.splitlines() else ""
    delimitador = ","
    for candidato in [";", "\t", ","]:
        if candidato in primera:
            delimitador = candidato
            break

    lector = csv.reader(texto.splitlines(), delimiter=delimitador)
    filas = [fila for fila in lector if any(celda.strip() for celda in fila)]
    if not filas:
        return [], []
    return [c.strip() for c in filas[0]], [[c.strip() for c in f] for f in filas[1:]]


# ----------------------------------------------------------------------------
# Estadísticas
# ----------------------------------------------------------------------------
def estadisticas(valores):
    """Estadísticas descriptivas de una lista de números."""
    if not valores:
        return None
    return {
        "n": len(valores),
        "suma": sum(valores),
        "promedio": statistics.mean(valores),
        "mediana": statistics.median(valores),
        "minimo": min(valores),
        "maximo": max(valores),
        "desviacion": statistics.pstdev(valores) if len(valores) > 1 else 0.0,
        "rango": max(valores) - min(valores),
    }


class ConjuntoDatos:
    """Contiene los datos y ofrece cálculos reutilizables."""

    def __init__(self, encabezados, filas):
        self.encabezados = encabezados
        self.filas = filas
        self.columnas = detectar_encabezado_y_tipos(encabezados, filas)
        self.columnas_numero = [c["nombre"] for c in self.columnas if c["tipo"] == "numero"]
        self.columnas_texto = [c["nombre"] for c in self.columnas if c["tipo"] == "texto"]
        self.columna_id = self.columnas_texto[0] if self.columnas_texto else (
            encabezados[0] if encabezados else ""
        )
        self.columna_grupo = self.columnas_texto[1] if len(self.columnas_texto) > 1 else None

    def valores_columna(self, nombre):
        valores = []
        for fila in self.filas:
            i = self.encabezados.index(nombre)
            if i < len(fila) and es_numero(fila[i]):
                valores.append(float(fila[i]))
        return valores

    def registros(self):
        """Devuelve cada registro con sus notas y promedio."""
        resultado = []
        for fila in self.filas:
            notas = {}
            for nombre in self.columnas_numero:
                i = self.encabezados.index(nombre)
                if i < len(fila) and es_numero(fila[i]):
                    notas[nombre] = float(fila[i])
            ident = self._valor(fila, self.columna_id)
            grupo = self._valor(fila, self.columna_grupo) if self.columna_grupo else ""
            promedio = statistics.mean(notas.values()) if notas else None
            resultado.append({
                "id": ident,
                "grupo": grupo,
                "notas": notas,
                "promedio": promedio,
            })
        return resultado

    def _valor(self, fila, nombre):
        if not nombre:
            return ""
        i = self.encabezados.index(nombre)
        return fila[i] if i < len(fila) else ""

    def estadisticas_por_columna(self):
        resultado = {}
        for nombre in self.columnas_numero:
            resultado[nombre] = estadisticas(self.valores_columna(nombre))
        return resultado

    def estadisticas_globales(self):
        todos = []
        for nombre in self.columnas_numero:
            todos.extend(self.valores_columna(nombre))
        return estadisticas(todos)


# ----------------------------------------------------------------------------
# Estructura del reporte: título + secciones (texto o tabla)
# ----------------------------------------------------------------------------
def seccion_texto(titulo, lineas):
    return {"titulo": titulo, "tipo": "texto", "lineas": list(lineas)}


def seccion_tabla(titulo, encabezados, filas, derecha=None):
    """`derecha` = índices de columnas que se alinean a la derecha."""
    return {
        "titulo": titulo,
        "tipo": "tabla",
        "encabezados": list(encabezados),
        "filas": [list(f) for f in filas],
        "derecha": set(derecha or []),
    }


def def_reporte(titulo, secciones):
    return {"titulo": titulo, "secciones": secciones}


# ----------------------------------------------------------------------------
# Constructores de cada tipo de reporte
# ----------------------------------------------------------------------------
def reporte_resumen(datos, umbral):
    estados = estado_por_estudiante(datos, umbral)
    aprobados = sum(1 for e in estados if e["estado"] == "Aprobado")
    reprobados = len(estados) - aprobados
    stats_col = datos.estadisticas_por_columna()
    global_stats = datos.estadisticas_globales()

    secciones = []

    secciones.append(seccion_tabla(
        "Estadísticas por asignatura",
        ["Asignatura", "N", "Promedio", "Mediana", "Máximo", "Mínimo", "Desv.", "Rango"],
        [
            [nombre, s["n"], formato(s["promedio"]), formato(s["mediana"]),
             formato(s["maximo"]), formato(s["minimo"]),
             formato(s["desviacion"]), formato(s["rango"])]
            for nombre, s in stats_col.items() if s
        ],
        derecha={1, 2, 3, 4, 5, 6, 7},
    ))

    if global_stats:
        secciones.append(seccion_texto(
            "Resumen global",
            [
                "Registros analizados: {}".format(len(datos.filas)),
                "Asignaturas: {}".format(len(datos.columnas_numero)),
                "Calificaciones registradas: {}".format(global_stats["n"]),
                "Promedio general: {}".format(formato(global_stats["promedio"])),
                "Mediana general: {}".format(formato(global_stats["mediana"])),
                "Calificación máxima: {}".format(formato(global_stats["maximo"])),
                "Calificación mínima: {}".format(formato(global_stats["minimo"])),
                "Desviación estándar: {}".format(formato(global_stats["desviacion"])),
                "Umbral de aprobación: {}".format(formato(umbral, 1)),
                "Aprobados: {}   Reprobados: {}".format(aprobados, reprobados),
            ],
        ))

    secciones.extend(secciones_valores_importantes(datos, umbral))
    return def_reporte("Resumen general", secciones)


def secciones_valores_importantes(datos, umbral):
    """Identifica extremos y casos destacados."""
    mejor_nota = None
    peor_nota = None
    for nombre in datos.columnas_numero:
        for fila in datos.filas:
            i = datos.encabezados.index(nombre)
            if i < len(fila) and es_numero(fila[i]):
                valor = float(fila[i])
                estudiante = datos._valor(fila, datos.columna_id)
                registro = (valor, estudiante, nombre)
                if mejor_nota is None or valor > mejor_nota[0]:
                    mejor_nota = registro
                if peor_nota is None or valor < peor_nota[0]:
                    peor_nota = registro

    estados = estado_por_estudiante(datos, umbral)
    con_promedio = [e for e in estados if e["promedio"] is not None]
    mejores = sorted(con_promedio, key=lambda e: e["promedio"], reverse=True)[:3]
    peores = sorted(con_promedio, key=lambda e: e["promedio"])[:3]

    lineas = []
    if mejor_nota:
        lineas.append("Calificación más alta: {} en {} ({})".format(
            formato(mejor_nota[0]), mejor_nota[2], mejor_nota[1]))
    if peor_nota:
        lineas.append("Calificación más baja: {} en {} ({})".format(
            formato(peor_nota[0]), peor_nota[2], peor_nota[1]))
    if mejores:
        lineas.append("Mejores promedios:")
        for e in mejores:
            lineas.append("   {} -> {}".format(e["id"], formato(e["promedio"])))
    if peores:
        lineas.append("Promedios más bajos:")
        for e in peores:
            lineas.append("   {} -> {}".format(e["id"], formato(e["promedio"])))

    secciones = [seccion_texto("Valores importantes", lineas)]

    if datos.columnas_numero:
        asignaturas = []
        for nombre, s in datos.estadisticas_por_columna().items():
            if s:
                asignaturas.append((nombre, s["promedio"]))
        if asignaturas:
            mejor_asig = max(asignaturas, key=lambda p: p[1])
            peor_asig = min(asignaturas, key=lambda p: p[1])
            secciones.append(seccion_texto(
                "Asignaturas destacadas",
                [
                    "Mejor rendimiento: {} ({})".format(mejor_asig[0], formato(mejor_asig[1])),
                    "Menor rendimiento: {} ({})".format(peor_asig[0], formato(peor_asig[1])),
                ],
            ))

    return secciones


def estado_por_estudiante(datos, umbral):
    resultado = []
    for reg in datos.registros():
        promedio = reg["promedio"]
        if promedio is None:
            estado = "Sin datos"
        elif promedio >= umbral:
            estado = "Aprobado"
        else:
            estado = "Reprobado"
        resultado.append({
            "id": reg["id"],
            "grupo": reg["grupo"],
            "promedio": promedio,
            "estado": estado,
            "notas": reg["notas"],
        })
    return resultado


def reporte_boletin(datos, umbral):
    """Boletín: una fila por estudiante con todas sus asignaturas."""
    asignaturas = datos.columnas_numero
    encabezados = [datos.columna_id] + asignaturas + ["Promedio", "Estado"]
    filas = []
    for e in estado_por_estudiante(datos, umbral):
        fila = [e["id"]]
        for asig in asignaturas:
            fila.append(formato(e["notas"][asig]) if asig in e["notas"] else "-")
        fila.append(formato(e["promedio"]) if e["promedio"] is not None else "-")
        fila.append(e["estado"])
        filas.append(fila)

    derecha = set(range(1, len(asignaturas) + 2))
    secciones = [seccion_tabla(
        "Boletín por estudiante",
        encabezados, filas, derecha=derecha,
    )]

    if len(asignaturas) >= 2:
        detalles = []
        for e in estado_por_estudiante(datos, umbral):
            if not e["notas"]:
                continue
            mejor = max(e["notas"].items(), key=lambda p: p[1])
            peor = min(e["notas"].items(), key=lambda p: p[1])
            detalles.append("{}: mejor en {} ({}), más débil en {} ({})".format(
                e["id"], mejor[0], formato(mejor[1]), peor[0], formato(peor[1])))
        secciones.append(seccion_texto("Fortalezas y debilidades", detalles))

    return def_reporte("Boletín por estudiante", secciones)


def reporte_ranking(datos, umbral, top):
    estados = [e for e in estado_por_estudiante(datos, umbral) if e["promedio"] is not None]
    ordenados = sorted(estados, key=lambda e: e["promedio"], reverse=True)

    filas = [[i, e["id"], e["grupo"], formato(e["promedio"]), e["estado"]]
             for i, e in enumerate(ordenados, 1)]

    secciones = [seccion_tabla(
        "Ranking de estudiantes (por promedio)",
        ["#", datos.columna_id, "Grupo", "Promedio", "Estado"],
        filas, derecha={0, 3},
    )]

    if ordenados:
        lineas = ["Top {} mejores:".format(min(top, len(ordenados)))]
        for i, e in enumerate(ordenados[:top], 1):
            lineas.append("   {}. {} ({}) -> {}".format(i, e["id"], e["grupo"] or "-",
                                                          formato(e["promedio"])))
        lineas.append("Últimos {}:".format(min(top, len(ordenados))))
        for i, e in enumerate(list(reversed(ordenados))[:top], 1):
            lineas.append("   {}. {} ({}) -> {}".format(i, e["id"], e["grupo"] or "-",
                                                          formato(e["promedio"])))
        secciones.append(seccion_texto("Destacados", lineas))

    return def_reporte("Ranking de estudiantes", secciones)


def reporte_distribucion(datos, umbral):
    todos = []
    for nombre in datos.columnas_numero:
        todos.extend(datos.valores_columna(nombre))

    rangos = [(0, 5), (5, 6), (6, 7), (7, 8), (8, 9), (9, 10.0001)]
    filas_rango = []
    total = len(todos)
    for bajo, alto in rangos:
        cuenta = sum(1 for v in todos if bajo <= v < alto)
        porcentaje = (cuenta / total * 100) if total else 0
        filas_rango.append([
            "{:.0f} - {:.2f}".format(bajo, min(alto, 10)),
            cuenta, "{:.1f}%".format(porcentaje),
        ])

    estados = estado_por_estudiante(datos, umbral)
    aprobados = sum(1 for e in estados if e["estado"] == "Aprobado")
    reprobados = sum(1 for e in estados if e["estado"] == "Reprobado")
    sin_datos = len(estados) - aprobados - reprobados
    total_est = len(estados)

    secciones = [
        seccion_texto(
            "Distribución de calificaciones",
            ["Total de calificaciones: {}".format(total)],
        ),
        seccion_tabla(
            "Frecuencia por rango",
            ["Rango", "Frecuencia", "Porcentaje"],
            filas_rango, derecha={1, 2},
        ),
        seccion_tabla(
            "Resultado académico (por promedio, umbral {})".format(formato(umbral, 1)),
            ["Estado", "Estudiantes", "Porcentaje"],
            [
                ["Aprobado", aprobados, "{:.1f}%".format(aprobados / total_est * 100 if total_est else 0)],
                ["Reprobado", reprobados, "{:.1f}%".format(reprobados / total_est * 100 if total_est else 0)],
                ["Sin datos", sin_datos, "{:.1f}%".format(sin_datos / total_est * 100 if total_est else 0)],
            ],
            derecha={1, 2},
        ),
    ]
    return def_reporte("Distribución y aprobados", secciones)


def construir_reporte(tipo, datos, umbral, top):
    if tipo == "Resumen general":
        return reporte_resumen(datos, umbral)
    if tipo == "Boletín por estudiante":
        return reporte_boletin(datos, umbral)
    if tipo == "Ranking de estudiantes":
        return reporte_ranking(datos, umbral, top)
    if tipo == "Distribución y aprobados":
        return reporte_distribucion(datos, umbral)
    if tipo == "Reporte completo":
        titulo = "Reporte completo de calificaciones"
        secciones = []
        for parcial in (
            reporte_resumen(datos, umbral),
            reporte_boletin(datos, umbral),
            reporte_ranking(datos, umbral, top),
            reporte_distribucion(datos, umbral),
        ):
            for seccion in parcial["secciones"]:
                secciones.append(seccion)
        return def_reporte(titulo, secciones)
    raise ValueError("Tipo de reporte desconocido: {}".format(tipo))


TIPOS_REPORTE = [
    "Resumen general",
    "Boletín por estudiante",
    "Ranking de estudiantes",
    "Distribución y aprobados",
    "Reporte completo",
]


# ----------------------------------------------------------------------------
# Renderizadores
# ----------------------------------------------------------------------------
def renderizar_texto(reporte, datos):
    lineas = []
    sep = "=" * 64
    lineas.append(sep)
    lineas.append(reporte["titulo"].upper())
    lineas.append("Generado: {}".format(datetime.now().strftime("%d/%m/%Y %H:%M")))
    lineas.append("Fuente: {} registro(s)".format(len(datos.filas)))
    lineas.append(sep)

    for seccion in reporte["secciones"]:
        lineas.append("")
        lineas.append("--- {} ---".format(seccion["titulo"]))
        if seccion["tipo"] == "texto":
            lineas.extend(seccion["lineas"])
        else:
            filas = [seccion["encabezados"]] + seccion["filas"]
            columnas = len(seccion["encabezados"])
            anchos = []
            for c in range(columnas):
                ancho = max(len(str(fila[c])) if c < len(fila) else 0 for fila in filas)
                anchos.append(max(ancho, 4))

            for idx, fila in enumerate(filas):
                celdas = []
                for c in range(columnas):
                    valor = str(fila[c]) if c < len(fila) else ""
                    if c in seccion["derecha"]:
                        celdas.append(valor.rjust(anchos[c]))
                    else:
                        celdas.append(valor.ljust(anchos[c]))
                lineas.append("  ".join(celdas))
                if idx == 0:
                    lineas.append("  ".join("-" * a for a in anchos))

    lineas.append("")
    lineas.append(sep)
    lineas.append("Fin del reporte")
    return "\n".join(lineas)


def _html_escapar(texto):
    return (str(texto)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;"))


def renderizar_html(reporte, datos):
    partes = []
    partes.append("<!DOCTYPE html>")
    partes.append('<html lang="es"><head><meta charset="UTF-8">')
    partes.append("<title>{}</title>".format(_html_escapar(reporte["titulo"])))
    partes.append(
        "<style>"
        "body{font-family:Segoe UI,Arial,sans-serif;background:#f4f6f8;color:#333;margin:0;padding:24px;}"
        ".contenedor{max-width:900px;margin:0 auto;background:#fff;border-radius:12px;"
        "box-shadow:0 3px 12px rgba(0,0,0,.1);padding:28px;}"
        "h1{color:#1e3a5f;font-size:1.6rem;margin:0 0 4px;}"
        ".meta{color:#777;font-size:.85rem;margin-bottom:20px;}"
        "h2{color:#2f6db5;font-size:1.1rem;margin:26px 0 10px;border-bottom:1px solid #eef1f5;padding-bottom:6px;}"
        "table{width:100%;border-collapse:collapse;font-size:.9rem;margin-bottom:8px;}"
        "th{background:#1e3a5f;color:#fff;text-align:left;padding:8px 10px;}"
        "td{padding:7px 10px;border-bottom:1px solid #eef1f5;}"
        "tr:nth-child(even) td{background:#fbfcfe;}"
        "td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;}"
        "ul{margin:0 0 8px 18px;}li{font-size:.92rem;margin:3px 0;}"
        ".pie{margin-top:26px;color:#999;font-size:.8rem;text-align:center;}"
        "</style></head><body><div class='contenedor'>"
    )
    partes.append("<h1>{}</h1>".format(_html_escapar(reporte["titulo"])))
    partes.append('<div class="meta">Generado: {} &middot; {} registro(s)</div>'.format(
        datetime.now().strftime("%d/%m/%Y %H:%M"), len(datos.filas)))

    for seccion in reporte["secciones"]:
        partes.append("<h2>{}</h2>".format(_html_escapar(seccion["titulo"])))
        if seccion["tipo"] == "texto":
            partes.append("<ul>")
            for linea in seccion["lineas"]:
                partes.append("<li>{}</li>".format(_html_escapar(linea)))
            partes.append("</ul>")
        else:
            partes.append("<table><thead><tr>")
            for i, enc in enumerate(seccion["encabezados"]):
                clase = ' class="num"' if i in seccion["derecha"] else ""
                partes.append("<th{}>{}</th>".format(clase, _html_escapar(enc)))
            partes.append("</tr></thead><tbody>")
            for fila in seccion["filas"]:
                partes.append("<tr>")
                for i, celda in enumerate(fila):
                    clase = ' class="num"' if i in seccion["derecha"] else ""
                    partes.append("<td{}>{}</td>".format(clase, _html_escapar(celda)))
                partes.append("</tr>")
            partes.append("</tbody></table>")

    partes.append('<div class="pie">Reporte generado automáticamente</div>')
    partes.append("</div></body></html>")
    return "\n".join(partes)


def renderizar_csv(reporte, datos):
    import io
    salida = io.StringIO()
    escritor = csv.writer(salida)
    escritor.writerow([reporte["titulo"]])
    escritor.writerow(["Generado", datetime.now().strftime("%d/%m/%Y %H:%M")])
    escritor.writerow([])

    for seccion in reporte["secciones"]:
        escritor.writerow([seccion["titulo"]])
        if seccion["tipo"] == "texto":
            for linea in seccion["lineas"]:
                escritor.writerow([linea])
        else:
            escritor.writerow(seccion["encabezados"])
            for fila in seccion["filas"]:
                escritor.writerow(fila)
        escritor.writerow([])

    return salida.getvalue()


def renderizar(reporte, datos, formato_salida):
    formato_salida = formato_salida.lower()
    if formato_salida == "html":
        return renderizar_html(reporte, datos)
    if formato_salida == "csv":
        return renderizar_csv(reporte, datos)
    return renderizar_texto(reporte, datos)


# ----------------------------------------------------------------------------
# Interfaz gráfica
# ----------------------------------------------------------------------------
class GeneradorApp:
    def __init__(self, raiz):
        self.raiz = raiz
        self.datos = None
        self.reporte_actual = None
        self.ultimo_texto = ""

        raiz.title("Generador Automático de Reportes")
        raiz.geometry("820x640")
        raiz.minsize(680, 520)

        self._construir_interfaz()

    def _construir_interfaz(self):
        barra = tk.Frame(self.raiz, padx=12, pady=10)
        barra.pack(fill="x")

        tk.Button(barra, text="Importar CSV", command=self.importar_csv, padx=10).pack(side="left")
        tk.Button(barra, text="Cargar ejemplo (notas)", command=self.cargar_ejemplo, padx=10).pack(
            side="left", padx=8)

        self.etiqueta_origen = tk.Label(barra, text="(sin datos)", fg="#666", anchor="w")
        self.etiqueta_origen.pack(side="left", fill="x", expand=True)

        opciones = tk.LabelFrame(self.raiz, text="Opciones del reporte", padx=12, pady=10)
        opciones.pack(fill="x", padx=12)

        tk.Label(opciones, text="Tipo de reporte:").grid(row=0, column=0, sticky="w", padx=(0, 6))
        self.combo_tipo = ttk.Combobox(
            opciones, values=TIPOS_REPORTE, state="readonly", width=26)
        self.combo_tipo.current(0)
        self.combo_tipo.grid(row=0, column=1, sticky="w")

        tk.Label(opciones, text="Umbral de aprobación:").grid(row=0, column=2, sticky="w", padx=(16, 6))
        self.var_umbral = tk.StringVar(value=str(UMBRAL_POR_DEFECTO))
        tk.Spinbox(opciones, from_=0, to=10, increment=0.5, width=6,
                   textvariable=self.var_umbral).grid(row=0, column=3, sticky="w")

        tk.Label(opciones, text="Top N:").grid(row=0, column=4, sticky="w", padx=(16, 6))
        self.var_top = tk.StringVar(value=str(TOP_POR_DEFECTO))
        tk.Spinbox(opciones, from_=1, to=50, width=6,
                   textvariable=self.var_top).grid(row=0, column=5, sticky="w")

        acciones = tk.Frame(self.raiz, padx=12, pady=10)
        acciones.pack(fill="x")

        tk.Button(acciones, text="Generar reporte", command=self.generar,
                  padx=12, bg="#2f6db5", fg="white").pack(side="left")
        tk.Button(acciones, text="Guardar reporte...", command=self.guardar,
                  padx=12, state="disabled").pack(side="left", padx=8)
        self.boton_guardar = acciones.winfo_children()[-1]

        self.estado = tk.Label(self.raiz, text="Listo", anchor="w", padx=12, fg="#2e8b57")
        self.estado.pack(fill="x")

        self.salida = scrolledtext.ScrolledText(self.raiz, wrap="none", font=("Consolas", 10))
        self.salida.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        self.salida.insert(
            "1.0",
            "1) Importa un CSV o carga el ejemplo de notas.\n"
            "2) Elige el tipo de reporte y pulsa Generar reporte.\n"
            "3) Guarda el resultado como TXT, HTML o CSV.\n",
        )

    # -- helpers de estado ---------------------------------------------------
    def set_estado(self, texto, color="#333"):
        self.estado.config(text=texto, fg=color)
        self.raiz.update_idletasks()

    def _leer_umbral(self):
        try:
            return float(self.var_umbral.get().replace(",", "."))
        except ValueError:
            return UMBRAL_POR_DEFECTO

    def _leer_top(self):
        try:
            return max(1, int(self.var_top.get()))
        except ValueError:
            return TOP_POR_DEFECTO

    # -- carga de datos ------------------------------------------------------
    def _cargar_datos(self, encabezados, filas, origen):
        if not encabezados or not filas:
            messagebox.showerror("Error", "Los datos están vacíos.")
            return False
        self.datos = ConjuntoDatos(encabezados, filas)
        self.etiqueta_origen.config(text="{} · {} registro(s)".format(origen, len(filas)))
        self.reporte_actual = None
        self.boton_guardar.config(state="disabled")
        return True

    def cargar_ejemplo(self):
        if self._cargar_datos(EJEMPLO["encabezados"], EJEMPLO["filas"], "Ejemplo (notas)"):
            self.generar()

    def importar_csv(self):
        ruta = filedialog.askopenfilename(
            title="Selecciona un archivo CSV",
            filetypes=[("Archivos CSV", "*.csv"), ("Todos", "*.*")],
        )
        if not ruta:
            return
        try:
            with open(ruta, "r", encoding="utf-8-sig", newline="") as f:
                contenido = f.read()
        except OSError as e:
            messagebox.showerror("Error", "No se pudo leer el archivo.\n{}".format(e))
            return

        encabezados, filas = parsear_csv(contenido)
        if self._cargar_datos(encabezados, filas, os.path.basename(ruta)):
            self.generar()

    # -- generación y guardado ----------------------------------------------
    def generar(self):
        if not self.datos:
            messagebox.showinfo("Sin datos", "Primero importa un CSV o carga el ejemplo.")
            return
        tipo = self.combo_tipo.get()
        try:
            reporte = construir_reporte(tipo, self.datos, self._leer_umbral(), self._leer_top())
        except Exception as e:  # noqa: BLE001
            messagebox.showerror("Error", "No se pudo generar el reporte.\n{}".format(e))
            return

        self.reporte_actual = reporte
        self.ultimo_texto = renderizar_texto(reporte, self.datos)
        self.salida.delete("1.0", "end")
        self.salida.insert("1.0", self.ultimo_texto)
        self.boton_guardar.config(state="normal")
        self.set_estado("Reporte '{}' generado.".format(tipo), "#2e8b57")

    def guardar(self):
        if not self.reporte_actual or not self.datos:
            return
        nombre = self.combo_tipo.get().lower().replace(" ", "_").replace("í", "i")
        ruta = filedialog.asksaveasfilename(
            title="Guardar reporte",
            defaultextension=".txt",
            initialfile="reporte_{}.txt".format(nombre),
            filetypes=[("Texto", "*.txt"), ("Página HTML", "*.html"),
                       ("CSV", "*.csv"), ("Todos", "*.*")],
        )
        if not ruta:
            return

        ext = os.path.splitext(ruta)[1].lower()
        formato_salida = {".html": "html", ".htm": "html", ".csv": "csv"}.get(ext, "txt")
        contenido = renderizar(self.reporte_actual, self.datos, formato_salida)
        try:
            with open(ruta, "w", encoding="utf-8", newline="") as f:
                f.write(contenido)
        except OSError as e:
            messagebox.showerror("Error", "No se pudo guardar el archivo.\n{}".format(e))
            return
        self.set_estado("Guardado: {} ({})".format(ruta, formato_salida.upper()), "#2e8b57")


def main():
    raiz = tk.Tk()
    GeneradorApp(raiz)
    raiz.mainloop()


if __name__ == "__main__":
    main()