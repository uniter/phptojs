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
    phpToJS = require('../../../../..');

describe('Transpiler binary cast operator test', function () {
    it('should correctly transpile a cast of addition result', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_BINARY_CAST',
                    value: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        right: [{
                            operator: '+',
                            operand: {
                                name: 'N_INTEGER',
                                number: '21'
                            }
                        }]
                    }
                }
            }]
        };

        // For now, just treat binary string and string values as identical,
        // as Zend's engine doesn't seem to recognise the difference yet anyway
        // (was slated for PHP v6.)
        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'scope.getVariable("myVar").getValue().add(tools.valueFactory.createInteger(21)).coerceToString();' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });
});
