import { me } from "appbit";
import { vibration } from "haptics";
import document from "document";
import * as messaging from "messaging";
import * as fs from "fs";
import * as util from "../common/utils";

const SETTINGS_TYPE = "cbor";
const SETTINGS_FILE = "settings.cbor";

const GAME_DEFAULT = 30;
const SHIFT_DEFAULT = 5;

// Clock counters
let gameMinute = 30;
let gameSecond = 0;
let shiftMinute = 5;
let shiftSecond = 0;

let numOfPings = 0;

let running = false;

let clock;
let ping;
let gameSwipe;
let shiftSwipe;

// UI Objects
let gameClock = document.getElementById("gameClock");
let shiftClock = document.getElementById("shiftClock");
let gameClockRect = document.getElementById("gameClockRect");
let shiftClockRect = document.getElementById("shiftClockRect");
let btnStartStop = document.getElementById("btnStartStop");
let btnReset = document.getElementById("btnReset");
let exitPage = document.getElementById("exitPage");
let btnNo = document.getElementById("btnNo");
let btnYes = document.getElementById("btnYes");

let settings = loadSettings();
applySettings();
me.onunload = saveSettings;
me.appTimeoutEnabled = false;

// Set clock displays to settings value
gameClock.text = util.monoDigits(settings.gameMinute) + ":" + util.monoDigits(settings.gameSecond);
shiftClock.text = util.monoDigits(settings.shiftMinute) + ":" + util.monoDigits(settings.shiftSecond);

// Ping the user every minute
ping = setInterval(sendPing, 60000);

// ***** Event Handlers *****
// Physical buttons pressed
document.onkeypress = function(evt) {
  console.log("Physical button pressed: " + evt.key);
  evt.preventDefault();
  clearInterval(ping);
  // "UP" (right-top) button pressed: 
  // Start/Stop the timers
  if (evt.key === "up") {
    console.log("UP!");
    if (running) {
      // If running then stop the clock
      clearInterval(clock);
      running = false;
    } else {
      // Start the clock
      clock = setInterval(fireTimer, 1000);
      running = true;
      me.appTimeoutEnabled = false;
    }
    toggleButtons();
  }
  // "DOWN" (right-bottom) button pressed:
  // When running, reset the shift clock only
  // When stopped, reset both clocks
  if (evt.key === "down") {
    console.log("DOWN!");
    if (!running) {
      gameMinute = settings.gameMinute;
      gameSecond = 0;
    }
    shiftMinute = settings.shiftMinute;
    shiftSecond = 0;
    updateClocks();
  }
  // "BACK" (left) button pressed
  if (evt.key === "back") {
    console.log("BACK!");
    exitPage.style.display = "inline";
  }
}

// Exit page buttons
// Exit NO
btnNo.onclick = function(evt) {
  console.log("Exit button pressed: NO");
  exitPage.style.display = "none";
}

// Exit YES
btnYes.onclick = function(evt) {
  console.log("Exit button pressed: YES");
  me.exit();
}


// Combo buttons pressed
// RIGHT TOP (Start/Stop)
btnStartStop.onactivate = function(evt) {
  console.log("Combo button pressed: Right Top");
  clearInterval(ping);
  // Start/Stop the timers
  if (running) {
    // If running then stop the clock
    clearInterval(clock);
    running = false;
  } else {
    // Start the clock
    clock = setInterval(fireTimer, 1000);
    running = true;
    me.appTimeoutEnabled = false;
  }
  toggleButtons();
}

// RIGHT BOTTOM (Reset)
btnReset.onactivate = function(evt) {
  console.log("Combo button pressed: Right Bottom");
    if (!running) {
      gameMinute = settings.gameMinute;
      gameSecond = 0;
    }
    shiftMinute = settings.shiftMinute;
    shiftSecond = 0;
    updateClocks();
}

// Start game clock "swipe"
gameClockRect.onmousedown = function(evt) {
  console.log("Game clock mouse down");
  if (running) return;
  gameSwipe = evt;
}

// Stop game clock "swipe"
gameClockRect.onmouseup = function(evt) {
  console.log("Game clock mouse up");
  if (running) return;
  let swipe = evt.screenX - gameSwipe.screenX;
  if (swipe > 60) {
    // Swipe right
    gameMinute += 5;
    settings.gameMinute = gameMinute;
    updateClocks();
  }
  if (swipe < -60) {
    // Swipe left
    if (gameMinute <= 5) return;
    gameMinute -= 5;
    settings.gameMinute = gameMinute;
    updateClocks();
  }
}

// Start shift clock "swipe"
shiftClockRect.onmousedown = function(evt) {
  console.log("Shift clock mouse down");
  if (running) return;
  shiftSwipe = evt;
}

// Stop shift clock "swipe"
shiftClockRect.onmouseup = function(evt) {
  console.log("Shift clock mouse up");
  if (running) return;
  let swipe = evt.screenX - shiftSwipe.screenX;
  if (swipe > 60) {
    // Swipe right
    shiftMinute += 1;
    settings.shiftMinute = shiftMinute;
    updateClocks();
  }
  if (swipe < -60) {
    // Swipe left
    if (shiftMinute <= 1) return;
    shiftMinute -= 1;
    settings.shiftMinute = shiftMinute;
    updateClocks();
  }
}


// ***** UI Functions *****
// Updates Game Clock and Shift Clock with current counter values
function updateClocks() {
  gameClock.text = util.monoDigits(gameMinute) + ":" + util.monoDigits(gameSecond);
  shiftClock.text = util.monoDigits(shiftMinute) + ":" + util.monoDigits(shiftSecond);  
}

// Shows/Hide the combo buttons
function toggleButtons() {
  if (btnStartStop.style.display === "none") {
    btnStartStop.style.display = "inline";
    btnReset.style.display = "inline";
  } else {
    btnStartStop.style.display = "none";
    btnReset.style.display = "none";
  }
}

// ***** Clock functions *****
// Function called every second while the clock is running
function fireTimer() {
  console.log("Fire! " + clock);
  gameSecond--;
  shiftSecond--;
  
  if (gameSecond < 0) {
    gameSecond = 59;
    gameMinute--;
    if (gameMinute < 0) {
      // Game over
      gameOver();
      return;
    }
  }
  
  if (shiftSecond < 0) {
    shiftSecond = 59
    shiftMinute--;
    if (shiftMinute < 0) {
      // Shift over
      shiftOver();
    }
  }
  
  updateClocks();    
}

// Called when the game clock expires
// - Stop timer interval
// - Set clock values to zero
// - Ping user
function gameOver() {
  clearInterval(clock);
  running = false;
  gameMinute = 0;
  gameSecond = 0;
  shiftMinute = 0;
  shiftSecond = 0;
  numOfPings = 0;
  updateClocks();
  toggleButtons();
  vibration.start("ring");
  ping = setInterval(sendPing, 60000);
}

// Called when the shift clock expires
// - Reset shift values
// - Nudge user
function shiftOver() {
  resetShift();
  shiftMinute--;
  shiftSecond = 59;
  vibration.start("nudge-max");
}

// Reset clock values to setting values
function resetClocks() {
  applySettings();
  updateClocks();
}

// Reset shift clock values to setting values
function resetShift() {
  shiftMinute = settings.shiftMinute;
  shiftSecond = 0;
  updateClocks();
}

// Pings the user every minute
function sendPing() {
  console.log("Ping! " + ping);
  vibration.start("ping");
  
  // Allow 10 unattended "pings" before resetting the app to allow timeout
  if(numOfPings++ > 10) {
    me.appTimeoutEnabled = false;
  }
}

// ***** Messaging/Settings functions *****
// Message is received
messaging.peerSocket.onmessage = evt => {
  console.log(`App received: ${JSON.stringify(evt)}`);
  
  // Do not accept settings updates when the clock is running
  if (running) {
    console.log("Clock running.  Skipping setting change.");
    return;
  }
  // Game clock setting changed
  if (evt.data.key === "gameClock" && evt.data.option) {
    gameMinute = parseInt(JSON.parse(evt.data.option).values[0].value);
    gameSecond = 0;
    settings.gameMinute = gameMinute;
    console.log(`Setting Game Clock: ${gameMinute}`);
  }
  
  // Shift clock setting changed
  if (evt.data.key === "shiftClock" && evt.data.option) {
    shiftMinute = parseInt(JSON.parse(evt.data.option).values[0].value);
    shiftSecond = 0;
    settings.shiftMinute = shiftMinute;
    console.log(`Setting Shift Clock: ${shiftMinute}`);
  }
  
  // Update clock values after setting change
  updateClocks();

};

// Message socket opens
messaging.peerSocket.onopen = () => {
  console.log("App Socket Open");
};

// Message socket closes
messaging.peerSocket.onclose = () => {
  console.log("App Socket Closed");
};

// Load settings from local file
function loadSettings() {
  console.log("Loading settings");
  try {
    return fs.readFileSync(SETTINGS_FILE, SETTINGS_TYPE);
  } catch (ex) {
    // Defaults
    return {
      gameMinute : GAME_DEFAULT,
      gameSecond : 0,
      shiftMinute : SHIFT_DEFAULT,
      shiftSecond : 0
    }
  }
}

// Apply settings values to runtime values
function applySettings() {
  console.log("Applying settings");
  gameMinute = settings.gameMinute;
  gameSecond = settings.gameSecond;
  shiftMinute = settings.shiftMinute;
  shiftSecond = settings.shiftSecond;
}

// Save settings to local file
function saveSettings() {
  console.log("Saving settings");
  fs.writeFileSync(SETTINGS_FILE, settings, SETTINGS_TYPE);
}

