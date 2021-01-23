import { range } from 'lodash';
import Axios from 'axios';
import { ReactQueryConfig } from 'react-query/types/core/types';
import { GuideName } from 'src/types';

export const APP_NAME = 'MLP Vector Club';
export const APP_URL = process.env.NEXT_PUBLIC_FRONTEND_HOST as string;
export const API_URL = process.env.NEXT_PUBLIC_BACKEND_HOST as string;
export const OLD_SITE_URL = 'https://mlpvector.club';

export const GITHUB_URL = 'https://github.com/MLP-VectorClub/Celestia';
export const PROJECT_NAME = GITHUB_URL.split('/').pop();
export const BACKEND_GITHUB_URL = 'https://github.com/MLP-VectorClub/Luna';
export const BACKEND_PROJECT_NAME = BACKEND_GITHUB_URL.split('/').pop();
export const CLUB_URL = 'https://www.deviantart.com/mlp-vectorclub';
export const DISCORD_INVITE_LINK = 'https://discord.gg/hrffb8k';
export const DEV_EMAIL = 'david@seinopsys.dev';

export const DEV_ENV = process.env.NODE_ENV !== 'production';
export const API_DOCS_URL = API_URL as string;

/**
 * Global prefix for all api calls, no trailing slash
 */
export const API_PREFIX = '/api';
Axios.defaults.baseURL = typeof window === 'undefined' ? process.env.NEXT_PUBLIC_BACKEND_HOST : API_PREFIX;

export const GUEST_AVATAR = '/img/guest.svg';

export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

export const GUIDE_NAMES: GuideName[] = ['pony', 'eqg', 'pl'];

export const GUIDE_PAGE_SIZES = range(7, 20 + 1);

export const REACT_QUERY_CONFIG: ReactQueryConfig = {
  queries: {
    staleTime: 60e3,
    keepPreviousData: true,
  },
};
