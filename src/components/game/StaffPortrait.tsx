import barrySheet from "@/assets/barry-ward-sprites.png.asset.json";
import priyaSheet from "@/assets/priya-ward-sprites.png.asset.json";

/**
 * Shop portraits cropped (via CSS) from each staff member's supplied sprite sheet.
 * Add an entry here when new staff artwork arrives; staff without one fall back to their emoji.
 * crop = square head region [x, y, size] in sheet pixels.
 */
const PORTRAITS: Record<string, { url: string; sheetW: number; sheetH: number; crop: [number, number, number] }> = {
  hca: { url: barrySheet.url, sheetW: 1170, sheetH: 955, crop: [9 * 117 + 15, 4 * 191 + 5, 85] },
  student: { url: priyaSheet.url, sheetW: 1536, sheetH: 1024, crop: [1229 + 12, 819 + 12, 104] },
};

export function StaffPortrait({ staffKey, fallback, size = 44 }: { staffKey: string; fallback: string; size?: number }) {
  const p = PORTRAITS[staffKey];
  if (!p) return <>{fallback}</>;
  const s = size / p.crop[2];
  return (
    <span
      aria-hidden="true"
      className="block"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${p.url})`,
        backgroundSize: `${p.sheetW * s}px ${p.sheetH * s}px`,
        backgroundPosition: `${-p.crop[0] * s}px ${-p.crop[1] * s}px`,
        imageRendering: "pixelated",
      }}
    />
  );
}
