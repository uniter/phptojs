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

describe('Transpiler instanceof binary operator test', function () {
    it('should correctly transpile a return statement with $var instanceof $var', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_INSTANCE_OF',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'myObject'
                    },
                    class: {
                        name: 'N_VARIABLE',
                        variable: 'myClass'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, instanceOf = core.instanceOf;' +
            'return instanceOf(getVariable("myObject"))(getVariable("myClass"));' +
            '});'
        );
    });

    it('should correctly transpile a return statement with $var instanceof <bareword>', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_INSTANCE_OF',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'myObject'
                    },
                    class: {
                        name: 'N_STRING',
                        string: 'MyClass'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createBareword = core.createBareword, getVariable = core.getVariable, instanceOf = core.instanceOf;' +
            'return instanceOf(getVariable("myObject"))(createBareword("MyClass"));' +
            '});'
        );
    });

    it('should correctly transpile a function call argument with $var instanceof <bareword>', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [{
                        name: 'N_INSTANCE_OF',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'myObject'
                        },
                        class: {
                            name: 'N_STRING',
                            string: 'MyClass'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var callFunction = core.callFunction, createBareword = core.createBareword, getVariable = core.getVariable, instanceOf = core.instanceOf;' +
            'return callFunction("myFunc")(instanceOf(getVariable("myObject"))(createBareword("MyClass")))();' +
            '});'
        );
    });
});
