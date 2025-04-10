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

describe('Transpiler class statement method definitions return-by-reference test', function () {
    it('should correctly transpile a class with return-by-reference instance and static method definitions', function () {
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
                        statements: []
                    },
                    returnByReference: true
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
                        statements: []
                    },
                    returnByReference: true
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
            '{"type":"array","name":"myByRefArrayArg","ref":true}' +
            '], ret: null, line: null, ref: true}, ' +
            '"myStaticMethod": {' +
            'isStatic: true, method: function _myStaticMethod() {' +
            '}, args: [' +
            '{"type":"array","name":"myCallableArg"}' +
            '], ret: null, line: null, ref: true}' +
            '}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });
});
