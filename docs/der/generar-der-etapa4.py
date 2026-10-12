#!/usr/bin/env python3
"""
Genera el diagrama entidad-relacion de la etapa 4 en formato draw.io
(docs/der/sintaxia-der-etapa4.drawio) y una vista previa en HTML para exportarla a PNG.

    python3 docs/der/generar-der-etapa4.py

El archivo .drawio se abre en https://app.diagrams.net o con la extension de draw.io para VS Code.
Suma, al contenido de la etapa 3, los participantes y su historial. `auth.users` pertenece a
Supabase Auth: se dibuja solo para mostrar a que apunta el perfil.
"""
from pathlib import Path
from xml.sax.saxutils import escape

RAIZ = Path(__file__).resolve().parent

VERDE, VERDE_SUAVE = "#2fbf56", "#e6f8ec"
VIOLETA, VIOLETA_SUAVE = "#7434db", "#f1e9fd"
GRIS, GRIS_SUAVE = "#9aa5b1", "#f2f4f7"

ALTO_TITULO, ALTO_FILA, ANCHO = 30, 22, 270

ESTILOS = {
    "contenido": (VERDE, VERDE_SUAVE, False),
    "participantes": (VIOLETA, VIOLETA_SUAVE, False),
    "auth": (GRIS, GRIS_SUAVE, True),
}

# (tabla, x, y, grupo, [(campo, tipo, marca)])   marca: PK, FK, U o ''; un '*' al final = obligatorio
TABLAS = [
    ("cursos", 40, 40, "contenido", [
        ("id", "text", "PK"), ("nombre", "text *", ""), ("descripcion", "text *", ""),
        ("nivel", "text *", ""), ("estado", "text *", ""), ("orden", "smallint *", "U"),
        ("... (ver etapa 3)", "", ""),
    ]),
    ("unidades", 370, 40, "contenido", [
        ("id", "text", "PK"), ("curso_id", "text *", "FK"), ("orden", "smallint *", "U"),
        ("titulo", "text *", ""), ("estado", "text *", ""), ("... (ver etapa 3)", "", ""),
    ]),
    ("lecciones", 700, 40, "contenido", [
        ("id", "text", "PK"), ("unidad_id", "text *", "FK"), ("orden", "smallint *", "U"),
        ("titulo", "text *", ""), ("xp", "smallint *", ""), ("explicacion", "text *", ""),
        ("estado", "text *", ""), ("... (ver etapa 3)", "", ""),
    ]),
    ("preguntas", 1030, 40, "contenido", [
        ("id", "text", "PK"), ("leccion_id", "text *", "FK"), ("orden", "smallint *", "U"),
        ("enunciado", "text *", ""), ("explicacion  (solucion)", "text *", ""),
        ("estado", "text *", ""), ("... (ver etapa 3)", "", ""),
    ]),
    ("opciones", 1030, 270, "contenido", [
        ("id", "text", "PK"), ("pregunta_id", "text *", "FK"), ("orden", "smallint *", "U"),
        ("texto", "text *", ""), ("es_correcta  (solucion)", "boolean *", ""),
        ("marca_correcta (generada)", "boolean", "U"),
    ]),
    ("auth.users", 40, 470, "auth", [
        ("id", "uuid", "PK"), ("email", "text", "U"),
        ("encrypted_password  (cifrada)", "text", ""), ("is_anonymous", "boolean *", ""),
        ("raw_user_meta_data", "jsonb", ""), ("email_confirmed_at", "timestamptz", ""),
    ]),
    ("perfiles", 370, 470, "participantes", [
        ("id", "uuid", "PK"), ("alias", "text *", ""), ("alias_normalizado (gen.)", "text", "U"),
        ("codigo", "smallint *", "U"), ("es_invitado", "boolean *", ""), ("avatar", "text *", ""),
        ("meta_diaria", "smallint *", ""), ("creado_en", "timestamptz *", ""),
        ("actualizado_en", "timestamptz *", ""),
    ]),
    ("intentos_leccion", 700, 470, "participantes", [
        ("id", "bigint (identity)", "PK"), ("usuario_id", "uuid *", "FK"),
        ("leccion_id", "text *", "FK"), ("aciertos", "smallint *", ""),
        ("total", "smallint *", ""), ("creado_en", "timestamptz *", ""),
    ]),
]

# (origen, destino, etiqueta, grupo)
RELACIONES = [
    ("cursos", "unidades", "1 : N", "contenido"),
    ("unidades", "lecciones", "1 : N", "contenido"),
    ("lecciones", "preguntas", "1 : N", "contenido"),
    ("preguntas", "opciones", "1 : N", "contenido"),
    ("auth.users", "perfiles", "1 : 1", "participantes"),
    ("perfiles", "intentos_leccion", "1 : N", "participantes"),
    ("lecciones", "intentos_leccion", "1 : N", "participantes"),
]

# Polilineas de la vista previa: puntos, posicion de la etiqueta, grupo.
LINEAS = [
    ([(310, 120), (370, 120)], (340, 108), "contenido", "1 : N"),
    ([(640, 120), (700, 120)], (670, 108), "contenido", "1 : N"),
    ([(970, 120), (1030, 120)], (1000, 108), "contenido", "1 : N"),
    ([(1165, 210), (1165, 270)], (1175, 244), "contenido", "1 : N"),
    ([(310, 560), (370, 560)], (340, 548), "participantes", "1 : 1"),
    ([(640, 560), (700, 560)], (670, 548), "participantes", "1 : N"),
    # En el HTML las filas miden ~18 px, asi que lecciones termina cerca de y=217.
    ([(835, 218), (835, 470)], (845, 350), "participantes", "1 : N"),
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
            negrita = 1 if marca in ("PK", "FK") else 0
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
        "Sintaxia - Modelo de datos (etapa 4: participantes)&#10;&#10;"
        "PK = clave primaria    FK = clave foranea    U = restriccion unica    * = campo obligatorio&#10;"
        "Verde: CONTENIDO (etapa 3).  Violeta: PARTICIPANTES (esta etapa).  Gris punteado: lo administra Supabase Auth.&#10;"
        "perfiles.id es la misma clave que auth.users.id: el perfil NO guarda correo ni contrasena, solo alias, avatar y meta.&#10;"
        "alias_normalizado + codigo es unico: dos personas pueden llamarse igual y se distinguen por el codigo (Ana#0427).&#10;"
        "RLS: cada participante ve y modifica SOLO sus filas de perfiles e intentos_leccion; el publico no ve ninguna.&#10;"
        "es_invitado espeja auth.users.is_anonymous. Al convertir un invitado en cuenta el id no cambia: el historial sigue siendo suyo."
    )
    celdas.append(
        f'<mxCell id="leyenda" value="{leyenda}" style="text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;'
        f'fontSize=12;strokeColor=#c9d2dd;fillColor=#ffffff;spacing=10;" vertex="1" parent="1">'
        f'<mxGeometry x="40" y="740" width="1260" height="165" as="geometry"/></mxCell>'
    )

    return (
        '<mxfile host="app.diagrams.net" type="device">\n  <diagram name="Sintaxia - participantes (etapa 4)">\n'
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
            f'<tr class="{"clave" if marca in ("PK", "FK") else ""}"><td class="marca">{marca}</td>'
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
    svg = f'<svg style="position:absolute;left:0;top:0" width="1340" height="720">{"".join(trazos)}</svg>'

    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  body {{ margin:0; background:#fff; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }}
  .lienzo {{ position:relative; width:1340px; height:930px; }}
  .tabla {{ position:absolute; width:{ANCHO}px; border-width:2px; border-radius:8px; overflow:hidden; }}
  .tabla h3 {{ margin:0; padding:6px 10px; font-size:14px; text-align:center; background:rgba(255,255,255,.65); border-bottom:1px solid rgba(0,0,0,.12); }}
  table {{ width:100%; border-collapse:collapse; background:#fff; }}
  td {{ font-size:11px; padding:2px 6px; border-bottom:1px solid #eef1f4; }}
  td.marca {{ width:30px; font-weight:800; color:var(--c); }}
  tr.clave td {{ font-weight:700; }}
  td.tipo {{ text-align:right; color:#667; font-family:ui-monospace,monospace; }}
  .leyenda {{ position:absolute; left:40px; top:740px; width:1260px; border:1px solid #c9d2dd; border-radius:8px; padding:10px 14px; font-size:12px; line-height:1.6; box-sizing:border-box; }}
  .leyenda b {{ color:{VIOLETA}; }}
</style></head><body><div class="lienzo">{svg}{''.join(bloques)}
<div class="leyenda"><b>Sintaxia · Modelo de datos (etapa 4: participantes)</b><br>
PK = clave primaria &nbsp;·&nbsp; FK = clave foranea &nbsp;·&nbsp; U = restriccion unica &nbsp;·&nbsp; * = campo obligatorio<br>
<span style="color:{VERDE};font-weight:700">Verde</span>: contenido (etapa 3) &nbsp;·&nbsp; <span style="color:{VIOLETA};font-weight:700">Violeta</span>: participantes (esta etapa) &nbsp;·&nbsp; <span style="color:#667;font-weight:700">Gris punteado</span>: lo administra Supabase Auth<br>
<code>perfiles.id</code> es la misma clave que <code>auth.users.id</code>: el perfil <b>no guarda correo ni contrasena</b>, solo alias, avatar y meta.<br>
<code>alias_normalizado + codigo</code> es unico: dos personas pueden llamarse igual y se distinguen por el codigo (<code>Ana#0427</code>).<br>
<b>RLS</b>: cada participante ve y modifica solo sus filas de <code>perfiles</code> e <code>intentos_leccion</code>; el publico no ve ninguna.<br>
<code>es_invitado</code> espeja <code>auth.users.is_anonymous</code>. Al convertir un invitado en cuenta el id no cambia: el historial sigue siendo suyo.
</div></div></body></html>"""


(RAIZ / "sintaxia-der-etapa4.drawio").write_text(generar_drawio(), encoding="utf8")
(RAIZ / "vista-previa-etapa4.html").write_text(generar_html(), encoding="utf8")
print("Escritos sintaxia-der-etapa4.drawio y vista-previa-etapa4.html")
