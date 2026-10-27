const { withInfoPlist, withEntitlementsPlist, createRunOncePlugin } = require('@expo/config-plugins');

const APP_GROUP_IDENTIFIER = 'group.com.overtone.music';
const PKG_NAME = 'withWidgets';
const PKG_VERSION = '1.0.1';

/**
 * Expo Config Plugin to configure iOS Live Activities (Dynamic Island),
 * Lock Screen Audio Controls, and App Groups for Home Screen Widgets.
 */
function withWidgets(config) {
  // 1. Configure iOS Info.plist for Live Activities & Background Audio
  config = withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    config.modResults.NSSupportsLiveActivitiesFrequentUpdates = true;
    config.modResults.UIFileSharingEnabled = true;
    config.modResults.LSSupportsOpeningDocumentsInPlace = true;

    const schemes = config.modResults.LSApplicationQueriesSchemes || [];
    if (!schemes.includes('shareddocuments')) {
      schemes.push('shareddocuments');
    }
    config.modResults.LSApplicationQueriesSchemes = schemes;

    const bgModes = config.modResults.UIBackgroundModes || [];
    if (!bgModes.includes('audio')) {
      bgModes.push('audio');
    }
    config.modResults.UIBackgroundModes = bgModes;

    return config;
  });

  // 2. Configure iOS Entitlements for App Groups
  config = withEntitlementsPlist(config, (config) => {
    const existingGroups = config.modResults['com.apple.security.application-groups'] || [];
    if (!existingGroups.includes(APP_GROUP_IDENTIFIER)) {
      existingGroups.push(APP_GROUP_IDENTIFIER);
    }
    config.modResults['com.apple.security.application-groups'] = existingGroups;

    return config;
  });

  return config;
}

module.exports = createRunOncePlugin(withWidgets, PKG_NAME, PKG_VERSION);
