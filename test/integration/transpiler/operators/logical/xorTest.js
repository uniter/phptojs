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

describe('Transpiler logical "xor" operator test', function () {
    it('should correctly transpile a return with an operation on two strings', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_STRING_LITERAL',
                        string: 'first'
                    },
                    right: [{
                        operator: 'xor',
                        operand: {
                            name: 'N_STRING_LITERAL',
                            string: 'second'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return tools.valueFactory.createBoolean(tools.valueFactory.createString("first").coerceToBoolean().getNative() !== (tools.valueFactory.createString("second").coerceToBoolean().getNative()));' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });
});
