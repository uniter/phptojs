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

describe('Transpiler static method call expression test', function () {
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
                        name: 'N_STRING',
                        string: 'myMethod'
                    },
                    args: [{
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'tools.valueFactory.createBarewordString("\\\\My\\\\Space\\\\MyClass")' +
            '.callStaticMethod(tools.valueFactory.createBarewordString("myMethod"), [' +
            'scope.getVariable("myVar")' +
            '], namespaceScope, false);' + // Non-forwarding
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
