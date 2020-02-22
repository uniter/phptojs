/*
 * PHPToJS - PHP-to-JavaScript transpiler
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phptojs
 *
 * Released under the MIT license
 * https://github.com/uniter/phptojs/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    hasOwn = {}.hasOwnProperty,
    Set = require('es6-set'),
    /**
     * Emits an event for the LabelRepository
     *
     * @param {LabelRepository} repository
     * @param {string} name
     * @param {*} arg
     */
    emit = function (repository, name, arg) {
        if (!repository.listenersByEvent[name]) {
            return;
        }

        repository.listenersByEvent[name].forEach(function (listener) {
            listener(arg);
        });
    };

/**
 * Represents a collection of labels and gotos that jump to them during transpilation.
 * At any given time, a label may have zero or more gotos and a goto may refer to a label
 * that has not yet been found
 *
 * @constructor
 */
function LabelRepository() {
    /**
     * @type {Object.<string, boolean>}
     */
    this.foundLabels = {};
    /**
     * @type {Object.<string, boolean>}
     */
    this.labels = {};
    /**
     * @type {Object.<string, Set>}
     */
    this.listenersByEvent = {};
    /**
     * @type {Object.<string, object>}
     */
    this.pendingLabels = {};
}

_.extend(LabelRepository.prototype, {
    /**
     * Adds a goto to the repository. If the label has not yet been found, it will be marked as "pending"
     * as this means it has a goto that refers to it so it must be defined at some point
     *
     * @param {object} gotoNode
     */
    addGoto: function (gotoNode) {
        var label = gotoNode.label.string,
            repository = this;

        repository.labels[label] = true;

        if (!repository.hasBeenFound(label)) {
            // Label has not yet been found, so mark it as pending -
            // if it _has_ already been found, _do not_ mark it as pending
            repository.pendingLabels[label] = gotoNode;
        }

        emit(repository, 'goto label', gotoNode);
    },

    /**
     * Marks a label as being defined. If it was previously marked as pending, this will remove that flag
     *
     * @param {object} labelNode
     */
    found: function (labelNode) {
        var label = labelNode.label.string,
            repository = this;

        repository.foundLabels[label] = true;
        repository.labels[label] = true;
        delete repository.pendingLabels[label];
        emit(repository, 'found label', labelNode);
    },

    /**
     * Fetches the AST node of the first goto whose label is pending
     *
     * @returns {object}
     * @throws {Error} Throws when there are no pending labels
     */
    getFirstPendingLabelGotoNode: function () {
        var pendingLabelGotoNodes = this.getPendingLabelGotoNodes();

        if (pendingLabelGotoNodes.length === 0) {
            throw new Error('There are no pending labels');
        }

        return pendingLabelGotoNodes[0];
    },

    /**
     * Fetches the names of all labels that have been mentioned thus far (both pending and found labels)
     *
     * @returns {string[]}
     */
    getLabels: function () {
        return Object.keys(this.labels);
    },

    /**
     * Fetches the names of all pending labels. A pending label is one that has a goto
     * but where the label statement has not yet been found
     *
     * @returns {string[]}
     */
    getPendingLabels: function () {
        return Object.keys(this.pendingLabels);
    },

    /**
     * Fetches an array of all goto nodes that we do not yet have a matching label for
     *
     * @returns {object[]}
     */
    getPendingLabelGotoNodes: function () {
        var nodes = [];

        _.forOwn(this.pendingLabels, function (node) {
            nodes.push(node);
        });

        return nodes;
    },

    /**
     * Fetches an object with one property for each pending label with the value true.
     * Used for optimised lookups of whether a label is pending
     *
     * @returns {Object.<string, object>}
     */
    getPendingLabelsHash: function () {
        return Object.assign({}, this.pendingLabels);
    },

    /**
     * Determines whether a label has been found
     *
     * @param {string} label
     * @returns {boolean}
     */
    hasBeenFound: function (label) {
        var repository = this;

        return repository.foundLabels[label] === true;
    },

    /**
     * Determines whether one or more pending labels (gotos) have been found
     *
     * @returns {boolean}
     */
    hasPending: function () {
        return Object.keys(this.pendingLabels).length > 0;
    },

    /**
     * Determines whether the given label has a goto but has not yet been found
     *
     * @param {string} label
     * @returns {boolean}
     */
    isPending: function (label) {
        return hasOwn.call(this.pendingLabels, label);
    },

    /**
     * Removes an event listener
     *
     * @param {string} name
     * @param {Function} listener
     */
    off: function (name, listener) {
        if (!this.listenersByEvent[name]) {
            return;
        }

        this.listenersByEvent[name].delete(listener);
    },

    /**
     * Adds an event listener
     *
     * @param {string} name
     * @param {Function} listener
     */
    on: function (name, listener) {
        if (!this.listenersByEvent[name]) {
            this.listenersByEvent[name] = new Set();
        }

        this.listenersByEvent[name].add(listener);
    }
});

module.exports = LabelRepository;
