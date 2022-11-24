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

describe('Transpiler loose inequality comparison operator test', function () {
    it('should correctly transpile a return with a comparison using "!=" between two integers', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 21
                    },
                    right: [{
                        operator: '!=',
                        operand: {
                            name: 'N_INTEGER',
                            number: 32
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, isNotEqual = core.isNotEqual;' +
            'return isNotEqual(createInteger(21))(createInteger(32));' +
            '}'
        );
    });

    it('should correctly transpile a return with a comparison using "<>" between two integers', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 21
                    },
                    right: [{
                        operator: '<>',
                        operand: {
                            name: 'N_INTEGER',
                            number: 32
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, isNotEqual = core.isNotEqual;' +
            'return isNotEqual(createInteger(21))(createInteger(32));' +
            '}'
        );
    });
});
