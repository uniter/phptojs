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
    it('should correctly transpile a return of empty array', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ARRAY_LITERAL',
                    elements: []
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createArray = core.createArray;' +
            'return createArray();' +
            '}'
        );
    });

    it('should correctly transpile a return of array with immediate integer, variable and variable reference', function () {
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
            'function (core) {' +
            'var createArray = core.createArray, createInteger = core.createInteger, createReferenceElement = core.createReferenceElement, getVariable = core.getVariable;' +
            'return createArray(' +
            'createInteger(21), ' +
            'getVariable("myVarByVal"), ' +
            'createReferenceElement(getVariable("myVarByRef"))' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a return of array with immediate integer between two variables', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ARRAY_LITERAL',
                    elements: [{
                        name: 'N_VARIABLE',
                        variable: 'myFirstVar'
                    }, {
                        name: 'N_INTEGER',
                        number: 21
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'mySecondVar'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createArray = core.createArray, createInteger = core.createInteger, getVariable = core.getVariable;' +
            'return createArray(' +
            // All elements are benign despite containing variables, so no snapshotting is needed.
            'getVariable("myFirstVar"), ' +
            'createInteger(21), ' +
            'getVariable("mySecondVar")' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a return of array with immediate integer between a variable and an assignment', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ARRAY_LITERAL',
                    elements: [{
                        name: 'N_VARIABLE',
                        variable: 'myFirstVar'
                    }, {
                        name: 'N_INTEGER',
                        number: 21
                    }, {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'mySecondVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: 101
                            }
                        }]
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createArray = core.createArray, createInteger = core.createInteger, getVariable = core.getVariable, setValue = core.setValue, snapshot = core.snapshot;' +
            'return createArray(' +
            // This non-literal element could be affected by the assignment below,
            // so it must be snapshotted.
            'snapshot(getVariable("myFirstVar")), ' +
            'createInteger(21), ' +
            'setValue(getVariable("mySecondVar"), createInteger(101))' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile an assignment of array with immediate integer, variable, array element and object property references', function () {
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
                                    index: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'myElementByRef'
                                    }
                                }
                            }, {
                                name: 'N_REFERENCE',
                                operand: {
                                    name: 'N_OBJECT_PROPERTY',
                                    object: {
                                        name: 'N_VARIABLE',
                                        variable: 'myObject'
                                    },
                                    property: {
                                        name: 'N_STRING',
                                        string: 'myPropertyByRef'
                                    }
                                }
                            }]
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createArray = core.createArray, createInteger = core.createInteger, createReferenceElement = core.createReferenceElement, getElement = core.getElement, getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, setValue = core.setValue;' +
            'setValue(getVariable("myTarget"), ' +
            'createArray(' +
            'createInteger(21), ' +
            'getVariable("myVarByVal"), ' +
            'createReferenceElement(getVariable("myVarByRef")), ' +
            'createReferenceElement(getElement(getVariable("myArray"), "myElementByRef")), ' +
            'createReferenceElement(getInstanceProperty(getVariable("myObject"), "myPropertyByRef"))' +
            ')' +
            ');' +
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
            'function (core) {' +
            'var createArray = core.createArray, createKeyReferencePair = core.createKeyReferencePair, createKeyValuePair = core.createKeyValuePair, createString = core.createString, getVariable = core.getVariable;' +
            'return createArray(' +
            'createKeyValuePair(createString("myKeyForVal"), getVariable("myVarByVal")), ' +
            'createKeyReferencePair(createString("myKeyForRef"), getVariable("myVarByRef"))' +
            ');' +
            '}'
        );
    });
});
