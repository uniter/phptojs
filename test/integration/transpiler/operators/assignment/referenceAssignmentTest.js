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

describe('Transpiler reference assignment pseudo-operator "=&" test', function () {
    it('should correctly transpile a return statement with assignment of reference', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'anotherVar'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getVariable("myVar").setReference(scope.getVariable("anotherVar").getReference());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a return statement with assignment of reference that is then assigned by value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_VARIABLE',
                        variable: 'firstVar'
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'secondVar'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_REFERENCE',
                                    operand: {
                                        name: 'N_VARIABLE',
                                        variable: 'thirdVar'
                                    }
                                }
                            }]
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getVariable("firstVar").setValue(scope.getVariable("secondVar").setReference(scope.getVariable("thirdVar").getReference()).getValue());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
