#!/usr/bin/env python3
"""
Genera el diagrama entidad-relacion de la etapa 7 en formato draw.io
(docs/der/sintaxia-der-etapa7.drawio) y una vista previa en HTML para exportarla a PNG.

    python3 docs/der/generar-der-etapa7.py

Muestra lo que agrega la etapa 7: la tabla publica del ranking (resultados_publicos), el
identificador publico de cada perfil y la tabla de administradores. Eventos, desafios y
partidas se dibujan resumidos (estan completos en el DER de la etapa 6).
"""
from pathlib import Path
from xml.sax.saxutils import escape

RAIZ = Path(__file__).resolve().parent

VERDE, VERDE_SUAVE = "#2fbf56", "#e6f8ec"
VIOLETA, VIOLETA_SUAVE = "#7434db", "#f1e9fd"
AZUL, AZUL_SUAVE = "#1487bd", "#e4f5fe"
NARANJA, NARANJA_SUAVE = "#e07a00", "#fff1df"
ROJO, ROJO_SUAVE = "#d93a3a", "#fdeaea"

ALTO_TITULO, ALTO_FILA, ANCHO = 30, 22, 270

ESTILOS = {
    "contenido": (VERDE, VERDE_SUAVE, False),
    "participantes": (VIOLETA, VIOLETA_SUAVE, False),
    "progreso": (AZUL, AZUL_SUAVE, False),
    "publico": (NARANJA, NARANJA_SUAVE, False),
    "admin": (ROJO, ROJO_SUAVE, False),
}

# (tabla, x, y, grupo, [(campo, tipo, marca)])   marca: PK, FK, U o ''; un '*' al final = obligatorio
TABLAS = [
    ("eventos", 40, 40, "contenido", [
        ("id", "text", "PK"), ("nombre", "text *", ""), ("estado", "text *", ""),
        ("... (ver etapa 6)", "", ""),
    ]),
    ("desafios", 370, 40, "contenido", [
        ("id", "text", "PK"), ("evento_id", "text *", "FK"), ("nombre", "text *", ""),
        ("estado", "text *", ""), ("version", "integer *", ""), ("congelado_en", "timestamptz", ""),
        ("... (ver etapa 6)", "", ""),
    ]),
    ("partidas", 1030, 40, "progreso", [
        ("id", "uuid", "PK"), ("usuario_id", "uuid *", "FK"), ("desafio_id, evento_id", "text *", "FK"),
        ("estado", "text *", ""), ("puntaje", "integer *", ""), ("duracion_ms", "integer", ""),
        ("finalizada_en", "timestamptz", ""), ("... (ver etapa 6)", "", ""),
    ]),
    ("resultados_publicos", 700, 200, "publico", [
        ("desafio_id", "text *", "PK FK"), ("participante", "uuid *", "PK FK"), ("evento_id", "text *", "FK"),
        ("alias", "text *", ""), ("codigo", "smallint *", ""), ("puntaje", "integer *", ""),
        ("duracion_ms", "integer *", ""), ("logrado_en", "timestamptz *", ""), ("actualizado_en", "timestamptz *", ""),
    ]),
    ("perfiles", 370, 380, "participantes", [
        ("id", "uuid", "PK"), ("id_publico  (nuevo)", "uuid *", "U"), ("alias", "text *", ""),
        ("codigo", "smallint *", "U"), ("es_invitado", "boolean *", ""), ("... (ver etapa 4)", "", ""),
    ]),
    ("administradores", 40, 380, "admin", [
        ("usuario_id", "uuid", "PK FK"), ("otorgado_por", "text *", ""), ("otorgado_en", "timestamptz *", ""),
    ]),
]

# (origen, destino, etiqueta, grupo)
RELACIONES = [
    ("eventos", "desafios", "1 : N", "contenido"),
    ("desafios", "partidas", "1 : N", "progreso"),
    ("perfiles", "partidas", "1 : N", "progreso"),
    ("desafios", "resultados_publicos", "1 : N", "publico"),
    ("perfiles", "resultados_publicos", "1 : N", "publico"),
    ("partidas", "resultados_publicos", "disparador: mejor finalizada", "publico"),
    ("perfiles", "administradores", "1 : 0..1", "admin"),
]

# Polilineas de la vista previa: puntos, posicion de la etiqueta, grupo, texto.
LINEAS = [
    ([(310, 100), (370, 100)], (318, 90), "contenido", "1 : N"),
    ([(505, 40), (505, 18), (1165, 18), (1165, 40)], (800, 12), "progreso", "1 : N"),
    ([(640, 210), (670, 210), (670, 236), (700, 236)], (676, 228), "publico", "1 : N"),
    ([(640, 420), (700, 420)], (648, 410), "publico", "1 : N"),
    ([(560, 542), (560, 560), (1210, 560), (1210, 246)], (1100, 552), "progreso", "1 : N"),
    ([(1100, 246), (1100, 320), (970, 320)], (985, 338), "publico", "disparador: mejor finalizada"),
    ([(370, 440), (310, 440)], (318, 430), "admin", "1 : 0..1"),
]

LEYENDA_TEXTO = [
    "Sintaxia - Modelo de datos (etapa 7: ranking publico y administracion)",
    "",
    "PK = clave primaria    FK = clave foranea    U = restriccion unica    * = campo obligatorio",
    "Naranja: resultados_publicos, lo UNICO que se publica (la pantalla sin sesion). Rojo: administradores. Verde, azul y violeta: tablas de las etapas 4 y 6, resumidas.",
    "resultados_publicos: una fila por participante y desafio con su MEJOR partida valida. La escriben solo disparadores del servidor (al finalizar una partida, al cambiar el alias, al crear la cuenta).",
    "participante = perfiles.id_publico: un identificador hecho para el ranking, no el id de la cuenta. Esta en la publicacion supabase_realtime: la pantalla recibe el aviso y vuelve a consultar ranking_evento().",
    "administradores: sin ningun permiso para el cliente; se otorga con otorgar_administrador() desde el servidor. Las funciones admin_* verifican es_admin().",
]

LEYENDA_HTML = (
    f"<b>{LEYENDA_TEXTO[0].replace(' - ', ' · ')}</b><br>"
    + "<br>".join(LEYENDA_TEXTO[2:])
)


def alto(tabla):
    return ALTO_TITULO + ALTO_FILA * len(tabla[4])


def generar_drawio():
    celdas, ids, n = [], {}, [2]

    def nuevo():
        n[0] += 1
        return f"n{n[0]}"

    for nombre, x, y, grupo, campos in TABLAS:
        borde, relleno, punteado = ESTILOS[grupo]
        idt = nuevo()
        ids[nombre] = idt
        guion = "dashed=1;" if punteado else ""
        celdas.append(
            f'<mxCell id="{idt}" value="{escape(nombre)}" style="shape=table;startSize={ALTO_TITULO};container=1;'
            f'collapsible=0;childLayout=tableLayout;fillColor={relleno};strokeColor={borde};{guion}fontStyle=1;'
            f'fontSize=14;align=center;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{ANCHO}" '
            f'height="{alto((nombre, x, y, grupo, campos))}" as="geometry"/></mxCell>'
        )
        for i, (campo, tipo, marca) in enumerate(campos):
            etiqueta = f"{marca + '  ' if marca else ''}{campo}{' : ' + tipo if tipo else ''}"
            negrita = 1 if "PK" in marca or "FK" in marca else 0
            celdas.append(
                f'<mxCell id="{nuevo()}" value="{escape(etiqueta)}" style="shape=partialRectangle;top=0;left=0;'
                f'bottom=0;right=0;align=left;spacingLeft=8;fillColor=none;strokeColor=none;fontSize=11;'
                f'fontStyle={negrita};overflow=hidden;" vertex="1" parent="{idt}"><mxGeometry y="{ALTO_TITULO + ALTO_FILA * i}" '
                f'width="{ANCHO}" height="{ALTO_FILA}" as="geometry"/></mxCell>'
            )

    for origen, destino, etiqueta, grupo in RELACIONES:
        color = ESTILOS[grupo][0]
        guion = "dashed=1;endArrow=block;startArrow=none;" if etiqueta.startswith("disparador") else "endArrow=ERoneToMany;startArrow=ERone;"
        celdas.append(
            f'<mxCell id="{nuevo()}" value="{etiqueta}" style="edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;'
            f'{guion}strokeColor={color};fontSize=11;fontStyle=1;" edge="1" '
            f'parent="1" source="{ids[origen]}" target="{ids[destino]}"><mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    leyenda = "&#10;".join(LEYENDA_TEXTO)
    celdas.append(
        f'<mxCell id="leyenda" value="{leyenda}" style="text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;'
        f'fontSize=12;strokeColor=#c9d2dd;fillColor=#ffffff;spacing=10;" vertex="1" parent="1">'
        f'<mxGeometry x="40" y="600" width="1260" height="170" as="geometry"/></mxCell>'
    )

    return (
        '<mxfile host="app.diagrams.net" type="device">\n  <diagram name="Sintaxia - ranking y administracion (etapa 7)">\n'
        '    <mxGraphModel dx="1400" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" '
        'fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">\n      <root>\n'
        '        <mxCell id="0"/>\n        <mxCell id="1" parent="0"/>\n        '
        + "\n        ".join(celdas)
        + "\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n"
    )


def generar_html():
    bloques = []
    for nombre, x, y, grupo, campos in TABLAS:
        borde, relleno, punteado = ESTILOS[grupo]
        filas = "".join(
            f'<tr class="{"clave" if "PK" in marca or "FK" in marca else ""}"><td class="marca">{marca}</td>'
            f'<td class="campo">{campo}</td><td class="tipo">{tipo}</td></tr>'
            for campo, tipo, marca in campos
        )
        bloques.append(
            f'<div class="tabla" style="left:{x}px;top:{y}px;border-color:{borde};background:{relleno};'
            f'border-style:{"dashed" if punteado else "solid"}"><h3>{nombre}</h3>'
            f'<table style="--c:{borde}">{filas}</table></div>'
        )

    trazos = []
    for puntos, (lx, ly), grupo, texto in LINEAS:
        color = ESTILOS[grupo][0]
        camino = " ".join(f"{x},{y}" for x, y in puntos)
        guion = ' stroke-dasharray="6 4"' if texto.startswith("disparador") else ""
        trazos.append(f'<polyline points="{camino}" fill="none" stroke="{color}" stroke-width="2"{guion}/>')
        fx, fy = puntos[-1]
        px, py = puntos[-2]
        if px == fx:
            s = 1 if fy > py else -1
            trazos.append(f'<path d="M{fx-6},{fy-9*s} L{fx},{fy} L{fx+6},{fy-9*s}" fill="none" stroke="{color}" stroke-width="2"/>')
        else:
            s = 1 if fx > px else -1
            trazos.append(f'<path d="M{fx-9*s},{fy-6} L{fx},{fy} L{fx-9*s},{fy+6}" fill="none" stroke="{color}" stroke-width="2"/>')
        trazos.append(f'<text x="{lx}" y="{ly}" font-size="11" font-weight="700" fill="{color}" font-family="system-ui,sans-serif">{texto}</text>')
    svg = f'<svg style="position:absolute;left:0;top:0" width="1340" height="600">{"".join(trazos)}</svg>'

    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  body {{ margin:0; background:#fff; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }}
  .lienzo {{ position:relative; width:1340px; height:800px; }}
  .tabla {{ position:absolute; width:{ANCHO}px; border-width:2px; border-radius:8px; overflow:hidden; }}
  .tabla h3 {{ margin:0; height:{ALTO_TITULO}px; box-sizing:border-box; line-height:16px; padding:6px 10px; font-size:14px; text-align:center; background:rgba(255,255,255,.65); border-bottom:1px solid rgba(0,0,0,.12); }}
  table {{ width:100%; border-collapse:collapse; background:#fff; }}
  td {{ font-size:11px; height:{ALTO_FILA}px; box-sizing:border-box; padding:0 6px; border-bottom:1px solid #eef1f4; }}
  td.marca {{ width:44px; font-weight:800; color:var(--c); }}
  tr.clave td {{ font-weight:700; }}
  td.tipo {{ text-align:right; color:#667; font-family:ui-monospace,monospace; }}
  .leyenda {{ position:absolute; left:40px; top:600px; width:1260px; border:1px solid #c9d2dd; border-radius:8px; padding:10px 14px; font-size:12px; line-height:1.6; box-sizing:border-box; }}
  .leyenda b {{ color:{AZUL}; }}
</style></head><body><div class="lienzo">{svg}{''.join(bloques)}
<div class="leyenda">{LEYENDA_HTML}</div></div></body></html>"""


(RAIZ / "sintaxia-der-etapa7.drawio").write_text(generar_drawio(), encoding="utf8")
(RAIZ / "vista-previa-etapa7.html").write_text(generar_html(), encoding="utf8")
print("Escritos sintaxia-der-etapa7.drawio y vista-previa-etapa7.html")
