import collisionMask from "@/assets/east-west-collision-mask.png.asset.json";

/** Red areas from the supplied 890×1123 east → west map, extracted as alpha.
 * Sample the moving object's centre, independently of its sprite dimensions. */
let maskPromise: Promise<ImageData> | undefined;

export function loadEastWestCollisionMap(): Promise<ImageData> {
  maskPromise ??= new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) { reject(new Error("Collision map canvas unavailable")); return; }
      context.drawImage(image, 0, 0);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    };
    image.onerror = () => reject(new Error("Collision map failed to load"));
    image.src = collisionMask.url;
  }).catch((error) => { maskPromise = undefined; throw error; });
  return maskPromise;
}

export function eastWestCollisionAt(map: ImageData, x: number, y: number): boolean {
  const px = Math.floor(x * map.width);
  const py = Math.floor(y * map.height);
  if (px < 0 || px >= map.width || py < 0 || py >= map.height) return false;
  return map.data[(py * map.width + px) * 4 + 3] > 127;
}