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
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(scope.getVariable("myVar").getValue().isEqualTo(tools.valueFactory.createInteger(21)).coerceToBoolean().getNative() ? ' +
            'tools.valueFactory.createInteger(22) : ' +
            'tools.valueFactory.createInteger(23));' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });

    it('should correctly transpile a shorthand ternary', function () {
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
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '((tools.ternaryCondition = scope.getVariable("myVar").getValue().isEqualTo(tools.valueFactory.createInteger(21))).coerceToBoolean().getNative() ? ' +
            'tools.ternaryCondition : ' +
            'tools.valueFactory.createInteger(23));' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });
});
