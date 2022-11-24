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

describe('Transpiler self:: construct expression test', function () {
    it('should correctly transpile self:: in global scope', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STATIC_PROPERTY',
                    className: {
                        name: 'N_SELF'
                    },
                    property: {
                        name: 'N_STRING',
                        string: 'myProp'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getClassNameOrThrow = core.getClassNameOrThrow, getStaticProperty = core.getStaticProperty;' +
            'return getStaticProperty(getClassNameOrThrow())("myProp");' +
            '});'
        );
    });

    // Calls to static methods with keywords e.g. self::, parent:: and static:: are always forwarding,
    // calls to the same methods with the class name e.g. MyClass:: are non-forwarding.
    it('should correctly transpile a call to a method with self:: (forwarding)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_STATIC_METHOD_CALL',
                    className: {
                        name: 'N_SELF'
                    },
                    method: {
                        name: 'N_STRING',
                        string: 'myMethod'
                    },
                    args: []
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var callStaticMethod = core.callStaticMethod, getClassNameOrThrow = core.getClassNameOrThrow;' +
            'callStaticMethod(getClassNameOrThrow())("myMethod")' +
            '(true)' + // Forwarding.
            '();' +
            '});'
        );
    });

    // See constantTest.js for a test that uses self:: in class constant -scope.
    // See propertyTest.js for a test that uses self:: as the initial value of a class property.
});
