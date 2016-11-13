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
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'block_1: for (' +
            'scope.getVariable("i").setValue(tools.valueFactory.createInteger(0));' +
            'scope.getVariable("i").getValue().isLessThan(tools.valueFactory.createInteger(2)).coerceToBoolean().getNative();' +
            'scope.getVariable("i").postIncrement()' +
            ') {' +
            'stdout.write(scope.getVariable("i").getValue().coerceToString().getNative());' +
            '}' +
            'return tools.valueFactory.createNull();' +
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
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'block_1: for (;;) {' +
            'stdout.write(scope.getVariable("i").getValue().coerceToString().getNative());' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
