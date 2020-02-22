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

describe('Transpiler "const" declaration statement test', function () {
    it('should correctly transpile multiple constant declarations in one statement', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CONSTANT_STATEMENT',
                constants: [{
                    constant: 'FIRST_CONST',
                    value: {
                        name: 'N_INTEGER',
                        number: '101'
                    }
                }, {
                    constant: 'SECOND_CONST',
                    value: {
                        name: 'N_STRING_LITERAL',
                        string: 'hello world!'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'namespace.defineConstant("FIRST_CONST", tools.valueFactory.createInteger(101));' +
            'namespace.defineConstant("SECOND_CONST", tools.valueFactory.createString("hello world!"));' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
