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

describe('Transpiler less-than comparison operator test', function () {
    it('should correctly transpile a return with a comparison between two integers', function () {
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
                        operator: '<',
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
            'var createInteger = core.createInteger, isLessThan = core.isLessThan;' +
            'return isLessThan(createInteger(21), createInteger(32));' +
            '}'
        );
    });

    it('should correctly transpile a return with a comparison between a variable and complex expression', function () {
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
                        operator: '<',
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
            'var createString = core.createString, getVariable = core.getVariable, isLessThan = core.isLessThan, snapshot = core.snapshot, ternary = core.ternary;' +
            'return isLessThan(' +
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
