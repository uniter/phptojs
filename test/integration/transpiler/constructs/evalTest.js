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

describe('Transpiler eval(...) construct expression test', function () {
    it('should correctly transpile an eval where the code is stored in a variable', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EVAL',
                    code: {
                        name: 'N_VARIABLE',
                        variable: 'myCode'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var eval = core.eval, getVariable = core.getVariable;' +
            'return eval(getVariable("myCode"));' +
            '});'
        );
    });
});
