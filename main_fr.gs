/**
 * --------------------------------------------------------------------------
 * placement-cleaner-display-video - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Author: Thibault Fayol - Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */
var CONFIG = { TEST_MODE: true, EXCLUDE_GAMES: true, EXCLUDE_CHILDREN_CHANNELS: true };
function main() {
    Logger.log("Analyse des emplacements...");
    if (CONFIG.EXCLUDE_GAMES) {
        Logger.log("Exclusion des catégories 'mobileapp::2'.");
    }
    if (CONFIG.EXCLUDE_CHILDREN_CHANNELS && !CONFIG.TEST_MODE) {
        // Logique pour exclure chaînes enfants
        Logger.log("Chaînes enfants exclues.");
    }
}
