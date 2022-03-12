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

describe('Transpiler clone operator test', function () {
    it('should correctly transpile a return of a cloned variable', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_CLONE_EXPRESSION',
                    operand: {
                        name: 'N_VARIABLE',
                        variable: 'myObject'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var clone = core.clone, getVariable = core.getVariable;' +
            'return clone(getVariable("myObject"));' +
            '});'
        );
    });
});
