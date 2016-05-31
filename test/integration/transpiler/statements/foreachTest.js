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
                    expression: {
                        name: 'N_INTEGER',
                        number: '1'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var array_0 = scope.getVariable("myArray").getValue().reset();' +
            'var length_0 = array_0.getLength();' +
            'var pointer_0 = 0;' +
            'while (pointer_0 < length_0) {' +
            'scope.getVariable("item").setValue(array_0.getElementByIndex(pointer_0).getValue());' +
            'pointer_0++;' +
            'stdout.write(tools.valueFactory.createInteger(1).coerceToString().getNative());' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
