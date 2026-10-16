export type SpriteColorKind = 'listed' | 'blend' | 'near' | 'unknown' | 'nearSpeck' | 'unknownSpeck' | 'translucent';

export interface SpriteColorEntry {
  hex: string;
  /** Fully opaque pixels */
  pixels: number;
  translucentPixels: number;
  kind: SpriteColorKind;
  /** Names of the appearance colors with this value */
  labels: string[];
  nearest: { hex: string; label: string; distance: number } | null;
  blendOf: [string, string] | null;
  blendMode: 'mix' | 'multiply' | 'screen' | null;
}

export interface SpriteColorPaletteEntry {
  group: string;
  label: string;
  hex: string;
  status: 'present' | 'translucent' | 'missing';
  /** For another form or use of the character, so not expected in every sprite */
  optional: boolean;
  pixels: number;
}

/** `GET /appearances/{id}/sprite/colors` */
export interface SpriteColorCheck {
  palette: SpriteColorPaletteEntry[];
  colors: SpriteColorEntry[];
  summary: { missing: number; translucentOnly: number; near: number; unknown: number; specks: number; ok: boolean };
}
