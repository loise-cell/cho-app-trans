import { CropRect } from "../types";

type Size = { width: number; height: number };

export function getImageDisplayLayout(container: Size, image: Size) {
  if (image.width <= 0 || image.height <= 0) {
    return {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      displayWidth: container.width,
      displayHeight: container.height
    };
  }

  const scale = Math.min(container.width / image.width, container.height / image.height);
  const displayWidth = image.width * scale;
  const displayHeight = image.height * scale;
  const offsetX = (container.width - displayWidth) / 2;
  const offsetY = (container.height - displayHeight) / 2;
  return { scale, offsetX, offsetY, displayWidth, displayHeight };
}

export function mapCropRectToImage(params: {
  cropRect: CropRect;
  previewSize: Size;
  imageSize: Size;
}): CropRect {
  const { cropRect, previewSize, imageSize } = params;
  const { scale, offsetX, offsetY } = getImageDisplayLayout(previewSize, imageSize);

  let originX = (cropRect.x - offsetX) / scale;
  let originY = (cropRect.y - offsetY) / scale;
  let width = cropRect.width / scale;
  let height = cropRect.height / scale;

  originX = Math.max(0, Math.min(originX, imageSize.width - 1));
  originY = Math.max(0, Math.min(originY, imageSize.height - 1));
  width = Math.max(50, Math.min(width, imageSize.width - originX));
  height = Math.max(50, Math.min(height, imageSize.height - originY));

  return {
    x: Math.round(originX),
    y: Math.round(originY),
    width: Math.round(width),
    height: Math.round(height)
  };
}

export function clampCropToDisplay(
  cropRect: CropRect,
  layout: ReturnType<typeof getImageDisplayLayout>
): CropRect {
  const minX = layout.offsetX;
  const minY = layout.offsetY;
  const maxX = layout.offsetX + layout.displayWidth;
  const maxY = layout.offsetY + layout.displayHeight;

  const width = Math.min(cropRect.width, maxX - minX);
  const height = Math.min(cropRect.height, maxY - minY);
  const x = Math.min(Math.max(cropRect.x, minX), maxX - width);
  const y = Math.min(Math.max(cropRect.y, minY), maxY - height);

  return { x, y, width, height };
}
