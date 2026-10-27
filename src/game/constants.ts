// Structural constants of the simulation (not balance numbers; those live in data/).

/** Fixed simulation step in real seconds. */
export const TICK = 0.1;
/** Max real seconds the accumulator processes per frame before switching to offline math. */
export const MAX_FRAME_SECONDS = 1;
/** Hidden-tab threshold (real seconds) after which offline math is applied. */
export const OFFLINE_THRESHOLD_SECONDS = 30;
/** How often the engine publishes to the UI store (Hz). */
export const PUBLISH_HZ = 10;
/** Save format version. */
export const SAVE_VERSION = 1;
export const SAVE_KEY = 'cdt-save';
export const SAVE_BACKUP_KEY = 'cdt-save-backup';
export const SETTINGS_KEY = 'cdt-settings';
/** Autosave interval in real seconds. */
export const AUTOSAVE_SECONDS = 10;
/** Seconds of income history kept for offline and income-per-minute. */
export const INCOME_RING_SECONDS = 180;
export const MAX_REVIEWS = 20;
export const MAX_PARTICLES = 400;
export const MAX_DPR = 2.5;
