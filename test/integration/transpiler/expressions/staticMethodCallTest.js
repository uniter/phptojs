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
    phpToJS = require('../../../..');

describe('Transpiler static method call expression test', function () {
    it('should correctly transpile a call to static method with FQCN (forwarding)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_STATIC_METHOD_CALL',
                    className: {
                        name: 'N_PARENT'
                    },
                    method: {
                        name: 'N_STRING',
                        string: 'myMethod'
                    },
                    args: [{
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'yourVar'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callStaticMethod = core.callStaticMethod, getSuperClassNameOrThrow = core.getSuperClassNameOrThrow, getVariable = core.getVariable;' +
            'callStaticMethod(getSuperClassNameOrThrow(), "myMethod", ' +
            'true, ' + // Forwarding.
            'getVariable("myVar"), ' +
            'getVariable("yourVar")' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a call to static method with FQCN (non-forwarding)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_STATIC_METHOD_CALL',
                    className: {
                        name: 'N_STRING',
                        string: '\\My\\Space\\MyClass'
                    },
                    method: {
                        name: 'N_STRING',
                        string: 'myMethod'
                    },
                    args: [{
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'yourVar'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callStaticMethod = core.callStaticMethod, createBareword = core.createBareword, getVariable = core.getVariable;' +
            'callStaticMethod(createBareword("\\\\My\\\\Space\\\\MyClass"), "myMethod", ' +
            'false, ' + // Non-forwarding.
            'getVariable("myVar"), ' +
            'getVariable("yourVar")' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a call having arguments with complex values', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_STATIC_METHOD_CALL',
                    className: {
                        name: 'N_VARIABLE',
                        variable: 'myClassName'
                    },
                    method: {
                        name: 'N_STRING',
                        string: 'myMethod'
                    },
                    args: [{
                        name: 'N_ARRAY_LITERAL',
                        elements: [{
                            name: 'N_KEY_VALUE_PAIR',
                            key: {
                                name: 'N_STRING_LITERAL',
                                string: 'myVarElement'
                            },
                            value: {
                                name: 'N_VARIABLE',
                                variable: 'myVarInNamedElement'
                            }
                        }, {
                            name: 'N_KEY_VALUE_PAIR',
                            key: {
                                name: 'N_STRING_LITERAL',
                                string: 'myPropertyElement'
                            },
                            value: {
                                name: 'N_OBJECT_PROPERTY',
                                object: {
                                    name: 'N_VARIABLE',
                                    variable: 'myObject'
                                },
                                property: {
                                    name: 'N_STRING',
                                    string: 'myProp'
                                }
                            }
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'myVarInIndexedElement'
                        }]
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'myVarAsArg'
                    }, {
                        name: 'N_TERNARY',
                        condition: {
                            name: 'N_VARIABLE',
                            variable: 'myVarAsCondition'
                        },
                        consequent: {
                            name: 'N_STRING',
                            string: 'show me if truthy'
                        },
                        alternate: {
                            name: 'N_STRING',
                            string: 'show me if falsy'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callStaticMethod = core.callStaticMethod, createArray = core.createArray, createKeyValuePair = core.createKeyValuePair, createString = core.createString, getConstant = core.getConstant, getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, snapshot = core.snapshot, ternary = core.ternary;' +
            // Plain variable object operand must be snapshotted due to complex subsequent operand (ternary argument).
            'callStaticMethod(snapshot(getVariable("myClassName")), "myMethod", false, ' +
            'createArray(' +
            'createKeyValuePair(' +
            'createString("myVarElement"), ' +
            'getVariable("myVarInNamedElement")' +
            '), ' +
            'createKeyValuePair(' +
            'createString("myPropertyElement"), ' +
            'getInstanceProperty(getVariable("myObject"), "myProp")' +
            '), ' +
            'getVariable("myVarInIndexedElement")' +
            '), ' +
            // Plain variable argument must be snapshotted due to complex subsequent argument (ternary).
            'snapshot(getVariable("myVarAsArg")), ' +
            '(ternary(getVariable("myVarAsCondition")) ? ' +
            'getConstant("show me if truthy") : ' +
            'getConstant("show me if falsy")' +
            '));' +
            '}'
        );
    });
});
