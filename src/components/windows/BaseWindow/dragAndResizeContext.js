// Viewport clamp utility
export function clampPositionToViewport(position, size) {
  const maxX = window.innerWidth - size.width;
  const maxY = window.innerHeight - size.height;
  return {
    top: Math.min(Math.max(position.top, 0), maxY),
    left: Math.min(Math.max(position.left, 0), maxX),
  };
}


