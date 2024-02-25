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
    phpCommon = require('phpcommon'),
    phpToJS = require('../../../..'),
    PHPFatalError = phpCommon.PHPFatalError;

describe('Transpiler "yield" statement test', function () {
    // See also test/integration/transpiler/statements/function/generatorTest.js.

    it('should snapshot the key when given as a non-literal and value is complex', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'myGenerator'
                },
                generator: true,
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_YIELD_EXPRESSION',
                            key: {
                                name: 'N_VARIABLE',
                                variable: 'myKey'
                            },
                            value: {
                                name: 'N_TERNARY',
                                condition: {
                                    name: 'N_VARIABLE',
                                    variable: 'myCondition'
                                },
                                consequent: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'my value if truthy'
                                },
                                alternate: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'my value if falsy'
                                }
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, defineFunction = core.defineFunction, getVariable = core.getVariable, snapshot = core.snapshot, ternary = core.ternary, wrapGenerator = core.wrapGenerator, yieldWithKey = core.yieldWithKey;' +
            'defineFunction("myGenerator", wrapGenerator(function _myGenerator() {' +
            'yieldWithKey(' +
            'snapshot(getVariable("myKey")), ' +
            '(ternary(getVariable("myCondition")) ? createString("my value if truthy") : createString("my value if falsy"))' +
            ');' +
            '}));' +
            '}'
        );
    });

    it('should not snapshot the key when given and value is complex but key is a literal', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'myGenerator'
                },
                generator: true,
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_YIELD_EXPRESSION',
                            key: {
                                name: 'N_STRING_LITERAL',
                                string: 'my key'
                            },
                            value: {
                                name: 'N_TERNARY',
                                condition: {
                                    name: 'N_VARIABLE',
                                    variable: 'myCondition'
                                },
                                consequent: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'my value if truthy'
                                },
                                alternate: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'my value if falsy'
                                }
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, defineFunction = core.defineFunction, getVariable = core.getVariable, ternary = core.ternary, wrapGenerator = core.wrapGenerator, yieldWithKey = core.yieldWithKey;' +
            'defineFunction("myGenerator", wrapGenerator(function _myGenerator() {' +
            'yieldWithKey(' +
            'createString("my key"), ' +
            '(ternary(getVariable("myCondition")) ? createString("my value if truthy") : createString("my value if falsy"))' +
            ');' +
            '}));' +
            '}'
        );
    });

    it('should throw when a yield statement is used at the top level of a module', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_YIELD_EXPRESSION',
                    key: null,
                    value: {
                        name: 'N_STRING_LITERAL',
                        string: 'my value',
                        bounds: {start: {line: 7, column: 8}}
                    },
                    bounds: {start: {line: 5, column: 6}}
                },
                bounds: {start: {line: 3, column: 4}}
            }],
            bounds: {start: {line: 1, column: 2}}
        };

        expect(function () {
            phpToJS.transpile(ast, {bare: true, path: '/path/to/my_module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: The "yield" expression can only be used inside a function in /path/to/my_module.php on line 5'
        );
    });
});
