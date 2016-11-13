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

describe('Transpiler "foreach" statement test', function () {
    it('should correctly transpile a foreach loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray'
                },
                value: {
                    name: 'N_VARIABLE',
                    variable: 'item'
                },
                body: {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '1'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var array_1 = scope.getVariable("myArray").getValue().reset();' +
            'var length_1 = array_1.getLength();' +
            'var pointer_1 = 0;' +
            'block_1: while (pointer_1 < length_1) {' +
            'scope.getVariable("item").setValue(array_1.getElementByIndex(pointer_1).getValue());' +
            'pointer_1++;' +
            'stdout.write(tools.valueFactory.createInteger(1).coerceToString().getNative());' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a foreach loop where value variable is by reference', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray'
                },
                value: {
                    name: 'N_REFERENCE',
                    operand: {
                        name: 'N_VARIABLE',
                        variable: 'item'
                    }
                },
                body: {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '1'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var array_1 = scope.getVariable("myArray").getValue().reset();' +
            'var length_1 = array_1.getLength();' +
            'var pointer_1 = 0;' +
            'block_1: while (pointer_1 < length_1) {' +
            'scope.getVariable("item").setReference(array_1.getElementByIndex(pointer_1).getReference());' +
            'pointer_1++;' +
            'stdout.write(tools.valueFactory.createInteger(1).coerceToString().getNative());' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a foreach loop with key variable', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray'
                },
                key: {
                    name: 'N_VARIABLE',
                    variable: 'theKey'
                },
                value: {
                    name: 'N_VARIABLE',
                    variable: 'item'
                },
                body: {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '1'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var array_1 = scope.getVariable("myArray").getValue().reset();' +
            'var length_1 = array_1.getLength();' +
            'var pointer_1 = 0;' +
            'block_1: while (pointer_1 < length_1) {' +
            'scope.getVariable("theKey").setValue(array_1.getKeyByIndex(pointer_1));' +
            'scope.getVariable("item").setValue(array_1.getElementByIndex(pointer_1).getValue());' +
            'pointer_1++;' +
            'stdout.write(tools.valueFactory.createInteger(1).coerceToString().getNative());' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
