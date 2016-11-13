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

describe('Transpiler global import statement test', function () {
    it('should correctly transpile a global import of two variables in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GLOBAL_STATEMENT',
                variables: [{
                    name: 'N_VARIABLE',
                    variable: 'firstVar'
                }, {
                    name: 'N_VARIABLE',
                    variable: 'secondVar'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'scope.importGlobal("firstVar");scope.importGlobal("secondVar");' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
