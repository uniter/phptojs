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
    phpToJS = require('../../../../../..');

describe('Transpiler class statement constructor property promotion test', function () {
    it('should correctly transpile a constructor with one promoted public typed property', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_METHOD_DEFINITION',
                    visibility: 'public',
                    func: {
                        name: 'N_STRING',
                        string: '__construct'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        visibility: 'public',
                        type: {
                            name: 'N_SCALAR_TYPE',
                            type: 'string'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'name'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass, getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, setValue = core.setValue;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"name": {visibility: "public", type: {"type":"scalar","scalarType":"string"}, value: function () { return null; }}' +
            '}, ' +
            'methods: {' +
            '"__construct": {isStatic: false, method: function ___construct() {' +
            'setValue(getInstanceProperty(getVariable("this"), "name"), getVariable("name"));' +
            '}, args: [{"type":"scalar","scalarType":"string","name":"name"}]}' +
            '}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile a constructor with one promoted readonly typed property', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_METHOD_DEFINITION',
                    visibility: 'public',
                    func: {
                        name: 'N_STRING',
                        string: '__construct'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
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
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass, getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, setValue = core.setValue;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"id": {visibility: "public", readonly: true, type: {"type":"scalar","scalarType":"int"}, value: function () { return null; }}' +
            '}, ' +
            'methods: {' +
            '"__construct": {isStatic: false, method: function ___construct() {' +
            'setValue(getInstanceProperty(getVariable("this"), "id"), getVariable("id"));' +
            '}, args: [{"type":"scalar","scalarType":"int","name":"id"}]}' +
            '}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile a constructor with a promoted property without a type', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_METHOD_DEFINITION',
                    visibility: 'public',
                    func: {
                        name: 'N_STRING',
                        string: '__construct'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        visibility: 'public',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'value'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass, getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, setValue = core.setValue;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"value": {visibility: "public", value: function () { return null; }}' +
            '}, ' +
            'methods: {' +
            '"__construct": {isStatic: false, method: function ___construct() {' +
            'setValue(getInstanceProperty(getVariable("this"), "value"), getVariable("value"));' +
            '}, args: [{"name":"value"}]}' +
            '}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile a constructor with mixed promoted and regular parameters', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_METHOD_DEFINITION',
                    visibility: 'public',
                    func: {
                        name: 'N_STRING',
                        string: '__construct'
                    },
                    args: [
                        {
                            name: 'N_ARGUMENT',
                            visibility: 'public',
                            type: {
                                name: 'N_SCALAR_TYPE',
                                type: 'string'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'name'
                            }
                        },
                        {
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_SCALAR_TYPE',
                                type: 'int'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'age'
                            }
                        },
                        {
                            name: 'N_ARGUMENT',
                            visibility: 'private',
                            type: {
                                name: 'N_SCALAR_TYPE',
                                type: 'bool'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'active'
                            },
                            value: {
                                name: 'N_BOOLEAN',
                                bool: true
                            }
                        }
                    ],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass, getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, setValue = core.setValue, trueValue = core.trueValue;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"name": {visibility: "public", type: {"type":"scalar","scalarType":"string"}, value: function () { return null; }}, ' +
            '"active": {visibility: "private", type: {"type":"scalar","scalarType":"bool"}, value: function () { return null; }}' +
            '}, ' +
            'methods: {' +
            '"__construct": {isStatic: false, method: function ___construct() {' +
            'setValue(getInstanceProperty(getVariable("this"), "name"), getVariable("name"));' +
            'setValue(getInstanceProperty(getVariable("this"), "active"), getVariable("active"));' +
            '}, args: [' +
            '{"type":"scalar","scalarType":"string","name":"name"},' +
            '{"type":"scalar","scalarType":"int","name":"age"},' +
            '{"type":"scalar","scalarType":"bool","name":"active","value":function () { return trueValue; }}' +
            ']}' +
            '}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });
});
