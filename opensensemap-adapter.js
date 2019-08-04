/**
 * opensensemap-adapter.js
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const {Adapter} = require('gateway-addon');
const OpenSenseMapDevice = require('./opensensemap-device');

class OpenSenseMapAdapter extends Adapter {
  constructor(addonManager, manifest) {
    super(addonManager, manifest.name, manifest.name);
    addonManager.addAdapter(this);

    this.knownBoxes = new Set();
    this.config = manifest.moziot.config;

    this.startPairing();
  }

  /**
   * Example process to add a new device to the adapter.
   *
   * The important part is to call: `this.handleDeviceAdded(device)`
   *
   * @param {String} deviceId ID of the device to add.
   * @param {String} deviceDescription Description of the device to add.
   * @return {Promise} which resolves to the device added.
   */
  // addDevice(deviceId, deviceDescription) {
  //   return new Promise((resolve, reject) => {
  //     if (deviceId in this.devices) {
  //       reject(`Device: ${deviceId} already exists.`);
  //     } else {
  //       const device = new OpenSenseMapDevice(this, deviceId, deviceDescription);
  //       this.handleDeviceAdded(device);
  //       resolve(device);
  //     }
  //   });
  // }

  /**
   * Example process ro remove a device from the adapter.
   *
   * The important part is to call: `this.handleDeviceRemoved(device)`
   *
   * @param {String} deviceId ID of the device to remove.
   * @return {Promise} which resolves to the device removed.
   */
  // removeDevice(deviceId) {
  //   return new Promise((resolve, reject) => {
  //     const device = this.devices[deviceId];
  //     if (device) {
  //       this.handleDeviceRemoved(device);
  //       resolve(device);
  //     } else {
  //       reject(`Device: ${deviceId} not found.`);
  //     }
  //   });
  // }

  /**
  * Attempt to add any configured boxes.
  */
  startPairing(_timeoutSeconds) {
    console.log('OpenSenseMapAdapter:', this.name,
      'id', this.id, 'pairing started');

    for (const box of this.config.boxes) {
      if (this.knownBoxes.has(box)) {
        continue;
      }

      this.knownBoxes.add(box);

      const dev = new OpenSenseMapDevice(
        this,
        box,
        // this.config.apiKey,
        this.config.pollInterval
      );
      dev.promise.then(() => this.handleDeviceAdded(dev));
    }
  }
  
  

  /**
   * Cancel the pairing/discovery process.
   */
  cancelPairing() {
    console.log('OpenSenseMapAdapter:', this.name, 'id', this.id,
      'pairing cancelled');
  }

  /**
   * Unpair the provided the device from the adapter.
   *
   * @param {Object} device Device to unpair with
   */
  removeThing(device) {
    this.knownBoxes.delete(device.id);
    if (this.devices.hasOwnProperty(device.id)) {
      this.handleDeviceRemoved(device);
    }

    return Promise.resolve(device);
  }

  /**
   * Cancel unpairing process.
   *
   * @param {Object} device Device that is currently being paired
   */
  // cancelRemoveThing(device) {
  //   console.log('OpenSenseMapAdapter:', this.name, 'id', this.id,
  //               'cancelRemoveThing(', device.id, ')');
  // }
}

module.exports = OpenSenseMapAdapter;
