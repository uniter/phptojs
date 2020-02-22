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

describe('Transpiler class statement with abstract methods test', function () {
    it('should correctly transpile a class with abstract instance and static methods', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                type: 'abstract',
                className: 'AbstractMyClass',
                members: [{
                    name: 'N_ABSTRACT_METHOD_DEFINITION',
                    func: {
                        name: 'N_STRING',
                        string: 'myMethod'
                    },
                    visibility: 'protected',
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_CLASS_TYPE',
                            className: 'MyArg'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'arg1'
                        }
                    }, {
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_CLASS_TYPE',
                            className: 'YourArg'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'arg2'
                        }
                    }]
                }, {
                    name: 'N_ABSTRACT_STATIC_METHOD_DEFINITION',
                    method: {
                        name: 'N_STRING',
                        string: 'myMethod'
                    },
                    visibility: 'protected',
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_CLASS_TYPE',
                            className: 'MyArg'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'arg1'
                        }
                    }, {
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_CLASS_TYPE',
                            className: 'YourArg'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'arg2'
                        }
                    }]
                }]
            }]
        };

        // Abstract method definitions are discarded for now
        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(function () {' +
            'var currentClass = namespace.defineClass("AbstractMyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '}, namespaceScope);' +
            '}());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
