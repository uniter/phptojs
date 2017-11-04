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

describe('Transpiler class statement with properties test', function () {
    it('should correctly transpile a class with instance properties with and without an initial value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_INSTANCE_PROPERTY_DEFINITION',
                    visibility: 'private',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'firstProp'
                    }
                }, {
                    name: 'N_INSTANCE_PROPERTY_DEFINITION',
                    visibility: 'private',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'secondProp'
                    },
                    value: {
                        name: 'N_INTEGER',
                        number: 21
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(function () {' +
            'var currentClass = namespace.defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {' +
            '"firstProp": function () { return null; }, ' +
            '"secondProp": function () { return tools.valueFactory.createInteger(21); }' +
            '}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '}, namespaceScope);}());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
