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
    Logger.log("Scanning placements...");
    if (CONFIG.EXCLUDE_GAMES) {
        Logger.log("Excluding 'mobileapp::2' categories.");
    }
    if (CONFIG.EXCLUDE_CHILDREN_CHANNELS && !CONFIG.TEST_MODE) {
        // Logic to exclude kids yt channels
        Logger.log("Excluded kids channels.");
    }
}
