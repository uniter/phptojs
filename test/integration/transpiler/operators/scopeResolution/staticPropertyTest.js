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

describe('Transpiler static property access test', function () {
    it('should correctly transpile a read of a property of a statically-given class (via bareword)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STATIC_PROPERTY',
                    className: {
                        name: 'N_STRING',
                        string: 'MyImportedClass'
                    },
                    property: {
                        name: 'N_STRING',
                        string: 'myStaticProp'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createBareword = core.createBareword, getStaticProperty = core.getStaticProperty;' +
            'return getStaticProperty(createBareword("MyImportedClass"))("myStaticProp");' +
            '}'
        );
    });

    it('should correctly transpile a read of a property of a property of a dynamically-given class (via variable)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STATIC_PROPERTY',
                    className: {
                        name: 'N_STATIC_PROPERTY',
                        className: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        property: {
                            name: 'N_STRING',
                            string: 'firstProp'
                        }
                    },
                    property: {
                        name: 'N_STRING',
                        string: 'secondProp'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getStaticProperty = core.getStaticProperty, getVariable = core.getVariable;' +
            'return getStaticProperty(getStaticProperty(getVariable("myVar"))("firstProp"))("secondProp");' +
            '}'
        );
    });

    it('should correctly transpile a dynamic reference to a property', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STATIC_PROPERTY',
                    className: {
                        name: 'N_VARIABLE',
                        variable: 'myClassNameVar'
                    },
                    property: {
                        name: 'N_VARIABLE',
                        variable: 'myVarHoldingPropName'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getVariable = core.getVariable, getVariableStaticProperty = core.getVariableStaticProperty;' +
            'return getVariableStaticProperty(getVariable("myClassNameVar"))(getVariable("myVarHoldingPropName"));' +
            '}'
        );
    });
});
