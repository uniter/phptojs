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

describe('Transpiler static:: construct expression test', function () {
    it('should correctly transpile static:: in global scope', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_STATIC_PROPERTY',
                    className: {
                        name: 'N_STATIC'
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
            'var getStaticClassName = core.getStaticClassName, getStaticProperty = core.getStaticProperty;' +
            'return getStaticProperty(getStaticClassName())("myProp");' +
            '});'
        );
    });

    // Calls to static methods with keywords eg. self::, parent:: and static:: are always forwarding,
    // calls to the same methods with the class name eg. MyClass:: are non-forwarding
    it('should correctly transpile a call to a method with static:: (forwarding)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_STATIC_METHOD_CALL',
                    className: {
                        name: 'N_STATIC'
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
            'var callStaticMethod = core.callStaticMethod, getStaticClassName = core.getStaticClassName;' +
            'callStaticMethod(getStaticClassName())("myMethod")' +
            '(true)' +  // Forwarding.
            '();' +
            '});'
        );
    });
});
