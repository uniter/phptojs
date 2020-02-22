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

describe('Transpiler class statement with method definitions test', function () {
    it('should correctly transpile a class with instance and static method definitions', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_METHOD_DEFINITION',
                    visibility: 'public',
                    func: {
                        name: 'N_STRING',
                        string: 'myInstanceMethod'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'myByRefArrayArg'
                            }
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_RETURN_STATEMENT',
                            expression: {
                                name: 'N_INTEGER',
                                number: 21
                            }
                        }]
                    }
                }, {
                    name: 'N_STATIC_METHOD_DEFINITION',
                    modifier: 'final',
                    visibility: 'protected',
                    method: {
                        name: 'N_STRING',
                        string: 'myStaticMethod'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myCallableArg'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_RETURN_STATEMENT',
                            expression: {
                                name: 'N_INTEGER',
                                number: 101
                            }
                        }]
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
            'methods: {' +
            '"myInstanceMethod": {' +
            'isStatic: false, method: function _myInstanceMethod($myByRefArrayArg) {' +
            'var scope = this;' +
            'scope.getVariable("myByRefArrayArg").setReference($myByRefArrayArg.getReference());' +
            'return tools.valueFactory.createInteger(21);' +
            '}, args: [' +
            '{"type":"array","name":"myByRefArrayArg","ref":true}' +
            ']}, ' +
            '"myStaticMethod": {' +
            'isStatic: true, method: function _myStaticMethod($myCallableArg) {' +
            'var scope = this;' +
            'scope.getVariable("myCallableArg").setValue($myCallableArg.getValue());' +
            'return tools.valueFactory.createInteger(101);' +
            '}, args: [' +
            '{"type":"array","name":"myCallableArg"}' +
            ']}' +
            '}, ' +
            'constants: {}' +
            '}, namespaceScope);' +
            '}());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
