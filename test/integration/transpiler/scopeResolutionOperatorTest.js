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

describe('Transpiler scope resolution operator test', function () {
    it('should correctly transpile a return statement with static class constant read in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_CLASS_CONSTANT',
                    className: {
                        name: 'N_STRING',
                        string: 'MyClass'
                    },
                    constant: 'MY_CONST'
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createBareword = core.createBareword, getClassConstant = core.getClassConstant;' +
            'return getClassConstant(createBareword("MyClass"))("MY_CONST");' +
            '});'
        );
    });
});
