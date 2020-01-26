var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-contact-switch-notification", "Contact Switch Notification",
			       ContactSwitchNotificationAccessory);
}

function ContactSwitchNotificationAccessory(log, config) {
  this.log = log;
  this.autoReset = config.hasOwnProperty("auto_reset")?config.auto_reset:true;
  this.contactName = config.contact_name;
  this.switchName = config.name;
  this.switchState = false;
  this.contactSensorState = Characteristic.ContactSensorState.CONTACT_DETECTED;

  this.contactSensorService = new Service.ContactSensor(this.contactName);
  this.contactSensorService
    .getCharacteristic(Characteristic.ContactSensorState)
    .on('get', this.getContactSensorState.bind(this));

  this.switchService = new Service.Switch(this.switchName);
  this.switchService
    .getCharacteristic(Characteristic.On)
    .on('get', this.getSwitchState.bind(this))
    .on('set', this.setSwitchState.bind(this));
}

ContactSwitchNotificationAccessory.prototype.getContactSensorState = function(callback) {
  callback(null, this.contactSensorState)
}

ContactSwitchNotificationAccessory.prototype.getSwitchState = function(callback) {
  callback(null, this.switchState)
}

ContactSwitchNotificationAccessory.prototype.setSwitchState = function(state, callback) {
  this.switchState = state

  // When we turn this on, we also want to turn on (and possibly off) the contact sensor
  this.trigger()
  callback(null);
}

ContactSwitchNotificationAccessory.prototype.trigger = function() {
  if (this.switchState) {
    // sends a notification that contact opened
    this.contactSensorState = Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    this.contactSensorService.setCharacteristic(Characteristic.ContactSensorState, this.contactSensorState);
    if (this.autoReset) setTimeout(this.resetSensors, 1000, this);
  } else {			// switch turned off
    if (!this.autoReset) {
      // sends a notification that contact closed
      this.contactSensorState = Characteristic.ContactSensorState.CONTACT_DETECTED;
      this.contactSensorService.setCharacteristic(Characteristic.ContactSensorState,this.contactSensorState);
    }
  }
}

ContactSwitchNotificationAccessory.prototype.resetSensors = function(self) {
  self.switchState = 0
  self.contactSensorState = Characteristic.ContactSensorState.CONTACT_DETECTED;
  self.switchService.setCharacteristic(Characteristic.On, Boolean(self.switchState));
  self.contactSensorService.setCharacteristic(Characteristic.ContactSensorState,self.contactSensorState);
}

ContactSwitchNotificationAccessory.prototype.getServices = function() {
  return [this.contactSensorService, this.switchService];
}
