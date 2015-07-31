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

describe('Transpiler "return" statement test', function () {
    it('should correctly transpile a return statement with an operand of 4', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '4'
                    }
                }]
            };

        expect(phpToJS.transpile(ast)).to.equal(
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = globalScope, currentClass = null;' +
            'return tools.valueFactory.createInteger(4);' +
            'return tools.valueFactory.createNull();'
        );
    });
});
