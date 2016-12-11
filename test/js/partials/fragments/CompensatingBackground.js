"use strict";
var Controller = require('agency-pkg-base/Controller');
var DomModel = require('agency-pkg-base/DomModel');
var dataTypeDefinition = require('agency-pkg-base/dataTypeDefinition');

var viewport = require('agency-pkg-service-viewport');
var gyroService = require('../../../../src/default');

var Modernizr = require('modernizr');
module.exports = Controller.extend({

    modelConstructor: DomModel.extend(dataTypeDefinition, {
        session: {

        }
    }),

    events: {
        'click': function() {
            gyroService.reset();
        }
    },
    bindings: {

    },
    initialize: function() {
        Controller.prototype.initialize.apply(this, arguments);
        console.log(Modernizr);
        var prefix = Modernizr.prefixed('transform');
        var contentEl = this.queryByHook('content');

        gyroService.register('background_' + this.cid, function(data) {
            var x = data.euler.x / (Math.PI / 2);
            var z = data.euler.z / (Math.PI / 2);
            contentEl.style.cssText = prefix + ': translate3d('+(-z)+'%, '+(-x*-1)+'%, 0px) rotateX('+(-1*x*45)+'deg) rotateY('+(z*45)+'deg);';
        });
        viewport.on('RESIZE', function() {
            gyroService.reset();
        });
        setTimeout(function() {
            gyroService.reset();
        }, 1000);


    }
});
