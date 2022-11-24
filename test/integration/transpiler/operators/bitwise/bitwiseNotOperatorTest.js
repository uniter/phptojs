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

describe('Transpiler bitwise NOT (ones\' complement) operator "~" test', function () {
    it('should correctly transpile a return statement with operation', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_UNARY_EXPRESSION',
                    prefix: true,
                    operator: '~',
                    operand: {
                        name: 'N_INTEGER',
                        number: '21'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, onesComplement = core.onesComplement;' +
            'return onesComplement(createInteger(21));' +
            '}'
        );
    });
});
