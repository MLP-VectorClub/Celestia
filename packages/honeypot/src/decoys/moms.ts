import { createHash } from 'node:crypto';

const KG_TO_LBS = 2.2046226218;

/**
 * The weight of the connecting visitor's mother, in kilograms and pounds, as a decoy .env would know it. Made up from the visitor's address (and a salt that
 * lives as long as the server does), so the same visitor reads the same figure every time; 121.0 to 289.9, one decimal. Nobody's mother is
 * weighed: the number comes out of a hash
 */
export const momsWeightOf =
  (salt: string) =>
  (address?: string): { kg: string; lbs: string } => {
    const hash = createHash('sha256')
      .update(`${salt}:${address ?? 'unknown'}`)
      .digest();
    const tenths = 1210 + (hash.readUInt32BE(0) % 1690);
    return { kg: (tenths / 10).toFixed(1), lbs: ((tenths / 10) * KG_TO_LBS).toFixed(1) };
  };
