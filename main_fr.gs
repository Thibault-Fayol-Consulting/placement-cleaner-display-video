/**
 * --------------------------------------------------------------------------
 * Placement Cleaner (Display & Video) — Script Google Ads pour PME
 * --------------------------------------------------------------------------
 * Identifie les emplacements automatiques non performants sur les campagnes
 * Display et Video via GAQL, les exclut et envoie un rapport email.
 *
 * Auteur :  Thibault Fayol — Consultant SEA PME
 * Site :    https://thibaultfayol.com
 * Licence : MIT
 * --------------------------------------------------------------------------
 */

var CONFIG = {
  // -- General --
  TEST_MODE: true,                          // Passer a false pour appliquer
  EMAIL: 'contact@votredomaine.com',        // Destinataire des alertes

  // -- Seuils --
  COST_THRESHOLD: 5.00,                     // Depense min (devise du compte) pour signaler
  DATE_RANGE: 'LAST_30_DAYS',              // Periode d analyse
  MIN_CLICKS: 5,                            // Clics min pour considerer

  // -- Patterns suspects (exclus automatiquement) --
  SUSPICIOUS_PATTERNS: [
    'mobileapp::',
    'anonymous.google',
    'adsenseformobileapps.com'
  ],

  // -- Label d exclusion --
  EXCLUSION_LABEL: 'Placement_Exclu'
};

function main() {
  try {
    var today = Utilities.formatDate(new Date(), AdsApp.currentAccount().getTimeZone(), 'yyyy-MM-dd');
    Logger.log('Placement Cleaner — execution du ' + today);

    var costThresholdMicros = CONFIG.COST_THRESHOLD * 1000000;

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

      Logger.log('Mauvais emplacement : ' + placementUrl + ' | Cout : ' + cost + ' | Clics : ' + clicks + ' | Campagne : ' + campName);

      excluded.push({
        url: placementUrl,
        cost: cost,
        clicks: clicks,
        campaign: campName,
        adGroupId: adGroupId
      });
    }

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
        suspicious.push(pattern + ' (Campagne : ' + camp.getName() + ')');
      }
    }

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

    var totalExcluded = excluded.length;
    Logger.log('Emplacements non performants : ' + totalExcluded);
    Logger.log('Exclusions patterns suspects : ' + suspicious.length);

    if ((totalExcluded > 0 || suspicious.length > 0) && !CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@votredomaine.com') {
      var lines = ['Date : ' + today, 'Compte : ' + AdsApp.currentAccount().getName(), ''];
      lines.push('=== Emplacements non performants (' + totalExcluded + ') ===');
      for (var k = 0; k < excluded.length; k++) {
        var e = excluded[k];
        lines.push(e.url + ' | Cout : ' + e.cost + ' | Clics : ' + e.clicks + ' | ' + e.campaign);
      }
      lines.push('');
      lines.push('=== Exclusions patterns suspects (' + suspicious.length + ') ===');
      for (var s = 0; s < suspicious.length; s++) {
        lines.push(suspicious[s]);
      }

      MailApp.sendEmail(
        CONFIG.EMAIL,
        'Placement Cleaner — ' + totalExcluded + ' emplacement(s) exclu(s)',
        lines.join('\n')
      );
    }

  } catch (e) {
    Logger.log('ERREUR FATALE : ' + e.message);
    if (!CONFIG.TEST_MODE && CONFIG.EMAIL !== 'contact@votredomaine.com') {
      MailApp.sendEmail(CONFIG.EMAIL, 'Placement Cleaner — Erreur', e.message);
    }
  }
}
