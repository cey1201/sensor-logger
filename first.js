/******************************************************************************************************************************************************
 * FUNC: FrontEnd
 */

const scr             = document.getElementById('screen');
const head            = document.getElementById('head');
const body            = document.getElementById('body');
const go              = document.getElementById('go');

const demographics    = document.getElementById('demographics');

const PINdisplay      = document.getElementById('PIN_display');
const PINcontainer    = document.getElementById('PIN_container');
const buttons         = document.querySelectorAll('.PIN_button');


const useTouchscreen = ('ontouchstart' in document.documentElement);
const getDownEvent    = function () {if (useTouchscreen) {return 'touchstart';} else {return 'mousedown';}}
const getMoveEvent    = function () {if (useTouchscreen) {return 'touchmove'; } else {return 'mousemove';}}
const getUpEvent      = function () {if (useTouchscreen) {return 'touchend';  } else {return 'mouseup';}}

const getX = function (event) {if (useTouchscreen) {return event.touches[0].clientX;} else {return event.clientX;}}
const getY = function (event) {if (useTouchscreen) {return event.touches[0].clientY;} else {return event.clientY;}}

let subID = "";
let pin               = '';
let displayStartTime  = -1;
let mode              = 'load';
let nextMode;
let check_count       = 0;
let interval          = -1;
let topPINS;
let rotationRate;
let accelerationIncludingGravity;
let shuffledPINS;
let cnt_PINS = 0;
let status_PINS = "released";
let btn;

buttons.forEach(button => {
  button.addEventListener('mousedown', PINdown);
  button.addEventListener('mouseup', PINup);
  button.addEventListener('touchstart', PINdown);
  button.addEventListener('touchend', PINup);
});

function PINdown(event) {
  event.preventDefault(); // Prevent default touch behavior
  btn = event.target;
  status_PINS = "btn_" + btn.textContent;
  console.log(status_PINS);
}

function PINup(event) {
  event.preventDefault(); // Prevent default touch behavior
  const targetPIN = shuffledPINS[cnt_PINS];
  status_PINS = "released";

  pin += btn.textContent;
  PINdisplay.textContent = '*'.repeat(pin.length);

  if (pin.length === targetPIN.length) {
    if (pin === targetPIN) {
      console.log("PIN correct!");
      cnt_PINS += 1;
    } else {
      console.log("Incorrect PIN.");
    }

    nextMode = 'enter_PIN';
    genericNext();

    pin = '';
    PINdisplay.textContent = '';
  }
}


/******************************************************************************************************************************************************
 * FUNC: BackEnd
 */

function loadCSV() {
  fetch('top_PINS.csv')
  .then(res => res.text())
  .then(csvText => {    
    console.log(csvText);
    topPINS = csvText;
    topPINS = topPINS.split('\r\n');
  })
  .catch(err => console.error(err));
}


function sendData() {
  const data = {
    time: new Date().toISOString(),
    value: Math.random()
  };

  fetch('/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => {
    if (res.ok) console.log("Data sent!");
    else console.error("Failed to send");
  });
}

    
function requestMotionPermission() {
    // Check if DeviceMotionEvent is supported
    if (window.DeviceMotionEvent) {
        // Request permission to access motion sensors
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        // Permission granted, continue to the next step
                        nextMode = 'init'; // Assuming nextMode and genericNext are defined elsewhere
                        genericNext(); // Function to proceed to the next step
                    } else {
                        // Permission denied, display a message
                        console.log('Motion sensor permission denied.');
                        head.innerText = "Permission Denied";
                        body.innerText = "Thank you for showing interest in this study. If you accidently canceled on permission, clear browser data and reload this page again.";
                    }
                })
                .catch(error => {
                    // Handle any errors
                    head.innerText = "System Error";
                    body.innerText = "Try this page later or on other device";
                    console.error('Error requesting motion sensor permission:', error);
                });
        } else {
            console.log('Motion sensor supported and permission not supported - proceed!');
            nextMode = 'init'; // Assuming nextMode and genericNext are defined elsewhere
            genericNext(); // Function to proceed to the next step
        }
    } else {
        console.log('Device motion not supported.');
        head.innerText = "Device motion not supported on your phone";
        body.innerText = "Thank you for showing interest in this study";
    }
}


const DBfound = function() {
  check_count ++;
  console.log("number of trials to load PIN data:" + check_count);

  if (!!topPINS) {
    mode = nextMode;
    hideAll();
    display();
  } else if ( check_count <= 10 ) { 
    if ( !topPINS ) {
      loadCSV();
    }    

    setTimeout(DBfound, interval);

  } else {
    console.log("Error occured while reading PIN data!");
    head.innerText = "System error, check WIFI connection.."
  }
} 


function handleMotion(event) {
    // // Extract acceleration data from the event
    // var acceleration = event.acceleration;

    // Extract rotation rate data from the event
    rotationRate = event.rotationRate;

    // Extract acceleration including gravity data from the event
    accelerationIncludingGravity = event.accelerationIncludingGravity;
}


/******************************************************************************************************************************************************
 * FUNC: App Architecture
 */
function hideAll() {
    PINcontainer.style.display      = 'none';
    PINdisplay.style.display        = 'none';
    body.style.display              = 'none';
    head.style.display              = 'none';
    go.style.display                = 'none';
}


const genericNext = function () {

  if (mode == 'start_PIN') {
    window.addEventListener('devicemotion', handleMotion);
  }

  mode = nextMode;
  body.removeEventListener(getUpEvent(), genericNext);
  hideAll();
  display();
    
}


const display = function() {

  displayStartTime = new Date().getTime();

  switch (mode) {

    case 'load':
      console.log("Read Top 100 PIn data from local computer");
      head.style.display         = 'block';
      body.style.display         = 'block';
      head.innerText = "Loading . . .";
      nextMode = 'permission';

      check_count = 0;
      interval = 1000;
      setTimeout(DBfound, interval);

      break; 


    case 'permission':
      console.log("Mode - Permission Motion Control");
      head.style.display         = 'block';
      body.style.display         = 'block';
      go.style.display           = 'block';

      head.innerText = "Please allow the device motion control on your device!";
      body.innerText = "";
      go.innerHTML   = "Proceed";

      
      go.addEventListener(getUpEvent(), requestMotionPermission);

      break;

    case 'init':
      if (DeviceMotionEvent.permissionState == 'denied') {
          console.log('Device motion denial.');
          go.removeEventListener(getUpEvent(), requestMotionPermission);
          head.innerText = "Device motion control " + DeviceMotionEvent.permissionState;
          body.innerText = "Try this study on alternative devices..";
      } else {
          // if running device motion, turn this off
          window.removeEventListener('devicemotion', handleMotion);
          console.log('Enter subject information');  
          head.style.display         = 'block';
          body.style.display         = 'block';
          go.style.display           = 'block';

          head.innerText = "Enter Subject ID";
          body.innerText = "";
          demographics.style.display = 'block';
          

          nextMode = 'start_PIN'; 
          go.removeEventListener(getUpEvent(), requestMotionPermission);
          go.addEventListener(getUpEvent(), genericNext);
          go.innerText="Next";  
      }
                
      break;            

    case 'start_PIN':
      console.log("PIN entry intro/start");
      head.style.display         = 'block';
      body.style.display         = 'block';
      go.style.display           = 'block';

      demographics.style.display = 'none';
      // save subject number
      subID = subID + document.getElementById("subjectNo").value;

      head.innerText = "PIN Entry Instruction"; 
      body.innerText = "You will now proceed to repeatedly enter 4-digit PIN displayed on the screen."

      // process shuffle TOP 100 PINs
      shuffledPINS = shuffleArray(topPINS, 1);

      nextMode = 'enter_PIN';
      go.addEventListener(getUpEvent(), genericNext);
      go.innerText="Tap to begin";

      break;

    case 'enter_PIN':
      console.log("start sessions");
      head.style.display         = 'block';
      body.style.display         = 'block';

      head.innerText = "Enter the give PIN (" + (cnt_PINS+1) + "/" + shuffledPINS.length + ")"; 
      body.innerText = shuffledPINS[cnt_PINS];
      body.style.fontSize = "20px";

      PINdisplay.style.display = 'block';
      PINdisplay.style.fontSize = "20px";
      PINcontainer.style.display = 'block';


      break;

  }
};


/******************************************************************************************************************************************************
 * FUNC: Implementation 
 */

function shuffleArray(array, rep) {
    const arr = [];
    for (var i = 0; i < array.length; i++) {
        for (var j = 0; j < rep; j++) {
            arr.push(array[i]);
        }
    }

    // Fisher-Yates shuffle algorithm
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];        
    }
    return arr;
}




hideAll();
display();
