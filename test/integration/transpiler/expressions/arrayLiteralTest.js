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

describe('Transpiler array literal expression test', function () {
    it('should correctly transpile a return of array with immediate integer and variable reference', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ARRAY_LITERAL',
                    elements: [{
                        name: 'N_INTEGER',
                        number: 21
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'myVarByVal'
                    }, {
                        name: 'N_REFERENCE',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'myVarByRef'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return tools.valueFactory.createArray([' +
            'tools.valueFactory.createInteger(21), ' +
            'scope.getVariable("myVarByVal").getValue(), ' +
            'scope.getVariable("myVarByRef").getReference()' +
            ']);' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });

    it('should correctly transpile an assignment array with immediate integer, variable, array element and object property references', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_VARIABLE',
                        variable: 'myTarget'
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_ARRAY_LITERAL',
                            elements: [{
                                name: 'N_INTEGER',
                                number: 21
                            }, {
                                name: 'N_VARIABLE',
                                variable: 'myVarByVal'
                            }, {
                                name: 'N_REFERENCE',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVarByRef'
                                }
                            }, {
                                name: 'N_REFERENCE',
                                operand: {
                                    name: 'N_ARRAY_INDEX',
                                    array: {
                                        name: 'N_VARIABLE',
                                        variable: 'myArray'
                                    },
                                    indices: [{
                                        index: {
                                            name: 'N_STRING_LITERAL',
                                            string: 'myElementByRef'
                                        }
                                    }]
                                }
                            }, {
                                name: 'N_REFERENCE',
                                operand: {
                                    name: 'N_OBJECT_PROPERTY',
                                    object: {
                                        name: 'N_VARIABLE',
                                        variable: 'myObject'
                                    },
                                    properties: [{
                                        property: {
                                            name: 'N_STRING',
                                            string: 'myElementByRef'
                                        }
                                    }]
                                }
                            }]
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'scope.getVariable("myTarget").setValue(tools.valueFactory.createArray([' +
            'tools.valueFactory.createInteger(21), ' +
            'scope.getVariable("myVarByVal").getValue(), ' +
            'scope.getVariable("myVarByRef").getReference(), ' +
            'scope.getVariable("myArray").getValue().getElementByKey(tools.valueFactory.createString("myElementByRef")).getReference(), ' +
            'scope.getVariable("myObject").getValue().getInstancePropertyByName(tools.valueFactory.createBarewordString("myElementByRef")).getReference()' +
            ']));' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });

    it('should correctly transpile a return of array with key=>value and key=>reference pairs', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ARRAY_LITERAL',
                    elements: [{
                        name: 'N_KEY_VALUE_PAIR',
                        key: {
                            name: 'N_STRING_LITERAL',
                            string: 'myKeyForVal'
                        },
                        value: {
                            name: 'N_VARIABLE',
                            variable: 'myVarByVal'
                        }
                    }, {
                        name: 'N_KEY_VALUE_PAIR',
                        key: {
                            name: 'N_STRING_LITERAL',
                            string: 'myKeyForRef'
                        },
                        value: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'myVarByRef'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return tools.valueFactory.createArray([' +
            'tools.createKeyValuePair(tools.valueFactory.createString("myKeyForVal"), scope.getVariable("myVarByVal").getValue()), ' +
            'tools.createKeyReferencePair(tools.valueFactory.createString("myKeyForRef"), scope.getVariable("myVarByRef").getReference())' +
            ']);' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });
});
