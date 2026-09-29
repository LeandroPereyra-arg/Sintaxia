#!/usr/bin/env python3
"""
Genera el diagrama entidad-relacion de la etapa 3 en formato draw.io
(docs/der/sintaxia-der-etapa3.drawio) y una vista previa en HTML para
exportarla a PNG.

    python3 docs/der/generar-der-etapa3.py

El archivo .drawio se abre en https://app.diagrams.net o con la extension de
draw.io para VS Code.
"""
from pathlib import Path
from xml.sax.saxutils import escape

RAIZ = Path(__file__).resolve().parent

VERDE = "#2fbf56"
VERDE_SUAVE = "#e6f8ec"
GRIS = "#9aa5b1"
GRIS_SUAVE = "#f2f4f7"

ALTO_TITULO = 30
ALTO_FILA = 22
ANCHO = 270

# (tabla, x, y, publicada, [(campo, tipo, marca)])
#   marca: 'PK', 'FK', 'U' (unico), '' (nada); un '*' al final = obligatorio
TABLAS = [
    ("cursos", 40, 40, True, [
        ("id", "text", "PK"),
        ("nombre", "text *", ""),
        ("descripcion", "text *", ""),
        ("nivel", "text *", ""),
        ("icono", "text *", ""),
        ("color", "text *", ""),
        ("color_texto", "text *", ""),
        ("estado", "text *", ""),
        ("requisito", "text", ""),
        ("horas_estimadas", "smallint", ""),
        ("unidades_previstas", "smallint", ""),
        ("lecciones_previstas", "smallint", ""),
        ("etiquetas", "text[] *", ""),
        ("orden", "smallint *", "U"),
        ("creado_en", "timestamptz *", ""),
        ("actualizado_en", "timestamptz *", ""),
    ]),
    ("unidades", 370, 40, True, [
        ("id", "text", "PK"),
        ("curso_id", "text *", "FK"),
        ("orden", "smallint *", "U"),
        ("titulo", "text *", ""),
        ("descripcion", "text *", ""),
        ("icono", "text *", ""),
        ("color", "text *", ""),
        ("estado", "text *", ""),
        ("temas", "text[] *", ""),
        ("creado_en", "timestamptz *", ""),
        ("actualizado_en", "timestamptz *", ""),
    ]),
    ("lecciones", 700, 40, True, [
        ("id", "text", "PK"),
        ("unidad_id", "text *", "FK"),
        ("orden", "smallint *", "U"),
        ("titulo", "text *", ""),
        ("descripcion", "text *", ""),
        ("icono", "text *", ""),
        ("xp", "smallint *", ""),
        ("explicacion", "text *", ""),
        ("ejemplo_titulo", "text", ""),
        ("ejemplo_codigo", "text", ""),
        ("ejemplo_nota", "text", ""),
        ("estado", "text *", ""),
        ("creado_en", "timestamptz *", ""),
        ("actualizado_en", "timestamptz *", ""),
    ]),
    ("preguntas", 1030, 40, True, [
        ("id", "text", "PK"),
        ("leccion_id", "text *", "FK"),
        ("orden", "smallint *", "U"),
        ("tipo", "text *", ""),
        ("enunciado", "text *", ""),
        ("codigo", "text", ""),
        ("explicacion  (solucion)", "text *", ""),
        ("estado", "text *", ""),
        ("creado_en", "timestamptz *", ""),
        ("actualizado_en", "timestamptz *", ""),
    ]),
    ("opciones", 1030, 340, True, [
        ("id", "text", "PK"),
        ("pregunta_id", "text *", "FK"),
        ("orden", "smallint *", "U"),
        ("texto", "text *", ""),
        ("es_correcta  (solucion)", "boolean *", ""),
        ("marca_correcta (generada)", "boolean", "U"),
        ("creado_en", "timestamptz *", ""),
        ("actualizado_en", "timestamptz *", ""),
    ]),
    # Progreso: se modela en la etapa siguiente.
    ("usuarios", 40, 460, False, [
        ("id", "uuid", "PK"),
        ("email", "text *", "U"),
        ("nombre", "text *", ""),
    ]),
    ("progreso_lecciones", 370, 460, False, [
        ("id", "uuid", "PK"),
        ("usuario_id", "uuid *", "FK"),
        ("leccion_id", "text *", "FK"),
        ("aciertos", "smallint *", ""),
        ("total", "smallint *", ""),
        ("aprobada", "boolean *", ""),
    ]),
    ("respuestas", 700, 460, False, [
        ("id", "uuid", "PK"),
        ("usuario_id", "uuid *", "FK"),
        ("pregunta_id", "text *", "FK"),
        ("opcion_id", "text *", "FK"),
        ("fue_correcta", "boolean *", ""),
    ]),
]

# (origen, destino, etiqueta, publicada)
RELACIONES = [
    ("cursos", "unidades", "1 : N", True),
    ("unidades", "lecciones", "1 : N", True),
    ("lecciones", "preguntas", "1 : N", True),
    ("preguntas", "opciones", "1 : N", True),
    ("usuarios", "progreso_lecciones", "1 : N", False),
    ("lecciones", "progreso_lecciones", "1 : N", False),
    ("usuarios", "respuestas", "1 : N", False),
    ("preguntas", "respuestas", "1 : N", False),
]


def alto(tabla):
    return ALTO_TITULO + ALTO_FILA * len(tabla[4])


def generar_drawio():
    celdas = []
    ids = {}
    contador = [2]

    def nuevo_id():
        contador[0] += 1
        return f"n{contador[0]}"

    for nombre, x, y, publicada, campos in TABLAS:
        idt = nuevo_id()
        ids[nombre] = idt
        relleno = VERDE_SUAVE if publicada else GRIS_SUAVE
        borde = VERDE if publicada else GRIS
        guion = "" if publicada else "dashed=1;"
        celdas.append(
            f'<mxCell id="{idt}" value="{escape(nombre)}" '
            f'style="shape=table;startSize={ALTO_TITULO};container=1;collapsible=0;childLayout=tableLayout;'
            f'fillColor={relleno};strokeColor={borde};{guion}fontStyle=1;fontSize=14;align=center;" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{ANCHO}" height="{ALTO_TITULO + ALTO_FILA * len(campos)}" as="geometry"/></mxCell>'
        )
        for i, (campo, tipo, marca) in enumerate(campos):
            idf = nuevo_id()
            etiqueta = f"{marca + '  ' if marca else ''}{campo} : {tipo}"
            negrita = 1 if marca in ("PK", "FK") else 0
            celdas.append(
                f'<mxCell id="{idf}" value="{escape(etiqueta)}" '
                f'style="shape=partialRectangle;top=0;left=0;bottom=0;right=0;align=left;spacingLeft=8;'
                f'fillColor=none;strokeColor=none;fontSize=11;fontStyle={negrita};overflow=hidden;" vertex="1" parent="{idt}">'
                f'<mxGeometry y="{ALTO_TITULO + ALTO_FILA * i}" width="{ANCHO}" height="{ALTO_FILA}" as="geometry"/></mxCell>'
            )

    for origen, destino, etiqueta, publicada in RELACIONES:
        ida = nuevo_id()
        color = VERDE if publicada else GRIS
        guion = "" if publicada else "dashed=1;"
        celdas.append(
            f'<mxCell id="{ida}" value="{etiqueta}" '
            f'style="edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;endArrow=ERoneToMany;startArrow=ERone;'
            f'strokeColor={color};{guion}fontSize=11;fontStyle=1;" edge="1" parent="1" '
            f'source="{ids[origen]}" target="{ids[destino]}"><mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    leyenda = (
        'Sintaxia - Modelo de datos del contenido (etapa 3)&#10;&#10;'
        'PK = clave primaria    FK = clave foranea    U = restriccion unica    * = campo obligatorio&#10;'
        'Verde: tablas del CONTENIDO, creadas en esta etapa (supabase/01-esquema.sql).&#10;'
        'Gris punteado: PROGRESO de cada participante, se implementa en la etapa siguiente.&#10;'
        'orden: define la secuencia de unidades, lecciones, preguntas y opciones; no se depende del orden de insercion.&#10;'
        'opciones.marca_correcta + UNIQUE (pregunta_id, marca_correcta) garantiza una sola opcion correcta por pregunta.&#10;'
        'estado: estado de PUBLICACION del contenido; no dice nada sobre el avance de un participante.'
    )
    celdas.append(
        f'<mxCell id="leyenda" value="{leyenda}" '
        f'style="text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontSize=12;strokeColor=#c9d2dd;'
        f'fillColor=#ffffff;spacing=10;" vertex="1" parent="1">'
        f'<mxGeometry x="40" y="660" width="1260" height="150" as="geometry"/></mxCell>'
    )

    return (
        '<mxfile host="app.diagrams.net" type="device">\n'
        '  <diagram name="Sintaxia - contenido (etapa 3)">\n'
        '    <mxGraphModel dx="1400" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" '
        'arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">\n'
        '      <root>\n'
        '        <mxCell id="0"/>\n'
        '        <mxCell id="1" parent="0"/>\n        '
        + "\n        ".join(celdas)
        + '\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n'
    )


# Trazado de las relaciones en la vista previa: cada una es una polilinea
# (lista de puntos) mas la posicion de su etiqueta.
LINEAS = [
    ("cursos - unidades",            [(310, 150), (370, 150)],                                 (340, 138), True),
    ("unidades - lecciones",         [(640, 150), (700, 150)],                                 (670, 138), True),
    ("lecciones - preguntas",        [(970, 150), (1030, 150)],                                (1000, 138), True),
    ("preguntas - opciones",         [(1165, 290), (1165, 340)],                               (1175, 318), True),
    ("usuarios - progreso",          [(310, 500), (370, 500)],                                 (340, 488), False),
    ("lecciones - progreso",         [(760, 378), (760, 430), (505, 430), (505, 460)],         (620, 420), False),
    ("usuarios - respuestas",        [(175, 556), (175, 645), (835, 645), (835, 600)],         (500, 637), False),
    ("preguntas - respuestas",       [(1030, 240), (1000, 240), (1000, 530), (970, 530)],      (1002, 545), False),
]


def generar_html():
    """Vista previa en HTML, para exportar el PNG del diagrama."""
    bloques = []
    for nombre, x, y, publicada, campos in TABLAS:
        filas = "".join(
            f'<tr class="{"clave" if marca in ("PK", "FK") else ""}">'
            f'<td class="marca">{marca}</td><td class="campo">{campo}</td><td class="tipo">{tipo}</td></tr>'
            for campo, tipo, marca in campos
        )
        bloques.append(
            f'<div class="tabla {"pub" if publicada else "futura"}" style="left:{x}px;top:{y}px">'
            f'<h3>{nombre}</h3><table>{filas}</table></div>'
        )

    trazos = []
    for nombre, puntos, (lx, ly), publicada in LINEAS:
        color = VERDE if publicada else GRIS
        guion = "" if publicada else ' stroke-dasharray="6 5"'
        camino = " ".join(f"{x},{y}" for x, y in puntos)
        trazos.append(
            f'<polyline points="{camino}" fill="none" stroke="{color}" stroke-width="2"{guion}/>'
        )
        # Pata de gallo (N) en el extremo de destino.
        fx, fy = puntos[-1]
        px, py = puntos[-2]
        if px == fx:  # llega en vertical
            signo = 1 if fy > py else -1
            trazos.append(
                f'<path d="M{fx - 6},{fy - 9 * signo} L{fx},{fy} L{fx + 6},{fy - 9 * signo}" '
                f'fill="none" stroke="{color}" stroke-width="2"{guion}/>'
            )
        else:
            signo = 1 if fx > px else -1
            trazos.append(
                f'<path d="M{fx - 9 * signo},{fy - 6} L{fx},{fy} L{fx - 9 * signo},{fy + 6}" '
                f'fill="none" stroke="{color}" stroke-width="2"{guion}/>'
            )
        trazos.append(
            f'<text x="{lx}" y="{ly}" font-size="11" font-weight="700" fill="{color}" '
            f'font-family="system-ui,sans-serif">1 : N</text>'
        )

    svg = f'<svg class="relaciones" width="1340" height="870">{"".join(trazos)}</svg>'

    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<style>
  body {{ margin:0; background:#fff; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }}
  .lienzo {{ position:relative; width:1340px; height:880px; }}
  .relaciones {{ position:absolute; left:0; top:0; pointer-events:none; }}
  .tabla {{ position:absolute; width:{ANCHO}px; border:2px solid {VERDE}; border-radius:8px;
            background:{VERDE_SUAVE}; overflow:hidden; }}
  .tabla.futura {{ border-color:{GRIS}; border-style:dashed; background:{GRIS_SUAVE}; }}
  .tabla h3 {{ margin:0; padding:6px 10px; font-size:14px; text-align:center;
               background:rgba(255,255,255,.65); border-bottom:1px solid rgba(0,0,0,.12); }}
  table {{ width:100%; border-collapse:collapse; background:#fff; }}
  td {{ font-size:11px; padding:2px 6px; border-bottom:1px solid #eef1f4; }}
  td.marca {{ width:30px; font-weight:800; color:{VERDE}; }}
  .futura td.marca {{ color:{GRIS}; }}
  tr.clave td {{ font-weight:700; }}
  td.tipo {{ text-align:right; color:#667; font-family:ui-monospace,monospace; }}
  .leyenda {{ position:absolute; left:40px; top:690px; width:1260px; border:1px solid #c9d2dd;
              border-radius:8px; padding:10px 14px; font-size:12px; line-height:1.55; }}
  .leyenda b {{ color:{VERDE}; }}
</style></head><body><div class="lienzo">
{svg}
{''.join(bloques)}
<div class="leyenda">
  <b>Sintaxia · Modelo de datos del contenido (etapa 3)</b><br>
  PK = clave primaria &nbsp;·&nbsp; FK = clave foranea &nbsp;·&nbsp; U = restriccion unica &nbsp;·&nbsp; * = campo obligatorio<br>
  Verde: tablas del <b>contenido</b>, creadas en esta etapa. Gris punteado: <b>progreso</b> de cada participante, etapa siguiente.<br>
  <code>orden</code> define la secuencia de unidades, lecciones, preguntas y opciones: no se depende del orden de insercion.<br>
  <code>opciones.marca_correcta</code> + <code>UNIQUE (pregunta_id, marca_correcta)</code> garantiza una sola opcion correcta por pregunta.<br>
  <code>estado</code> es el estado de <b>publicacion</b> del contenido; el avance de cada participante se guarda aparte.
</div>
</div></body></html>"""


(RAIZ / "sintaxia-der-etapa3.drawio").write_text(generar_drawio(), encoding="utf8")
(RAIZ / "vista-previa-etapa3.html").write_text(generar_html(), encoding="utf8")
print("Escritos sintaxia-der-etapa3.drawio y vista-previa-etapa3.html")
