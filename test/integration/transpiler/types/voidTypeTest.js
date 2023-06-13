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

describe('Transpiler void type test', function () {
    it('should correctly transpile an empty function with void return type', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'gogo'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: []
                },
                returnType: {
                    name: 'N_VOID_TYPE'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineFunction = core.defineFunction;' +
            'defineFunction("gogo", function _gogo() {}, [], ' +
            '{"type":"void"}' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a function with void return type that returns with no value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'gogo'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_RETURN_STATEMENT'
                    }]
                },
                returnType: {
                    name: 'N_VOID_TYPE'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineFunction = core.defineFunction;' +
            'defineFunction("gogo", function _gogo() {return;}, [], ' +
            '{"type":"void"}' +
            ');' +
            '}'
        );
    });

    it('should throw when a function with void return type returns null explicitly', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'gogo',
                    bounds: {start: {line: 2, column: 3}}
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_RETURN_STATEMENT',
                        expression: {
                            name: 'N_NULL',
                            bounds: {start: {line: 6, column: 7}}
                        },
                        bounds: {start: {line: 4, column: 5}}
                    }]
                },
                returnType: {
                    name: 'N_VOID_TYPE',
                    bounds: {start: {line: 2, column: 9}}
                },
                bounds: {start: {line: 1, column: 1}}
            }]
        };

        expect(function () {
            phpToJS.transpile(ast, {bare: true, path: '/path/to/my_module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: A void function must not return a value (did you mean "return;" instead of "return null;"?) in /path/to/my_module.php on line 4'
        );
    });

    it('should throw when a function with void return type returns a value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'gogo',
                    bounds: {start: {line: 2, column: 3}}
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_RETURN_STATEMENT',
                        expression: {
                            name: 'N_INTEGER',
                            number: '21',
                            bounds: {start: {line: 6, column: 7}}
                        },
                        bounds: {start: {line: 4, column: 5}}
                    }]
                },
                returnType: {
                    name: 'N_VOID_TYPE',
                    bounds: {start: {line: 2, column: 9}}
                },
                bounds: {start: {line: 1, column: 1}}
            }]
        };

        expect(function () {
            phpToJS.transpile(ast, {bare: true, path: '/path/to/my_module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: A void function must not return a value in /path/to/my_module.php on line 4'
        );
    });
});
