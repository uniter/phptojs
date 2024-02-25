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

describe('Transpiler label statement test', function () {
    it('should correctly transpile a lone label', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            // TODO: No need to output anything at all in this scenario,
            //       as there is no goto referencing the label.
            'var goingToLabel_my_goto_label = false;' +
            'goingToLabel_my_goto_label = false;' +
            '}'
        );
    });
});
