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

describe('Transpiler statement hoisting test', function () {
    it('should correctly transpile a use followed by assignment, class and function statements', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_USE_STATEMENT',
                uses: [{
                    source: 'Your\\Class',
                    alias: 'YourImportedClass'
                }]
            }, {
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_INTEGER',
                            number: '21'
                        }
                    }]
                }
            }, {
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                extend: 'YourImportedClass',
                members: []
            }, {
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'aFinalFunc'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: []
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, defineClass = core.defineClass, defineFunction = core.defineFunction, getVariable = core.getVariable, setValue = core.setValue, useClass = core.useClass;' +
            'useClass("Your\\\\Class", "YourImportedClass");' +
            '(function () {' +
            'var currentClass = defineClass("MyClass", {' +
            'superClass: "YourImportedClass", ' +
            // TODO: Don't output these properties in this object literal when they are empty
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            '}());' +
            'defineFunction("aFinalFunc", function _aFinalFunc() {});' +
            'setValue(getVariable("myVar"), createInteger(21));' +
            '});'
        );
    });
});
