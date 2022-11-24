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
    phpToJS = require('../../../../../index');

describe('Transpiler variable static method call expression test', function () {
    it('should correctly transpile a call to static method with FQCN (forwarding)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_STATIC_METHOD_CALL',
                    className: {
                        name: 'N_PARENT'
                    },
                    method: {
                        name: 'N_VARIABLE',
                        variable: 'myMethodNameVar'
                    },
                    args: [{
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'yourVar'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var callVariableStaticMethod = core.callVariableStaticMethod, getSuperClassNameOrThrow = core.getSuperClassNameOrThrow, getVariable = core.getVariable;' +
            'callVariableStaticMethod(getSuperClassNameOrThrow())(getVariable("myMethodNameVar"))' +
            '(true)' + // Forwarding.
            '(getVariable("myVar"))' +
            '(getVariable("yourVar"))' +
            '();' +
            '});'
        );
    });

    it('should correctly transpile a call to static method with FQCN (non-forwarding)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_STATIC_METHOD_CALL',
                    className: {
                        name: 'N_STRING',
                        string: '\\My\\Space\\MyClass'
                    },
                    method: {
                        name: 'N_VARIABLE',
                        variable: 'myMethodNameVar'
                    },
                    args: [{
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'yourVar'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var callVariableStaticMethod = core.callVariableStaticMethod, createBareword = core.createBareword, getVariable = core.getVariable;' +
            'callVariableStaticMethod(createBareword("\\\\My\\\\Space\\\\MyClass"))(getVariable("myMethodNameVar"))' +
            '(false)' + // Non-forwarding.
            '(getVariable("myVar"))' +
            '(getVariable("yourVar"))' +
            '();' +
            '});'
        );
    });
});
