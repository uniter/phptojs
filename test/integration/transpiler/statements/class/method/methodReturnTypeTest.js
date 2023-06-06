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
    phpToJS = require('../../../../../..');

describe('Transpiler class statement method definitions return type test', function () {
    it('should correctly transpile methods with array return types', function () {
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
                            name: 'N_ITERABLE_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myArg'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    },
                    returnType: {
                        name: 'N_ARRAY_TYPE'
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
                            name: 'N_ITERABLE_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myArg'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    },
                    returnType: {
                        name: 'N_ARRAY_TYPE'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {' +
            '"myInstanceMethod": {' +
            'isStatic: false, method: function _myInstanceMethod() {' +
            '}, args: [' +
            '{"type":"iterable","name":"myArg"}' +
            '], ' +
            'ret: {"type":"array"}' +
            '}, ' +
            '"myStaticMethod": {' +
            'isStatic: true, method: function _myStaticMethod() {' +
            '}, args: [' +
            '{"type":"iterable","name":"myArg"}' +
            '], ' +
            'ret: {"type":"array"}' +
            '}' +
            '}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });
});
