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

describe('Transpiler "new" operator test', function () {
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
            'setValue(getVariable("object"), createInstance(createBareword("Worker")));' +
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
            'callFunction("myFunc", ' +
            'createInstance(getVariable("myClassName"))' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile an instantiation with a bareword class name with single complex constructor argument', function () {
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
                                string: 'MyClass'
                            },
                            args: [{
                                name: 'N_VARIABLE_EXPRESSION',
                                expression: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                }
                            }]
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createBareword = core.createBareword, createInstance = core.createInstance, getVariable = core.getVariable, getVariableVariable = core.getVariableVariable, setValue = core.setValue;' +
            'setValue(getVariable("object"), ' +
            'createInstance(' +
            // No need to snapshot a bareword.
            'createBareword("MyClass"), ' +
            'getVariableVariable(getVariable("myVar"))' +
            '));' +
            '}'
        );
    });

    it('should correctly transpile an instantiation with a dynamic class name with single complex constructor argument', function () {
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
                                name: 'N_VARIABLE',
                                variable: 'myClassName'
                            },
                            args: [{
                                name: 'N_VARIABLE_EXPRESSION',
                                expression: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                }
                            }]
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInstance = core.createInstance, getVariable = core.getVariable, getVariableVariable = core.getVariableVariable, setValue = core.setValue, snapshot = core.snapshot;' +
            'setValue(getVariable("object"), ' +
            'createInstance(' +
            // This operand must be snapshotted as it is followed by an expression that may modify it
            // (based on simple heuristics).
            'snapshot(getVariable("myClassName")), ' +
            // Final operand does not need to be snapshotted, as there are no subsequent complex operands
            // that may affect its result prior to the actual call executing.
            'getVariableVariable(getVariable("myVar"))' +
            '));' +
            '}'
        );
    });
});
