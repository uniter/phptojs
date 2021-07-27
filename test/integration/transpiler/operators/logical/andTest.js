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

describe('Transpiler logical "and" operator test', function () {
    it('should correctly transpile a return with an "&&" operation on two strings', function () {
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
                        operator: '&&',
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
            'return createBoolean(logicalTerm(createString("first")) && logicalTerm(createString("second")));' +
            '}'
        );
    });

    it('should correctly transpile a return with a word-"and" operation on two strings', function () {
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
                        operator: 'and',
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
            'return createBoolean(logicalTerm(createString("first")) && logicalTerm(createString("second")));' +
            '}'
        );
    });
});
