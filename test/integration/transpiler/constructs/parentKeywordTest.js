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

describe('Transpiler parent:: construct expression test', function () {
    it('should correctly transpile parent:: in global scope', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STATIC_PROPERTY',
                    className: {
                        name: 'N_PARENT'
                    },
                    property: {
                        name: 'N_STRING',
                        string: 'myProp'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getParentClassNameOrThrow().getStaticPropertyByName(tools.valueFactory.createBarewordString("myProp"), namespaceScope).getValue();' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile parent:: in class constant scope', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_CONSTANT_DEFINITION',
                    constant: 'MY_CONST',
                    value: {
                        name: 'N_CLASS_CONSTANT',
                        className: {
                            name: 'N_PARENT'
                        },
                        constant: 'PARENT_CONST'
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
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {' +
            '"MY_CONST": function () { ' +
            'return tools.getParentClassName(currentClass)' +
            '.getConstantByName("PARENT_CONST", namespaceScope); ' +
            '}' +
            '}' +
            '}, namespaceScope);' +
            '}());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
