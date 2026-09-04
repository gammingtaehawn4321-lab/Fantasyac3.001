export const FANTASYAC_APP_ID = 'com.fantasyac.game';
export const FANTASYAC_INDEXED_DB_NAME = 'fantasyak';

/**
 * Native wrappers MUST keep the same app/bundle id between releases.
 * Save DB and user content must never be stored under the replaceable web asset directory.
 */
export const USER_DATA_POLICY = {
  preserveIndexedDbAcrossUpdates: true,
  backupBeforeUpdate: true,
  userContentIsReplaceable: false,
  appId: FANTASYAC_APP_ID,
} as const;
