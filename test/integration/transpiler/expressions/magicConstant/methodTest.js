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

describe('Transpiler __METHOD__ magic constant test', function () {
    it('should correctly transpile a return statement outside of class', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_MAGIC_METHOD_CONSTANT'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getMethodName();' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });

    it('should correctly transpile a return statement inside class method', function () {
        var ast = {
            name: 'N_PROGRAM',
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
                                            name: 'N_MAGIC_METHOD_CONSTANT'
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(function () {' +
            'var currentClass = namespace.defineClass("MyClass", {superClass: null, interfaces: [], staticProperties: {}, properties: {}, methods: {' +
            '"getClass": {' +
            'isStatic: false, ' +
            'method: function _getClass() {var scope = this;' +
            'return scope.getMethodName();' +
            '}}' +
            '}, constants: {}}, namespaceScope);}());' +
            'return tools.valueFactory.createNull();}'
        );
    });
});
