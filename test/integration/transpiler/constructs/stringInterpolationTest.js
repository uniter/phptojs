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

describe('Transpiler string interpolation construct test', function () {
    it('should correctly transpile a return of string with interpolated variable', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STRING_EXPRESSION',
                    parts: [{
                        name: 'N_STRING_LITERAL',
                        // Embed a quote to check for escaping
                        string: 'The num\"ber is $'
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }, {
                        name: 'N_STRING_LITERAL',
                        string: '.'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, interpolate = core.interpolate;' +
            'return interpolate(["The num\\"ber is $", getVariable("myVar"), "."]);' +
            '});'
        );
    });
});
