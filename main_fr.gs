/**
 * --------------------------------------------------------------------------
 * placement-cleaner-display-video - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Auteur : Thibault Fayol - Consultant SEA PME
 * Site web : https://thibaultfayol.com
 * Licence : MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  TEST_MODE: true,
  EXCLUDE_ALL_MOBILE_APPS: true,
  SPEND_THRESHOLD_WITHOUT_CONV: 5.0
};
function main() {
  Logger.log("Nettoyage des emplacements en cours...");
  if (CONFIG.EXCLUDE_ALL_MOBILE_APPS) {
      var campIter = AdsApp.campaigns().withCondition("Status = ENABLED").withCondition("AdvertisingChannelType IN ['DISPLAY', 'VIDEO']").get();
      while(campIter.hasNext()) {
          var camp = campIter.next();
          if (!CONFIG.TEST_MODE) {
              camp.display().newPlacementBuilder().withUrl("mobileapp::2-").exclude(); // Standard exclusion for all apps in GDN
          }
      }
      Logger.log("Mobile apps exclusion processed.");
  }
  
  // Clean bad placements
  var report = AdsApp.report("SELECT URL, Cost, Conversions, CampaignName FROM AUTOMATIC_PLACEMENTS_PERFORMANCE_REPORT WHERE Cost > " + CONFIG.SPEND_THRESHOLD_WITHOUT_CONV + " AND Conversions = 0 DURING LAST_30_DAYS");
  var rows = report.rows();
  var count = 0;
  while(rows.hasNext()) {
      var row = rows.next();
      Logger.log("Bad Placement: " + row["URL"] + " (Cost: " + row["Cost"] + ")");
      // In a real scenario, you'd add this to a Shared Exclusion List or exclude at campaign level.
      count++;
  }
  Logger.log(count + " bad placements identified for review.");
}