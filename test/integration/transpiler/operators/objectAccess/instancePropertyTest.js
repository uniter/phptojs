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

describe('Transpiler object instance property access test', function () {
    it('should correctly transpile a read of a property of a property', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_OBJECT_PROPERTY',
                    object: {
                        name: 'N_OBJECT_PROPERTY',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        property: {
                            name: 'N_STRING',
                            string: 'firstProp'
                        }
                    },
                    property: {
                        name: 'N_STRING',
                        string: 'secondProp'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable;' +
            'return getInstanceProperty(getInstanceProperty(getVariable("myVar"), "firstProp"), "secondProp");' +
            '}'
        );
    });

    it('should correctly transpile a read of dynamically referenced property', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_OBJECT_PROPERTY',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'myObjectVar'
                    },
                    property: {
                        name: 'N_VARIABLE',
                        variable: 'myVarHoldingPropName'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getVariable = core.getVariable, getVariableInstanceProperty = core.getVariableInstanceProperty;' +
            'return getVariableInstanceProperty(getVariable("myObjectVar"), getVariable("myVarHoldingPropName"));' +
            '}'
        );
    });

    it('should correctly transpile a read of dynamically referenced property with complex expression', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_OBJECT_PROPERTY',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'myObjectVar'
                    },
                    property: {
                        name: 'N_TERNARY',
                        condition: {
                            name: 'N_VARIABLE',
                            variable: 'myVarAsCondition'
                        },
                        consequent: {
                            name: 'N_STRING_LITERAL',
                            string: 'myVarHoldingPropNameIfTruthy'
                        },
                        alternate: {
                            name: 'N_STRING_LITERAL',
                            string: 'myVarHoldingPropNameIfFalsy'
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, getVariable = core.getVariable, getVariableInstanceProperty = core.getVariableInstanceProperty, snapshot = core.snapshot, ternary = core.ternary;' +
            'return getVariableInstanceProperty(' +
            // Plain variable object operand must be snapshotted due to complex subsequent operand
            // (ternary property name operand).
            'snapshot(getVariable("myObjectVar")), ' +
            '(ternary(getVariable("myVarAsCondition")) ? ' +
            'createString("myVarHoldingPropNameIfTruthy") : ' +
            'createString("myVarHoldingPropNameIfFalsy")' +
            '));' +
            '}'
        );
    });

    it('should correctly transpile a write to a property', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_OBJECT_PROPERTY',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        property: {
                            name: 'N_STRING',
                            string: 'myProp'
                        }
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_INTEGER',
                            number: 1234
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, setValue = core.setValue;' +
            'setValue(getInstanceProperty(getVariable("myVar"), "myProp"), createInteger(1234));' +
            '}'
        );
    });
});
