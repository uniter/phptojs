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

describe('Transpiler class statement with constants test', function () {
    it('should correctly transpile a class with constants', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CLASS_STATEMENT',
                className: 'MyClass',
                members: [
                    {
                        name: 'N_CONSTANT_DEFINITION',
                        constants: [{
                            constant: 'MY_CONST',
                            value: {
                                name: 'N_INTEGER',
                                number: 1001
                            }
                        }]
                    },
                    {
                        name: 'N_CONSTANT_DEFINITION',
                        constants: [{
                            constant: 'ANOTHER_ONE',
                            value: {
                                name: 'N_CLASS_CONSTANT',
                                className: {
                                    name: 'N_SELF'
                                },
                                constant: 'MY_CONST'
                            }
                        }, {
                            // Also test one statement with two declarations (would be comma-separated)
                            constant: 'YET_ANOTHER_ONE',
                            value: {
                                name: 'N_INTEGER',
                                number: '1234'
                            }
                        }]
                    }
                ]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, defineClass = core.defineClass, getCurrentClassConstant = core.getCurrentClassConstant;' +
            'defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {' +
            '"MY_CONST": function (currentClass) { ' +
            'return createInteger(1001); ' +
            '}, ' +
            '"ANOTHER_ONE": function (currentClass) { ' +
            'return getCurrentClassConstant(currentClass)("MY_CONST"); ' +
            '}, ' +
            '"YET_ANOTHER_ONE": function (currentClass) { ' +
            'return createInteger(1234); ' +
            '}' +
            '}' +
            '});' +
            '});'
        );
    });
});
