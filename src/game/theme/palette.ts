/** Editorial Soft Defense palette — keep UI + sim visuals on these tokens. */

export const PALETTE = {
  seaTeal: 0x0f766e,
  seaTealDeep: 0x0b3d3a,
  /** Bright cyan — brine towers must read against teal grass (not green-on-green). */
  brine: 0x67e8f9,
  coral: 0xe11d48,
  amber: 0xd97706,
  sage: 0xa8b5a0,
  sand: 0xe8dcc8,
  ink: 0x1c1917,
  foam: 0xf8faf9,
  path: 0xd6c4a8,
  /** Darker grass so towers / path stay readable. */
  buildable: 0x1a4a45,
  blocked: 0x123834,
} as const;

export type PaletteKey = keyof typeof PALETTE;
