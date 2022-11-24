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

describe('Transpiler statement hoisting test', function () {
    it('should correctly transpile a use followed by assignment, class, interface and function statements', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_USE_STATEMENT',
                uses: [{
                    source: 'Your\\Class',
                    alias: 'YourImportedClass'
                }]
            }, {
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_INTEGER',
                            number: '21'
                        }
                    }]
                }
            }, {
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                extend: 'YourImportedClass',
                members: []
            }, {
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'aFinalFunc'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: []
                }
            }, {
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'Thing',
                extend: [
                    'First\\SuperClass',
                    'Second\\SuperClass'
                ],
                members: []
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, defineClass = core.defineClass, defineFunction = core.defineFunction, defineInterface = core.defineInterface, getVariable = core.getVariable, setValue = core.setValue, useClass = core.useClass;' +
            // "Use" import statement.
            'useClass("Your\\\\Class", "YourImportedClass");' +
            // Function declaration statement.
            'defineFunction("aFinalFunc", function _aFinalFunc() {});' +
            // Interface declaration statement (hoisted above classes).
            'defineInterface("Thing", {' +
            'superClass: null, ' +
            'interfaces: ["First\\\\SuperClass","Second\\\\SuperClass"], ' +
            'staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // Class declaration statement.
            'defineClass("MyClass", {' +
            'superClass: "YourImportedClass", ' +
            // TODO: Don't output these properties in this object literal when they are empty
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // Expression statement ends up below all declarations.
            'setValue(getVariable("myVar"))(createInteger(21));' +
            '});'
        );
    });

    it('should sort to allow a class extending one defined after it', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'ChildClass',
                extend: 'ParentClass',
                members: []
            }, {
                name: 'N_CLASS_STATEMENT',
                className: 'ParentClass',
                members: []
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineClass = core.defineClass;' +
            // Parent class declaration statement. Note that it has been sorted
            // above the child class so that it is defined first.
            'defineClass("ParentClass", {' +
            'superClass: null, ' +
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // Child class declaration statement.
            'defineClass("ChildClass", {' +
            'superClass: "ParentClass", ' +
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            '});'
        );
    });

    it('should sort parent->child->grandparent class declarations as grandparent->parent->child', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'ParentClass',
                extend: 'GrandparentClass',
                members: []
            }, {
                name: 'N_CLASS_STATEMENT',
                className: 'ChildClass',
                extend: 'ParentClass',
                members: []
            }, {
                name: 'N_CLASS_STATEMENT',
                className: 'GrandparentClass',
                members: []
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineClass = core.defineClass;' +
            // Grandparent class declaration statement. Note that it has been sorted
            // above both the parent and child classes so that it is defined first.
            'defineClass("GrandparentClass", {' +
            'superClass: null, ' +
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // Parent class declaration statement. Note that it has been sorted
            // above the child class so that it is defined first.
            'defineClass("ParentClass", {' +
            'superClass: "GrandparentClass", ' +
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // Child class declaration statement.
            'defineClass("ChildClass", {' +
            'superClass: "ParentClass", ' +
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            '});'
        );
    });

    it('should sort child->parent class declarations as parent->child when ->grandparent class is referenced but missing', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'ChildClass',
                extend: 'ParentClass',
                members: []
            }, {
                name: 'N_CLASS_STATEMENT',
                className: 'ParentClass',
                extend: 'GrandparentClass',
                members: []
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineClass = core.defineClass;' +

            // Note that grandparent class declaration statement is missing.

            // Parent class declaration statement. Note that it has been sorted
            // above the child class so that it is defined first.
            'defineClass("ParentClass", {' +
            'superClass: "GrandparentClass", ' +
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // Child class declaration statement.
            'defineClass("ChildClass", {' +
            'superClass: "ParentClass", ' +
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            '});'
        );
    });

    it('should not hoist a "use" statement if after a class', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                extend: 'YourImportedClass',
                members: []
            }, {
                name: 'N_USE_STATEMENT',
                uses: [{
                    source: 'Your\\Class',
                    alias: 'YourImportedClass'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineClass = core.defineClass, useClass = core.useClass;' +
            // Class declaration statement.
            'defineClass("MyClass", {' +
            'superClass: "YourImportedClass", ' +
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // "Use" import statement.
            'useClass("Your\\\\Class", "YourImportedClass");' +
            '});'
        );
    });

    it('should sort to allow an interface extending one defined after it', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'ChildInterface',
                extend: ['ParentInterface'],
                members: []
            }, {
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'ParentInterface',
                members: []
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineInterface = core.defineInterface;' +
            // Parent interface declaration statement. Note that it has been sorted
            // above the child interface so that it is defined first.
            'defineInterface("ParentInterface", {' +
            'superClass: null, ' +
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // Child interface declaration statement.
            'defineInterface("ChildInterface", {' +
            'superClass: null, ' +
            'interfaces: ["ParentInterface"], ' +
            'staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            '});'
        );
    });

    it('should sort parent->child->grandparent interface declarations as grandparent->parent->child', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'ParentInterface',
                extend: ['GrandparentInterface'],
                members: []
            }, {
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'ChildInterface',
                extend: ['ParentInterface'],
                members: []
            }, {
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'GrandparentInterface',
                members: []
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineInterface = core.defineInterface;' +
            // Grandparent interface declaration statement. Note that it has been sorted
            // above both the parent and child interfaces so that it is defined first.
            'defineInterface("GrandparentInterface", {' +
            'superClass: null, ' +
            'interfaces: [], staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // Parent interface declaration statement. Note that it has been sorted
            // above the child interface so that it is defined first.
            'defineInterface("ParentInterface", {' +
            'superClass: null, ' +
            'interfaces: ["GrandparentInterface"], ' +
            'staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // Child interface declaration statement.
            'defineInterface("ChildInterface", {' +
            'superClass: null, ' +
            'interfaces: ["ParentInterface"], ' +
            'staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            '});'
        );
    });

    it('should sort child->parent interface declarations as parent->child when ->grandparent interface is referenced but missing', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'ChildInterface',
                extend: ['ParentInterface'],
                members: []
            }, {
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'ParentInterface',
                extend: ['GrandparentInterface'],
                members: []
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineInterface = core.defineInterface;' +

            // Note that grandparent interface declaration statement is missing.

            // Parent interface declaration statement. Note that it has been sorted
            // above the child interface so that it is defined first.
            'defineInterface("ParentInterface", {' +
            'superClass: null, ' +
            'interfaces: ["GrandparentInterface"], ' +
            'staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // Child interface declaration statement.
            'defineInterface("ChildInterface", {' +
            'superClass: null, ' +
            'interfaces: ["ParentInterface"], ' +
            'staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            '});'
        );
    });

    it('should not hoist a "use" statement if after a interface', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'MyInterface',
                extend: ['YourImportedInterface'],
                members: []
            }, {
                name: 'N_USE_STATEMENT',
                uses: [{
                    source: 'Your\\Interface',
                    alias: 'YourImportedInterface'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineInterface = core.defineInterface, useClass = core.useClass;' +
            // Interface declaration statement.
            'defineInterface("MyInterface", {' +
            'superClass: null, ' +
            'interfaces: ["YourImportedInterface"], ' +
            'staticProperties: {}, properties: {}, methods: {}, constants: {}});' +
            // "Use" import statement.
            'useClass("Your\\\\Interface", "YourImportedInterface");' +
            '});'
        );
    });
});
