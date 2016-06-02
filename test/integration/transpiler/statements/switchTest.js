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
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'block_0: {' +
            'var switchExpression_0 = tools.valueFactory.createInteger(21).add(tools.valueFactory.createInteger(6)), ' +
            'switchMatched_0 = false;' +
            'if (switchMatched_0 || switchExpression_0.isEqualTo(tools.valueFactory.createInteger(27)).getNative()) {' +
            'switchMatched_0 = true; ' +
            'scope.getVariable("a").setValue(tools.valueFactory.createInteger(7));' +
            'break block_0;' +
            '}' +
            'if (!switchMatched_0) {' +
            'switchMatched_0 = true; ' +
            'scope.getVariable("a").setValue(tools.valueFactory.createInteger(8));' +
            '}' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
