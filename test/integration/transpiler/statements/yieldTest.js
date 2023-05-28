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
