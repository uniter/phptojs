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

describe('Transpiler logical "not" operator test', function () {
    it('should correctly transpile a return with a negation of a variable value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_UNARY_EXPRESSION',
                    prefix: true,
                    operator: '!',
                    operand: {
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getVariable = core.getVariable, logicalNot = core.logicalNot;' +
            'return logicalNot(getVariable("myVar"));' +
            '}'
        );
    });

    it('should correctly transpile a logical OR with embedded NOT', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_UNARY_EXPRESSION',
                        prefix: true,
                        operator: '!',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'leftVar'
                        }
                    },
                    right: [{
                        operator: '!==',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'rightVar'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getVariable = core.getVariable, isNotIdentical = core.isNotIdentical, logicalNot = core.logicalNot;' +
            'return isNotIdentical(logicalNot(getVariable("leftVar")))(getVariable("rightVar"));' +
            '}'
        );
    });
});
