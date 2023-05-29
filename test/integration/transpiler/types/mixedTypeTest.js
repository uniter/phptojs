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

describe('Transpiler mixed type test', function () {
    it('should correctly transpile an empty function with explicit mixed return type', function () {
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
                    name: 'N_MIXED_TYPE'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineFunction = core.defineFunction;' +
            'defineFunction("gogo", function _gogo() {}, [], ' +
            // TODO: Omit these from the bundle, as mixed is the default?
            '{"type":"mixed"}' +
            ');' +
            '}'
        );
    });
});
