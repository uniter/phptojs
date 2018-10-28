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
    phpToJS = require('../../..');

describe('Transpiler function call expression test', function () {
    it('should correctly transpile a call with no arguments', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: []
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(tools.valueFactory.createBarewordString("myFunc").call([], namespaceScope) || tools.valueFactory.createNull());' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });

    it('should correctly transpile a call having arguments with simple values', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
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
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(tools.valueFactory.createBarewordString("myFunc").call([' +
            'tools.valueFactory.createString("My string"), ' +
            'tools.valueFactory.createInteger(21), ' +
            'tools.valueFactory.createFloat(101.4)' +
            '], namespaceScope) || tools.valueFactory.createNull());' +
            'return tools.valueFactory.createNull();' +
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
                        name: 'N_STRING',
                        string: 'myFunc'
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
                                properties: [{
                                    property: {
                                        name: 'N_STRING',
                                        string: 'myProp'
                                    }
                                }]
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
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(tools.valueFactory.createBarewordString("myFunc").call([' +
            'tools.valueFactory.createArray([' +
            'tools.createKeyValuePair(' +
            'tools.valueFactory.createString("myVarElement"), ' +
            'scope.getVariable("myVarInNamedElement").getValue()' +
            '), ' +
            'tools.createKeyValuePair(' +
            'tools.valueFactory.createString("myPropertyElement"), ' +
            'scope.getVariable("myObject").getValue().getInstancePropertyByName(tools.valueFactory.createBarewordString("myProp")).getValue()' +
            '), ' +
            'scope.getVariable("myVarInIndexedElement").getValue()' +
            ']), ' +
            'scope.getVariable("myVarAsArg")' + // Should not `.getValue()`, in case parameter is by-reference
            ', ' +
            '(scope.getVariable("myVarAsCondition").getValue().coerceToBoolean().getNative() ? ' +
            'namespaceScope.getConstant("show me if truthy") : ' +
            'namespaceScope.getConstant("show me if falsy")' +
            ')], namespaceScope) || tools.valueFactory.createNull());' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });
});
