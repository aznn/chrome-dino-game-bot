var canvas = document.getElementsByClassName('runner-canvas')[0];
var ctx = canvas.getContext('2d');

// constants
var C = {
    // pixels
    blankPixel: {r: 0, g: 0, b: 0, a: 0},
    blackPixel: {r: 83, g: 83, b: 83, a: 255},

    // moves
    mJump: 'M_JUMP',
    mDuck: 'M_DUCK',
    mSpace: 'M_SPACE',

    // State
    stateAirbone: 'S_AIRBONE',
    stateGround: 'S_GROUND',
    stateDuck: 'S_DUCK',

    // etc
    width: canvas.width,
    height: canvas.height,

    // pos
    groundY: 131,
    dinoEndX: 70,

    // game logic constants

    // interval of run logic
    runIntervalMs: 50,

    // dino eye position
    dinoEyeX: 51,
    dinoEyeY: 98,

    dinoDuckEyeX: 68,
    dinoDuckEyeY: 116,

    midBirdX: 75 + 5,
    midBirdY: 98 - 10,
    midBirdLookAhead: 50,

    dinoEyeColor: {r: 255, g: 255, b: 255, a: 255},

    // start pixel to look ahead from
    lookAheadX: 70 + 5,
    lookAheadY: 131 - 10,

    lookDownWidth: 60,
    lookDownStartX: 10,
    lookDownStartY: 131 - 10
};

// game logic
var runIntervalId = -1;
var currentDinoState = C.stateGround;
var stateCommanded = false;
var oldDinoState = C.stateGround;
var currentTime = 0;
var currentLookAheadBuffer;
var currentBirdLookAheadBuffer;
function run() {
    var i;

    if (runIntervalId == -1) {
        runIntervalId = setInterval(run, C.runIntervalMs);
    }

    currentLookAheadBuffer = getLookAheadBuffer(currentTime);
    currentBirdLookAheadBuffer = getLookAheadBufferBird(currentTime);

    var imageData = ctx.getImageData(0, 0, C.width, C.height);

    var eyePixel = getPixel(imageData, C.dinoEyeX, C.dinoEyeY);
    var eyePixelDuck = getPixel(imageData, C.dinoDuckEyeX, C.dinoDuckEyeY);
    if (isPixelEqual(eyePixel, C.dinoEyeColor)) {
        currentDinoState = C.stateGround;
    } else if (isPixelEqual(eyePixelDuck, C.dinoEyeColor)) {
        currentDinoState = C.stateDuck;
    } else {
        currentDinoState = C.stateAirbone;
    }

    var lookforwardDanger = false;
    for (i = 0; i < currentLookAheadBuffer; i += 2) {
        if (isPixelEqual(getPixel(imageData, C.lookAheadX + i, C.lookAheadY), C.blackPixel)) {
            lookforwardDanger = true;
            break;
        }
    }

    if (currentDinoState === C.stateGround) {
        // if dino on ground, scan ahead to see if there are obstacles. If there are
        // jump

        if (lookforwardDanger && !stateCommanded) {
            issueMove(C.mJump);
            stateCommanded = true;
            console.log('JUMP!');

        } else {
            // watch for birds in mid level
            var birdDanger = false;
            for (i = C.midBirdX; i < C.midBirdX + currentBirdLookAheadBuffer; i += 2) {
                if (isPixelEqual(getPixel(imageData, i, C.midBirdY), C.blackPixel)) {
                    birdDanger = true;
                    break;
                }
            }

            if (birdDanger) {
                issueMove(C.mDuck, 400);
                console.log('DUCK!');
            }
        }

    }
    // else if (currentDinoState === C.stateAirbone) {
    //     var downClear = true;
    //     for (i = 0; i < C.lookDownWidth; i++) {
    //         if (!isPixelEqual(getPixel(imageData, C.lookDownStartX + i, C.lookDownStartY), C.blankPixel)) {
    //             downClear = false;
    //         }
    //     }
    //
    //     if (!lookforwardDanger && downClear && !stateCommanded) {
    //         console.log('DOWN!');
    //         stateCommanded = true;
    //         issueMove(C.mDuck);
    //     }
    // }

    // state change
    if (oldDinoState !== currentDinoState) {
        stateCommanded = false;
    }

    oldDinoState = currentDinoState;
    currentTime += C.runIntervalMs;

    console.log({
        currentDinoState: currentDinoState,
        // lookForwardDanger: lookforwardDanger,
        birdDanger: birdDanger,
        // downClear: downClear,
        // stateCommanded: stateCommanded,
        currentTime: currentTime,
        lookAheadBuffer: currentLookAheadBuffer,
        birdLookAhead: currentBirdLookAheadBuffer,
    });
}

function issueMove(move, timeout) {
    switch (move) {
        case C.mJump:
            if (!timeout) {
                timeout = 85;
            }

            issueKeyPress('keydown', 38);
            setTimeout(function() {
                issueKeyPress('keyup', 38);
            }, timeout);
            break;

        case C.mDuck:
            if (!timeout) {
                timeout = 200;
            }

            issueKeyPress('keydown', 40);
            setTimeout(function() {
                issueKeyPress('keyup', 40);
            }, timeout);
            break;

        default:
            console.log('Invalid move ' + move);
    }
}

function getLookAheadBuffer(time) {
    if (time < 40000) {
        return 62;

    } else if (time < 60000) {
        return 92;

    } else if (time < 70000) {
        return 110;

    } else if (time < 85000) {
        return 120;

    } else if (time < 100000) {
        return 135;

    } else if (time < 115000) {
        return 150;

    } else if (time < 140000) {
        return 180;

    } else if (time < 170000) {
        return 190;
    }

    return 190;
}

function getLookAheadBufferBird(time) {
    if (time < 50000) {
        return 50;
    }

    return 70;
}

function issueKeyPress(type, keycode) {
    var eventObj = document.createEventObject ?
        document.createEventObject() : document.createEvent("Events");

    if(eventObj.initEvent){
        eventObj.initEvent(type, true, true);
    }

    eventObj.keyCode = keycode;
    eventObj.which = keycode;

    document.dispatchEvent ? document.dispatchEvent(eventObj) : el.fireEvent("onkeydown", eventObj);

}

function getPixel(imgData, x, y) {
    var dataStart = (x + y * C.width) * 4;

    return {
        r: imgData.data[dataStart],
        g: imgData.data[dataStart + 1],
        b: imgData.data[dataStart + 2],
        a: imgData.data[dataStart + 3]
    };
}

function isPixelEqual(p1, p2) {
    return p1.r === p2.r &&
        p1.g === p2.g &&
        p1.b === p2.b &&
        p1.a === p2.a;
}

run();
