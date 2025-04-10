/*
 * PHPToJS - PHP-to-JavaScript transpiler
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phptojs
 *
 * Released under the MIT license
 * https://github.com/uniter/phptojs/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    phpToJS = require('../../../../..');

describe('Transpiler class statement using trait test', function () {
    it('should correctly transpile an empty class that uses a single trait', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                extend: 'My\\SuperClass',
                members: [{
                    name: 'N_USE_TRAIT_STATEMENT',
                    traitNames: ['My\\MixinTrait']
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: "My\\\\SuperClass", ' +
            'interfaces: [], ' +
            'traits: {names: ["My\\\\MixinTrait"]}, ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile an empty class that uses multiple traits in one statement', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                extend: 'My\\SuperClass',
                members: [{
                    name: 'N_USE_TRAIT_STATEMENT',
                    traitNames: ['My\\MixinTrait', 'Your\\OtherMixinTrait']
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: "My\\\\SuperClass", ' +
            'interfaces: [], ' +
            'traits: {names: ["My\\\\MixinTrait","Your\\\\OtherMixinTrait"]}, ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile an empty class that uses multiple traits across two statements', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                extend: 'My\\SuperClass',
                members: [{
                    name: 'N_USE_TRAIT_STATEMENT',
                    traitNames: ['My\\MixinTrait']
                }, {
                    name: 'N_USE_TRAIT_STATEMENT',
                    traitNames: ['Your\\OtherMixinTrait']
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: "My\\\\SuperClass", ' +
            'interfaces: [], ' +
            'traits: {names: ["My\\\\MixinTrait","Your\\\\OtherMixinTrait"]}, ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });
});
