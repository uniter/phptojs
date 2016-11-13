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

describe('Transpiler if statement test', function () {
    it('should correctly transpile an if statement with else clause', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_IF_STATEMENT',
                condition: {
                    name: 'N_BOOLEAN',
                    bool: 'true'
                },
                consequentStatement: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'firstFunc'
                            },
                            args: []
                        }
                    }]
                },
                alternateStatement: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'secondFunc'
                            },
                            args: []
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'if (tools.valueFactory.createBoolean(true).coerceToBoolean().getNative()) {' +
            '(tools.valueFactory.createBarewordString("firstFunc").call([], namespaceScope) || tools.valueFactory.createNull());' +
            '} else {' +
            '(tools.valueFactory.createBarewordString("secondFunc").call([], namespaceScope) || tools.valueFactory.createNull());' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
