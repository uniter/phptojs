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

describe('Transpiler "while" statement test', function () {
    it('should correctly transpile a while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 27
                    },
                    right: [{
                        operator: '>',
                        operand: {
                            name: 'N_INTEGER',
                            number: 21
                        }
                    }]
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, echo = core.echo, isGreaterThan = core.isGreaterThan, loop = core.loop;' +
            'block_1: while (loop(0, isGreaterThan(createInteger(27))(createInteger(21)))) {' +
            'echo(createInteger(4));' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile multiple and nested while loops within a scope', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'firstVar'
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'first'
                        }]
                    }, {
                        name: 'N_WHILE_STATEMENT',
                        condition: {
                            name: 'N_VARIABLE',
                            variable: 'secondVar'
                        },
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: [{
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'second, nested'
                                }]
                            }]
                        }
                    }]
                }
            }, {
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'thirdVar'
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'third'
                        }]
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createString = core.createString, echo = core.echo, getVariable = core.getVariable, loop = core.loop;' +
            'block_1: while (loop(0, getVariable("firstVar"))) {' +
            'echo(createString("first"));' +
            'block_2: while (loop(1, getVariable("secondVar"))) {' +
            'echo(createString("second, nested"));' +
            '}' +
            '}' +
            'block_1: while (loop(2, getVariable("thirdVar"))) {' +
            'echo(createString("third"));' +
            '}' +
            '});'
        );
    });
});
