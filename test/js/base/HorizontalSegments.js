"use strict";

var Collection = require('agency-pkg-base/Controller/Collection');

module.exports = Collection.extend({

    modelConstructor: Collection.prototype.modelConstructor.extend({
        session: {
            selector: {
                type: 'string',
                required: true,
                default: '> *'
            },
            viewWidth: {
                type: 'number',
                required: true,
                default: 0
            }
        }
    }),

    initialize: function() {
        Collection.prototype.initialize.apply(this, arguments);
        this.reset();
    },

    reset: function() {
        var $items = $(this.model.selector, this.el);
        this.model.viewWidth = 1 / $items.length;
        this.collection.reset();
        var model;
        $items.each(function(index, item) {
            model = $(item).data('controller').model;
            model.index = index;
            model.width = this.model.viewWidth;
            this.collection.add(model);
        }.bind(this));
    }

});
