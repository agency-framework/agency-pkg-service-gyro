"use strict";
var extend = require('lodash/extend');

global.WebVRConfig = extend({
    // Flag to disabled the UI in VR Mode.
    CARDBOARD_UI_DISABLED: false, // Default: false

    // Forces availability of VR mode, even for non-mobile devices.
    FORCE_ENABLE_VR: false, // Default: false.

    // Complementary filter coefficient. 0 for accelerometer, 1 for gyro.
    K_FILTER: 0.98, // Default: 0.98.

    // Flag to disable the instructions to rotate your device.
    ROTATE_INSTRUCTIONS_DISABLED: false, // Default: false.

    // How far into the future to predict during fast motion (in seconds).
    PREDICTION_TIME_S: 0.040, // Default: 0.040.

    // Flag to disable touch panner. In case you have your own touch controls.
    TOUCH_PANNER_DISABLED: false, // Default: false.

    // Enable yaw panning only, disabling roll and pitch. This can be useful
    // for panoramas with nothing interesting above or below.
    YAW_ONLY: false, // Default: false.

    // To disable keyboard and mouse controls, if you want to use your own
    // implementation.
    MOUSE_KEYBOARD_CONTROLS_DISABLED: false, // Default: false.

    // Prevent the polyfill from initializing immediately. Requires the app
    // to call InitializeWebVRPolyfill() before it can be used.
    DEFER_INITIALIZATION: true, // Default: false.

    // Enable the deprecated version of the API (navigator.getVRDevices).
    ENABLE_DEPRECATED_API: true, // Default: false.

    // Scales the recommended buffer size reported by WebVR, which can improve
    // performance.
    BUFFER_SCALE: 0.5, // Default: 0.5.

    // Allow VRDisplay.submitFrame to change gl bindings, which is more
    // efficient if the application code will re-bind its resources on the
    // next frame anyway. This has been seen to cause rendering glitches with
    // THREE.js.
    // Dirty bindings include: gl.FRAMEBUFFER_BINDING, gl.CURRENT_PROGRAM,
    // gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING,
    // and gl.TEXTURE_BINDING_2D for texture unit 0.
    DIRTY_SUBMIT_FRAME_BINDINGS: true // Default: false.
}, global.WebVRConfig || {});

require('webvr-polyfill/src/main');

var Vector = require('agency-pkg-base/Vector');
var VectorBuffer = require('agency-pkg-base/VectorBuffer');
var Enum = require('enum');

var cleanRadVector = new Vector();
var directionVectorHorizontal = new Vector(0, 0, 0);

var Default = function() {
    this.resetOffset = false;
    this.euler = new Vector(0, 0, 0);
    this.eulerNonOffset = new Vector(0, 0, 0);

    this.position = new Vector(0, 0, 0);
    this.resetOffsetValues = new Vector(0, 0, 0);
    this.offsetValues = new Vector(0, 0, 0);
    this.overridePosition = new Vector(0, 0, 0);
    this.horizontalDirectionBuffer = new VectorBuffer(4);
    gyroCheck(function(hasGyro) {
        this.hasGyro = hasGyro;
        if (hasGyro) {
            document.querySelector('html').classList.add('js-has-gyro');
        } else {
            document.querySelector('html').classList.add('js-has-not-gyro');
        }
    }.bind(this));
    this.setup();
};

Default.prototype.AXIS = new Enum(['X', 'Y', 'Z', 'XY', 'XYZ']);
Default.prototype.DIRECTION_TYPES = new Enum(['NONE', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM']);
/**
 * @type agency-pkg-base/Vector
 */
Default.prototype.euler = null;
/**
 * @type agency-pkg-base/Vector
 */
Default.prototype.eulerNonOffset = null;
/**
 * @type agency-pkg-base/Vector
 */
Default.prototype.position = null;
/**
 * @type agency-pkg-base/VectorBuffer
 */
Default.prototype.horizontalDirectionBuffer = null;
/**
 * @type enum
 */
Default.prototype.horizontalDirection = null;
/**
 * When sets, is position callback deactivated.
 * @type boolean
 */
Default.prototype.locked = false;
/**
 * @type boolean
 */
Default.prototype.ready = false;
/**
 * @type boolean
 */
Default.prototype.hasGyro = false;
/**
 * @type array
 */
Default.prototype.callbacks = [];
/**
 * @type boolean
 */
Default.prototype.setOffset = false;
/**
 * @type boolean
 */
Default.prototype.resetOffset = false;
/**
 * @type object
 */
Default.prototype.resetOffsetValues = null;
/**
 * @type object
 */
Default.prototype.offsetValues = null;
/**
 * When sets, use simulated position.
 * @type boolean
 */
Default.prototype.override = false;
/**
 * @type object
 */
Default.prototype.overridePosition = null;

Default.prototype.setup = function() {
    var direction;
    if (!this.ready) {
        console.log('GYRO initializing');
        global.InitializeWebVRPolyfill();
        if (global.navigator.getVRDisplays) {
            global.navigator.getVRDisplays().then(function(displays) {
                if (!displays.length) {
                    return;
                }
                var scope = this;
                var quadEuler;
                var trigger_ = function() {
                    if (!scope.locked) {
                        var orientation = this.getPose().orientation;

                        if (scope.override) {
                            scope.euler.resetValues(scope.overridePosition.x, scope.overridePosition.y, scope.overridePosition.z);
                        } else {
                            quadEuler = quatToEuler({
                                x: orientation[0],
                                y: orientation[1],
                                z: orientation[2],
                                w: orientation[3]
                            });
                            scope.euler.resetValues(quadEuler.x, quadEuler.y, quadEuler.z);
                        }

                        /* ######## */

                        var x = scope.euler.x,
                            y = scope.euler.y,
                            z = scope.euler.z;

                        if (!scope.override) {
                            if (scope.resetOffset) {
                                resetOffset(scope, x, y, z);
                            }
                            scope.euler.subtractLocal(scope.resetOffsetValues);
                        }

                        scope.eulerNonOffset.reset(scope.euler);
                        scope.euler.subtractLocal(scope.offsetValues);

                        scope.euler.y = cleanRad(scope.euler.y);

                        x = scope.euler.x;
                        y = scope.euler.y;
                        z = scope.euler.z;

                        // X
                        x += Math.PI / 2;
                        x = (x / Math.PI);

                        // Y
                        if (y < 0) {
                            y = 2 * Math.PI + y;
                        }
                        y = 1 - (y / Math.PI) / 2;

                        // Z
                        z += Math.PI / 2;
                        z = (z / Math.PI);

                        scope.position.setX(x).setY(y).setZ(z);

                        scope.position.setX(scope.position.x % 1);
                        scope.position.setY((1 + scope.position.y) % 1);
                        scope.position.setZ(scope.position.z % 1);

                        scope.horizontalDirectionBuffer.add(new Vector().resetByRad(scope.euler.y));
                        direction = scope.horizontalDirectionBuffer.getAverage().radRelativeTo(directionVectorHorizontal.resetByRad(scope.euler.y));
                        scope.horizontalDirection = scope.DIRECTION_TYPES.NONE;
                        if (direction < 0) {
                            scope.horizontalDirection = scope.DIRECTION_TYPES.LEFT;
                        } else if (direction > 0) {
                            scope.horizontalDirection = scope.DIRECTION_TYPES.RIGHT;
                        }

                        trigger(scope);

                    }
                };
                for (var i = 0; i < displays.length; ++i) {
                    global.animationFrame.addLoopListener('agency-pkg-service-gyro', trigger_.bind(displays[i]));
                }
            }.bind(this));
        }
        this.ready = true;
    }
};
Default.prototype.reset = function(axis) {
    this.resetOffset = axis || true;
};
Default.prototype.offset = function(x, y, z) {
    console.log('offset', y, this.offsetValues.y);
    this.offsetValues.resetValues(x, y, z);
    this.setOffset = true;
};
Default.prototype.addOffset = function(x, y, z) {
    this.offsetValues.addValuesLocal(x, y, z);
    this.setOffset = true;
};
Default.prototype.register = function(name, callback) {
    this.callbacks.push({
        name: name,
        cb: callback
    });
};

function cleanRad(y) {
    return cleanRadVector.resetByRad(y).rad();
}

function quatToEuler(q1) {
    var pitchYawRoll = {};
    var sqw = q1.w * q1.w;
    var sqx = q1.x * q1.x;
    var sqy = q1.y * q1.y;
    var sqz = q1.z * q1.z;
    var unit = sqx + sqy + sqz + sqw;
    var test = q1.x * q1.y + q1.z * q1.w;
    var heading, attitude, bank;
    if (test > 0.499 * unit) {
        heading = 2 * Math.atan2(q1.x, q1.w);
        attitude = Math.PI / 2;
        bank = 0;
        return;
    }
    if (test < -0.499 * unit) {
        heading = -2 * Math.atan2(q1.x, q1.w);
        attitude = -Math.PI / 2;
        bank = 0;
        return;
    } else {
        heading = Math.atan2(2 * q1.y * q1.w - 2 * q1.x * q1.z, sqx - sqy - sqz + sqw);
        attitude = Math.asin(2 * test / unit);
        bank = Math.atan2(2 * q1.x * q1.w - 2 * q1.y * q1.z, -sqx + sqy - sqz + sqw);
    }
    pitchYawRoll.z = Math.floor(attitude * 1000) / 1000;
    pitchYawRoll.y = Math.floor(heading * 1000) / 1000;
    pitchYawRoll.x = Math.floor(bank * 1000) / 1000;
    return pitchYawRoll;
}

function trigger(scope) {
    scope.callbacks.forEach(function(callback) {
        callback.cb(scope);
    });
}

function gyroCheck(callback) {
    function handler(event) {
        var hasGyro = typeof event.alpha === 'number' &&
            typeof event.beta === 'number' &&
            typeof event.gamma === 'number';
        window.removeEventListener('deviceorientation', handler, false);
        callback(hasGyro);
    }
    window.addEventListener('deviceorientation', handler, false);
}

function resetOffset(scope, x, y, z) {
    // Set offset
    scope.resetOffsetValues.reset(0, 0, 0);
    switch (scope.resetOffset) {
        case scope.AXIS.X:
            scope.resetOffsetValues.setX(x);
            break;
        case scope.AXIS.Y:
            scope.resetOffsetValues.setY(y);
            break;
        case scope.AXIS.Z:
            scope.resetOffsetValues.setX(z);
            break;
        case scope.AXIS.XY:
            scope.resetOffsetValues.setX(x);
            scope.resetOffsetValues.setY(y);
            break;
        default:
            // XYZ
            scope.resetOffsetValues.reset(scope.euler);
            break;
    }
    scope.resetOffset = false;
}

module.exports = new Default();
