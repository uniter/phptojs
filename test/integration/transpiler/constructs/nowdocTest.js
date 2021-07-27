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

describe('Transpiler "nowdoc" statement test', function () {
    it('should correctly transpile a nowdoc', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_NOWDOC',
                        string: 'my nowdoc with strings that $look like $interpolated variables'
                    }
                }]
            };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createString = core.createString;' +
            'return createString(' +
            '"my nowdoc with strings that $look like $interpolated variables"' +
            ');' +
            '});'
        );
    });
});
