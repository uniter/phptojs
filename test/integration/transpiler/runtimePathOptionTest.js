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

describe('Transpiler "runtimePath" option test', function () {
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

        expect(phpToJS.transpile(ast, {runtimePath: '/path/to/runtime'})).to.equal(
            'require(\'/path/to/runtime\').compile(function (core) {' +
            'var createInteger = core.createInteger;' +
            'return createInteger(4);' +
            '});'
        );
    });

    it('should correctly transpile a return statement with an operand of 6 in synchronous mode using "sync" option', function () {
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

        expect(phpToJS.transpile(ast, {sync: true, runtimePath: '/path/to/runtime'})).to.equal(
            'require(\'/path/to/runtime/sync\').compile(function (core) {' +
            'var createInteger = core.createInteger;' +
            'return createInteger(6);' +
            '});'
        );
    });

    it('should correctly transpile a return statement with an operand of 6 in synchronous mode using "mode" option', function () {
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

        expect(phpToJS.transpile(ast, {mode: 'sync', runtimePath: '/path/to/runtime'})).to.equal(
            'require(\'/path/to/runtime/sync\').compile(function (core) {' +
            'var createInteger = core.createInteger;' +
            'return createInteger(6);' +
            '});'
        );
    });
});
