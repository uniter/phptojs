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

describe('Transpiler new expression test', function () {
    it('should correctly transpile in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_VARIABLE',
                        variable: 'object'
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_NEW_EXPRESSION',
                            className: {
                                name: 'N_STRING',
                                string: 'Worker'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'scope.getVariable("object").setValue(tools.createInstance(namespaceScope, tools.valueFactory.createBarewordString("Worker"), []));' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a new expression in function call argument in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [{
                        name: 'N_NEW_EXPRESSION',
                        className: {
                            name: 'N_VARIABLE',
                            variable: 'myClassName'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(tools.valueFactory.createBarewordString("myFunc").call([' +
            'tools.createInstance(namespaceScope, scope.getVariable("myClassName").getValue(), [])' +
            '], namespaceScope) || tools.valueFactory.createNull());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
