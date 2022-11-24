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

describe('Transpiler ternary expression test', function () {
    it('should correctly transpile a ternary with comparison in condition', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_TERNARY',
                    condition: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        right: [{
                            operator: '==',
                            operand: {
                                name: 'N_INTEGER',
                                number: '21'
                            }
                        }]
                    },
                    consequent: {
                        name: 'N_INTEGER',
                        number: '22'
                    },
                    alternate: {
                        name: 'N_INTEGER',
                        number: '23'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, getVariable = core.getVariable, isEqual = core.isEqual, ternary = core.ternary;' +
            '(ternary(isEqual(getVariable("myVar"))(createInteger(21))) ? ' +
            'createInteger(22) : ' +
            'createInteger(23));' +
            '}'
        );
    });

    it('should correctly transpile a shorthand ternary at the top level', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_TERNARY',
                    condition: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        right: [{
                            operator: '==',
                            operand: {
                                name: 'N_INTEGER',
                                number: '21'
                            }
                        }]
                    },
                    consequent: null,
                    alternate: {
                        name: 'N_INTEGER',
                        number: '23'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, getVariable = core.getVariable, isEqual = core.isEqual, ternary = core.ternary, ternaryCondition;' +
            '(ternary(ternaryCondition = isEqual(getVariable("myVar"))(createInteger(21))) ? ' +
            'ternaryCondition : ' +
            'createInteger(23));' +
            '}'
        );
    });

    it('should correctly transpile a shorthand ternary inside function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'myFunc'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_TERNARY',
                            condition: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '==',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '21'
                                    }
                                }]
                            },
                            consequent: null,
                            alternate: {
                                name: 'N_INTEGER',
                                number: '23'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, defineFunction = core.defineFunction, getVariable = core.getVariable, isEqual = core.isEqual, ternary = core.ternary;' +
            'defineFunction("myFunc", function _myFunc() {' +
            'var ternaryCondition;' +
            '(ternary(ternaryCondition = isEqual(getVariable("myVar"))(createInteger(21))) ? ' +
            'ternaryCondition : ' +
            'createInteger(23));' +
            '});' +
            '}'
        );
    });
});
