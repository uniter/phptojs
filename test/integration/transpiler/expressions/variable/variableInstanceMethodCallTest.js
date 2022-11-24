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

describe('Transpiler variable instance method call expression test', function () {
    it('should correctly transpile a call to instance method of variable', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_METHOD_CALL',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'myObject'
                    },
                    method: {
                        name: 'N_VARIABLE',
                        variable: 'myMethodName'
                    },
                    args: [{
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callVariableInstanceMethod = core.callVariableInstanceMethod, getVariable = core.getVariable;' +
            'callVariableInstanceMethod(getVariable("myObject"))(getVariable("myMethodName"))' +
            '(getVariable("myVar"))' +
            '();' +
            '}'
        );
    });
});
