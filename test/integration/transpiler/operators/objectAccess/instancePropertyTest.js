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

describe('Transpiler object instance property access test', function () {
    it('should correctly transpile a read of a property of a property', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_OBJECT_PROPERTY',
                    object: {
                        name: 'N_OBJECT_PROPERTY',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        properties: [{
                            property: {
                                name: 'N_STRING',
                                string: 'firstProp'
                            }
                        }]
                    },
                    properties: [{
                        property: {
                            name: 'N_STRING',
                            string: 'secondProp'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getVariable("myVar").getValue().getInstancePropertyByName(tools.valueFactory.createBarewordString("firstProp")).getValue().getInstancePropertyByName(tools.valueFactory.createBarewordString("secondProp")).getValue();' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });

    it('should correctly transpile a dynamic reference to a property', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_OBJECT_PROPERTY',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'myObjectVar'
                    },
                    properties: [{
                        property: {
                            name: 'N_VARIABLE',
                            variable: 'myVarHoldingPropName'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getVariable("myObjectVar").getValue().getInstancePropertyByName(scope.getVariable("myVarHoldingPropName").getValue()).getValue();' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });
});
