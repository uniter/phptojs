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

describe('Transpiler "do..while" statement test', function () {
    it('should correctly transpile a do..while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DO_WHILE_STATEMENT',
                condition: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 27
                    },
                    right: [{
                        operator: '>',
                        operand: {
                            name: 'N_INTEGER',
                            number: 21
                        }
                    }]
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'block_1: do {' +
            'stdout.write(tools.valueFactory.createInteger(4).coerceToString().getNative());' +
            '} while (' +
            'tools.valueFactory.createInteger(27).isGreaterThan(tools.valueFactory.createInteger(21)).coerceToBoolean().getNative()' +
            ');' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
