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
    phpToJS = require('../../../../..');

describe('Transpiler bitwise AND assignment operator "&=" test', function () {
    it('should correctly transpile a return statement with assignment', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    },
                    right: [{
                        operator: '&=',
                        operand: {
                            name: 'N_INTEGER',
                            number: '27'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var bitwiseAndWith = core.bitwiseAndWith, createInteger = core.createInteger, getVariable = core.getVariable;' +
            'return bitwiseAndWith(getVariable("myVar"))(createInteger(27));' +
            '});'
        );
    });
});
