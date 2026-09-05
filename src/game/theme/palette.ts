/** Editorial Soft Defense palette — keep UI + sim visuals on these tokens. */

export const PALETTE = {
  seaTeal: 0x0f766e,
  seaTealDeep: 0x0b3d3a,
  coral: 0xe11d48,
  amber: 0xd97706,
  sage: 0xa8b5a0,
  sand: 0xe8dcc8,
  ink: 0x1c1917,
  foam: 0xf8faf9,
  path: 0xd6c4a8,
  buildable: 0x2a6f68,
  blocked: 0x164e4a,
} as const;

export type PaletteKey = keyof typeof PALETTE;
