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

describe('Transpiler closure expression test', function () {
    it('should correctly transpile a return of a closure with parameters and bound variables', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_CLOSURE',
                    args: [{
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'arg1'
                        }
                    }, {
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'arg2'
                            }
                        }
                    }, {
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'arg3'
                        },
                        value: {
                            name: 'N_INTEGER',
                            number: 21
                        }
                    }],
                    bindings: [{
                        name: 'N_VARIABLE',
                        variable: 'bound1'
                    }, {
                        name: 'N_REFERENCE',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'bound2'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_INTEGER',
                                number: 21
                            }]
                        }]
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return tools.createClosure(' +
            '(function (parentScope) { ' +
            'return function ($arg1, $arg2, $arg3) {' +
            'var scope = this;' +
            'scope.getVariable("arg1").setValue($arg1.getValue());' +
            'scope.getVariable("arg2").setReference($arg2.getReference());' +
            'scope.getVariable("arg3").setValue($arg3 ? $arg3.getValue() : tools.valueFactory.createInteger(21));' +
            'scope.getVariable("bound1").setValue(parentScope.getVariable("bound1").getValue());' +
            'scope.getVariable("bound2").setReference(parentScope.getVariable("bound2").getReference());' +
            'stdout.write(tools.valueFactory.createInteger(21).coerceToString().getNative());' +
            '}; ' +
            '}(scope)), ' +
            'scope);' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });

    it('should correctly transpile a return of a closure with a parameter that is by-ref and has a default value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_CLOSURE',
                    args: [{
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'myArg'
                            }
                        },
                        value: {
                            name: 'N_INTEGER',
                            number: 27
                        }
                    }],
                    bindings: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_INTEGER',
                                number: 21
                            }]
                        }]
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return tools.createClosure(' +
            'function ($myArg) {' +
            'var scope = this;' +
            'if ($myArg) {' +
            'scope.getVariable("myArg").setReference($myArg.getReference());' +
            '} else {' +
            'scope.getVariable("myArg").setValue(tools.valueFactory.createInteger(27));' +
            '}' +
            'stdout.write(tools.valueFactory.createInteger(21).coerceToString().getNative());' +
            '}, ' +
            'scope);' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });
});
