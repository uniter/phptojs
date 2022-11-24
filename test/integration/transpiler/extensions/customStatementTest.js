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

describe('Transpiler custom statement test', function () {
    it('should correctly transpile a custom trap statement between function calls', function () {
        // Source code: 'firstFunc(); trap_it @ 21; secondFunc();',
        var ast = {
                name: 'N_PROGRAM',
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
                }, {
                    name: 'N_CUSTOM_TRAP_IT',
                    arg: {
                        name: 'N_INTEGER',
                        number: '21'
                    }
                }, {
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
            },
            options = {
                nodes: {
                    'N_CUSTOM_TRAP_IT': function (node, interpret, context) {
                        return context.createStatementSourceNode(
                            [context.useCoreSymbol('printRaw'), '("Trapped: " + ', context.useCoreSymbol('getNative'), '(', interpret(node.arg), '));'],
                            node
                        );
                    }
                }
            };

        expect(phpToJS.transpile(ast, {}, options)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var callFunction = core.callFunction, createInteger = core.createInteger, getNative = core.getNative, printRaw = core.printRaw;' +
            'callFunction("firstFunc")();' +
            'printRaw("Trapped: " + getNative(createInteger(21)));' +
            'callFunction("secondFunc")();' +
            '});'
        );
    });
});
