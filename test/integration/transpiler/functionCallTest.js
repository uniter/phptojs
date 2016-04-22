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
    phpToJS = require('../../..');

describe('Transpiler function call expression test', function () {
    it('should correctly transpile in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: []
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(tools.valueFactory.createBarewordString("myFunc").call([], namespaceScope) || tools.valueFactory.createNull());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
