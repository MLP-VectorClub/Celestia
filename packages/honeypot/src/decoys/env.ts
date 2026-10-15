import type { Secrets } from './secrets';

/** Where the line about the visitor's mother is filled in */
export const VISITORS_MOM = '%%VISITORS_MOM%%';
export const VISITORS_MOM_LBS = '%%VISITORS_MOM_LBS%%';

/**
 * A `.env` somebody should not have left in the web root. Over the top on purpose: far more services than any one site uses (most of them nothing
 * to do with this one), a few jokes, and a pointer to the security policy at the top (which says what these files are), so that nobody who reads it
 * takes it for the real thing. Every value is random
 */
export const envFile = (s: Secrets, siteName: string, securityTxtUrl: string): string => {
  const slug = siteName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'example';
  const host = `${slug}.internal`;
  return `# ${siteName.toUpperCase()} - PRODUCTION SECRETS
# DO NOT COMMIT THIS FILE. DO NOT SHARE THIS FILE. DO NOT PUT THIS FILE IN THE WEB ROOT.
# Found a security problem with this file? Report it the way ${securityTxtUrl} says.

##### application
APP_NAME="${siteName}"
APP_ENV=production
APP_KEY=${s.appKey}
APP_DEBUG=false
APP_URL=https://app.${host}
SECRET_KEY_BASE=${s.hex(64)}
SESSION_SECRET=${s.base64url(32)}
JWT_SECRET=${s.jwtSecret}
ENCRYPTION_KEY=${s.hex(32)}
ADMIN_EMAIL=admin@${host}
ADMIN_PASSWORD=${s.password(14)}
ROOT_PASSWORD=${s.password(18)}
SUPERUSER_TOKEN=${s.hex(24)}

##### databases
DB_CONNECTION=mysql
DB_HOST=10.0.3.14
DB_PORT=3306
DB_DATABASE=production
DB_USERNAME=app_admin
DB_PASSWORD=${s.password(22)}
DATABASE_URL=postgres://postgres:${s.password(24)}@10.0.3.15:5432/${slug}_prod
MONGODB_URI=mongodb+srv://root:${s.password(20)}@cluster0.${s.lower(5)}.mongodb.net/prod?retryWrites=true&w=majority
REDIS_HOST=10.0.3.21
REDIS_PASSWORD=${s.password(32)}
REDIS_PORT=6379
MEMCACHED_SASL_PASSWORD=${s.password(16)}
ELASTICSEARCH_PASSWORD=${s.password(20)}
OPENSEARCH_ADMIN_PASSWORD=${s.password(20)}
CASSANDRA_PASSWORD=${s.password(18)}
INFLUXDB_TOKEN=${s.base64url(48)}
CLICKHOUSE_PASSWORD=${s.password(20)}
NEO4J_AUTH=neo4j/${s.password(16)}
SUPABASE_URL=https://${s.lower(20)}.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${s.base64url(60)}.${s.base64url(32)}
FIREBASE_API_KEY=AIza${s.password(35)}
FIREBASE_PRIVATE_KEY_ID=${s.hex(20)}
PLANETSCALE_PASSWORD=pscale_pw_${s.password(43)}
RABBITMQ_URL=amqp://admin:${s.password(18)}@10.0.3.40:5672/
KAFKA_SASL_PASSWORD=${s.password(32)}

##### mail and messages
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=postmaster@mg.${host}
MAIL_PASSWORD=${s.hex(16)}-${s.hex(4)}-${s.hex(4)}
MAIL_ENCRYPTION=tls
MAILGUN_SECRET=key-${s.lower(32)}
SENDGRID_API_KEY=SG.${s.password(22)}.${s.password(43)}
POSTMARK_TOKEN=${s.uuid()}
MAILCHIMP_API_KEY=${s.hex(16)}-us${s.digits(1)}
RESEND_API_KEY=re_${s.password(8)}_${s.password(24)}
TWILIO_ACCOUNT_SID=AC${s.hex(16)}
TWILIO_AUTH_TOKEN=${s.hex(16)}
VONAGE_API_SECRET=${s.lower(16)}
MESSAGEBIRD_ACCESS_KEY=${s.lower(25)}
SLACK_BOT_TOKEN=xoxb-${s.digits(12)}-${s.digits(13)}-${s.password(24)}
SLACK_SIGNING_SECRET=${s.hex(16)}
DISCORD_BOT_TOKEN=${s.password(24)}.${s.password(6)}.${s.base64url(21)}
TELEGRAM_BOT_TOKEN=${s.digits(10)}:AA${s.base64url(25)}
PUSHER_APP_SECRET=${s.hex(10)}
ABLY_API_KEY=${s.password(6)}.${s.password(6)}:${s.base64url(32)}
ONESIGNAL_REST_API_KEY=os_v2_app_${s.lower(40)}

##### cloud
AWS_ACCESS_KEY_ID=${s.awsAccessKeyId}
AWS_SECRET_ACCESS_KEY=${s.awsSecretAccessKey}
AWS_DEFAULT_REGION=eu-central-1
AWS_BUCKET=prod-backups-${s.hex(3)}
AWS_SESSION_TOKEN=IQoJb3JpZ2luX2Vj${s.base64url(96)}
AZURE_STORAGE_KEY=${s.base64url(64)}==
AZURE_CLIENT_SECRET=${s.password(3)}8Q~${s.password(34)}
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/service-account.json
GOOGLE_CLIENT_SECRET=GOCSPX-${s.password(28)}
GCP_API_KEY=AIza${s.password(35)}
DIGITALOCEAN_TOKEN=dop_v1_${s.hex(32)}
LINODE_TOKEN=${s.hex(32)}
HETZNER_API_TOKEN=${s.password(64)}
CLOUDFLARE_API_TOKEN=${s.base64url(30)}
CLOUDFLARE_GLOBAL_API_KEY=${s.hex(18)}
VERCEL_TOKEN=${s.password(24)}
NETLIFY_AUTH_TOKEN=${s.base64url(32)}
HEROKU_API_KEY=${s.uuid()}
FLY_API_TOKEN=FlyV1 fm2_${s.base64url(60)}
VAULT_TOKEN=hvs.${s.password(24)}
TF_API_TOKEN=${s.password(14)}.atlasv1.${s.password(60)}
KUBE_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6Ij${s.base64url(60)}
DOCKERHUB_TOKEN=dckr_pat_${s.base64url(27)}
CLOUDINARY_URL=cloudinary://${s.digits(15)}:${s.base64url(21)}@${slug}

##### source, builds and monitoring
GITHUB_TOKEN=${s.githubToken}
GITLAB_TOKEN=glpat-${s.password(20)}
BITBUCKET_APP_PASSWORD=ATBB${s.password(32)}
NPM_TOKEN=npm_${s.password(36)}
PYPI_TOKEN=pypi-AgEIcHlwaS5vcmc${s.base64url(60)}
CIRCLECI_TOKEN=${s.hex(20)}
SENTRY_DSN=https://${s.hex(16)}@o${s.digits(7)}.ingest.sentry.io/${s.digits(7)}
SENTRY_AUTH_TOKEN=sntrys_${s.base64url(60)}
DATADOG_API_KEY=${s.hex(16)}
DATADOG_APP_KEY=${s.hex(20)}
NEW_RELIC_LICENSE_KEY=${s.hex(20)}NRAL
GRAFANA_CLOUD_API_KEY=glc_${s.base64url(60)}
PAGERDUTY_API_KEY=u+${s.password(18)}
ROLLBAR_ACCESS_TOKEN=${s.hex(16)}
LOGDNA_INGESTION_KEY=${s.hex(16)}
SONAR_TOKEN=sqp_${s.hex(20)}
CODECOV_TOKEN=${s.uuid()}

##### payments, shops and analytics
STRIPE_KEY=pk_live_${s.password(24)}
STRIPE_SECRET=${s.stripeLive}
STRIPE_WEBHOOK_SECRET=whsec_${s.password(32)}
PAYPAL_CLIENT_ID=A${s.password(79)}
PAYPAL_SECRET=E${s.password(79)}
SQUARE_ACCESS_TOKEN=EAAA${s.password(60)}
BRAINTREE_PRIVATE_KEY=${s.hex(16)}
PLAID_SECRET=${s.hex(15)}
COINBASE_API_SECRET=${s.base64url(32)}
SHOPIFY_ADMIN_TOKEN=shpat_${s.hex(16)}
PATREON_CLIENT_SECRET=${s.base64url(43)}
KOFI_VERIFICATION_TOKEN=${s.uuid()}
SEGMENT_WRITE_KEY=${s.password(32)}
MIXPANEL_SECRET=${s.hex(16)}
ALGOLIA_ADMIN_KEY=${s.hex(16)}
MAPBOX_SECRET_TOKEN=sk.eyJ1Ijoi${s.password(8)}IiwiYSI6${s.base64url(60)}
GOOGLE_MAPS_API_KEY=AIza${s.password(35)}

##### social logins
FACEBOOK_APP_SECRET=${s.hex(16)}
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAA${s.password(36)}
TWITTER_API_SECRET=${s.password(50)}
LINKEDIN_CLIENT_SECRET=${s.password(16)}
SPOTIFY_CLIENT_SECRET=${s.hex(16)}
TWITCH_CLIENT_SECRET=${s.lower(30)}
REDDIT_CLIENT_SECRET=${s.base64url(21)}
STEAM_API_KEY=${s.upper(32).replace(/[2-7]/g, 'A')}
OKTA_CLIENT_SECRET=${s.base64url(48)}
AUTH0_CLIENT_SECRET=${s.base64url(48)}

##### machine learning
OPENAI_API_KEY=sk-proj-${s.base64url(70)}
ANTHROPIC_API_KEY=sk-ant-api03-${s.base64url(75)}
HUGGINGFACE_TOKEN=hf_${s.password(34)}
REPLICATE_API_TOKEN=r8_${s.password(37)}
COHERE_API_KEY=${s.password(40)}
PINECONE_API_KEY=${s.uuid()}
ELEVENLABS_API_KEY=sk_${s.hex(24)}
STABILITY_API_KEY=sk-${s.password(48)}

##### tls and ssh
SSL_CERTIFICATE_PATH=/etc/ssl/certs/${host}.pem
SSL_PRIVATE_KEY_PASSPHRASE=${s.password(20)}
SSL_PRIVATE_KEY="${s.pem('PRIVATE KEY', 1190)}"
SSL_CERTIFICATE="${s.pem('CERTIFICATE', 1100)}"
SSL_CA_BUNDLE="${s.pem('CERTIFICATE', 1100)}"
SSH_DEPLOY_KEY="${s.pem('OPENSSH PRIVATE KEY', 1250)}"
PGP_SIGNING_KEY_PASSPHRASE=${s.password(24)}

##### the important ones
BITCOIN_WALLET_SEED_PHRASE="${s.seedPhrase(12)}"
BITCOIN_WIF=K${s.base58(51)}
ETHEREUM_WALLET_ADDRESS=0x${s.hex(20)}
ETHEREUM_PRIVATE_KEY=0x${s.hex(32)}
ETHEREUM_KEYSTORE_PASSWORD=${s.password(16)}
ETHEREUM_MNEMONIC="${s.seedPhrase(24)}"
METAMASK_VAULT_PASSWORD=${s.password(12)}
SOLANA_PRIVATE_KEY=${s.base58(88)}
LEDGER_RECOVERY_PHRASE="${s.seedPhrase(24)}"
BANK_ACCOUNT_PIN=${s.digits(4)}
SAFE_COMBINATION=${s.digits(2)}-${s.digits(2)}-${s.digits(2)}
NUCLEAR_LAUNCH_CODES=${s.upper(8)}-${s.upper(8)}-${s.upper(8)}
WIFI_PASSWORD=${s.password(12)}
NETFLIX_PASSWORD=${s.password(10)}
MY_CATS_NAME=Fluffernutter
# whoever is reading this, personally:
VISITOR_MOMS_WEIGHT_KG=${VISITORS_MOM}
VISITOR_MOMS_WEIGHT_LBS=${VISITORS_MOM_LBS}
`;
};
