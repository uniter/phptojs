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

describe('Transpiler "heredoc" statement test', function () {
    it('should correctly transpile a heredoc with interpolated variables', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'Increase '
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'firstVar'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: ' with '
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'secondVar'
                        }]
                    }
                }]
            };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, interpolate = core.interpolate;' +
            'return interpolate([' +
            '"Increase ", ' +
            'getVariable("firstVar"), ' +
            '" with ", ' +
            'getVariable("secondVar")' +
            ']);' +
            '});'
        );
    });
});
