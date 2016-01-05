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
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
            'return scope.getVariable("myObject").getValue().isAnInstanceOf(scope.getVariable("myClass").getValue(), namespaceScope);' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
