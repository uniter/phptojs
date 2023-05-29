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
    phpToJS = require('../../..');

describe('Transpiler class constant operator test', function () {
    it('should correctly transpile a return statement with ::class', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_CLASS_CONSTANT',
                    className: {
                        name: 'N_STRING',
                        string: 'My\\Stuff\\MyClass'
                    },
                    constant: 'class'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createBareword = core.createBareword, getClassNameConstant = core.getClassNameConstant;' +
            'return getClassNameConstant(createBareword("My\\\\Stuff\\\\MyClass"));' +
            '}'
        );
    });
});
