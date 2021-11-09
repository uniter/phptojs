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
    it('should correctly transpile two adjacent namespace statements with a return in the second', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_NAMESPACE_STATEMENT',
                namespace: 'This\\Is\\My\\FirstSpace',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_PRINT_EXPRESSION',
                        operand: {
                            name: 'N_INTEGER',
                            number: 1234
                        }
                    }
                }]
            }, {
                name: 'N_NAMESPACE_STATEMENT',
                namespace: 'This\\Is\\My\\SecondSpace',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: 9876
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, print = core.print, useDescendantNamespaceScope = core.useDescendantNamespaceScope;' +

            // First namespace scope
            'useDescendantNamespaceScope("This\\\\Is\\\\My\\\\FirstSpace");' +
            'print(createInteger(1234));' +

            // Second namespace scope
            'useDescendantNamespaceScope("This\\\\Is\\\\My\\\\SecondSpace");' +
            'return createInteger(9876);' +
            '});'
        );
    });

    it('should correctly transpile two adjacent namespace statements where first is for the global namespace', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_NAMESPACE_STATEMENT',
                namespace: '',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_PRINT_EXPRESSION',
                        operand: {
                            name: 'N_INTEGER',
                            number: 1234
                        }
                    }
                }]
            }, {
                name: 'N_NAMESPACE_STATEMENT',
                namespace: 'This\\Is\\My\\SubSpace',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_PRINT_EXPRESSION',
                        operand: {
                            name: 'N_INTEGER',
                            number: 6543
                        }
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, print = core.print, useDescendantNamespaceScope = core.useDescendantNamespaceScope, useGlobalNamespaceScope = core.useGlobalNamespaceScope;' +

            // First namespace scope
            'useGlobalNamespaceScope();' +
            'print(createInteger(1234));' +

            // Second namespace scope
            'useDescendantNamespaceScope("This\\\\Is\\\\My\\\\SubSpace");' +
            'print(createInteger(6543));' +
            '});'
        );
    });

    it('should correctly transpile two adjacent namespace statements where second is for the global namespace', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_NAMESPACE_STATEMENT',
                namespace: 'This\\Is\\My\\SubSpace',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_PRINT_EXPRESSION',
                        operand: {
                            name: 'N_INTEGER',
                            number: 6543
                        }
                    }
                }]
            }, {
                name: 'N_NAMESPACE_STATEMENT',
                namespace: '',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_PRINT_EXPRESSION',
                        operand: {
                            name: 'N_INTEGER',
                            number: 1234
                        }
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, print = core.print, useDescendantNamespaceScope = core.useDescendantNamespaceScope, useGlobalNamespaceScope = core.useGlobalNamespaceScope;' +

            // First namespace scope
            'useDescendantNamespaceScope("This\\\\Is\\\\My\\\\SubSpace");' +
            'print(createInteger(6543));' +

            // Second namespace scope
            'useGlobalNamespaceScope();' +
            'print(createInteger(1234));' +
            '});'
        );
    });

    it('should correctly transpile a return statement inside class method inside namespace', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [
                {
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Your\\Space',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_PRINT_EXPRESSION',
                            operand: {
                                name: 'N_INTEGER',
                                number: 1234
                            }
                        }
                    }]
                },
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
            'function (core) {' +
            'var createInteger = core.createInteger, defineClass = core.defineClass, getNamespaceName = core.getNamespaceName, print = core.print, useDescendantNamespaceScope = core.useDescendantNamespaceScope;' +

            // First namespace scope
            'useDescendantNamespaceScope("Your\\\\Space");' +
            'print(createInteger(1234));' +

            // Second namespace scope
            'useDescendantNamespaceScope("This\\\\Is\\\\My\\\\Space");' +
            'defineClass("MyClass", {superClass: null, interfaces: [], staticProperties: {}, properties: {}, methods: {' +
            '"getClass": {' +
            'isStatic: false, ' +
            'method: function _getClass() {' +
            'return getNamespaceName();' +
            '}}' +
            '}, constants: {}});' +
            '}'
        );
    });
});
