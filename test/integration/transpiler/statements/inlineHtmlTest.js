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

describe('Transpiler inline HTML statement test', function () {
    it('should correctly transpile in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INLINE_HTML_STATEMENT',
                html: '<p>My inline HTML</p>'
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var printRaw = core.printRaw;' +
            'printRaw("<p>My inline HTML</p>");' +
            '});'
        );
    });
});
