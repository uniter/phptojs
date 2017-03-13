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

describe('Transpiler empty(...) construct expression test', function () {
    it('should correctly transpile a return statement with expression', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EMPTY',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'a_var'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return (function (scope) {scope.suppressOwnErrors();' +
            'var result = tools.valueFactory.createBoolean(scope.getVariable("a_var").isEmpty());' +
            'scope.unsuppressOwnErrors(); return result;}(scope));' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a return statement with array element access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EMPTY',
                    variable: {
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
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return (function (scope) {scope.suppressOwnErrors();var result = tools.valueFactory.createBoolean(' +
            'scope.getVariable("myArray").getValue().getElementByKey(tools.valueFactory.createInteger(21)).isEmpty()' +
            ');scope.unsuppressOwnErrors(); return result;}(scope));' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a return statement with array element access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EMPTY',
                    variable: {
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
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return (function (scope) {scope.suppressOwnErrors();var result = tools.valueFactory.createBoolean(' +
            'scope.getVariable("myArray").getValue().getElementByKey(tools.valueFactory.createInteger(21)).isEmpty()' +
            ');scope.unsuppressOwnErrors(); return result;}(scope));' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a return statement with static property access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EMPTY',
                    variable: {
                        name: 'N_STATIC_PROPERTY',
                        className: {
                            name: 'N_SELF'
                        },
                        property: {
                            name: 'N_STRING',
                            string: 'myProp'
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return (function (scope) {scope.suppressOwnErrors();var result = tools.valueFactory.createBoolean(' +
            'scope.getClassNameOrThrow().getStaticPropertyByName(tools.valueFactory.createBarewordString("myProp"), namespaceScope).isEmpty()' +
            ');scope.unsuppressOwnErrors(); return result;}(scope));' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
