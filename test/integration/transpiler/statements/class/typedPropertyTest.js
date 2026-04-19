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

describe('Transpiler class statement with typed property definitions test', function () {
    it('should correctly transpile a class with a typed instance property with no default value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_INSTANCE_PROPERTY_DEFINITION',
                    visibility: 'public',
                    type: {
                        name: 'N_SCALAR_TYPE',
                        type: 'int'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'count'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"count": {visibility: "public", type: {"type":"scalar","scalarType":"int"}, value: function () { return null; }}' +
            '}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile a class with a typed instance property with a default value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_INSTANCE_PROPERTY_DEFINITION',
                    visibility: 'private',
                    type: {
                        name: 'N_SCALAR_TYPE',
                        type: 'string'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'name'
                    },
                    value: {
                        name: 'N_STRING_LITERAL',
                        string: 'default'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"name": {visibility: "private", type: {"type":"scalar","scalarType":"string"}, value: function () { return createString("default"); }}' +
            '}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile a class with a readonly typed instance property', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_INSTANCE_PROPERTY_DEFINITION',
                    visibility: 'public',
                    readonly: true,
                    type: {
                        name: 'N_SCALAR_TYPE',
                        type: 'int'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'id'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"id": {visibility: "public", readonly: true, type: {"type":"scalar","scalarType":"int"}, value: function () { return null; }}' +
            '}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile a class with a typed static property', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_STATIC_PROPERTY_DEFINITION',
                    visibility: 'public',
                    type: {
                        name: 'N_SCALAR_TYPE',
                        type: 'int'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'count'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {' +
            '"count": {visibility: "public", type: {"type":"scalar","scalarType":"int"}, value: function () { return null; }}' +
            '}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile a class with a typed instance property with a class type', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_INSTANCE_PROPERTY_DEFINITION',
                    visibility: 'protected',
                    type: {
                        name: 'N_CLASS_TYPE',
                        className: 'MyDependency'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'dep'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"dep": {visibility: "protected", type: {"type":"class","className":"MyDependency"}, value: function () { return null; }}' +
            '}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });
});
