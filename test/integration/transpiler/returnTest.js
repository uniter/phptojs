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
    phpToJS = require('../../..');

describe('Transpiler "return" statement test', function () {
    it('should correctly transpile a return statement with no operand in default (async) mode', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT'
                }]
            };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'return;' +
            '});'
        );
    });

    it('should correctly transpile a return statement with an operand of 4 in default (async) mode', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '4'
                    }
                }]
            };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger;' +
            'return createInteger(4);' +
            '});'
        );
    });

    it('should correctly transpile a return statement with an operand of 6 in bare mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_INTEGER',
                    number: '6'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger;' +
            'return createInteger(6);' +
            '}'
        );
    });

    it('should correctly transpile a return statement of variable value in bare mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_VARIABLE',
                    variable: 'myVar'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getVariable = core.getVariable;' +
            'return getVariable("myVar");' +
            '}'
        );
    });
});
