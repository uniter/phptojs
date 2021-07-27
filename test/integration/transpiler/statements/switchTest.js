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

describe('Transpiler "switch" statement test', function () {
    it('should correctly transpile a switch with two cases and default in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_SWITCH_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 21
                    },
                    right: [{
                        operator: '+',
                        operand: {
                            name: 'N_INTEGER',
                            number: 6
                        }
                    }]
                },
                cases: [{
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 27
                    },
                    body: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '7'
                                }
                            }]
                        }
                    }, {
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }, {
                    name: 'N_DEFAULT_CASE',
                    body: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '8'
                                }
                            }]
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var add = core.add, createInteger = core.createInteger, getVariable = core.getVariable, setValue = core.setValue, switchCase = core.switchCase, switchOn = core.switchOn;' +
            'block_1: {' +
            'var switchExpression_1 = switchOn(add(createInteger(21), createInteger(6))), ' +
            'switchMatched_1 = false;' +
            'if (switchMatched_1 || switchCase(switchExpression_1, createInteger(27))) {' +
            'switchMatched_1 = true; ' +
            'setValue(getVariable("a"), createInteger(7));' +
            'break block_1;' +
            '}' +
            'if (!switchMatched_1) {' +
            'switchMatched_1 = true; ' +
            'setValue(getVariable("a"), createInteger(8));' +
            '}' +
            '}' +
            '});'
        );
    });
});
