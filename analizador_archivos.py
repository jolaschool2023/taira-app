# -*- coding: utf-8 -*-
"""
Analizador de archivos
-----------------------
Analiza una carpeta seleccionada: cantidad de archivos, extensiones,
tamaño total, archivos más grandes, y posibles duplicados de nombre.
También permite organizar los archivos en subcarpetas según su tipo.

Uso:  python analizador_archivos.py
Requiere: solo biblioteca estándar (tkinter, os, collections, threading).
"""

import os
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext

# Mapeo de extensiones -> categoría (carpeta de destino)
CATEGORIAS = {
    "Imagenes": {
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg",
        ".webp", ".ico", ".tiff", ".heic",
    },
    "Documentos": {
        ".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt",
        ".xls", ".xlsx", ".ppt", ".pptx", ".csv", ".md", ".epub",
    },
    "Videos": {".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"},
    "Audio": {".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"},
    "Comprimidos": {".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz"},
    "Codigo": {
        ".py", ".js", ".ts", ".html", ".css", ".json", ".xml",
        ".java", ".cpp", ".c", ".h", ".php", ".rb", ".go", ".rs",
        ".sql", ".sh", ".bat",
    },
    "Ejecutables": {".exe", ".msi", ".apk", ".dmg", ".bin", ".jar"},
}

MAX_MAYORES = 10


def extension_de(ruta):
    """Devuelve la extensión en minúsculas con punto ('' si no tiene)."""
    _, ext = os.path.splitext(ruta)
    return ext.lower()


def categoria_de(ext):
    """Devuelve el nombre de la carpeta destino según la extensión."""
    for nombre, extensiones in CATEGORIAS.items():
        if ext in extensiones:
            return nombre
    return "Sin extension" if not ext else "Otros"


def formato_tamano(bytes_):
    """Convierte bytes a una unidad legible (B, KB, MB, GB)."""
    if bytes_ is None:
        return "?"
    tamano = float(bytes_)
    for unidad in ("B", "KB", "MB", "GB", "TB"):
        if tamano < 1024 or unidad == "TB":
            if unidad == "B":
                return "{} B".format(int(tamano))
            return "{:.1f} {}".format(tamano, unidad)
        tamano /= 1024.0
    return "{} B".format(int(bytes_))


def recoger_archivos(carpeta, auto_ignorar=None):
    """
    Recorre la carpeta de forma recursiva y devuelve una lista de rutas
    de todos los archivos encontrados (incluyendo subcarpetas).
    """
    archivos = []
    if not carpeta:
        return archivos
    for directorio, _, nombres in os.walk(carpeta):
        for nombre in nombres:
            ruta = os.path.join(directorio, nombre)
            if auto_ignorar and ruta == auto_ignorar:
                continue
            try:
                if os.path.isfile(ruta):
                    archivos.append(ruta)
            except OSError:
                continue
    return archivos


def analizar_archivos(archivos):
    """
    Devuelve un diccionario con las estadísticas de la lista de archivos:
    total, tamaño total, frecuencia por extensión, mayores archivos y
    posibles duplicados de nombre.
    """
    resultado = {
        "total": len(archivos),
        "tamano_total": 0,
        "por_extension": {},      # ext -> {"cantidad": n, "tamano": t}
        "mayores": [],            # top 10 (ruta, tamaño)
        "duplicados": [],         # lista de dicts con los duplicados
    }

    tamano_por_archivo = []
    nombre_a_rutas = {}

    for ruta in archivos:
        try:
            tamano = os.path.getsize(ruta)
        except OSError:
            tamano = None

        if tamano is not None:
            resultado["tamano_total"] += tamano
            tamano_por_archivo.append((ruta, tamano))

        ext = extension_de(ruta)
        info = resultado["por_extension"].setdefault(
            ext, {"cantidad": 0, "tamano": 0}
        )
        info["cantidad"] += 1
        if tamano is not None:
            info["tamano"] += tamano

        base = os.path.basename(ruta).lower()
        nombre_a_rutas.setdefault(base, []).append((ruta, tamano))

    tamano_por_archivo.sort(key=lambda par: par[1], reverse=True)
    resultado["mayores"] = tamano_por_archivo[:MAX_MAYORES]

    for nombre_base, rutas in nombre_a_rutas.items():
        if len(rutas) < 2:
            continue
        tamanos = set(t for _, t in rutas)
        probable = len(tamanos) == 1 and None not in tamanos
        resultado["duplicados"].append({
            "nombre": nombre_base,
            "probable": probable,
            "archivos": [(r, t) for r, t in rutas],
        })

    resultado["duplicados"].sort(
        key=lambda d: len(d["archivos"]), reverse=True
    )
    return resultado


def plan_de_organizacion(archivos):
    """Agrupa los archivos según la categoría de su extensión (sin moverlos)."""
    plan = {}
    for ruta in archivos:
        cat = categoria_de(extension_de(ruta))
        plan.setdefault(cat, []).append(ruta)
    return plan


def aplicar_organizacion(carpeta, plan):
    """
    Crea las subcarpetas de destino y mueve los archivos.
    Devuelve (movidos, errores, ya_organizados).
    """
    movidos = []
    errores = []
    ya_organizados = []

    for categoria, rutas in plan.items():
        destino = os.path.join(carpeta, categoria)
        try:
            os.makedirs(destino, exist_ok=True)
        except OSError as e:
            errores.append("No se pudo crear '{}': {}".format(categoria, e))
            continue

        for ruta in rutas:
            if os.path.dirname(ruta) == destino:
                ya_organizados.append(ruta)
                continue
            nombre = os.path.basename(ruta)
            objetivo = os.path.join(destino, nombresinconflicto(destino, nombre))
            try:
                os.rename(ruta, objetivo)
                movidos.append((ruta, objetivo))
            except OSError as e:
                errores.append("No se pudo mover '{}': {}".format(nombre, e))

    return movidos, errores, ya_organizados


def nombresinconflicto(destino, nombre):
    """Agrega un sufijo numérico si el nombre ya existe en `destino`."""
    base, ext = os.path.splitext(nombre)
    candidato = nombre
    contador = 1
    while os.path.exists(os.path.join(destino, candidato)):
        candidato = "{}_({}){}".format(base, contador, ext)
        contador += 1
    return candidato


def generar_reporte(carpeta, stats, archivos):
    """Construye un texto legible con todas las estadísticas del análisis."""
    lineas = []
    agregar = lineas.append

    agregar("=" * 56)
    agregar("REPORTE DE ANALISIS DE CARPETA")
    agregar("Carpeta: {}".format(carpeta))
    agregar("=" * 56)
    agregar("")
    agregar("TOTAL DE ARCHIVOS: {}".format(stats["total"]))
    agregar("TAMANO TOTAL:       {}".format(formato_tamano(stats["tamano_total"])))
    agregar("TAMANO PROMEDIO:    {}".format(
        formato_tamano(
            stats["tamano_total"] // stats["total"]
            if stats["total"] else 0
        )
    ))
    agregar("")

    agregar("--- EXTENSIONES ({} distintas) ---".format(len(stats["por_extension"])))
    orden = sorted(stats["por_extension"].items(), key=lambda p: -p[1]["cantidad"])
    for ext, info in orden:
        nombre_ext = "sin extensión" if not ext else ext
        agregar("  {:>12}  {:>5} archivo(s)  {}".format(
            nombre_ext, info["cantidad"], formato_tamano(info["tamano"])
        ))
    agregar("")

    orden_mayores = [(r, t) for r, t in stats["mayores"] if t is not None]
    if orden_mayores:
        agregar("--- ARCHIVOS MAS GRANDES ---")
        for i, (ruta, tamano) in enumerate(orden_mayores, 1):
            agregar("  {}. {:>9}  {}".format(i, formato_tamano(tamano), ruta))
        agregar("")

    if stats["duplicados"]:
        agregar("--- POSIBLES DUPLICADOS DE NOMBRE ---")
        for d in stats["duplicados"]:
            tipo = "PROBABLE duplicado (mismo nombre y tamaño)"
            if not d["probable"]:
                tipo = "posible duplicado (mismo nombre, diferente tamaño)"
            agregar("  '{}' -> {}".format(d["nombre"], tipo))
            for ruta, tamano in d["archivos"]:
                agregar("       {:>9}  {}".format(formato_tamano(tamano), ruta))
        agregar("")

    if not stats["duplicados"]:
        agregar("--- DUPLICADOS ---")
        agregar("  No se encontraron archivos con el mismo nombre.")
        agregar("")

    agregar("--- SUGERENCIA DE ORGANIZACION ---")
    plan = plan_de_organizacion(archivos)
    for categoria, rutas in sorted(plan.items()):
        tamano = sum(os.path.getsize(r) for r in rutas if os.path.exists(r))
        agregar("  {:<18} {:>4} archivo(s)  {}".format(
            categoria, len(rutas), formato_tamano(tamano)
        ))
    agregar("")
    agregar("Nota: la organización mueve los archivos a subcarpetas")
    agregar("según su extensión (ej. .jpg -> Imagenes).")

    return "\n".join(lineas)


class AnalizadorApp:
    """Aplicación gráfica con tkinter."""

    def __init__(self, raiz):
        self.raiz = raiz
        self.carpeta = None
        self.archivos = []
        self.stats = None
        raiz.title("Analizador de Archivos")
        raiz.geometry("760x580")
        raiz.minsize(620, 460)

        self._construir_interfaz()

    def _construir_interfaz(self):
        barra = tk.Frame(self.raiz, padx=12, pady=10)
        barra.pack(fill="x")

        self.boton_seleccionar = tk.Button(
            barra, text="Seleccionar carpeta",
            command=self.seleccionar_carpeta, padx=10
        )
        self.boton_seleccionar.pack(side="left")

        self.boton_analizar = tk.Button(
            barra, text="Analizar", command=self.analizar, padx=10, state="disabled"
        )
        self.boton_analizar.pack(side="left", padx=8)

        self.boton_report = tk.Button(
            barra, text="Guardar reporte", command=self.guardar_reporte,
            padx=10, state="disabled"
        )
        self.boton_report.pack(side="left", padx=(0, 8))

        self.boton_organizar = tk.Button(
            barra, text="Organizar archivos", command=self.organizar,
            padx=10, bg="#2e8b57", fg="white", state="disabled"
        )
        self.boton_organizar.pack(side="left")

        self.etiqueta_ruta = tk.Label(
            barra, text="(sin carpeta seleccionada)", fg="#666",
            anchor="w", padx=8
        )
        self.etiqueta_ruta.pack(side="left", fill="x", expand=True)

        self.estado = tk.Label(
            self.raiz, text="Listo",
            anchor="w", padx=12, pady=4, fg="#2e8b57"
        )
        self.estado.pack(fill="x")

        self.salida = scrolledtext.ScrolledText(
            self.raiz, wrap="word", font=("Consolas", 10)
        )
        self.salida.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        self.salida.insert("1.0", "1) Selecciona una carpeta.\n"
                                  "2) Pulsa Analizar para ver las estadísticas.\n"
                                  "3) Si quieres, pulsa Organizar archivos para\n"
                                  "   agruparlos en subcarpetas según su tipo.\n")

    def set_mensaje(self, texto, color="#333"):
        self.estado.config(text=texto, fg=color)
        self.raiz.update_idletasks()

    def seleccionar_carpeta(self):
        carpeta = filedialog.askdirectory(title="Selecciona la carpeta a analizar")
        if not carpeta:
            return
        self.carpeta = carpeta
        self.etiqueta_ruta.config(text=carpeta)
        self.boton_analizar.config(state="normal")
        self.boton_report.config(state="disabled")
        self.boton_organizar.config(state="disabled")
        self.salida.delete("1.0", "end")
        self.set_mensaje("Carpeta seleccionada. Pulsa Analizar.")

    def analizar(self):
        if not self.carpeta:
            return
        self.boton_analizar.config(state="disabled")
        self.set_mensaje("Analizando... por favor espera.")

        def trabajo():
            archivos = recoger_archivos(self.carpeta)
            stats = analizar_archivos(archivos)
            self.raiz.after(0, lambda: self._mostrar_analisis(archivos, stats))

        threading.Thread(target=trabajo, daemon=True).start()

    def _mostrar_analisis(self, archivos, stats):
        self.archivos = archivos
        self.stats = stats
        self.boton_analizar.config(state="normal")
        self.boton_report.config(state="normal")
        self.boton_organizar.config(state="normal")
        self.salida.delete("1.0", "end")
        self.salida.insert("1.0", generar_reporte(self.carpeta, stats, archivos))
        self.set_mensaje(
            "Analisis completo: {} archivo(s), {}".format(
                stats["total"], formato_tamano(stats["tamano_total"])
            ),
            "#2e8b57",
        )

    def guardar_reporte(self):
        if not self.stats:
            return
        destino = filedialog.asksaveasfilename(
            defaultextension=".txt",
            initialfile="reporte_analisis.txt",
            filetypes=[("Archivo de texto", "*.txt")],
        )
        if not destino:
            return
        try:
            with open(destino, "w", encoding="utf-8") as f:
                f.write(generar_reporte(self.carpeta, self.stats, self.archivos))
            self.set_mensaje("Reporte guardado en: " + destino, "#2e8b57")
        except OSError as e:
            messagebox.showerror("Error", "No se pudo guardar el reporte.\n{}".format(e))

    def organizar(self):
        if not self.carpeta or not self.archivos:
            return

        plan = plan_de_organizacion(self.archivos)
        resumen = []
        for categoria, rutas in sorted(plan.items()):
            resumen.append("- {}: {} archivo(s)".format(categoria, len(rutas)))
        plan_texto = "\n".join(resumen)

        confirmar = messagebox.askyesno(
            "Organizar archivos",
            "Se moverán los archivos a subcarpetas dentro de:\n{}\n\n"
            "Plan:\n{}\n\n¿Deseas continuar?".format(self.carpeta, plan_texto),
        )
        if not confirmar:
            return

        self.boton_organizar.config(state="disabled")
        self.set_mensaje("Organizando... por favor espera.")

        def trabajo():
            movidos, errores, ya = aplicar_organizacion(self.carpeta, plan)
            self.raiz.after(
                0,
                lambda: self._mostrar_resultado_organizacion(movidos, errores, ya),
            )

        threading.Thread(target=trabajo, daemon=True).start()

    def _mostrar_resultado_organizacion(self, movidos, errores, ya_organizados):
        self.boton_organizar.config(state="normal")
        texto = ["ORGANIZACION COMPLETADA", "=" * 40]
        texto.append("Archivos movidos:    {}".format(len(movidos)))
        texto.append("Ya organizados:      {}".format(len(ya_organizados)))
        texto.append("Errores:             {}".format(len(errores)))
        texto.append("")
        for ruta, destino in movidos:
            texto.append("-> {}".format(os.path.basename(destino)))
            texto.append("   desde: {}".format(ruta))
        if ya_organizados:
            texto.append("")
            texto.append("Archivos que ya estaban en su carpeta:")
            for ruta in ya_organizados[:10]:
                texto.append("   {}".format(ruta))
            if len(ya_organizados) > 10:
                texto.append("   ... y {} más.".format(len(ya_organizados) - 10))
        if errores:
            texto.append("")
            texto.append("Errores:")
            for error in errores:
                texto.append("   {}".format(error))

        self.salida.delete("1.0", "end")
        self.salida.insert("1.0", "\n".join(texto))
        if errores:
            self.set_mensaje(
                "Organización terminada con {} error(es).".format(len(errores)),
                "#c0392b",
            )
        else:
            self.set_mensaje(
                "Organización completa: {} archivo(s) movido(s).".format(len(movidos)),
                "#2e8b57",
            )


def main():
    raiz = tk.Tk()
    AnalizadorApp(raiz)
    raiz.mainloop()


if __name__ == "__main__":
    main()