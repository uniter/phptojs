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

describe('Transpiler "require" expression test', function () {
    it('should correctly transpile in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_VARIABLE',
                        variable: 'map'
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_REQUIRE_EXPRESSION',
                            path: {
                                name: 'N_STRING_LITERAL',
                                string: 'abc.php'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, getVariable = core.getVariable, require = core.require, setValue = core.setValue;' +
            'setValue(getVariable("map"))(require(createString("abc.php")));' +
            '}'
        );
    });
});
