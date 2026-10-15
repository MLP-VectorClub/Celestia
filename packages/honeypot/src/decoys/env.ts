import type { Secrets } from './secrets';

/** A `.env` somebody should not have left in the web root: a Laravel-looking one, with a bit of everything */
export const envFile = (s: Secrets, siteName: string): string =>
  `APP_NAME="${siteName}"
APP_ENV=production
APP_KEY=${s.appKey}
APP_DEBUG=false
APP_URL=https://app.${siteName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'example'}.internal

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=10.0.3.14
DB_PORT=3306
DB_DATABASE=production
DB_USERNAME=app_admin
DB_PASSWORD=${s.password(22)}

REDIS_HOST=10.0.3.21
REDIS_PASSWORD=${s.password(32)}
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=postmaster@mg.internal
MAIL_PASSWORD=${s.hex(16)}-${s.hex(4)}-${s.hex(4)}
MAIL_ENCRYPTION=tls

AWS_ACCESS_KEY_ID=${s.awsAccessKeyId}
AWS_SECRET_ACCESS_KEY=${s.awsSecretAccessKey}
AWS_DEFAULT_REGION=eu-central-1
AWS_BUCKET=prod-backups-${s.hex(3)}

STRIPE_KEY=pk_live_${s.password(24)}
STRIPE_SECRET=${s.stripeLive}
STRIPE_WEBHOOK_SECRET=whsec_${s.password(32)}

JWT_SECRET=${s.jwtSecret}
GITHUB_TOKEN=${s.githubToken}
SENTRY_LARAVEL_DSN=https://${s.hex(16)}@o${s.hex(3).replace(/[a-f]/g, '1')}.ingest.sentry.io/${s.hex(3).replace(/[a-f]/g, '7')}

ADMIN_EMAIL=admin@${siteName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'example'}.internal
ADMIN_PASSWORD=${s.password(14)}
`;
