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
    phpToJS = require('../../..');

describe('Transpiler new expression test', function () {
    it('should correctly transpile an instantiation with no constructor arguments', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_VARIABLE',
                        variable: 'object'
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_NEW_EXPRESSION',
                            className: {
                                name: 'N_STRING',
                                string: 'Worker'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createBareword = core.createBareword, createInstance = core.createInstance, getVariable = core.getVariable, setValue = core.setValue;' +
            'setValue(getVariable("object"))(createInstance(createBareword("Worker"))());' +
            '}'
        );
    });

    it('should correctly transpile a new expression in function call argument', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [{
                        name: 'N_NEW_EXPRESSION',
                        className: {
                            name: 'N_VARIABLE',
                            variable: 'myClassName'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callFunction = core.callFunction, createInstance = core.createInstance, getVariable = core.getVariable;' +
            'callFunction("myFunc")(' +
            'createInstance(getVariable("myClassName"))()' +
            ')();' +
            '}'
        );
    });
});
