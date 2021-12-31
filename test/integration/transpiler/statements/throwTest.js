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

describe('Transpiler throw statement test', function () {
    it('should correctly transpile a throw of variable value in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_THROW_STATEMENT',
                expression: {
                    name: 'N_VARIABLE',
                    variable: 'myError'
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, throw_ = core.throw_;' +
            'throw_(getVariable("myError"));' +
            '});'
        );
    });
});
