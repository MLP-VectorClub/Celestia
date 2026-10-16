export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

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
  /** `mix` is any mix of the two colors; otherwise the blend mode of the combination */
  blendMode: 'mix' | BlendMode | null;
  /** For a listed color with an opacity or blend mode over a sprite color: its opacity in percent (100 when only a blend mode is set) */
  blendOpacity: number | null;
}

export interface SpriteColorPaletteEntry {
  group: string;
  label: string;
  hex: string;
  /** How opaque the color is listed, in percent */
  opacity: number | null;
  blendMode: BlendMode | null;
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

/** The API's colors with the opacity and blend mode that the generated types do not know yet */
export interface ColorBlending {
  /** How opaque the color is drawn in percent, 1 to 99, null for fully opaque */
  opacity?: number | null;
  /** How it combines with what is under it, null (or missing) means normal */
  blendMode?: BlendMode | null;
}

export const BLEND_MODES: BlendMode[] = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
];
