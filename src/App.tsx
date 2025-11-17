// @ts-nocheck 
import React, { useMemo, useState } from 'react';

// ============================
// 1. Definición de piezas
// ============================

// Genera las 9 piezas (5 cascarón + 4 corral) según tus fórmulas
function generateRigidMailerPieces({ w, d, h }) {
  if (w <= 0 || d <= 0 || h <= 0) return [];

  // Ajustes de mm con límites para no ir a negativo
  const hMenos2 = Math.max(h - 2, 1);
  const dMenos2 = Math.max(d - 2, 1);
  const dMas3 = d + 3;

  const pieces = [
    // CASCARÓN
    // 1. Panel frontal : H x W
    { id: 'C1', group: 'Cascarón', name: 'Panel frontal', width: h, height: w },

    // 2. Tapa superior : W x (D + 3mm)
    {
      id: 'C2',
      group: 'Cascarón',
      name: 'Tapa superior',
      width: w,
      height: dMas3,
    },

    // 3. Lomo : (H - 2mm) x W
    { id: 'C3', group: 'Cascarón', name: 'Lomo', width: hMenos2, height: w },

    // 4. Fondo : W x D
    { id: 'C4', group: 'Cascarón', name: 'Fondo', width: w, height: d },

    // 5. Panel posterior : H x W
    {
      id: 'C5',
      group: 'Cascarón',
      name: 'Panel posterior',
      width: h,
      height: w,
    },

    // CORRAL
    // 1. Panel Frontal : W x (H - 2mm)
    {
      id: 'R1',
      group: 'Corral',
      name: 'Panel frontal',
      width: w,
      height: hMenos2,
    },

    // 2. Panel Trasero : W x (H - 2mm)
    {
      id: 'R2',
      group: 'Corral',
      name: 'Panel trasero',
      width: w,
      height: hMenos2,
    },

    // 3. Lateral Der : (D - 2mm) x (H - 2mm)
    {
      id: 'R3',
      group: 'Corral',
      name: 'Lateral der',
      width: dMenos2,
      height: hMenos2,
    },

    // 4. Lateral Izq : (D - 2mm) x (H - 2mm)
    {
      id: 'R4',
      group: 'Corral',
      name: 'Lateral izq',
      width: dMenos2,
      height: hMenos2,
    },
  ];

  return pieces;
}

// ============================
// 2. Layout de las piezas en el plano
// ============================

function layoutPieces(pieces) {
  if (!pieces.length) {
    return { piecesWithLayout: [], totalWidth: 100, totalHeight: 100 };
  }

  const margin = 10; // separación entre piezas en mm (visual)

  const cascaron = pieces.filter((p) => p.group === 'Cascarón');
  const corral = pieces.filter((p) => p.group === 'Corral');

  function layoutRow(rowPieces, startY) {
    let x = margin;
    let maxHeight = 0;
    const rowWithPos = rowPieces.map((p) => {
      const placed = {
        ...p,
        x,
        y: startY,
      };
      x += p.width + margin;
      if (p.height > maxHeight) maxHeight = p.height;
      return placed;
    });
    const rowWidth = x + margin;
    return { rowWithPos, rowWidth, rowHeight: maxHeight };
  }

  // Primera fila: cascarón
  const row1 = layoutRow(cascaron, margin);
  // Segunda fila: corral (debajo de la primera)
  const row2StartY = margin + row1.rowHeight + margin;
  const row2 = layoutRow(corral, row2StartY);

  const totalWidth = Math.max(row1.rowWidth, row2.rowWidth) + margin;
  const totalHeight = row2StartY + row2.rowHeight + margin;

  const piecesWithLayout = [...row1.rowWithPos, ...row2.rowWithPos];

  return { piecesWithLayout, totalWidth, totalHeight };
}

// ============================
// 3. Generación de SVG para descarga
// ============================

function buildPiecesSvgString(pieces, totalWidth, totalHeight) {
  const rectsSvg = pieces
    .map((p) => {
      const label = `${p.id} ${p.name}`;
      const sizeText = `${p.width} x ${p.height} mm`;
      const textX = p.x + p.width / 2;
      const textY = p.y + p.height / 2;

      return `
  <g>
    <rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}"
    fill="${
      p.group === 'Cascarón' ? '#cfe8ff' : '#ffe5c2'
    }" stroke="black" stroke-width="0.5" />
    <text x="${textX}" y="${textY - 4}" font-size="10" text-anchor="middle">
      ${label}
    </text>
    <text x="${textX}" y="${textY + 10}" font-size="9" text-anchor="middle">
      ${sizeText}
    </text>
  </g>`;
    })
    .join('\n');

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}">
${rectsSvg}
</svg>
`.trim();
}

// ============================
// 4. Componentes de UI
// ============================

function PiecesPreview({ pieces, totalWidth, totalHeight }) {
  if (!pieces.length) return <p>No hay piezas para mostrar.</p>;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      style={{
        width: '100%',
        height: '400px',
        border: '1px solid #ccc',
        background: '#fff',
      }}
    >
      {pieces.map((p) => {
        const textX = p.x + p.width / 2;
        const textY = p.y + p.height / 2;
        const sizeText = `${p.width} x ${p.height} mm`;
        const label = `${p.id} ${p.name}`;

        return (
          <g
            key={p.id}
            transform={
              p.id === 'C2' || p.id === 'C4'
                ? `rotate(90 ${p.x + p.width / 2} ${p.y + p.height / 2})`
                : undefined
            }
          >
            <rect
              x={p.x}
              y={p.y}
              width={p.width}
              height={p.height}
              fill={p.group === 'Cascarón' ? '#cfe8ff' : '#ffe5c2'}
              stroke="#000"
              strokeWidth={0.5}
            />
            <text
              x={textX}
              y={textY - 4}
              fontSize="10"
              textAnchor="middle"
              fill="#000"
            >
              {label}
            </text>
            <text
              x={textX}
              y={textY + 10}
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
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'rigid_mailer_pieces.svg';
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        padding: '8px 16px',
        borderRadius: 4,
        border: '1px solid #333',
        background: '#111',
        color: '#fff',
        cursor: 'pointer',
        marginTop: '8px',
      }}
    >
      Descargar SVG
    </button>
  );
}

// ============================
// 5. App principal
// ============================

export default function App() {
  const [width, setWidth] = useState(200); // W
  const [depth, setDepth] = useState(100); // D
  const [height, setHeight] = useState(150); // H

  const { piecesWithLayout, totalWidth, totalHeight } = useMemo(() => {
    const pieces = generateRigidMailerPieces({
      w: width,
      d: depth,
      h: height,
    });
    return layoutPieces(pieces);
  }, [width, depth, height]);

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
        Desglose de Cartones – Caja rígida
      </h1>
      <p style={{ marginBottom: '16px', color: '#555' }}>
        Ingresa las medidas finales de la caja (W, D, H) en milímetros. Se
        generarán los cartones de la Tapa (Azul) y del Corral (Rojo) como
        rectángulos independientes con sus medidas.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '20px',
          alignItems: 'flex-start',
        }}
      >
        {/* Panel de controles */}
        <div
          style={{
            padding: '16px',
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#fafafa',
          }}
        >
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>
            Medidas finales (mm)
          </h2>

          <label style={{ display: 'block', marginBottom: '8px' }}>
            Ancho (W):
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', padding: '4px 8px', marginTop: '4px' }}
              min={1}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '8px' }}>
            Fondo (D):
            <input
              type="number"
              value={depth}
              onChange={(e) => setDepth(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', padding: '4px 8px', marginTop: '4px' }}
              min={1}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '8px' }}>
            Alto (H):
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', padding: '4px 8px', marginTop: '4px' }}
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
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>
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
