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

describe('Transpiler namespace statement test', function () {
    it('should correctly transpile a return statement inside class method inside namespace', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [
                {
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'This\\Is\\My\\Space',
                    statements: [
                        {
                            name: 'N_CLASS_STATEMENT',
                            className: 'MyClass',
                            members: [
                                {
                                    name: 'N_METHOD_DEFINITION',
                                    visibility: 'public',
                                    func: {
                                        name: 'N_STRING',
                                        string: 'getClass'
                                    },
                                    args: [],
                                    body: {
                                        name: 'N_COMPOUND_STATEMENT',
                                        statements: [
                                            {
                                                name: 'N_RETURN_STATEMENT',
                                                expression: {
                                                    name: 'N_MAGIC_NAMESPACE_CONSTANT'
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'if (namespaceResult = (function (globalNamespace) {' +
            'var namespace = globalNamespace.getDescendant("This\\\\Is\\\\My\\\\Space"), namespaceScope = tools.createNamespaceScope(namespace);' +
            '(function () {' +
            'var currentClass = namespace.defineClass("MyClass", {superClass: null, interfaces: [], staticProperties: {}, properties: {}, methods: {' +
            '"getClass": {' +
            'isStatic: false, ' +
            'method: function _getClass() {var scope = this;' +
            'return namespaceScope.getNamespaceName();' +
            '}}' +
            '}, constants: {}}, namespaceScope);}());' +
            '}(namespace))) { return namespaceResult; }' +
            'return tools.valueFactory.createNull();}'
        );
    });
});
