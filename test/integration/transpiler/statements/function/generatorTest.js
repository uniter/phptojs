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

describe('Transpiler generator function statement test', function () {
    it('should correctly transpile a generator with a single yield of a value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'myGenerator'
                },
                generator: true,
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_YIELD_EXPRESSION',
                            key: null,
                            value: {
                                name: 'N_STRING_LITERAL',
                                string: 'my value'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, defineFunction = core.defineFunction, wrapGenerator = core.wrapGenerator, yield_ = core.yield_;' +
            'defineFunction("myGenerator", wrapGenerator(function _myGenerator() {' +
            'yield_(createString("my value"));' +
            '}));' +
            '}'
        );
    });

    it('should correctly transpile a generator with a single yield of a key and value', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'myGenerator'
                },
                generator: true,
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_YIELD_EXPRESSION',
                            key: {
                                name: 'N_STRING_LITERAL',
                                string: 'my key'
                            },
                            value: {
                                name: 'N_STRING_LITERAL',
                                string: 'my value'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, defineFunction = core.defineFunction, wrapGenerator = core.wrapGenerator, yieldWithKey = core.yieldWithKey;' +
            'defineFunction("myGenerator", wrapGenerator(function _myGenerator() {' +
            'yieldWithKey(createString("my key"))(createString("my value"));' +
            '}));' +
            '}'
        );
    });
});
