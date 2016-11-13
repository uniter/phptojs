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

describe('Transpiler instanceof binary operator test', function () {
    it('should correctly transpile a return statement with $var instanceof $var', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_INSTANCE_OF',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'myObject'
                    },
                    class: {
                        name: 'N_VARIABLE',
                        variable: 'myClass'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getVariable("myObject").getValue().isAnInstanceOf(scope.getVariable("myClass").getValue(), namespaceScope);' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a return statement with $var instanceof <bareword>', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_INSTANCE_OF',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'myObject'
                    },
                    class: {
                        name: 'N_STRING',
                        string: 'MyClass'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getVariable("myObject").getValue().isAnInstanceOf(tools.valueFactory.createBarewordString("MyClass"), namespaceScope);' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a function call argument with $var instanceof <bareword>', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [{
                        name: 'N_INSTANCE_OF',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'myObject'
                        },
                        class: {
                            name: 'N_STRING',
                            string: 'MyClass'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return (tools.valueFactory.createBarewordString("myFunc").call([scope.getVariable("myObject").getValue().isAnInstanceOf(' +
            'tools.valueFactory.createBarewordString("MyClass"), namespaceScope' +
            ')], namespaceScope) || tools.valueFactory.createNull());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
