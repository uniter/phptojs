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
     * @type {Object.<string, boolean>}
     */
    this.pendingLabels = {};
}

_.extend(LabelRepository.prototype, {
    /**
     * Adds a goto to the repository. If the label has not yet been found, it will be marked as "pending"
     * as this means it has a goto that refers to it so it must be defined at some point
     *
     * @param {string} label
     */
    addGoto: function (label) {
        var repository = this;

        repository.labels[label] = true;

        if (!repository.hasBeenFound(label)) {
            // Label has not yet been found, so mark it as pending -
            // if it _has_ already been found, _do not_ mark it as pending
            repository.pendingLabels[label] = true;
        }

        emit(repository, 'goto label', label);
    },

    /**
     * Marks a label as being defined. If it was previously marked as pending, this will remove that flag
     *
     * @param {string} label
     */
    found: function (label) {
        var repository = this;

        repository.foundLabels[label] = true;
        repository.labels[label] = true;
        delete repository.pendingLabels[label];
        emit(repository, 'found label', label);
    },

    /**
     * Fetches the names of all labels that have been mentioned thus far (both pending and found labels)
     *
     * @return {string[]}
     */
    getLabels: function () {
        return Object.keys(this.labels);
    },

    /**
     * Fetches the names of all pending labels. A pending label is one that has a goto
     * but where the label statement has not yet been found
     *
     * @return {string[]}
     */
    getPendingLabels: function () {
        return Object.keys(this.pendingLabels);
    },

    /**
     * Fetches an object with one property for each pending label with the value true.
     * Used for optimised lookups of whether a label is pending
     *
     * @return {Object.<string, boolean>}
     */
    getPendingLabelsHash: function () {
        return Object.assign({}, this.pendingLabels);
    },

    /**
     * Determines whether a label has been found
     *
     * @param {string} label
     * @return {boolean}
     */
    hasBeenFound: function (label) {
        var repository = this;

        return repository.foundLabels[label] === true;
    },

    /**
     * Determines whether one or more pending labels (gotos) have been found
     *
     * @return {boolean}
     */
    hasPending: function () {
        return Object.keys(this.pendingLabels).length > 0;
    },

    /**
     * Determines whether the given label has a goto but has not yet been found
     *
     * @param {string} label
     * @return {boolean}
     */
    isPending: function (label) {
        return this.pendingLabels[label] === true;
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
