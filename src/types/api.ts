/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * DO NOT EDIT THIS FILE DIRECTLY! - GENERATE IT USING yarn run api:types INSTEAD
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

/**
 * List of supported avatar providers
 */
export type AvatarProvider = "deviantart" | "discord" | "gravatar";

/**
 * List of available color guides
 */
export type GuideName = "pony" | "eqg" | "pl";

/**
 * List of recognized MLP generations
 */
export type MlpGeneration = "pony" | "pl";

/**
 * List of roles values that can be stored by the backend
 */
export type DatabaseRole = "user" | "member" | "assistant" | "staff" | "admin" | "developer";

/**
 * List of roles values that can be publicly displayed
 */
export type Role = "user" | "member" | "assistant" | "staff" | "admin";

/**
 * List of types that can be used for show entries
 */
export type ShowType = "episode" | "movie" | "short" | "special";

/**
 * List of available social signin providers
 */
export type SocialProvider = "deviantart" | "discord";

/**
 * List of available sprite sizes
 */
export type SpriteSize = 300 | 600;

/**
 * List of types tags in the color guide can have
 */
export type TagType = "app" | "cat" | "gen" | "spec" | "char" | "warn";

/**
 * List of available user preferences
 */
export type UserPrefKeys =
  | "cgItemsperpage"
  | "cgHidesynon"
  | "cgHideclrinfo"
  | "cgFulllstprev"
  | "cgNutshell"
  | "cgDefaultguide"
  | "pAvatarprov"
  | "pVectorapp"
  | "pHidediscord"
  | "pHidepcg"
  | "pHomelastep"
  | "epHidesynopses"
  | "epNoappprev"
  | "epRevstepbtn"
  | "aPcgearn"
  | "aPcgmake"
  | "aPcgsprite"
  | "aPostreq"
  | "aPostres"
  | "aReserve"
  | "pcgSlots";

/**
 * List of available vector apps
 */
export type VectorApp = "illustrator" | "inkscape" | "ponyscape";

/**
 * An object containing the number of entries in each color guide
 */
export interface GuideEntryCounts {
  pony: number;
  eqg: number;
  pl: number;
}

/**
 * A list of preferences for the current user (or defaults if not signed in)
 */
export interface UserPrefs {
  cgItemsperpage: number;
  cgHidesynon: boolean;
  cgHideclrinfo: boolean;
  cgFulllstprev: boolean;
  cgNutshell: boolean;
  cgDefaultguide: GuideName;
  pAvatarprov: AvatarProvider;
  pVectorapp: VectorApp;
  pHidediscord: boolean;
  pHidepcg: boolean;
  pHomelastep: boolean;
  epHidesynopses: boolean;
  epNoappprev: boolean;
  epRevstepbtn: boolean;
  aPcgearn: boolean;
  aPcgmake: boolean;
  aPcgsprite: boolean;
  aPostreq: boolean;
  aPostres: boolean;
  aReserve: boolean;
  pcgSlots: number;
}

/**
 * An object containing information about the connection made to the server
 */
export interface ConnectionInfo {
  /**
   * The IP address the server believes this request originated from
   */
  ip: string;
  /**
   * The value of the X-Forwarded-For HTTP header as received by the server
   */
  proxiedIps: string;
}

export type SlimAppearanceList = ErrorResponse & {
  appearances: SlimAppearance[];
};

/**
 * An array of appearances under the appearances key
 */
export interface AppearanceList {
  appearances: Appearance[];
}

/**
 * Optional parameter that indicates whether you would like to get preview image data with the request. Typically unnecessary unless you want to display a temporary image while the larger image loads.
 */
export type PreviewsIndicator = true;

/**
 * Used for displaying items in a specific order. The API guarantees that array return values are sorted in ascending order based on this property.
 */
export type Order = number;

/**
 * Array of color groups under the `colorGroups` key
 */
export interface ListOfColorGroups {
  /**
   * Array of color groups belonging to an appearance (may be an empty array).
   */
  colorGroups: ColorGroup[];
}

/**
 * Common properties of the two Appearance schemas
 */
export interface CommonAppearance {
  id: ZeroBasedId;
  /**
   * The name of the appearance
   */
  label: string;
  order: Order;
  /**
   * The sprite that belongs to this appearance, or null if there is none
   */
  sprite: Sprite;
  /**
   * Indicates whether there are any cutie marks tied to this appearance
   */
  hasCutieMarks: boolean;
}

/**
 * Represents properties that belong to the slim appearance object only
 */
export type SlimAppearanceOnly = CommonAppearance;

/**
 * A less heavy version of the regular Appearance schema
 */
export type SlimAppearance = CommonAppearance & SlimAppearanceOnly;

/**
 * Represents properties that belong to the full appearance object only
 */
export interface AppearanceOnly {
  created_at: IsoStandardDate;
  notes: string;
  tags: SlimGuideTag[];
}

/**
 * Represents an entry in the color guide
 */
export type Appearance = CommonAppearance & AppearanceOnly & ListOfColorGroups;

export interface SlimGuideTag {
  id?: OneBasedId;
  /**
   * Tag name (all lowercase)
   */
  name?: string;
  type?: TagType;
  [k: string]: any;
}

/**
 * Data related to an appearance's sprite file. The actual file is available from a different endpoint.
 */
export interface Sprite {
  /**
   * The full URL of the current sprite image
   */
  path: string;
  /**
   * The width and height of the sprite expressed in the smallest numbers possible while retaining the same aspect ratio. Useful for calculating placeholder element sizes.
   */
  aspectRatio: number[];
}

/**
 * Groups a list of colors
 */
export interface ColorGroup {
  id: OneBasedId;
  /**
   * The name of the color group
   */
  label: string;
  order: Order;
  /**
   * The list of colors inside this group
   */
  colors: Color[];
}

/**
 * A color entry
 */
export interface Color {
  id: OneBasedId;
  /**
   * The name of the color
   */
  label: string;
  order: Order;
  /**
   * The color value in uppercase hexadecimal form, including a # prefix
   */
  hex: string;
}

export type GuidePageSize = number;

export type AppearanceToken = string;

/**
 * Contains a URL that most clients will automatically redirect to for 301 and 302 responses
 */
export type LocationHeader = string;

export interface SigninRequest {
  email: string;
  password: string;
  /**
   * When using session-based auth set to true for persistent cookies, omit or use false for session cookies
   */
  remember?: boolean;
}

export interface OauthCode {
  /**
   * The authorization code received from the provider
   */
  code: string;
}

export interface RegistrationRequest {
  name: string;
  email: string;
  password: string;
}

export interface ErrorResponse {
  /**
   * An error message describing what caused the request to fail
   */
  message: string;
}

/**
 * An ISO 8601 standard compliant date as a string
 */
export type IsoStandardDate = string;

export type ValidationErrorResponse = {
  /**
   * A map containing error messages for each field that did not pass validation
   */
  errors: {
    [k: string]: string[];
  };
} & ErrorResponse;

/**
 * A query parameter used for specifying which page is currently being displayed
 */
export type PageNumber = number;

export type File = string;

export type SVGFile = string;

export type QueryString = string;

export type OneBasedId = number;

export type ZeroBasedId = number;

/**
 * Contains publicly accessible properties of useful links
 */
export interface PublicUsefulLink {
  id: OneBasedId;
  /**
   * The URL this link points to
   */
  url: string;
  /**
   * The link text to display on the page
   */
  label: string;
  /**
   * The title text associated with the link providing additional context about why it's useful
   */
  title?: string;
  order: Order;
}

/**
 * Contains all stored properties of useful links
 */
export type UsefulLink = PublicUsefulLink & {
  /**
   * The minimum role required to be able to see this link in application the sidebar
   */
  minrole: string;
};

/**
 * Represents a publicly accessible representation of a user
 */
export interface PublicUser {
  id: number;
  name: string;
  role: Role;
  avatarUrl: string;
  avatarProvider: AvatarProvider;
}

export type User = PublicUser & {
  email: string;
  role: DatabaseRole;
};

export interface Token {
  id: number;
  /**
   * Name of the token, either generated (from OS and browser version) or user-supplied if renamed
   */
  name: string;
  lastUsedAt: IsoStandardDate;
  createdAt: IsoStandardDate;
}

export interface PageData {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * An object containing information related to the verion of this appilcation that's currently running on the server
 */
export interface CommitData {
  /**
   * Abbreviated commit ID of the backend application, indicating the version currently deployed on the server (at least 7 characters long)
   */
  commitId: string;
  /**
   * Date at which the commit currently deployed on the server was authored
   */
  commitTime: IsoStandardDate;
}

/**
 * List of supported application-wide settings
 */
export type AppSettings = "dev_role_label";

export interface GetAboutConnectionRequest {
}
export interface GetAppearancesRequest {
  guide: GuideName
  page: PageNumber
  size: GuidePageSize
  q: QueryString
}
export interface GetAppearancesAllRequest {
  guide: GuideName
}
export interface GetAppearancesIdColorGroupsRequest {
  id: ZeroBasedId
}
export interface GetAppearancesIdSpriteRequest {
  id: ZeroBasedId
  size: SpriteSize
  token: AppearanceToken
}
export interface GetAppearancesIdPreviewRequest {
  id: ZeroBasedId
  token: AppearanceToken
}
export type PostUsersSigninRequest = SigninRequest
export interface GetUsersOauthSigninProviderRequest {
  provider: SocialProvider
}
export type PostUsersOauthSigninProviderRequest = OauthCode
export type PostUsersRequest = RegistrationRequest
export interface GetColorGuidesRequest {
}
export interface GetSanctumCsrfCookieRequest {
}
export interface GetUsefulLinksSidebarRequest {
}
export interface GetUserPrefsMeRequest {
}
export interface GetUsersMeRequest {
}
export interface GetUsersDaUsernameRequest {
  username: string
}
export interface GetUsersIdRequest {
  id: OneBasedId
}
export interface PostUsersSignoutRequest {
}
export interface GetUsersTokensRequest {
}
export interface DeleteUsersTokensIdRequest {
  id: number
}
export type GetAboutConnectionResult = ConnectionInfo & CommitData;

export type GetAppearancesResult = AppearanceList & PageData;

export type GetAppearancesAllResult = SlimAppearanceList;

export type GetAppearancesIdColorGroupsResult = ListOfColorGroups;

export type GetAppearancesIdSpriteResult = any
export type GetAppearancesIdSprite302 = any
export type GetAppearancesIdPreviewResult = any
export interface PostUsersSigninResult {
  token?: string;
}

export type PostUsersSignin204 = any
export type GetUsersOauthSigninProviderResult = any
export interface PostUsersOauthSigninProviderResult {
  token?: string;
}

export type PostUsersOauthSigninProvider204 = any
export interface PostUsersResult {
  token?: string;
}

export type PostUsers204 = any
export interface GetColorGuidesResult {
  entryCounts: GuideEntryCounts;
}

export type GetSanctumCsrfCookieResult = any
export type GetUsefulLinksSidebarResult = PublicUsefulLink[];

export type GetUserPrefsMeResult = UserPrefs;

export type GetUsersMeResult = User;

export type GetUsersDaUsernameResult = PublicUser;

export type GetUsersIdResult = PublicUser;

export type PostUsersSignoutResult = any
export interface GetUsersTokensResult {
  /**
   * ID of the token used to make this request. Will be null if the request is authenticated through CookieAuth
   */
  currentTokenId: number;
  /**
   * A list of tokens that belong to the user
   */
  tokens: Token[];
}

export type DeleteUsersTokensIdResult = any