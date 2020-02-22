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

describe('Transpiler static variable scope statement test', function () {
    it('should correctly transpile a static variable in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'myFunc'
                },
                args: [{
                    name: 'N_ARGUMENT',
                    type: {
                        name: 'N_CALLABLE_TYPE'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'myArg'
                    }
                }],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_STATIC_STATEMENT',
                        variables: [{
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'firstVar'
                            }
                        }, {
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'secondVar'
                            },
                            initialiser: {
                                name: 'N_INTEGER',
                                number: '101'
                            }
                        }]
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'namespace.defineFunction("myFunc", function _myFunc($myArg) {' +
            'var scope = this;' +
            'scope.getVariable("myArg").setValue($myArg.getValue());' +
            'scope.importStatic("firstVar");' +
            'scope.importStatic("secondVar", tools.valueFactory.createInteger(101));' +
            '}, namespaceScope, [' +
            '{"type":"callable","name":"myArg"}' +
            ']);' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
