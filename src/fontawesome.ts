import { config, library } from '@fortawesome/fontawesome-svg-core';
import {
  faDeviantart,
  faDiscord,
  faTelegram,
  faTwitter,
  faVk,
  faWhatsapp,
} from '@fortawesome/free-brands-svg-icons';
import {
  faArrowCircleLeft,
  faArrowDown,
  faArrowUp,
  faBars,
  faCaretDown,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleNotch,
  faClipboard,
  faClock,
  faDownload,
  faEllipsisH,
  faEnvelope,
  faExclamationTriangle,
  faExternalLinkAlt,
  faEye,
  faEyeDropper,
  faEyeSlash,
  faFolder,
  faGlobe,
  faGlobeAmericas,
  faHardHat,
  faHome,
  faImage,
  faInfo,
  faPaintBrush,
  faPencilAlt,
  faPlus,
  faSearch,
  faShare,
  faSignInAlt,
  faSignOutAlt,
  faSort,
  faSync,
  faTag,
  faTags,
  faThumbtack,
  faTimes,
  faTrash,
  faUser,
  faUserPlus,
  faUsers,
  faVideo,
} from '@fortawesome/free-solid-svg-icons';

// Tell Font Awesome to skip adding the CSS automatically since it's being imported
config.autoAddCss = false;

const brandIcons = [
  faDeviantart,
  faDiscord,
  faTelegram,
  faTwitter,
  faVk,
  faWhatsapp,
];

// List of used icons - amend if new icons are needed
library.add(
  ...brandIcons,
  faEye,
  faTag,
  faInfo,
  faBars,
  faSync,
  faHome,
  faPlus,
  faSort,
  faInfo,
  faUser,
  faTags,
  faCheck,
  faClock,
  faGlobe,
  faTimes,
  faUsers,
  faTrash,
  faImage,
  faShare,
  faVideo,
  faFolder,
  faSearch,
  faHardHat,
  faArrowUp,
  faEnvelope,
  faEyeSlash,
  faUserPlus,
  faDownload,
  faPencilAlt,
  faArrowDown,
  faSignInAlt,
  faEllipsisH,
  faChevronUp,
  faCaretDown,
  faClipboard,
  faThumbtack,
  faPaintBrush,
  faEyeDropper,
  faSignOutAlt,
  faChevronLeft,
  faChevronDown,
  faCircleNotch,
  faCheckCircle,
  faChevronRight,
  faGlobeAmericas,
  faExternalLinkAlt,
  faArrowCircleLeft,
  faExclamationTriangle,
);
