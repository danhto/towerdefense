import type { ShareCardPayload } from "./card";
import {
  formatShareText,
  TOWER_KIND_COLOR,
  uniqueTowerKinds,
} from "./card";

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

  // Typographic lines only — loadout is drawn as color dots (not kind names).
  const lines = formatShareText(card).split("\n").slice(0, 3);
  ctx.fillStyle = "#f8faf9";
  ctx.font = "700 42px Fraunces, Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(lines[0] ?? "Daily Hold", SHARE_CARD_WIDTH / 2, 110);

  ctx.fillStyle = "#e8dcc8";
  ctx.font = "600 28px Manrope, sans-serif";
  ctx.fillText(lines[1] ?? "", SHARE_CARD_WIDTH / 2, 175);

  ctx.fillStyle = "#a8b5a0";
  ctx.font = "500 24px Manrope, sans-serif";
  ctx.fillText(lines[2] ?? "", SHARE_CARD_WIDTH / 2, 230);

  const kinds = uniqueTowerKinds(card.towerKinds);
  if (kinds.length > 0) {
    const label = card.result === "cleared" ? "Held with" : "Ran";
    ctx.fillStyle = "#e8dcc8";
    ctx.font = "600 20px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, SHARE_CARD_WIDTH / 2, 280);

    const radius = 14;
    const gap = 36;
    const totalW = (kinds.length - 1) * gap;
    let x = SHARE_CARD_WIDTH / 2 - totalW / 2;
    const y = 318;
    for (const kind of kinds) {
      ctx.beginPath();
      ctx.fillStyle = TOWER_KIND_COLOR[kind];
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      // Foam rim so ice-blue brine stays readable on teal.
      ctx.strokeStyle = "#f8faf9";
      ctx.lineWidth = 2;
      ctx.stroke();
      x += gap;
    }
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
