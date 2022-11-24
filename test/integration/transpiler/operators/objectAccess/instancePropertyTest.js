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
            'return getInstanceProperty(getInstanceProperty(getVariable("myVar"))("firstProp"))("secondProp");' +
            '}'
        );
    });

    it('should correctly transpile a read of dynamically referenced to a property', function () {
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
            'return getVariableInstanceProperty(getVariable("myObjectVar"))(getVariable("myVarHoldingPropName"));' +
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
            'setValue(getInstanceProperty(getVariable("myVar"))("myProp"))(createInteger(1234));' +
            '}'
        );
    });
});
