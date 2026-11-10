#!/usr/bin/env python3
"""
Genera el diagrama entidad-relacion de la etapa 6 en formato draw.io
(docs/der/sintaxia-der-etapa6.drawio) y una vista previa en HTML para exportarla a PNG.

    python3 docs/der/generar-der-etapa6.py

El archivo .drawio se abre en https://app.diagrams.net o con la extension de draw.io para VS Code.
Muestra la competencia: eventos, desafios, su banco de preguntas propio y las partidas.
El contenido de practica (cursos ... opciones) y el progreso de la etapa 5 no cambian y no se
repiten aca; perfiles se dibuja porque cada partida es de un perfil.
"""
from pathlib import Path
from xml.sax.saxutils import escape

RAIZ = Path(__file__).resolve().parent

VERDE, VERDE_SUAVE = "#2fbf56", "#e6f8ec"
VIOLETA, VIOLETA_SUAVE = "#7434db", "#f1e9fd"
GRIS, GRIS_SUAVE = "#9aa5b1", "#f2f4f7"

ALTO_TITULO, ALTO_FILA, ANCHO = 30, 22, 270

AZUL, AZUL_SUAVE = "#1487bd", "#e4f5fe"

ESTILOS = {
    "contenido": (VERDE, VERDE_SUAVE, False),
    "participantes": (VIOLETA, VIOLETA_SUAVE, False),
    "progreso": (AZUL, AZUL_SUAVE, False),
    "auth": (GRIS, GRIS_SUAVE, True),
}

# (tabla, x, y, grupo, [(campo, tipo, marca)])   marca: PK, FK, U o ''; un '*' al final = obligatorio
TABLAS = [
    ("eventos", 40, 40, "contenido", [
        ("id", "text", "PK"), ("nombre", "text *", ""), ("descripcion", "text *", ""),
        ("lugar", "text", ""), ("estado", "text *", ""), ("abre_en", "timestamptz", ""),
        ("cierra_en", "timestamptz", ""), ("creado_en", "timestamptz *", ""),
    ]),
    ("desafios", 370, 40, "contenido", [
        ("id", "text", "PK"), ("evento_id", "text *", "FK"), ("orden", "smallint *", "U"),
        ("nombre", "text *", ""), ("dificultad", "text *", ""), ("duracion_segundos", "integer *", ""),
        ("puntos_por_acierto", "integer *", ""), ("intentos_permitidos", "smallint *", ""),
        ("gracia_segundos", "smallint *", ""), ("estado", "text *", ""), ("version", "integer *", ""),
        ("congelado_en", "timestamptz", ""),
    ]),
    ("preguntas_desafio", 700, 40, "contenido", [
        ("id", "text", "PK"), ("desafio_id", "text *", "FK"), ("orden", "smallint *", "U"),
        ("enunciado", "text *", ""), ("codigo", "text", ""), ("explicacion  (solucion)", "text *", ""),
        ("estado", "text *", ""),
    ]),
    ("opciones_desafio", 1030, 40, "contenido", [
        ("id", "text", "PK"), ("pregunta_id", "text *", "FK"), ("orden", "smallint *", "U"),
        ("texto", "text *", "U"), ("es_correcta  (solucion)", "boolean *", ""),
        ("marca_correcta (gen.)", "boolean", "U"),
    ]),
    ("perfiles", 40, 430, "participantes", [
        ("id", "uuid", "PK"), ("alias", "text *", ""), ("codigo", "smallint *", "U"),
        ("es_invitado", "boolean *", ""), ("... (ver etapa 4)", "", ""),
    ]),
    ("partidas", 370, 430, "progreso", [
        ("id  (del cliente)", "uuid", "PK"), ("usuario_id", "uuid *", "FK"),
        ("desafio_id, evento_id", "text *", "FK"), ("numero", "smallint *", "U"),
        ("estado", "text *", ""), ("version_desafio", "integer *", ""),
        ("puntos_por_acierto", "integer *", ""), ("duracion_segundos", "integer *", ""),
        ("gracia_segundos", "smallint *", ""), ("total_preguntas", "smallint *", ""),
        ("aciertos", "smallint *", ""), ("errores", "smallint *", ""), ("puntaje", "integer *", ""),
        ("iniciada_en", "timestamptz *", ""), ("vence_en", "timestamptz *", ""),
        ("finalizada_en", "timestamptz", ""), ("duracion_ms", "integer", ""),
    ]),
    ("partida_preguntas", 700, 430, "progreso", [
        ("partida_id", "uuid *", "PK FK"), ("pregunta_id", "text *", "PK FK"), ("orden", "smallint *", "U"),
    ]),
    ("partida_respuestas", 1030, 430, "progreso", [
        ("partida_id", "uuid *", "PK FK"), ("pregunta_id", "text *", "PK FK"),
        ("opcion_id", "text *", "FK"), ("es_correcta", "boolean *", ""), ("puntos", "integer *", ""),
        ("respondida_en", "timestamptz *", ""),
    ]),
]

# (origen, destino, etiqueta, grupo)
RELACIONES = [
    ("eventos", "desafios", "1 : N", "contenido"),
    ("desafios", "preguntas_desafio", "1 : N", "contenido"),
    ("preguntas_desafio", "opciones_desafio", "1 : N", "contenido"),
    ("perfiles", "partidas", "1 : N", "progreso"),
    ("desafios", "partidas", "1 : N", "progreso"),
    ("partidas", "partida_preguntas", "1 : N", "progreso"),
    ("preguntas_desafio", "partida_preguntas", "1 : N", "progreso"),
    ("partida_preguntas", "partida_respuestas", "1 : 0..1", "progreso"),
    ("opciones_desafio", "partida_respuestas", "1 : N", "progreso"),
]

# Polilineas de la vista previa: puntos, posicion de la etiqueta, grupo.
LINEAS = [
    ([(310, 120), (370, 120)], (340, 108), "contenido", "1 : N"),
    ([(640, 120), (700, 120)], (670, 108), "contenido", "1 : N"),
    ([(970, 120), (1030, 120)], (1000, 108), "contenido", "1 : N"),
    ([(505, 288), (505, 430)], (515, 360), "progreso", "1 : N"),
    ([(310, 520), (370, 520)], (340, 508), "progreso", "1 : N"),
    ([(640, 500), (700, 500)], (670, 488), "progreso", "1 : N"),
    ([(835, 200), (835, 430)], (845, 320), "progreso", "1 : N"),
    ([(970, 480), (1030, 480)], (978, 468), "progreso", "1 : 0..1"),
    ([(1165, 182), (1165, 430)], (1175, 320), "progreso", "1 : N"),
]


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
        celdas.append(
            f'<mxCell id="{nuevo()}" value="{etiqueta}" style="edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;'
            f'endArrow=ERoneToMany;startArrow=ERone;strokeColor={color};fontSize=11;fontStyle=1;" edge="1" '
            f'parent="1" source="{ids[origen]}" target="{ids[destino]}"><mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    leyenda = (
        "Sintaxia - Modelo de datos (etapa 6: competencia)&#10;&#10;"
        "PK = clave primaria    FK = clave foranea    U = restriccion unica    * = campo obligatorio&#10;"
        "Verde: EVENTOS, DESAFIOS Y SU BANCO (separado del de practica).  Azul: PARTIDAS (las escribe solo el servidor).  Violeta: perfiles (etapa 4).&#10;"
        "Cada partida copia las reglas del desafio (puntos, duracion, gracia, version) y el servidor le fija sus preguntas (partida_preguntas).&#10;"
        "partida_respuestas: clave (partida_id, pregunta_id) = una sola respuesta por partida y pregunta; su FK a partida_preguntas exige que la pregunta sea de esa partida.&#10;"
        "puntaje = aciertos x puntos_por_acierto (restriccion). El tiempo (iniciada_en, vence_en, duracion_ms) lo pone el reloj del servidor.&#10;"
        "Un solo intento en curso por persona y desafio (indice unico parcial). Desde la primera partida el desafio queda congelado (congelado_en).&#10;"
        "RLS: el banco del desafio no se lee desde el cliente; cada persona ve solo sus partidas y respuestas."
    )
    celdas.append(
        f'<mxCell id="leyenda" value="{leyenda}" style="text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;'
        f'fontSize=12;strokeColor=#c9d2dd;fillColor=#ffffff;spacing=10;" vertex="1" parent="1">'
        f'<mxGeometry x="40" y="1000" width="1300" height="185" as="geometry"/></mxCell>'
    )

    return (
        '<mxfile host="app.diagrams.net" type="device">\n  <diagram name="Sintaxia - competencia (etapa 6)">\n'
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
        trazos.append(f'<polyline points="{camino}" fill="none" stroke="{color}" stroke-width="2"/>')
        fx, fy = puntos[-1]
        px, py = puntos[-2]
        if px == fx:
            s = 1 if fy > py else -1
            trazos.append(f'<path d="M{fx-6},{fy-9*s} L{fx},{fy} L{fx+6},{fy-9*s}" fill="none" stroke="{color}" stroke-width="2"/>')
        else:
            s = 1 if fx > px else -1
            trazos.append(f'<path d="M{fx-9*s},{fy-6} L{fx},{fy} L{fx-9*s},{fy+6}" fill="none" stroke="{color}" stroke-width="2"/>')
        trazos.append(f'<text x="{lx}" y="{ly}" font-size="11" font-weight="700" fill="{color}" font-family="system-ui,sans-serif">{texto}</text>')
    svg = f'<svg style="position:absolute;left:0;top:0" width="1360" height="800">{"".join(trazos)}</svg>'

    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  body {{ margin:0; background:#fff; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }}
  .lienzo {{ position:relative; width:1360px; height:1130px; }}
  .tabla {{ position:absolute; width:{ANCHO}px; border-width:2px; border-radius:8px; overflow:hidden; }}
  .tabla h3 {{ margin:0; padding:6px 10px; font-size:14px; text-align:center; background:rgba(255,255,255,.65); border-bottom:1px solid rgba(0,0,0,.12); }}
  table {{ width:100%; border-collapse:collapse; background:#fff; }}
  td {{ font-size:11px; padding:2px 6px; border-bottom:1px solid #eef1f4; }}
  td.marca {{ width:44px; font-weight:800; color:var(--c); }}
  tr.clave td {{ font-weight:700; }}
  td.tipo {{ text-align:right; color:#667; font-family:ui-monospace,monospace; }}
  .leyenda {{ position:absolute; left:40px; top:880px; width:1290px; border:1px solid #c9d2dd; border-radius:8px; padding:10px 14px; font-size:12px; line-height:1.6; box-sizing:border-box; }}
  .leyenda b {{ color:{AZUL}; }}
</style></head><body><div class="lienzo">{svg}{''.join(bloques)}
<div class="leyenda"><b>Sintaxia · Modelo de datos (etapa 6: competencia)</b><br>
PK = clave primaria &nbsp;·&nbsp; FK = clave foranea &nbsp;·&nbsp; U = restriccion unica &nbsp;·&nbsp; * = campo obligatorio<br>
<span style="color:{VERDE};font-weight:700">Verde</span>: eventos, desafios y su banco (separado del de practica) &nbsp;·&nbsp; <span style="color:{AZUL};font-weight:700">Azul</span>: partidas (las escribe solo el servidor) &nbsp;·&nbsp; <span style="color:{VIOLETA};font-weight:700">Violeta</span>: perfiles (etapa 4)<br>
Cada partida <b>copia las reglas</b> del desafio (puntos, duracion, gracia, version) y el servidor le <b>fija sus preguntas</b> (<code>partida_preguntas</code>).<br>
<code>partida_respuestas</code>: clave <code>(partida_id, pregunta_id)</code> = una sola respuesta por partida y pregunta; su FK a <code>partida_preguntas</code> exige que la pregunta sea de esa partida.<br>
<code>puntaje = aciertos x puntos_por_acierto</code> (restriccion). El tiempo (<code>iniciada_en</code>, <code>vence_en</code>, <code>duracion_ms</code>) lo pone el <b>reloj del servidor</b>.<br>
Un solo intento en curso por persona y desafio. Desde la primera partida el desafio queda <b>congelado</b> (<code>congelado_en</code>).<br>
<b>RLS</b>: el banco del desafio no se lee desde el cliente; cada persona ve solo sus partidas y respuestas.
</div></div></body></html>"""


(RAIZ / "sintaxia-der-etapa6.drawio").write_text(generar_drawio(), encoding="utf8")
(RAIZ / "vista-previa-etapa6.html").write_text(generar_html(), encoding="utf8")
print("Escritos sintaxia-der-etapa6.drawio y vista-previa-etapa6.html")
