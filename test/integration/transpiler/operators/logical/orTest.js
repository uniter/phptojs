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

describe('Transpiler logical "or" operator test', function () {
    it('should correctly transpile a return with an "||" operation on two strings', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_STRING_LITERAL',
                        string: 'first'
                    },
                    right: [{
                        operator: '||',
                        operand: {
                            name: 'N_STRING_LITERAL',
                            string: 'second'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createBoolean = core.createBoolean, createString = core.createString, logicalTerm = core.logicalTerm;' +
            'return createBoolean(logicalTerm(createString("first")) || logicalTerm(createString("second")));' +
            '}'
        );
    });

    it('should correctly transpile a return with two "||" operations on numbers', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 21
                    },
                    right: [{
                        operator: '||',
                        operand: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_INTEGER',
                                number: 27
                            },
                            right: [{
                                operator: '||',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: 101
                                }
                            }]
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createBoolean = core.createBoolean, createInteger = core.createInteger, logicalTerm = core.logicalTerm;' +
            'return createBoolean(logicalTerm(createInteger(21)) || logicalTerm(createBoolean(logicalTerm(createInteger(27)) || logicalTerm(createInteger(101)))));' +
            '}'
        );
    });

    it('should correctly transpile a return with a word-"or" operation on two strings', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_STRING_LITERAL',
                        string: 'first'
                    },
                    right: [{
                        operator: 'or',
                        operand: {
                            name: 'N_STRING_LITERAL',
                            string: 'second'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createBoolean = core.createBoolean, createString = core.createString, logicalTerm = core.logicalTerm;' +
            'return createBoolean(logicalTerm(createString("first")) || logicalTerm(createString("second")));' +
            '}'
        );
    });
});
