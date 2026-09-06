import type { ShareCardPayload } from "./card";
import { formatShareText } from "./card";

export const SHARE_CARD_WIDTH = 720;
export const SHARE_CARD_HEIGHT = 420;

/** Render a spoiler-free typographic share card to a canvas. */
export function renderShareCardCanvas(
  card: ShareCardPayload,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");

  // Soft coastal gradient — editorial, not a battle screenshot.
  const grad = ctx.createLinearGradient(
    0,
    0,
    SHARE_CARD_WIDTH,
    SHARE_CARD_HEIGHT,
  );
  grad.addColorStop(0, "#0b3d3a");
  grad.addColorStop(0.55, "#0f766e");
  grad.addColorStop(1, "#164e4a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  // Sand frame
  ctx.strokeStyle = "#e8dcc8";
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, SHARE_CARD_WIDTH - 36, SHARE_CARD_HEIGHT - 36);

  const lines = formatShareText(card).split("\n");
  ctx.fillStyle = "#f8faf9";
  ctx.font = "700 42px Fraunces, Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(lines[0] ?? "Daily Hold", SHARE_CARD_WIDTH / 2, 120);

  ctx.fillStyle = "#e8dcc8";
  ctx.font = "600 28px Manrope, sans-serif";
  ctx.fillText(lines[1] ?? "", SHARE_CARD_WIDTH / 2, 190);

  ctx.fillStyle = "#a8b5a0";
  ctx.font = "500 24px Manrope, sans-serif";
  ctx.fillText(lines[2] ?? "", SHARE_CARD_WIDTH / 2, 245);

  if (lines[3]) {
    ctx.fillStyle = "#e8dcc8";
    ctx.font = "600 22px Manrope, sans-serif";
    ctx.fillText(lines[3], SHARE_CARD_WIDTH / 2, 290);
  }

  ctx.fillStyle = "#78716c";
  ctx.font = "400 16px Manrope, sans-serif";
  ctx.fillText(
    "Same dare for everyone · no layout spoilers",
    SHARE_CARD_WIDTH / 2,
    360,
  );

  return canvas;
}

export function shareCardToDataUrl(card: ShareCardPayload): string {
  return renderShareCardCanvas(card).toDataURL("image/png");
}

export async function shareCardToBlob(card: ShareCardPayload): Promise<Blob> {
  const canvas = renderShareCardCanvas(card);
  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("share card blob failed"));
      else resolve(blob);
    }, "image/png");
  });
}

export function downloadShareCardImage(card: ShareCardPayload): void {
  const url = shareCardToDataUrl(card);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daily-hold-${card.dateKey}.png`;
  a.click();
}

/** Copy PNG to clipboard when supported; returns false on failure. */
export async function copyShareCardImage(
  card: ShareCardPayload,
): Promise<boolean> {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    return false;
  }
  try {
    const blob = await shareCardToBlob(card);
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}
