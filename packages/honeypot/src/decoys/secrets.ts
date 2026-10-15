import { randomBytes, randomInt, randomUUID } from 'node:crypto';

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

const fromAlphabet = (alphabet: string, length: number): string =>
  Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('');

/** Values that look like what people leave in these files, and are random: they open nothing anywhere */
export const randomSecrets = () => ({
  appKey: `base64:${randomBytes(32).toString('base64')}`,
  password: (length = 20) => fromAlphabet(ALPHANUMERIC, length),
  /** Letters and digits in lower case (a lot of keys are) */
  lower: (length: number) => fromAlphabet(LOWERCASE_DIGITS, length),
  digits: (length: number) => fromAlphabet(DIGITS, length),
  upper: (length: number) => fromAlphabet(UPPERCASE_DIGITS, length),
  hex: (bytes: number) => randomBytes(bytes).toString('hex'),
  base64url: (bytes: number) => randomBytes(bytes).toString('base64url'),
  uuid: () => randomUUID(),
  /** A PEM block (`-----BEGIN <label>-----`) around random base64: it has the shape of a key or a certificate and decodes to nothing */
  pem: (label: string, bytes: number) => {
    const body = randomBytes(bytes).toString('base64').replace(/=+$/, '');
    return `-----BEGIN ${label}-----\n${body.match(/.{1,64}/g)?.join('\n')}\n-----END ${label}-----`;
  },
  base58: (length: number) => fromAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', length),
  seedPhrase: (words = 12) => Array.from({ length: words }, () => WORDS[randomInt(WORDS.length)]).join(' '),
  awsAccessKeyId: `AKIA${fromAlphabet(UPPERCASE_DIGITS, 16)}`,
  awsSecretAccessKey: randomBytes(30)
    .toString('base64')
    .replace(/[+/=]/g, () => ALPHANUMERIC[randomInt(ALPHANUMERIC.length)])
    .slice(0, 40),
  stripeLive: `sk_live_${fromAlphabet(ALPHANUMERIC, 24)}`,
  githubToken: `ghp_${fromAlphabet(ALPHANUMERIC, 36)}`,
  jwtSecret: randomBytes(48).toString('base64url'),
});

export type Secrets = ReturnType<typeof randomSecrets>;
