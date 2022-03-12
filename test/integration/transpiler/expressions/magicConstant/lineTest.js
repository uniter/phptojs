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

describe('Transpiler __LINE__ magic constant test', function () {
    it('should correctly transpile a return statement outside of function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_MAGIC_LINE_CONSTANT',
                    bounds: {
                        start: {
                            line: 1,
                            offset: 2
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger;' +
            'return createInteger(1);' +
            '}'
        );
    });

    it('should correctly transpile a return statement inside function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [
                {
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        'name': 'N_STRING',
                        'string': 'myFunction'
                    },
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [
                            {
                                name: 'N_RETURN_STATEMENT',
                                expression: {
                                    name: 'N_MAGIC_LINE_CONSTANT',
                                    bounds: {
                                        start: {
                                            line: 3,
                                            offset: 8
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, defineFunction = core.defineFunction;' +
            'defineFunction("myFunction", function _myFunction() {' +
            'return createInteger(3);' +
            '});' +
            '}'
        );
    });

    it('should correctly transpile a return statement outside of function with no bounds information', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_MAGIC_LINE_CONSTANT'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var nullValue = core.nullValue;' +
            'return nullValue;' +
            '}'
        );
    });
});
