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

describe('Transpiler union type test', function () {
    it('should correctly transpile an empty function with union callable|iterable return type', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'gogo'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: []
                },
                returnType: {
                    name: 'N_UNION_TYPE',
                    types: [
                        { name: 'N_CALLABLE_TYPE' },
                        { name: 'N_ITERABLE_TYPE'}
                    ]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineFunction = core.defineFunction;' +
            'defineFunction("gogo", function _gogo() {}, [], ' +
            '{"type":"union","types":[{"type":"callable"},{"type":"iterable"}]}' +
            ');' +
            '}'
        );
    });
});
