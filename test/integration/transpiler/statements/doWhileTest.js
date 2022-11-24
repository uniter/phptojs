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

describe('Transpiler "do..while" statement test', function () {
    it('should correctly transpile a do..while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DO_WHILE_STATEMENT',
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
            'block_1: do {' +
            'echo(createInteger(4));' +
            '} while (' +
            'loop(0, isGreaterThan(createInteger(27))(createInteger(21)))' +
            ');' +
            '});'
        );
    });

    it('should correctly transpile multiple and nested while loops within a scope', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DO_WHILE_STATEMENT',
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
                        name: 'N_DO_WHILE_STATEMENT',
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
                name: 'N_DO_WHILE_STATEMENT',
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
            'block_1: do {' +
            'echo(createString("first"));' +
            'block_2: do {' +
            'echo(createString("second, nested"));' +
            '} while (loop(1, getVariable("secondVar")));' +
            '} while (loop(0, getVariable("firstVar")));' +
            'block_1: do {' +
            'echo(createString("third"));' +
            '} while (loop(2, getVariable("thirdVar")));' +
            '});'
        );
    });
});
