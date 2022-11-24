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

describe('Transpiler list(...) construct test', function () {
    it('should correctly transpile a simple assignment to list with one variable of array with one element', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_LIST',
                        elements: [{
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        }]
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_ARRAY_LITERAL',
                            elements: [{
                                name: 'N_INTEGER',
                                number: '21'
                            }]
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createArray = core.createArray, createInteger = core.createInteger, createList = core.createList, getVariable = core.getVariable, setValue = core.setValue;' +
            'setValue(createList(getVariable("myVar"))())(createArray(createInteger(21))());' +
            '}'
        );
    });

    it('should correctly transpile an assignment to list with one variable (after skipping first value) of array with two elements', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_LIST',
                        elements: [{
                            name: 'N_VOID'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        }]
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_ARRAY_LITERAL',
                            elements: [{
                                name: 'N_INTEGER',
                                number: '4'
                            }, {
                                name: 'N_INTEGER',
                                number: '21'
                            }]
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createArray = core.createArray, createInteger = core.createInteger, createList = core.createList, createVoid = core.createVoid, getVariable = core.getVariable, setValue = core.setValue;' +
            'setValue(createList(createVoid())(getVariable("myVar"))())(createArray(createInteger(4))(createInteger(21))());' +
            '});'
        );
    });
});
