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

describe('Transpiler echo statement test', function () {
    it('should correctly transpile an echo of two variables in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
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
            'stdout.write(scope.getVariable("firstVar").getValue().coerceToString().getNative());' +
            'stdout.write(scope.getVariable("secondVar").getValue().coerceToString().getNative());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
