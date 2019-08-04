'use strict';

const OpenSenseMapAdapter = require('./opensensemap-adapter');

module.exports = (addonManager, manifest, errorCallback) => {
  const config = manifest.moziot.config;

  // if (!config.apiKey) {
  //   errorCallback(manifest.name, 'API key must be set!');
  //   return;
  // }

  if (!config.boxes || config.boxes.length === 0) {
    errorCallback(manifest.name, 'No sense boxes configured.');
    return;
  }

  new OpenSenseMapAdapter(addonManager, manifest);
};
