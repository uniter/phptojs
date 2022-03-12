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
            'function (core) {' +
            'var getPath = core.getPath;' +
            'return getPath();' +
            '}'
        );
    });

    it('should correctly transpile a return statement inside function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [
                {
                    'name': 'N_FUNCTION_STATEMENT',
                    'func': {
                        'name': 'N_STRING',
                        'string': 'myFunction'
                    },
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
            'function (core) {' +
            'var defineFunction = core.defineFunction, getPath = core.getPath;' +
            'defineFunction("myFunction", function _myFunction() {' +
            'return getPath();' +
            '});' +
            '}'
        );
    });
});
