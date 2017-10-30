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

describe('Transpiler interface statement test', function () {
    it('should correctly transpile an interface in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'Thing',
                extend: [
                    'First\\SuperClass',
                    'Second\\SuperClass'
                ],
                members: [{
                    name: 'N_CONSTANT_DEFINITION',
                    constant: 'SHAPE',
                    value: {
                        name: 'N_STRING_LITERAL',
                        string: 'sphere'
                    }
                }, {
                    name: 'N_STATIC_INTERFACE_METHOD_DEFINITION',
                    method: {
                        name: 'N_STRING',
                        string: 'doSomething'
                    },
                    visibility: 'public',
                    args: [{
                        name: 'N_ARGUMENT',
                        type: 'array',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'someQueryArgs'
                        }
                    }]
                }, {
                    name: 'N_INTERFACE_METHOD_DEFINITION',
                    func: {
                        name: 'N_STRING',
                        string: 'doSomethingElse'
                    },
                    visibility: 'public',
                    args: [{
                        name: 'N_ARGUMENT',
                        type: 'array',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myBodyArgs'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(function () {' +
            'var currentClass = namespace.defineClass("Thing", {' +
            'superClass: null, ' +
            'interfaces: ["First\\\\SuperClass","Second\\\\SuperClass"], ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {' +
            '"doSomething": {isStatic: true, abstract: true}, ' +
            '"doSomethingElse": {isStatic: false, abstract: true}' +
            '}, ' +
            'constants: {' +
            '"SHAPE": function () { return tools.valueFactory.createString("sphere"); }' +
            '}' +
            '}, namespaceScope);' +
            '}());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
