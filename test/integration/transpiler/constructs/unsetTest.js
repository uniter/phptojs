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

describe('Transpiler unset(...) construct expression test', function () {
    it('should correctly transpile an unset with one variable', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_UNSET_STATEMENT',
                variables: [{
                    name: 'N_VARIABLE',
                    variable: 'a_var'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'scope.getVariable("a_var").unset();' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile an unset with two variables', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_UNSET_STATEMENT',
                variables: [{
                    name: 'N_VARIABLE',
                    variable: 'first_var'
                }, {
                    name: 'N_VARIABLE',
                    variable: 'second_var'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'scope.getVariable("first_var").unset(); scope.getVariable("second_var").unset();' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile an unset with array element access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_UNSET_STATEMENT',
                variables: [{
                    name: 'N_ARRAY_INDEX',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'myArray'
                    },
                    indices: [{
                        index: {
                            name: 'N_INTEGER',
                            number: 21
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'scope.getVariable("myArray").getValue().getElementByKey(tools.valueFactory.createInteger(21)).unset();' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile an unset with object property access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_UNSET_STATEMENT',
                variables: [{
                    name: 'N_OBJECT_PROPERTY',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'an_object'
                    },
                    properties: [{
                        property: {
                            name: 'N_STRING',
                            string: 'prop'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'scope.getVariable("an_object").getValue().getInstancePropertyByName(tools.valueFactory.createBarewordString("prop")).unset();' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
