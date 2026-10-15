import { createHmac, randomBytes, randomInt, randomUUID } from 'node:crypto';

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const UPPERCASE_DIGITS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const DIGITS = '0123456789';
const LOWERCASE_DIGITS = 'abcdefghijklmnopqrstuvwxyz0123456789';
/** Enough words to look like a wallet's recovery phrase, picked at random: not the list a real wallet uses, so no phrase here is anybody's */
const WORDS = [
  'abandon',
  'anchor',
  'barrel',
  'candle',
  'dragon',
  'ember',
  'falcon',
  'garden',
  'harbor',
  'island',
  'jungle',
  'kettle',
  'lantern',
  'meadow',
  'nectar',
  'orchid',
  'pepper',
  'quartz',
  'rabbit',
  'saddle',
  'thunder',
  'umbrella',
  'velvet',
  'walnut',
  'yonder',
  'zephyr',
  'biscuit',
  'cobalt',
  'dolphin',
  'echo',
  'fiddle',
  'glacier',
];

export interface Random {
  bytes: (length: number) => Buffer;
  int: (max: number) => number;
  uuid: () => string;
}

/**
 * Where the random values come from. Without a seed they are the system's, different in every process. With one they are a deterministic stream (HMAC
 * of a counter), so every process given the same seed makes the very same values: the server runs as several workers, and a scanner that is
 * sent from one to the next must read the same file
 */
export const createRandom = (seed?: string): Random => {
  if (!seed) return { bytes: (length) => randomBytes(length), int: (max) => randomInt(max), uuid: () => randomUUID() };

  let counter = 0;
  let pool = Buffer.alloc(0);
  const bytes = (length: number): Buffer => {
    while (pool.length < length) pool = Buffer.concat([pool, createHmac('sha256', seed).update(`honeypot:${counter++}`).digest()]);
    const out = Buffer.from(pool.subarray(0, length));
    pool = pool.subarray(length);
    return out;
  };
  const int = (max: number): number => {
    // Rejection sampling, so no value is more likely than another
    const limit = Math.floor(0x100000000 / max) * max;
    for (;;) {
      const value = bytes(4).readUInt32BE(0);
      if (value < limit) return value % max;
    }
  };
  const uuid = (): string => {
    const b = bytes(16);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const hex = b.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };
  return { bytes, int, uuid };
};

/** Values that look like what people leave in these files, and are random (or, given a seed, the same in every process): they open nothing anywhere */
export const randomSecrets = (seed?: string) => {
  const random = createRandom(seed);
  const from = (alphabet: string, length: number): string => Array.from({ length }, () => alphabet[random.int(alphabet.length)]).join('');
  return {
    appKey: `base64:${random.bytes(32).toString('base64')}`,
    password: (length = 20) => from(ALPHANUMERIC, length),
    /** Letters and digits in lower case (a lot of keys are) */
    lower: (length: number) => from(LOWERCASE_DIGITS, length),
    digits: (length: number) => from(DIGITS, length),
    upper: (length: number) => from(UPPERCASE_DIGITS, length),
    hex: (bytes: number) => random.bytes(bytes).toString('hex'),
    base64url: (bytes: number) => random.bytes(bytes).toString('base64url'),
    uuid: () => random.uuid(),
    /** A PEM block (`-----BEGIN <label>-----`) around random base64: it has the shape of a key or a certificate and decodes to nothing */
    pem: (label: string, bytes: number) => {
      const body = random.bytes(bytes).toString('base64').replace(/=+$/, '');
      return `-----BEGIN ${label}-----\n${body.match(/.{1,64}/g)?.join('\n')}\n-----END ${label}-----`;
    },
    base58: (length: number) => from('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', length),
    seedPhrase: (words = 12) => Array.from({ length: words }, () => WORDS[random.int(WORDS.length)]).join(' '),
    awsAccessKeyId: `AKIA${from(UPPERCASE_DIGITS, 16)}`,
    awsSecretAccessKey: random
      .bytes(30)
      .toString('base64')
      .replace(/[+/=]/g, () => ALPHANUMERIC[random.int(ALPHANUMERIC.length)])
      .slice(0, 40),
    stripeLive: `sk_live_${from(ALPHANUMERIC, 24)}`,
    githubToken: `ghp_${from(ALPHANUMERIC, 36)}`,
    jwtSecret: random.bytes(48).toString('base64url'),
  };
};

export type Secrets = ReturnType<typeof randomSecrets>;
