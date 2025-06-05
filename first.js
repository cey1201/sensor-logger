/******************************************************************************************************************************************************
 * FUNC: FrontEnd
 */

const scr             = document.getElementById('screen');
const head            = document.getElementById('head');
const body            = document.getElementById('body');
const go              = document.getElementById('go');

const demographics    = document.getElementById('demographics');

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
let rotationRate
let accelerationIncludingGravity

buttons.forEach(button => {
    button.addEventListener('click', () => {
    if (pin.length < 6) {
        pin += button.textContent;
        PINdisplay.textContent = pin;
    }
    });
});

/******************************************************************************************************************************************************
 * FUNC: BackEnd
 */

function loadCSV() {
  fetch('top_PINS.csv')
  .then(res => res.text())
  .then(csvText => {    
    console.log(csvText); // CSV 내용 확인용 출력
    topPINS = csvText
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


// function startLoggingMotion() {
//   console.log('Listening to devicemotion...');
//   window.addEventListener('devicemotion', (event) => {
//     console.log('Motion event triggered'); // Add this

//     const data = {
//       acceleration: event.acceleration,
//       rotationRate: event.rotationRate,
//       timestamp: Date.now()
//     };

//     fetch('http://192.168.0.139:3000/log', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });
//   });
// }


/******************************************************************************************************************************************************
 * FUNC: App Architecture
 */
function hideAll() {
    PINcontainer.style.display      = 'none';
    body.style.display              = 'none';
    head.style.display              = 'none';
    go.style.display                = 'none';
}


const genericNext = function () {

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
      console.log("Enter subject ID number")
      head.style.display         = 'block';
      body.style.display         = 'block';
      go.style.display           = 'block';

      demographics.style.display = 'none';
      // save subject number
      subID = subID + document.getElementById("subjectNo").value;

      head.innerText = "PIN Entry Instruction"; 
      body.innerText = "You will now proceed to repeatedly enter 4-digit PIN displayed on the screen."

      // process shuffle TOP 100 PINs

      nextMode = 'enter_PIN';
      go.addEventListener(getUpEvent(), genericNext);
      go.innerText="Tap to begin";
      break;

  }
};


/******************************************************************************************************************************************************
 * FUNC: Implementation 
 */

hideAll();
display();
