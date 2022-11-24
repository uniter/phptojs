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

describe('Transpiler closure expression test', function () {
    it('should correctly transpile a return of a closure with parameters and bound variables', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_CLOSURE',
                    args: [{
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'arg1'
                        }
                    }, {
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'arg2'
                            }
                        }
                    }, {
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'arg3'
                        },
                        value: {
                            name: 'N_INTEGER',
                            number: 21
                        }
                    }],
                    bindings: [{
                        name: 'N_VARIABLE',
                        variable: 'bound1'
                    }, {
                        name: 'N_REFERENCE',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'bound2'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_INTEGER',
                                number: 21
                            }]
                        }]
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createClosure = core.createClosure, createInteger = core.createInteger, echo = core.echo, getReferenceBinding = core.getReferenceBinding, getValueBinding = core.getValueBinding, getVariable = core.getVariable, setReference = core.setReference, setValue = core.setValue;' +
            'return createClosure(' +
            'function () {' +
            'setValue(getVariable("bound1"))(getValueBinding("bound1"));' +
            'setReference(getVariable("bound2"))(getReferenceBinding("bound2"));' +
            'echo(createInteger(21));' +
            '}, [' +
            '{"name":"arg1"},' +
            '{"type":"array","name":"arg2","ref":true},' +
            '{"name":"arg3","value":function () { return createInteger(21); }}' +
            '], ' +
            '[{"name":"bound1"},{"name":"bound2","ref":true}]' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a return of a closure with a parameter that is by-ref and has a default value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_CLOSURE',
                    args: [{
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'myArg'
                            }
                        },
                        value: {
                            name: 'N_INTEGER',
                            number: 27
                        }
                    }],
                    bindings: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_INTEGER',
                                number: 21
                            }]
                        }]
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createClosure = core.createClosure, createInteger = core.createInteger, echo = core.echo;' +
            'return createClosure(' +
            'function () {' +
            'echo(createInteger(21));' +
            '}, ' +
            '[' +
            '{"name":"myArg","ref":true,"value":function () { return createInteger(27); }}' +
            ']);' +
            '}'
        );
    });

    it('should correctly transpile a return of an empty static closure', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_CLOSURE',
                    static: true,
                    args: [],
                    bindings: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createClosure = core.createClosure;' +
            'return createClosure(' +
            'function () {' +
            '}, [], [], true);' +
            '}'
        );
    });
});
