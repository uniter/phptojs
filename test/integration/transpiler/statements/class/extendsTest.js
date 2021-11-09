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
    phpToJS = require('../../../../..');

describe('Transpiler class statement "extends" test', function () {
    it('should correctly transpile an empty class that extends another', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                extend: 'My\\SuperClass',
                members: []
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineClass = core.defineClass;' +
            'defineClass("MyClass", {' +
            'superClass: "My\\\\SuperClass", ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {}' +
            '});' +
            '});'
        );
    });
});
