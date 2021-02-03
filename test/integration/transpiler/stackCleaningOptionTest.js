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
    phpToJS = require('../../..');

describe('Transpiler "stackCleaning" option test', function () {
    it('should correctly transpile a return statement with stack cleaning explicitly enabled', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STRING_LITERAL',
                    string: 'my result'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {stackCleaning: true})).to.equal(
            'require(\'phpruntime\').compile(function __uniterModuleStackMarker__(stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return tools.valueFactory.createString("my result");' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile an empty function with stack cleaning explicitly enabled', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'gogo'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: []
                }
            }]
        };

        expect(phpToJS.transpile(ast, {stackCleaning: true})).to.equal(
            'require(\'phpruntime\').compile(function __uniterModuleStackMarker__(stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'namespace.defineFunction("gogo", function _gogo__uniterFunctionStackMarker__() {var scope = this;}, namespaceScope);' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a return statement with stack cleaning explicitly disabled', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STRING_LITERAL',
                    string: 'my result'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {stackCleaning: false})).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return tools.valueFactory.createString("my result");' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile an empty function with stack cleaning explicitly disabled', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'gogo'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: []
                }
            }]
        };

        expect(phpToJS.transpile(ast, {stackCleaning: false})).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'namespace.defineFunction("gogo", function _gogo() {var scope = this;}, namespaceScope);' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
