/**
 * src/utils/theocraticSecurity.ts
 *
 * Barril de compatibilidad: la implementación vive en src/utils/security/*.
 * Los importadores existentes siguen funcionando sin cambios; el código nuevo debería
 * importar directamente del módulo concreto.
 */

export { encryptTheocraticData, decryptTheocraticData } from './security/passphraseCrypto.ts';
export type { EncryptedPayload } from './security/passphraseCrypto.ts';
export { getSecureRandomBytes, secureRandomInt } from './security/random.ts';
export { SLOW_HASH_PREFIX, DEFAULT_SLOW_HASH_ITERATIONS, hashPasscode, hashPasscodeSlow, isSlowHash, verifyPasscode } from './security/slowHash.ts';
export { maskPhoneNumber, maskHomeAddress, maskPrivateNotes } from './security/masking.ts';
export { generateMilitaryGradeCongregationId, formatCanonicalCongregationId, formatCongregationIdInput, formatCongregationPinInput, isValidCongregationPinLength, countCongregationPinChars, MIN_CONGREGATION_PIN_CHARS, generateSecureCongregationPin, generateSecurePublisherPin, generateSecureRolePin, generateSecureMasterPin } from './security/congregationCredentials.ts';
export { evaluatePinStrength, getPinLockoutRemainingSeconds, recordFailedPinAttempt, resetFailedPinAttempts } from './security/pinPolicy.ts';
export type { PinStrengthResult } from './security/pinPolicy.ts';
export { isSafeDemoMode, isCongregationIdString, getFriendlyCongregationName, sanitizeForFirestore, GENERIC_IDENTITY_NAMES, isGenericIdentityName } from './congregationIdentity.ts';
export { sha256HexSync } from './security/sha256.ts';
export { normalizePersonalPinInput, hashPersonalPin } from './security/personalPin.ts';
export { getDeviceEntropySalt, encryptPinAtRest, isEncryptedPinAtRest, decryptPinAtRest, verifyPersonalPinMatch, setSecureLocalPin, getSecureLocalPin, verifySecureLocalPin, AT_REST_CIPHER_KEY } from './security/atRestPin.ts';
export { getSensitiveDataAtRestKey, encryptSensitiveFieldAtRest, decryptSensitiveFieldAtRest, sanitizePublishersForLocalStorage, restorePublishersFromLocalStorage, sanitizePinRecordsForLocalStorage, restorePinRecordsFromLocalStorage, sanitizeShepherdingVisitsForLocalStorage, restoreShepherdingVisitsFromLocalStorage, sanitizeTransactionsForLocalStorage, restoreTransactionsFromLocalStorage, sanitizeAuditsForLocalStorage, restoreAuditsFromLocalStorage } from './security/sensitiveFields.ts';
export { SERVER_ROLE_TOKEN_STORAGE_KEY, parseServerRoleToken, signRoleSession, verifyRoleSessionSignature } from './security/roleSession.ts';
export type { ParsedServerRoleToken } from './security/roleSession.ts';
export { generateSecureInvitationCode, encodeSecureShareToken, decodeSecureShareToken } from './security/shareTokens.ts';
export type { SecureShareTokenPayload } from './security/shareTokens.ts';
export { sanitizeImportedBackupObject, computeBackupIntegritySeal, verifyBackupIntegritySeal } from './security/backupIntegrity.ts';
export { hashInvitationCode, hashInvitationCodeV1, verifyInvitationCodeMatch, sanitizeInvitationsForPublicPayload } from './security/invitations.ts';
export { computeAssignmentConfirmSignature, verifyAssignmentConfirmSignature } from './security/assignmentSignature.ts';
export { sanitizeCsvFormulaInjection, sanitizeImportedCsvText, openSafeExternalUrl } from './security/inputSanitizing.ts';
export { packageDepartmentCompartment, unpackageDepartmentCompartment, packagePersonalCompartment, unpackagePersonalCompartment } from './security/compartments.ts';
export type { WrappedKey, EncryptedCompartmentEnvelope, EncryptedPersonalEnvelope } from './security/compartments.ts';
