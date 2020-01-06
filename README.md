## Homebridge Contact Switch Notification

A common need in Homekit is for push notifications. The Home app natively supports push notifications for Blinds & Windows, Doors & Locks, Sensors (e.g. motion, other contact sensors), and Security devices.  But, aside from time of day and people present, these notifications are all-or-nothing, no other conditions allowed. And you can't get notified about changes to other Homekit accessories, like switches, etc. 

What if you want to be notified if a pair of doors both stay open for more than 2 minutes after 3pm?  Impossible, right?  The solution is to create a _dummy_ notification accessory (a fake door!) that can be subscribed to for push notifications, from the front page of the Home app, and use automations to toggle it _at the right time_ (whenever you define that to be). 

One solution to this need (on which this plugin is based) is [homebridge-motion-switch](https://github.com/aaronpearce/homebridge-motion-switch), which uses a switch with a fake motion sensor, which gets triggered (and thus can send a notification) when the switch is toggled.  But the notification says "Motion detected by Room MySensorName".  What if you instead have a situation where being alerted with a push message mentioning a door, window, or other contact sensor message would be more appropriate than motion?  This plugin is for you.   Note that a Homekit contact sensor can be customized in the Home app to be displayed as a `Door`, `Blinds`, `Garage Door`, `Window`, or generic `Contact Sensor`, and this changes the notfication message.  Note also that you get _two_ notifications: once when opened, and again when closed.  See the `auto_reset` config variable below if you want to have this 2nd notification be meaningful.

#### Setup

`npm install -g homebridge-contact-switch`

And add the following to the accessories list in your Homebridge config. Change names as you wish.

```js
{
  "accessory": "Contact Switch Notification",
  "contact_name": "My Door",
  "name": "Door Notifier",
  "auto_reset": false
}
```

Here `name` is the name of the overall accessory, with two services (a switch to activate the notifier, and a contact sensor named `contact_name`).  If `auto_reset` is true (the default), the switch and contact will be auto-reset after 1 second (generating another notification).   If it is `false`, you need to arrange to turn off the switch yourself (the contact will be automatically reset then, sending a _closed_ notification). 

Once added to Homekit, you will need to turn on Notifications for the fake contact sensor you just added, and possibly change it to a door, windows, etc. (see e.g. [this note](https://github.com/jvmahon/homebridge-homeseer/wiki/Contact-Sensor-Icon-Type-(Door,-Window,-etc.))).

#### Example

As an example non-trivial use of this notifier: notifying if a _door is left open for more than one minute_ (a common occurrence in my household!), and then notifying again if and when it gets closed. This takes 3 automations to make work, and another dummy switch (not provided here).

1. Create a dummy regular switch (using e.g. a [StatefulDummySwitch](https://github.com/mend1/homebridge-statefuldummy#readme)): call it `Door Open`.
1. Create a `Contact Switch Notification` accessory named `Door Notifier` with `contact_name: "Door was LEFT OPEN!!!"`, using `"auto_reset": false`.
1. In the Home app, create an automation that toggles the `Door Open` dummy switch on when the real door opens (#1), and turns it off after 1 minute.  Also create an automation (#2) that turns _off_ the `Door Notifier` switch when the real door closes.
1. Create another automation (#3) for when the accessory `Door Open` turns _off_ (which will happen automatically after one minute), toggling the `Door Notifier` switch _on_.  Now, as a final step, use the Eve app to add a condition to this 2nd automation: only run it if your real door is (still) open!  Note that Home will report but cannot yet set these conditions on automations, so you have to use a 3rd party app like Eve.

Here's the config:

```js
    {
      "accessory": "StatefulDummySwitch",
      "name": "FrontDoorOpen"
    },
    {
      "accessory": "Contact Switch Notification",
      "name": "Front Door Open Notifier",
      "contact_name": "Front Door Left OPEN!!!",
      "auto_reset": false
    },
```

Here's how it work: when the real door opens, automation #1 sets the dummy switch on, and begins a 1 minute count-down.  At the end of the minute, the dummy switch is turned off, triggering automation #3, which checks the state of the door. If the actual door is closed, nothing happens.  But if it is _still_ open, automation #3 toggles the notifier switch this plugin provides.  The notifier switch opens the "fake" contact, which sends out a notification, ala "Room Front Door Left OPEN!!! was opened".  With `auto_reset: false` set in the config, the notifier switch will stay on.  Once the door is actually closed, automation #2 toggles off the notifier switch, and you get a final notification of it closing. 

