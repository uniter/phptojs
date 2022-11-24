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

describe('Transpiler "for" statement test', function () {
    it('should correctly transpile a for loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOR_STATEMENT',
                initializer: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [{
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'i'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '0'
                            }
                        }]
                    }]
                },
                condition: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [{
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'i'
                        },
                        right: [{
                            operator: '<',
                            operand: {
                                name: 'N_INTEGER',
                                number: '2'
                            }
                        }]
                    }]
                },
                update: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [{
                        name: 'N_UNARY_EXPRESSION',
                        operator: '++',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'i'
                        },
                        prefix: false
                    }]
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_VARIABLE',
                            variable: 'i'
                        }]
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, echo = core.echo, getVariable = core.getVariable, isLessThan = core.isLessThan, loop = core.loop, postIncrement = core.postIncrement, setValue = core.setValue;' +
            'block_1: for (' +
            'setValue(getVariable("i"))(createInteger(0));' +
            'loop(0, isLessThan(getVariable("i"))(createInteger(2)));' +
            'postIncrement(getVariable("i"))' +
            ') {' +
            'echo(getVariable("i"));' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile an infinite for loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOR_STATEMENT',
                initializer: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: []
                },
                condition: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: []
                },
                update: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: []
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_VARIABLE',
                            variable: 'i'
                        }]
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var echo = core.echo, getVariable = core.getVariable, loop = core.loop;' +
            'block_1: for (;loop(0);) {' +
            'echo(getVariable("i"));' +
            '}' +
            '});'
        );
    });
});
