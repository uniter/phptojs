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

describe('Transpiler empty(...) construct expression test', function () {
    it('should correctly transpile a return statement with expression', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EMPTY',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'a_var'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, isEmpty = core.isEmpty;' +
            'return isEmpty()(getVariable("a_var"));' +
            '});'
        );
    });

    it('should correctly transpile a return statement with array element access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EMPTY',
                    variable: {
                        name: 'N_ARRAY_INDEX',
                        array: {
                            name: 'N_VARIABLE',
                            variable: 'myArray'
                        },
                        index: {
                            name: 'N_INTEGER',
                            number: 21
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getElement = core.getElement, getVariable = core.getVariable, isEmpty = core.isEmpty;' +
            'return isEmpty()(getElement(getVariable("myArray"), 21));' +
            '});'
        );
    });

    it('should correctly transpile a return statement with instance property access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EMPTY',
                    variable: {
                        name: 'N_OBJECT_PROPERTY',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'myObject'
                        },
                        property: {
                            name: 'N_STRING',
                            string: 'myProp'
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, isEmpty = core.isEmpty;' +
            'return isEmpty()(getInstanceProperty(getVariable("myObject"))("myProp"));' +
            '});'
        );
    });

    it('should correctly transpile a return statement with static property access', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_EMPTY',
                    variable: {
                        name: 'N_STATIC_PROPERTY',
                        className: {
                            name: 'N_SELF'
                        },
                        property: {
                            name: 'N_STRING',
                            string: 'myProp'
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getClassNameOrThrow = core.getClassNameOrThrow, getStaticProperty = core.getStaticProperty, isEmpty = core.isEmpty;' +
            'return isEmpty()(getStaticProperty(getClassNameOrThrow())("myProp"));' +
            '});'
        );
    });
});
