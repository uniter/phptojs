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

describe('Transpiler isset(...) construct expression test', function () {
    it('should correctly transpile a return statement with expression', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ISSET',
                    variables: [{
                        name: 'N_VARIABLE',
                        variable: 'a_var'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
            'return (function (scope) {scope.suppressOwnErrors();' +
            'var result = tools.valueFactory.createBoolean(scope.getVariable("a_var").isSet());' +
            'scope.unsuppressOwnErrors(); return result;}(scope));' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
