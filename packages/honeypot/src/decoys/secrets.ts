import { randomBytes, randomInt } from 'node:crypto';

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const UPPERCASE_DIGITS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const fromAlphabet = (alphabet: string, length: number): string =>
  Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('');

/** Values that look like what people leave in these files, and are random: they open nothing anywhere */
export const randomSecrets = () => ({
  appKey: `base64:${randomBytes(32).toString('base64')}`,
  password: (length = 20) => fromAlphabet(ALPHANUMERIC, length),
  hex: (bytes: number) => randomBytes(bytes).toString('hex'),
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
