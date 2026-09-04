import React, { useId } from 'react';

/**
 * Renders ordinary image URLs and the packed CC0 equipment atlas transparently.
 *
 * New equipment definitions use `equipment-atlas://eq_0001` style virtual URLs.
 * Old saves may still contain `/assets/equipment/cc0/mapped/eq_0001.png`; those
 * legacy URLs are intentionally recognized here so removing the 404 individual
 * PNG files does not break save compatibility.
 *
 * NOTE: Chromium/WebView builds used by mobile AI Studio previews can treat the
 * root SVG overflow as visible.  The atlas image is therefore clipped with an
 * explicit clipPath instead of relying on implicit SVG viewport clipping.
 */
const ATLAS_COLUMNS = 8;
const ATLAS_ROWS = 4;
const ITEMS_PER_ATLAS = ATLAS_COLUMNS * ATLAS_ROWS;
const CELL_SIZE = 256;

const parseEquipmentAtlasIndex = (src?: string | null): number | null => {
  if (!src) return null;

  const virtualMatch = src.match(/^equipment-atlas:\/\/eq_(\d{4})$/i);
  const legacyMatch = src.match(/\/assets\/equipment\/cc0\/mapped\/eq_(\d{4})\.png(?:[?#].*)?$/i);
  const raw = virtualMatch?.[1] ?? legacyMatch?.[1];
  if (!raw) return null;

  const oneBased = Number.parseInt(raw, 10);
  if (!Number.isFinite(oneBased) || oneBased < 1 || oneBased > 404) return null;
  return oneBased - 1;
};

export interface IllustrationImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  referrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>['referrerPolicy'];
}

export const IllustrationImage: React.FC<IllustrationImageProps> = ({
  src,
  alt = '',
  className = '',
  referrerPolicy,
}) => {
  const clipId = `equipment-cell-${useId().replace(/:/g, '')}`;
  const index = parseEquipmentAtlasIndex(src);

  if (index === null) {
    if (!src) return null;
    return <img src={src} alt={alt} className={className} referrerPolicy={referrerPolicy} />;
  }

  const atlasIndex = Math.floor(index / ITEMS_PER_ATLAS);
  const cellIndex = index % ITEMS_PER_ATLAS;
  const column = cellIndex % ATLAS_COLUMNS;
  const row = Math.floor(cellIndex / ATLAS_COLUMNS);
  const atlasUrl = `/assets/equipment/cc0/atlas/equipment_cc0_${String(atlasIndex).padStart(2, '0')}.png`;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${CELL_SIZE} ${CELL_SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      focusable="false"
      overflow="hidden"
      style={{ overflow: 'hidden', display: 'block' }}
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect x="0" y="0" width={CELL_SIZE} height={CELL_SIZE} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image
          href={atlasUrl}
          x={-column * CELL_SIZE}
          y={-row * CELL_SIZE}
          width={ATLAS_COLUMNS * CELL_SIZE}
          height={ATLAS_ROWS * CELL_SIZE}
          preserveAspectRatio="none"
        />
      </g>
    </svg>
  );
};

export default IllustrationImage;
