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

describe('Transpiler error control operator @(...) test', function () {
    it('should correctly transpile a return statement with error-suppressed variable read', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_SUPPRESSED_EXPRESSION',
                    expression: {
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return (function (scope) {scope.suppressErrors();' +
            'var result = scope.getVariable("myVar").getValue();' +
            'scope.unsuppressErrors(); return result;}(scope));' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
