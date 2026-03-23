# Placement Cleaner (Display & Video)

> Google Ads Script for SMBs — Automatically exclude wasteful placements on Display and Video campaigns.

## What it does

This script queries the `group_placement_view` via GAQL to find automatic placements that spent money without converting. It excludes those placements at the ad group level and also blocks known suspicious patterns (mobile apps, anonymous placements). An email report lists all excluded placements with their cost and click data.

## Setup

1. Open Google Ads > Tools > Scripts
2. Create a new script and paste the code from `main_en.gs` (or `main_fr.gs` for French)
3. Update the `CONFIG` block at the top
4. Authorize and run a preview first
5. Schedule: **Weekly**

## CONFIG reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `TEST_MODE` | `true` | When true, logs placements without excluding them |
| `EMAIL` | `contact@yourdomain.com` | Email address for exclusion reports |
| `COST_THRESHOLD` | `5.00` | Minimum spend to flag a placement |
| `DATE_RANGE` | `LAST_30_DAYS` | Lookback period for placement data |
| `MIN_CLICKS` | `5` | Minimum clicks to consider a placement |
| `SUSPICIOUS_PATTERNS` | `['mobileapp::',...]` | URL patterns auto-excluded regardless of performance |
| `EXCLUSION_LABEL` | `Placement_Excluded` | Label for tracking |

## How it works

1. Runs a GAQL query on `group_placement_view` for Display/Video campaigns
2. Filters placements with spend above threshold, clicks above minimum, and zero conversions
3. Excludes wasteful placements at the ad group level using `newPlacementExclusionBuilder()`
4. Excludes suspicious URL patterns (mobile apps, anonymous) from all campaigns
5. Sends an email report of all exclusions

## Requirements

- Google Ads account with Display or Video campaigns
- Google Ads Scripts access

## License

MIT — Thibault Fayol Consulting
