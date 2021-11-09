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

describe('Transpiler isset(...) construct expression test', function () {
    it('should correctly transpile a return statement with expression', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ISSET',
                    variables: [{
                        name: 'N_VARIABLE',
                        variable: 'a_var'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, isSet = core.isSet;' +
            'return isSet()([getVariable("a_var")]);' +
            '});'
        );
    });

    it('should correctly transpile a return statement with multiple expressions', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ISSET',
                    variables: [{
                        name: 'N_VARIABLE',
                        variable: 'a_var'
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'another_var'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, isSet = core.isSet;' +
            'return isSet()([getVariable("a_var"), getVariable("another_var")]);' +
            '});'
        );
    });

    it('should correctly transpile a return statement with array element access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ISSET',
                    variables: [{
                        name: 'N_ARRAY_INDEX',
                        array: {
                            name: 'N_VARIABLE',
                            variable: 'myArray'
                        },
                        index: {
                            name: 'N_INTEGER',
                            number: 21
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getElement = core.getElement, getVariable = core.getVariable, isSet = core.isSet;' +
            'return isSet()([getElement(getVariable("myArray"), 21)]);' +
            '});'
        );
    });
});
