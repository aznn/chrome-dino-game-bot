/**
 * A simple script to automatically play the chrome
 * offline dinosaur game. 
 *
 * Copy this script into the Javascript console in the browser
 * and start the game. The dinosaur should now be alive!
 *
 * This is a simple hack done over an afternoon and far from perfect
 * It can be improved in various ways. Last I checked it reaches
 * a score of around 4k+ pretty consistently. It can definitely
 * be improved much further
 *
 * Currently, the logic is look ahead of the dinosaur for obstacles
 * when an obstacle is detected jump. If the obstacle is a bird
 * then duck. The dinosaur's current state is tracked by the "eye"
 * position. The logic is the dinosaur's eye is in a constant
 * defined position in every state (running, duck). Using this
 * we can reliably detect the current state the dinosaur is in. 
 *
 * Author: Azaan Hassan
 * Email : azaan@outlook.com
 *
 * June - 2016 
 */

var game = (function(document) {
    'use strict';

    var canvas = document.getElementsByClassName('runner-canvas')[0];
    var ctx = canvas.getContext('2d');

    // constants
    var C = {
        // pixels
        blankPixel: {r: 0, g: 0, b: 0, a: 0},
        blackPixel: {r: 83, g: 83, b: 83, a: 255},
        dinoEyeColor: {r: 255, g: 255, b: 255, a: 255},

        // moves
        mJump: 'M_JUMP',
        mDuck: 'M_DUCK',
        mSpace: 'M_SPACE',

        // states
        stateAirbone: 'S_AIRBONE',
        stateGround: 'S_GROUND',
        stateDuck: 'S_DUCK',

        // dimensions
        width: canvas.width,
        height: canvas.height,

        // reference positions
        groundY: 131,
        dinoEndX: 70,

        // position of dino eye in running state
        dinoEyeX: 50,
        dinoEyeY: 99,

        // position of dino eye in duck state
        dinoDuckEyeX: 68,
        dinoDuckEyeY: 116,

        // position to look for birds in
        midBirdX: 75 + 5,
        midBirdY: 98 - 10,

        // interval between bot function runs
        runIntervalMs: 50,

        // look ahead configurations
        lookAheadX: 70 + 5,
        lookAheadY: 131 - 10,

        lookDownWidth: 60,
        lookDownStartX: 10,
        lookDownStartY: 131 - 10,

        midBirdLookAhead: 50,
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
        // when in air and the dino crosses the obstacle press down
        // to goto ground faster. This could be an improvement if tuned
        // properly. Removed as of now.
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

        if (oldDinoState !== currentDinoState) {
            stateCommanded = false;
        }

        oldDinoState = currentDinoState;
        currentTime += C.runIntervalMs;

        console.log({
            currentDinoState: currentDinoState,
            lookForwardDanger: lookforwardDanger,
            birdDanger: birdDanger,
            // downClear: downClear,
            stateCommanded: stateCommanded,
            currentTime: currentTime,
            lookAheadBuffer: currentLookAheadBuffer,
            birdLookAhead: currentBirdLookAheadBuffer,
        });
    }

    /**
     * Given a move and an optional timeout, execute the
     * move by issuing required keystrokes
     *
     * @param move the state to move to from Constants
     * @param timeout optional value for how long to keep the button pressed
     */
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

    /**
     * Given the current time return the distance to look
     * ahead for. This changes with time as the dino goes
     * faster it helps to look further. As you've to jump
     * earlier to cross obstacles.
     *
     * @param time the current in game time
     * @return number of look ahead pixels
     */
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

    /**
     * Given the current game time return the look ahead
     * pixels for birds
     * 
     * @param time current in game time
     * @return number of pixels to look ahead for birds
     */
    function getLookAheadBufferBird(time) {
        if (time < 50000) {
            return 50;
        }

        return 70;
    }

    /**
     * Helper which given an event type and a key code
     * dispatches this event
     */
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

    /**
     * Given an image data array from a canvas and an x and y
     * position, return an object representing the pixel 
     * at the given point. The x and y values must be 
     * within bounds
     */
    function getPixel(imgData, x, y) {
        var dataStart = (x + y * C.width) * 4;

        return {
            r: imgData.data[dataStart],
            g: imgData.data[dataStart + 1],
            b: imgData.data[dataStart + 2],
            a: imgData.data[dataStart + 3]
        };
    }

    /**
     * Given two standard pixel objects check for their
     * equality
     */
    function isPixelEqual(p1, p2) {
        return p1.r === p2.r &&
            p1.g === p2.g &&
            p1.b === p2.b &&
            p1.a === p2.a;
    }

    // exports
    return {
        run: run
    };

})(document)


game.run();
