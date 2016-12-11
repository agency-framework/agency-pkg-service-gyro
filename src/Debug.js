"use strict";
var Controller = require('agency-pkg-base/Controller');
var DomModel = require('agency-pkg-base/DomModel');
var dataTypeDefinition = require('agency-pkg-base/dataTypeDefinition');
var gyroService = require('./default');

module.exports = Controller.extend({

    modelConstructor: DomModel.extend(dataTypeDefinition, {
        session: {
            visible: {
                type: 'boolean',
                required: true,
                default: function() {
                    return true;
                }
            }
        }
    }),

    events: {
        'click': function() {
            gyroService.reset();
        }
    },
    bindings: {
        'model.visible': {
            type: 'booleanClass',
            name: 'js-visible'
        }
    },
    initialize: function() {
        Controller.prototype.initialize.apply(this, arguments);
        this.direction = this.queryByHook('direction');
        this.listEl = this.queryByHook('list');

        this.model.on('change:visible', onChangeVisible, this);
        onChangeVisible.bind(this)(this.model, this.model.visible);


    }
});

function onChangeVisible(model, visible) {
    if (visible) {
        gyroService.register('agency-pkg-service-gyro/debug', render.bind(this));
    } else {
        gyroService.unregister('agency-pkg-service-gyro/debug', render.bind(this));
    }
}

function render(data) {
    this.listEl.innerHTML = '<li data-hook="direction">' + data.horizontalDirection.key + '</li><li class="x">' + Math.round(data.euler.x * 1000) / 1000 + '</li><li class="y">' + Math.round(data.euler.y * 1000) / 1000 + '</li><li class="z">' + Math.round(data.euler.z * 1000) / 1000 + '</li>';
}
