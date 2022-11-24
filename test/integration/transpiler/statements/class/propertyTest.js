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

describe('Transpiler class statement with properties test', function () {
    it('should correctly transpile a class with instance properties with and without an initial value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_INSTANCE_PROPERTY_DEFINITION',
                    visibility: 'private',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'firstProp'
                    }
                }, {
                    name: 'N_INSTANCE_PROPERTY_DEFINITION',
                    visibility: 'private',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'secondProp'
                    },
                    value: {
                        name: 'N_INTEGER',
                        number: 21
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"firstProp": {visibility: "private", value: function (currentClass) { return null; }}, ' +
            '"secondProp": {visibility: "private", value: function (currentClass) { return createInteger(21); }}' +
            '}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '});'
        );
    });

    it('should correctly transpile a class with static properties with and without an initial value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_STATIC_PROPERTY_DEFINITION',
                    visibility: 'private',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'firstProp'
                    }
                }, {
                    name: 'N_STATIC_PROPERTY_DEFINITION',
                    visibility: 'private',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'secondProp'
                    },
                    value: {
                        name: 'N_INTEGER',
                        number: 21
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {' +
            '"firstProp": {' +
            'visibility: "private", ' +
            'value: function (currentClass) { return null; }' +
            '}, ' +
            '"secondProp": {' +
            'visibility: "private", ' +
            'value: function (currentClass) { return createInteger(21); }' +
            '}' +
            '}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '});'
        );
    });

    it('should correctly transpile a class with an instance property referencing a constant of the current class', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [
                    {
                        name: 'N_CONSTANT_DEFINITION',
                        constants: [{
                            constant: 'MY_CONST',
                            value: {
                                name: 'N_INTEGER',
                                number: 1001
                            }
                        }]
                    },
                    {
                        name: 'N_INSTANCE_PROPERTY_DEFINITION',
                        visibility: 'protected',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myProp'
                        },
                        value: {
                            name: 'N_CLASS_CONSTANT',
                            className: {
                                name: 'N_SELF'
                            },
                            constant: 'MY_CONST'
                        }
                    }
                ]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, defineClass = core.defineClass, getCurrentClassConstant = core.getCurrentClassConstant;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"myProp": {visibility: "protected", value: function (currentClass) { ' +
            'return getCurrentClassConstant(currentClass)("MY_CONST"); ' +
            '}}' +
            '}, ' +
            'methods: {}, ' +
            'constants: {' +
            '"MY_CONST": function (currentClass) { ' +
            'return createInteger(1001); ' +
            '}' +
            '}' +
            '});' +
            '});'
        );
    });

    it('should correctly transpile a class with a static property referencing a constant of the current class', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [
                    {
                        name: 'N_CONSTANT_DEFINITION',
                        constants: [{
                            constant: 'MY_CONST',
                            value: {
                                name: 'N_INTEGER',
                                number: 1001
                            }
                        }]
                    },
                    {
                        name: 'N_STATIC_PROPERTY_DEFINITION',
                        visibility: 'private',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myStaticProp'
                        },
                        value: {
                            name: 'N_CLASS_CONSTANT',
                            className: {
                                name: 'N_SELF'
                            },
                            constant: 'MY_CONST'
                        }
                    }
                ]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, defineClass = core.defineClass, getCurrentClassConstant = core.getCurrentClassConstant;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {' +
            '"myStaticProp": {' +
            'visibility: "private", ' +
            'value: function (currentClass) { ' +
            'return getCurrentClassConstant(currentClass)("MY_CONST"); ' +
            '}' +
            '}}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {' +
            '"MY_CONST": function (currentClass) { ' +
            'return createInteger(1001); ' +
            '}' +
            '}' +
            '});' +
            '});'
        );
    });
});
