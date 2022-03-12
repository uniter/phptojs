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

describe('Transpiler "mode" option test', function () {
    it('should correctly transpile a return statement in explicit sync mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STRING_LITERAL',
                    string: 'my result'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {mode: 'sync'})).to.equal(
            'require(\'phpruntime/sync\').compile(function (core) {' +
            'var createString = core.createString;' +
            'return createString("my result");' +
            '});'
        );
    });

    it('should correctly transpile a return statement in explicit async mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STRING_LITERAL',
                    string: 'my result'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {mode: 'async'})).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createString = core.createString;' +
            'return createString("my result");' +
            '});'
        );
    });

    it('should correctly transpile a return statement in implicit async mode (neither "mode" nor "sync" options specified)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STRING_LITERAL',
                    string: 'my result'
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createString = core.createString;' +
            'return createString("my result");' +
            '});'
        );
    });

    it('should correctly transpile a return statement in explicit promise-sync mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STRING_LITERAL',
                    string: 'my result'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {mode: 'psync'})).to.equal(
            'require(\'phpruntime/psync\').compile(function (core) {' +
            'var createString = core.createString;' +
            'return createString("my result");' +
            '});'
        );
    });

    it('should throw when both "sync" and "mode" options are given, even when not conflicting', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STRING_LITERAL',
                    string: 'my result'
                }
            }]
        };

        expect(function () {
            phpToJS.transpile(ast, {mode: 'sync', sync: true});
        }).to.throw('Only one of "mode" and "sync" options should be specified');
    });

    it('should throw when an invalid "mode" option is given', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STRING_LITERAL',
                    string: 'my result'
                }
            }]
        };

        expect(function () {
            phpToJS.transpile(ast, {mode: 'invalid-mode'});
        }).to.throw('Invalid mode "invalid-mode" given');
    });
});
