/**
 * --------------------------------------------------------------------------
 * Placement Cleaner (Display & Video) — Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Identifies wasteful automatic placements on Display and Video campaigns
 * using GAQL, excludes them, and sends an email report.
 *
 * Author:  Thibault Fayol — Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  // -- General --
  TEST_MODE: true,                          // Set to false to apply exclusions
  EMAIL: 'contact@yourdomain.com',          // Alert recipient

  // -- Thresholds --
  COST_THRESHOLD: 5.00,                     // Min spend (account currency) to flag a placement
  DATE_RANGE: 'LAST_30_DAYS',              // Lookback period
  MIN_CLICKS: 5,                            // Min clicks to consider

  // -- Suspicious patterns (auto-excluded regardless of performance) --
  SUSPICIOUS_PATTERNS: [
    'mobileapp::',
    'anonymous.google',
    'adsenseformobileapps.com'
  ],

  // -- Exclusion label --
  EXCLUSION_LABEL: 'Placement_Excluded'
};

function main() {
  try {
    var today = Utilities.formatDate(new Date(), AdsApp.currentAccount().getTimeZone(), 'yyyy-MM-dd');
    Logger.log('Placement Cleaner — run started ' + today);

    var costThresholdMicros = CONFIG.COST_THRESHOLD * 1000000;

    // Query wasteful placements via GAQL
    var query = 'SELECT group_placement_view.display_name, '
      + 'group_placement_view.target_url, '
      + 'metrics.cost_micros, '
      + 'metrics.clicks, '
      + 'metrics.conversions, '
      + 'campaign.name, '
      + 'campaign.id, '
      + 'ad_group.id '
      + 'FROM group_placement_view '
      + 'WHERE campaign.advertising_channel_type IN (\'DISPLAY\', \'VIDEO\') '
      + 'AND metrics.cost_micros > ' + costThresholdMicros + ' '
      + 'AND metrics.clicks > ' + CONFIG.MIN_CLICKS + ' '
      + 'AND metrics.conversions = 0 '
      + 'AND segments.date DURING ' + CONFIG.DATE_RANGE;

    var rows = AdsApp.search(query);
    var excluded = [];
    var suspicious = [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var placementUrl = row.groupPlacementView.targetUrl || row.groupPlacementView.displayName;
      var cost = (row.metrics.costMicros / 1000000).toFixed(2);
      var clicks = row.metrics.clicks;
      var campName = row.campaign.name;
      var adGroupId = row.adGroup.id;

      Logger.log('Bad placement: ' + placementUrl + ' | Cost: ' + cost + ' | Clicks: ' + clicks + ' | Campaign: ' + campName);

      excluded.push({
        url: placementUrl,
        cost: cost,
        clicks: clicks,
        campaign: campName,
        adGroupId: adGroupId
      });
    }

    // Exclude suspicious patterns from all Display/Video campaigns
    var campIter = AdsApp.campaigns()
      .withCondition('Status = ENABLED')
      .get();

    while (campIter.hasNext()) {
      var camp = campIter.next();
      for (var p = 0; p < CONFIG.SUSPICIOUS_PATTERNS.length; p++) {
        var pattern = CONFIG.SUSPICIOUS_PATTERNS[p];
        if (!CONFIG.TEST_MODE) {
          camp.display().newPlacementExclusionBuilder()
            .withUrl(pattern)
            .build();
        }
        suspicious.push(pattern + ' (Campaign: ' + camp.getName() + ')');
      }
    }

    // Exclude wasteful placements at ad group level
    if (!CONFIG.TEST_MODE && excluded.length > 0) {
      for (var j = 0; j < excluded.length; j++) {
        var placement = excluded[j];
        var adGroupIter = AdsApp.adGroups().withIds([placement.adGroupId]).get();
        if (adGroupIter.hasNext()) {
          var adGroup = adGroupIter.next();
          adGroup.display().newPlacementExclusionBuilder()
            .withUrl(placement.url)
            .build();
        }
      }
    }

    // Email report
    var totalExcluded = excluded.length;
    Logger.log('Wasteful placements found: ' + totalExcluded);
    Logger.log('Suspicious pattern exclusions: ' + suspicious.length);

    if ((totalExcluded > 0 || suspicious.length > 0) && !CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@yourdomain.com') {
      var lines = ['Date: ' + today, 'Account: ' + AdsApp.currentAccount().getName(), ''];
      lines.push('=== Wasteful Placements (' + totalExcluded + ') ===');
      for (var k = 0; k < excluded.length; k++) {
        var e = excluded[k];
        lines.push(e.url + ' | Cost: ' + e.cost + ' | Clicks: ' + e.clicks + ' | ' + e.campaign);
      }
      lines.push('');
      lines.push('=== Suspicious Pattern Exclusions (' + suspicious.length + ') ===');
      for (var s = 0; s < suspicious.length; s++) {
        lines.push(suspicious[s]);
      }

      MailApp.sendEmail(
        CONFIG.EMAIL,
        'Placement Cleaner — ' + totalExcluded + ' placement(s) excluded',
        lines.join('\n')
      );
    }

  } catch (e) {
    Logger.log('FATAL ERROR: ' + e.message);
    if (!CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@yourdomain.com') {
      MailApp.sendEmail(CONFIG.EMAIL, 'Placement Cleaner — Error', e.message);
    }
  }
}
