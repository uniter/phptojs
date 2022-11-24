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

describe('Transpiler unset(...) construct expression test', function () {
    it('should correctly transpile an unset with one variable', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_UNSET_STATEMENT',
                variables: [{
                    name: 'N_VARIABLE',
                    variable: 'a_var'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, unset = core.unset;' +
            'unset(getVariable("a_var"))();' +
            '});'
        );
    });

    it('should correctly transpile an unset with two variables', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_UNSET_STATEMENT',
                variables: [{
                    name: 'N_VARIABLE',
                    variable: 'first_var'
                }, {
                    name: 'N_VARIABLE',
                    variable: 'second_var'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, unset = core.unset;' +
            'unset(getVariable("first_var"))(getVariable("second_var"))();' +
            '});'
        );
    });

    it('should correctly transpile an unset with array element access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_UNSET_STATEMENT',
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
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getElement = core.getElement, getVariable = core.getVariable, unset = core.unset;' +
            'unset(getElement(getVariable("myArray"), 21))();' +
            '});'
        );
    });

    it('should correctly transpile an unset with object property access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_UNSET_STATEMENT',
                variables: [{
                    name: 'N_OBJECT_PROPERTY',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'an_object'
                    },
                    property: {
                        name: 'N_STRING',
                        string: 'prop'
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, unset = core.unset;' +
            'unset(getInstanceProperty(getVariable("an_object"))("prop"))();' +
            '});'
        );
    });
});
