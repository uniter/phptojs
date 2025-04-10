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

describe('Transpiler parent:: construct expression test', function () {
    it('should correctly transpile parent:: in global scope', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STATIC_PROPERTY',
                    className: {
                        name: 'N_PARENT'
                    },
                    property: {
                        name: 'N_STRING',
                        string: 'myProp'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getStaticProperty = core.getStaticProperty, getSuperClassNameOrThrow = core.getSuperClassNameOrThrow;' +
            'return getStaticProperty(getSuperClassNameOrThrow(), "myProp");' +
            '}'
        );
    });

    it('should correctly transpile parent:: in class constant scope', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [{
                    name: 'N_CONSTANT_DEFINITION',
                    constants: [{
                        constant: 'MY_CONST',
                        value: {
                            name: 'N_CLASS_CONSTANT',
                            className: {
                                name: 'N_PARENT'
                            },
                            constant: 'PARENT_CONST'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineClass = core.defineClass, getClassConstant = core.getClassConstant, getSuperClassName = core.getSuperClassName;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {' +
            '"MY_CONST": function () { ' +
            'return getClassConstant(getSuperClassName(), "PARENT_CONST"); ' +
            '}' +
            '}' +
            '});' +
            '}'
        );
    });

    // Calls to static methods with keywords e.g. self::, parent:: and static:: are always forwarding,
    // calls to the same methods with the class name e.g. MyClass:: are non-forwarding.
    it('should correctly transpile a call to a method with parent:: (forwarding)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_STATIC_METHOD_CALL',
                    className: {
                        name: 'N_PARENT'
                    },
                    method: {
                        name: 'N_STRING',
                        string: 'myMethod'
                    },
                    args: []
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callStaticMethod = core.callStaticMethod, getSuperClassNameOrThrow = core.getSuperClassNameOrThrow;' +
            'callStaticMethod(getSuperClassNameOrThrow(), "myMethod", ' +
            'true' + // Forwarding.
            ');' +
            '}'
        );
    });
});
