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

describe('Transpiler "sync" option test', function () {
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

        expect(phpToJS.transpile(ast, {sync: true})).to.equal(
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

        expect(phpToJS.transpile(ast, {sync: false})).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createString = core.createString;' +
            'return createString("my result");' +
            '});'
        );
    });
});
