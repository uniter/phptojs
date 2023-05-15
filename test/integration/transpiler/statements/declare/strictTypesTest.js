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
    phpToJS = require('../../../../..'),
    PHPFatalError = phpCommon.PHPFatalError;

describe('Transpiler declare strict_types test', function () {
    it('should correctly transpile a declare with strict_types on', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DECLARE_STATEMENT',
                directives: [{
                    name: 'N_STRICT_TYPES_DIRECTIVE',
                    value: {
                        name: 'N_INTEGER',
                        number: '1'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var enableStrictTypes = core.enableStrictTypes;' +
            'enableStrictTypes();' +
            '}'
        );
    });

    it('should correctly transpile a declare with strict_types off', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DECLARE_STATEMENT',
                directives: [{
                    name: 'N_STRICT_TYPES_DIRECTIVE',
                    value: {
                        name: 'N_INTEGER',
                        number: '0'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            // There should be no opcode emitted, as this is the default.
            'function (core) {}'
        );
    });

    it('should throw when strict_types is given an integer that is not 0 or 1', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DECLARE_STATEMENT',
                directives: [{
                    name: 'N_STRICT_TYPES_DIRECTIVE',
                    value: {
                        name: 'N_INTEGER',
                        number: '21',
                        bounds: {start: {line: 6, column: 7}}
                    },
                    bounds: {start: {line: 4, column: 5}}
                }],
                bounds: {start: {line: 2, column: 3}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {bare: true, path: '/path/to/my_module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: strict_types declaration must have 0 or 1 as its value in /path/to/my_module.php on line 4'
        );
    });

    it('should throw when strict_types is given a non-literal', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DECLARE_STATEMENT',
                directives: [{
                    name: 'N_STRICT_TYPES_DIRECTIVE',
                    value: {
                        name: 'N_STRING',
                        string: 'abc',
                        bounds: {start: {line: 6, column: 7}}
                    },
                    bounds: {start: {line: 4, column: 5}}
                }],
                bounds: {start: {line: 2, column: 3}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {bare: true, path: '/path/to/my_module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: declare(strict_types) value must be a literal in /path/to/my_module.php on line 4'
        );
    });
});
