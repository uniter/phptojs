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

describe('Transpiler exit(...) construct expression test', function () {
    it('should correctly transpile exit with no status or message', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXIT'
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var exit = core.exit;' +
            'exit();' +
            '});'
        );
    });

    it('should correctly transpile exit with status', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXIT',
                    status: {
                        name: 'N_INTEGER',
                        number: '21'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, exit = core.exit;' +
            'exit(createInteger(21));' +
            '});'
        );
    });

    it('should correctly transpile exit with message', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXIT',
                    message: {
                        name: 'N_STRING_LITERAL',
                        string: 'My failure message'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createString = core.createString, exit = core.exit, print = core.print;' +
            '(print(createString("My failure message")), exit());' +
            '});'
        );
    });
});
