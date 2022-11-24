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

describe('Transpiler addition arithmetic operator "+" test', function () {
    it('should correctly transpile a return statement with operation', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: '21'
                    },
                    right: [{
                        operator: '+',
                        operand: {
                            name: 'N_INTEGER',
                            number: '10'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var add = core.add, createInteger = core.createInteger;' +
            'return add(createInteger(21))(createInteger(10));' +
            '});'
        );
    });
});
