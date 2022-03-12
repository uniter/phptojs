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

describe('Transpiler decrement "--" operator test', function () {
    it('should correctly transpile a pre-decrement expression statement', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_UNARY_EXPRESSION',
                    operand: {
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    },
                    operator: '--',
                    prefix: true
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, preDecrement = core.preDecrement;' +
            'preDecrement(getVariable("myVar"));' +
            '});'
        );
    });

    it('should correctly transpile a post-decrement expression statement', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_UNARY_EXPRESSION',
                    operand: {
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    },
                    operator: '--',
                    prefix: false
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, postDecrement = core.postDecrement;' +
            'postDecrement(getVariable("myVar"));' +
            '});'
        );
    });
});
