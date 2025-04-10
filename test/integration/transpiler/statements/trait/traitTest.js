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

describe('Transpiler trait statement test', function () {
    it('should correctly transpile a trait with instance and static method definitions', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRAIT_STATEMENT',
                traitName: 'MyTrait',
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

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, defineTrait = core.defineTrait;' +
            'defineTrait("MyTrait", {' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {' +
            '"myInstanceMethod": {' +
            'isStatic: false, method: function _myInstanceMethod() {' +
            'return createInteger(21);' +
            '}, args: [' +
            '{"type":"array","name":"myByRefArrayArg","ref":true}' +
            ']}, ' +
            '"myStaticMethod": {' +
            'isStatic: true, method: function _myStaticMethod() {' +
            'return createInteger(101);' +
            '}, args: [' +
            '{"type":"array","name":"myCallableArg"}' +
            ']}' +
            '}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile a trait that uses another', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRAIT_STATEMENT',
                traitName: 'MyTrait',
                members: [{
                    name: 'N_USE_TRAIT_STATEMENT',
                    traitNames: ['Yours\\YourTrait']
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

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, defineTrait = core.defineTrait;' +
            'defineTrait("MyTrait", {' +
            'traits: {names: ["Yours\\\\YourTrait"]}, ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {' +
            '"myStaticMethod": {' +
            'isStatic: true, method: function _myStaticMethod() {' +
            'return createInteger(101);' +
            '}, args: [' +
            '{"type":"array","name":"myCallableArg"}' +
            ']}' +
            '}, ' +
            'constants: {}' +
            '});' +
            '}'
        );
    });
});
