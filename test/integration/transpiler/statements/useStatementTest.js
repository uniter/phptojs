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

describe('Transpiler use statement test', function () {
    it('should correctly transpile a use statement with no alias inside namespace', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_NAMESPACE_STATEMENT',
                namespace: 'This\\Is\\My\\Space',
                statements: [{
                    name: 'N_USE_STATEMENT',
                    uses: [{
                        source: 'My\\Imported\\MyClass'
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var useClass = core.useClass, useDescendantNamespaceScope = core.useDescendantNamespaceScope;' +

            'useDescendantNamespaceScope("This\\\\Is\\\\My\\\\Space");' +
            'useClass("My\\\\Imported\\\\MyClass");' +
            '});'
        );
    });

    it('should correctly transpile a use statement with alias inside namespace', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_NAMESPACE_STATEMENT',
                namespace: 'This\\Is\\My\\Space',
                statements: [{
                    name: 'N_USE_STATEMENT',
                    uses: [{
                        source: 'My\\Imported\\MyClass',
                        alias: 'MyAlias'
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var useClass = core.useClass, useDescendantNamespaceScope = core.useDescendantNamespaceScope;' +

            'useDescendantNamespaceScope("This\\\\Is\\\\My\\\\Space");' +
            'useClass("My\\\\Imported\\\\MyClass", "MyAlias");' +
            '});'
        );
    });
});
