/**
 * Weather device type.
 */
'use strict';

const crypto = require('crypto');
const fetch = require('node-fetch');
const {Property, Device} = require('gateway-addon');

class OpenSenseMapProperty extends Property {
  /**
   * Weather property type.
   *
   * @param {Object} device - Device this property belongs to
   * @param {string} name - Name of this property
   * @param {Object} descr - Property description metadata
   * @param {*} value - Current property value
   */
  constructor(device, name, descr, value) {
    super(device, name, descr);
    this.setCachedValue(value);
  }
}


/**
 * Weather device type.
 */
class OpenSenseMapDevice extends Device {
  /**
   * Initialize the object.
   *
   * @param {Object} adapter - WeatherAdapter instance
   * @param {string} box - Configured box
   * @param {number} pollInterval - Interval at which to poll provider
   */
  constructor(adapter, box, pollInterval) {
    console.log('NEW OpenSenseMapDevice', box, pollInterval);
    
    const shasum = crypto.createHash('sha1');
    shasum.update(box.name);
    super(adapter, `box-${shasum.digest('hex')}`);

    this.box = box;
    // this.apiKey = apiKey;
    this.pollInterval = pollInterval * 60 * 1000;

    this.name = this.description = `Box (${box.name})`;
    this['@context'] = 'https://iot.mozilla.org/schemas';
    this['@type'] = ['TemperatureSensor', 'MultiLevelSensor'];


    // TODO: Poll first for capabilities (available props)
    // then set properties.

    this.promise = this.pollCapabilities()
    .then(() => {
      return this.poll()
    })
  }
  
  
  pollCapabilities() {
    return fetch(`https://api.opensensemap.org/boxes/${this.box.boxId}`)
    .then(res => res.json())
    .then((json) => {
      for (const sensor of json.sensors) {
        this.setSensorProperty(sensor)
      }
      return json
    })
  }
  
  setSensorProperty (sensor) {
    console.log(sensor);
    const {title, unit} = sensor
    const lowerTitle = title.toLowerCase()
    const label = title
    let atType = 'LevelProperty'
    let type = 'integer'
    let minimum = 0
    let maximum = 100
  
    
    if (lowerTitle === 'pm10' || lowerTitle === 'pm2.5') {
      maximum = 1000
    } else if (lowerTitle.startsWith('temperatur')) {
        atType = 'TemperatureProperty';
        let minimum = -100
        let maximum = 100
    } else if (lowerTitle === 'humidity' || lowerTitle.includes('luftfeucht')) {

    } else if (lowerTitle.includes('pressure') || lowerTitle.includes('luftdruck')) {

    } else if (lowerTitle === 'brightness' || lowerTitle === 'helligkeit' || lowerTitle.includes('beleuchtung')) {

    } else {
      console.log('WARNING: Could not find config for sensor', title, '. Using default values.');
    }
    
    this.properties.set(
      title,
      new OpenSenseMapProperty(
        this,
        title,
        {
          label,
          '@type': atType,
          type,
          unit,
          minimum,
          maximum,
          readOnly: true,
        },
        null
      )
    );
    
  }
  

  /**
   * Update the weather data.
   */
  poll() {
    
    console.log('POLLING FOR DATA');
    console.log('box id', this.box.boxId);
    fetch(`https://api.opensensemap.org/boxes/${this.box.boxId}/sensors`)
    .then(res => res.json())
    .then((json) => {
      for (const sensor of json.sensors) {
        const freshValue = Math.round(sensor.lastMeasurement.value)
        console.log(sensor.title, freshValue);
        if (this.properties.has(sensor.title)) {
          const prop = this.properties.get(sensor.title);
          if (prop.value !== freshValue) {
            prop.setCachedValue(freshValue);
            this.notifyPropertyChanged(prop);
          }
        }
      }
    })
    
    // const promise = this.provider.poll().then(() => {
    //   const properties = [
    //     'temperature',
    //     'pressure',
    //     'humidity',
    //   ];
    //   for (const property of properties) {
    //     const value = this.provider[property]();
    //     const prop = this.properties.get(property);
    //
    //     if (prop.value !== value) {
    //       prop.setCachedValue(value);
    //       this.notifyPropertyChanged(prop);
    //     }
    //   }
    // }).catch((e) => {
    //   console.error('Failed to poll weather provider:', e);
    // });

    setTimeout(this.poll.bind(this), 3 * 60 * 1000);
    return Promise.resolve('test');
  }
}

module.exports = OpenSenseMapDevice;
