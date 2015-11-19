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

describe('Transpiler __FILE__ magic constant test', function () {
    it('should correctly transpile a return statement outside of function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_MAGIC_FILE_CONSTANT'
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
            'return tools.getPath();' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });

    it('should correctly transpile a return statement inside function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [
                {
                    'name': 'N_FUNCTION_STATEMENT',
                    'func': 'myFunction',
                    'args': [],
                    'body': {
                        'name': 'N_COMPOUND_STATEMENT',
                        'statements': [
                            {
                                'name': 'N_RETURN_STATEMENT',
                                'expression': {
                                    'name': 'N_MAGIC_FILE_CONSTANT'
                                }
                            }
                        ]
                    }
                }
            ]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
            'namespace.defineFunction("myFunction", function () {var scope = this;' +
            'return tools.getPath();' +
            '});' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });
});
