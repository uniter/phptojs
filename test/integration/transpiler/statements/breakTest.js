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
    phpToJS = require('../../../..'),
    PHPFatalError = require('phpcommon').PHPFatalError;

describe('Transpiler "break" statement test', function () {
    it('should correctly transpile a break inside a for loop', function () {
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
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'block_0: for (' +
            'scope.getVariable("i").setValue(tools.valueFactory.createInteger(0));' +
            'scope.getVariable("i").getValue().isLessThan(tools.valueFactory.createInteger(2)).coerceToBoolean().getNative();' +
            'scope.getVariable("i").postIncrement()' +
            ') {' +
            'break block_0;' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a break inside a foreach loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray'
                },
                value: {
                    name: 'N_VARIABLE',
                    variable: 'item'
                },
                body: {
                    name: 'N_BREAK_STATEMENT',
                    levels: {
                        name: 'N_INTEGER',
                        number: '1'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var array_0 = scope.getVariable("myArray").getValue().reset();' +
            'var length_0 = array_0.getLength();' +
            'var pointer_0 = 0;' +
            'block_0: while (pointer_0 < length_0) {' +
            'scope.getVariable("item").setValue(array_0.getElementByIndex(pointer_0).getValue());' +
            'pointer_0++;' +
            'break block_0;' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a break inside a while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_INTEGER',
                    number: 21
                },
                statements: [{
                    name: 'N_BREAK_STATEMENT',
                    levels: {
                        name: 'N_INTEGER',
                        number: '1'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'while (tools.valueFactory.createInteger(21).coerceToBoolean().getNative()) {' +
            'break block_0;' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a break inside a do..while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DO_WHILE_STATEMENT',
                condition: {
                    name: 'N_INTEGER',
                    number: 21
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'do {' +
            'break block_0;' +
            '} while (tools.valueFactory.createInteger(21).coerceToBoolean().getNative());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a break inside a switch', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_SWITCH_STATEMENT',
                expression: {
                    name: 'N_INTEGER',
                    number: 21
                },
                cases: [{
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 21
                    },
                    body: [{
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'block_0: {' +
            'var switchExpression_0 = tools.valueFactory.createInteger(21), ' +
            'switchMatched_0 = false;' +
            'if (switchMatched_0 || switchExpression_0.isEqualTo(tools.valueFactory.createInteger(21)).getNative()) {' +
            'switchMatched_0 = true; ' +
            'break block_0;' +
            '}' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should throw a fatal error when zero is given as the break level', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_BREAK_STATEMENT',
                levels: {
                    name: 'N_INTEGER',
                    number: 0
                }
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'break\' operator accepts only positive numbers');
    });

    it('should throw a fatal error when negative one is given as the break level', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_BREAK_STATEMENT',
                levels: {
                    name: 'N_INTEGER',
                    number: -1
                }
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'break\' operator accepts only positive numbers');
    });

    it('should throw a runtime fatal error when not inside a looping structure for 1 level', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_BREAK_STATEMENT',
                levels: {
                    name: 'N_INTEGER',
                    number: 1
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'tools.throwCannotBreakOrContinue(1);' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should throw a runtime fatal error when code is not enough levels deep', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_INTEGER',
                    number: 21
                },
                statements: [{
                    name: 'N_BREAK_STATEMENT',
                    levels: {
                        name: 'N_INTEGER',
                        number: 2
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'while (tools.valueFactory.createInteger(21).coerceToBoolean().getNative()) {' +
            'tools.throwCannotBreakOrContinue(2);' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
