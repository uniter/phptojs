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
    phpToJS = require('../../../../../index');

describe('Transpiler variable function call expression test', function () {
    it('should correctly transpile a call with no arguments', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_VARIABLE',
                        variable: 'myFuncNameVar'
                    },
                    args: []
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callVariableFunction = core.callVariableFunction, getVariable = core.getVariable;' +
            'callVariableFunction(getVariable("myFuncNameVar"))();' +
            '}'
        );
    });

    it('should correctly transpile a call to variable function name having arguments with simple values', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_VARIABLE',
                        variable: 'myFuncNameVar'
                    },
                    args: [{
                        name: 'N_STRING_LITERAL',
                        string: 'My string'
                    }, {
                        name: 'N_INTEGER',
                        number: 21
                    }, {
                        name: 'N_FLOAT',
                        number: 101.4
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callVariableFunction = core.callVariableFunction, createFloat = core.createFloat, createInteger = core.createInteger, createString = core.createString, getVariable = core.getVariable;' +
            'callVariableFunction(getVariable("myFuncNameVar"))' +
            '(createString("My string"))' +
            '(createInteger(21))' +
            '(createFloat(101.4))' +
            '();' +
            '}'
        );
    });

    it('should correctly transpile a call having arguments with complex values', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_VARIABLE',
                        variable: 'myFuncNameVar'
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
            'var callVariableFunction = core.callVariableFunction, createArray = core.createArray, createKeyValuePair = core.createKeyValuePair, createString = core.createString, getConstant = core.getConstant, getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, ternary = core.ternary;' +
            'callVariableFunction(getVariable("myFuncNameVar"))(' +
            'createArray' +
            '(createKeyValuePair(' +
            'createString("myVarElement"))' +
            '(getVariable("myVarInNamedElement")' +
            '))' +
            '(createKeyValuePair(' +
            'createString("myPropertyElement"))' +
            '(getInstanceProperty(getVariable("myObject"))("myProp")' +
            '))' +
            '(getVariable("myVarInIndexedElement"))' +
            '())(' +
            'getVariable("myVarAsArg")' +
            ')(' +
            '(ternary(getVariable("myVarAsCondition")) ? ' +
            'getConstant("show me if truthy") : ' +
            'getConstant("show me if falsy")' +
            ')' +
            ')();' +
            '}'
        );
    });
});
