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

describe('Transpiler global import statement test', function () {
    it('should correctly transpile a global import of two variables', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GLOBAL_STATEMENT',
                variables: [{
                    name: 'N_VARIABLE',
                    variable: 'firstVar'
                }, {
                    name: 'N_VARIABLE',
                    variable: 'secondVar'
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var importGlobal = core.importGlobal;' +
            'importGlobal("firstVar");importGlobal("secondVar");' +
            '}'
        );
    });
});
