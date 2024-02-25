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

describe('Transpiler logical "xor" operator test', function () {
    it('should correctly transpile a return with an operation on two strings', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_STRING_LITERAL',
                        string: 'first'
                    },
                    right: [{
                        operator: 'xor',
                        operand: {
                            name: 'N_STRING_LITERAL',
                            string: 'second'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, logicalXor = core.logicalXor;' +
            'return logicalXor(createString("first"), createString("second"));' +
            '}'
        );
    });

    it('should correctly transpile a return with an operation on a variable and complex expression', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_VARIABLE',
                        variable: 'myLeftVar'
                    },
                    right: [{
                        operator: 'xor',
                        operand: {
                            name: 'N_TERNARY',
                            condition: {
                                name: 'N_VARIABLE',
                                variable: 'myCondition'
                            },
                            consequent: {
                                name: 'N_STRING_LITERAL',
                                string: 'myRightStringIfTruthy'
                            },
                            alternate: {
                                name: 'N_STRING_LITERAL',
                                string: 'myRightStringIfFalsy'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, getVariable = core.getVariable, logicalXor = core.logicalXor, snapshot = core.snapshot, ternary = core.ternary;' +
            'return logicalXor(' +
            // Plain variable object operand must be snapshotted due to complex subsequent operand (ternary).
            'snapshot(getVariable("myLeftVar")), ' +
            '(ternary(getVariable("myCondition")) ? ' +
            'createString("myRightStringIfTruthy") : ' +
            'createString("myRightStringIfFalsy")' +
            '));' +
            '}'
        );
    });
});
