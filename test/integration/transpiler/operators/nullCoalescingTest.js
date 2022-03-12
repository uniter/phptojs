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

describe('Transpiler null coalescing operator (??) test', function () {
    it('should correctly transpile a return of null-coalescing expression', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_NULL_COALESCE',
                    left: {
                        name: 'N_INTEGER',
                        number: '21'
                    },
                    right: {
                        name: 'N_INTEGER',
                        number: '22'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, nullCoalesce = core.nullCoalesce;' +
            'return nullCoalesce()(createInteger(21), createInteger(22));' +
            '}'
        );
    });
});
