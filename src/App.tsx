// @ts-nocheck
import React, { useMemo, useState } from "react";

// ===================================================
// 1. Definición de piezas y layout sin solapamientos
// ===================================================

function createRigidMailerPieces({ w, d, h }) {
  if (w <= 0 || d <= 0 || h <= 0) return [];

  const hMenos2 = Math.max(h - 2, 1);
  const dMenos2 = Math.max(d - 2, 1);
  const dMas3 = d + 3;

  // CASCARÓN (Azul)
  const cascaron = [
    { id: "C1", group: "Cascarón", name: "Panel frontal",   width: h,        height: w,        rotate: false },
    { id: "C2", group: "Cascarón", name: "Tapa superior",   width: w,        height: dMas3,    rotate: true  },
    { id: "C3", group: "Cascarón", name: "Lomo",            width: hMenos2,  height: w,        rotate: false },
    { id: "C4", group: "Cascarón", name: "Fondo",           width: w,        height: d,        rotate: true  },
    { id: "C5", group: "Cascarón", name: "Panel posterior", width: h,        height: w,        rotate: false },
  ];

  // CORRAL (Naranja)
  const corral = [
    { id: "R1", group: "Corral", name: "Panel frontal",   width: w,       height: hMenos2, rotate: false },
    { id: "R2", group: "Corral", name: "Panel trasero",   width: w,       height: hMenos2, rotate: false },
    { id: "R3", group: "Corral", name: "Lateral der",     width: dMenos2, height: hMenos2, rotate: false },
    { id: "R4", group: "Corral", name: "Lateral izq",     width: dMenos2, height: hMenos2, rotate: false },
  ];

  return [...cascaron, ...corral];
}

// Distribuye las piezas en dos filas (cascarón arriba, corral abajo) sin solapamientos
function layoutPieces(pieces) {
  if (!pieces.length) {
    return { piecesWithLayout: [], totalWidth: 100, totalHeight: 100 };
  }

  const marginX = 20; // espacio horizontal entre piezas
  const marginY = 30; // espacio vertical entre filas

  const cascaron = pieces.filter((p) => p.group === "Cascarón");
  const corral = pieces.filter((p) => p.group === "Corral");

  function layoutRow(rowPieces, startY) {
    let cursorX = marginX;
    let rowMaxHeight = 0;

    const withPos = rowPieces.map((p) => {
      // ancho/alto del bounding box teniendo en cuenta la rotación
      const finalWidth = p.rotate ? p.height : p.width;
      const finalHeight = p.rotate ? p.width : p.height;

      const cx = cursorX + finalWidth / 2;
      const cy = startY + finalHeight / 2;

      cursorX += finalWidth + marginX;
      if (finalHeight > rowMaxHeight) rowMaxHeight = finalHeight;

      return {
        ...p,
        cx,
        cy,
        finalWidth,
        finalHeight,
      };
    });

    const rowWidth = cursorX + marginX;
    return { withPos, rowWidth, rowMaxHeight };
  }

  const row1 = layoutRow(cascaron, marginY);
  const row2StartY = marginY + row1.rowMaxHeight + marginY;
  const row2 = layoutRow(corral, row2StartY);

  const totalWidth = Math.max(row1.rowWidth, row2.rowWidth);
  const totalHeight = row2StartY + row2.rowMaxHeight + marginY;

  const piecesWithLayout = [...row1.withPos, ...row2.withPos];

  return { piecesWithLayout, totalWidth, totalHeight };
}

// ===================================================
// 2. SVG para descarga (misma disposición que preview)
// ===================================================

function buildPiecesSvgString(pieces, totalWidth, totalHeight) {
  const rectsSvg = pieces
    .map((p) => {
      const fill = p.group === "Cascarón" ? "#cfe8ff" : "#ffe5c2";
      const label = `${p.id} ${p.name}`;
      const sizeText = `${p.width} x ${p.height} mm`;

      // coordenadas del rectángulo sin rotar (centrado en cx,cy)
      const rectX = p.cx - p.width / 2;
      const rectY = p.cy - p.height / 2;

      const transformAttr = p.rotate
        ? ` transform="rotate(90 ${p.cx} ${p.cy})"`
        : "";

      return `
  <g${transformAttr}>
    <rect x="${rectX}" y="${rectY}" width="${p.width}" height="${p.height}"
          fill="${fill}" stroke="black" stroke-width="0.5" />
    <text x="${p.cx}" y="${p.cy - 4}" font-size="10" text-anchor="middle">
      ${label}
    </text>
    <text x="${p.cx}" y="${p.cy + 10}" font-size="9" text-anchor="middle">
      ${sizeText}
    </text>
  </g>`;
    })
    .join("\n");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}">
${rectsSvg}
</svg>
`.trim();
}

// ===================================================
// 3. Componentes de UI
// ===================================================

function PiecesPreview({ pieces, totalWidth, totalHeight }) {
  if (!pieces.length) return <p>No hay piezas para mostrar.</p>;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      style={{
        width: "100%",
        height: "400px",
        border: "1px solid #ccc",
        background: "#fff",
      }}
    >
      {pieces.map((p) => {
        const fill = p.group === "Cascarón" ? "#cfe8ff" : "#ffe5c2";
        const label = `${p.id} ${p.name}`;
        const sizeText = `${p.width} x ${p.height} mm`;

        const rectX = p.cx - p.width / 2;
        const rectY = p.cy - p.height / 2;
        const transform = p.rotate
          ? `rotate(90 ${p.cx} ${p.cy})`
          : undefined;

        return (
          <g key={p.id} transform={transform}>
            <rect
              x={rectX}
              y={rectY}
              width={p.width}
              height={p.height}
              fill={fill}
              stroke="#000"
              strokeWidth={0.5}
            />
            <text
              x={p.cx}
              y={p.cy - 4}
              fontSize="10"
              textAnchor="middle"
              fill="#000"
            >
              {label}
            </text>
            <text
              x={p.cx}
              y={p.cy + 10}
              fontSize="9"
              textAnchor="middle"
              fill="#333"
            >
              {sizeText}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DownloadSvgButton({ pieces, totalWidth, totalHeight }) {
  const handleDownload = () => {
    if (!pieces.length) return;
    const svgString = buildPiecesSvgString(pieces, totalWidth, totalHeight);
    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "rigid_mailer_pieces.svg";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        padding: "8px 16px",
        borderRadius: 4,
        border: "1px solid #333",
        background: "#111",
        color: "#fff",
        cursor: "pointer",
        marginTop: "8px",
      }}
    >
      Descargar SVG
    </button>
  );
}

// ===================================================
// 4. App principal
// ===================================================

export default function App() {
  const [width, setWidth] = useState(200); // W
  const [depth, setDepth] = useState(100); // D
  const [height, setHeight] = useState(150); // H

  const { piecesWithLayout, totalWidth, totalHeight } = useMemo(() => {
    const basePieces = createRigidMailerPieces({
      w: width,
      d: depth,
      h: height,
    });
    return layoutPieces(basePieces);
  }, [width, depth, height]);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "20px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
        Desglose de Cartones – Caja rígida
      </h1>
      <p style={{ marginBottom: "16px", color: "#555" }}>
        Ingresa las medidas finales de la caja (W, D, H) en milímetros. Se
        generarán los cartones del Cascarón (Azul) y del Corral (Naranja) como
        rectángulos independientes con sus medidas.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "20px",
          alignItems: "flex-start",
        }}
      >
        {/* Panel de controles */}
        <div
          style={{
            padding: "16px",
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
            Medidas finales (mm)
          </h2>

          <label style={{ display: "block", marginBottom: "8px" }}>
            Ancho (W):
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
              style={{ width: "100%", padding: "4px 8px", marginTop: "4px" }}
              min={1}
            />
          </label>

          <label style={{ display: "block", marginBottom: "8px" }}>
            Fondo (D):
            <input
              type="number"
              value={depth}
              onChange={(e) => setDepth(parseFloat(e.target.value) || 0)}
              style={{ width: "100%", padding: "4px 8px", marginTop: "4px" }}
              min={1}
            />
          </label>

          <label style={{ display: "block", marginBottom: "8px" }}>
            Alto (H):
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              style={{ width: "100%", padding: "4px 8px", marginTop: "4px" }}
              min={1}
            />
          </label>

          <DownloadSvgButton
            pieces={piecesWithLayout}
            totalWidth={totalWidth}
            totalHeight={totalHeight}
          />
        </div>

        {/* Vista previa */}
        <div>
          <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
            Vista previa de piezas
          </h2>
          <PiecesPreview
            pieces={piecesWithLayout}
            totalWidth={totalWidth}
            totalHeight={totalHeight}
          />
        </div>
      </div>
    </div>
  );
}
