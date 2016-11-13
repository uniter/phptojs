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
                        constant: 'MY_CONST',
                        value: {
                            name: 'N_INTEGER',
                            number: 1001
                        }
                    },
                    {
                        name: 'N_CONSTANT_DEFINITION',
                        constant: 'ANOTHER_ONE',
                        value: {
                            name: 'N_STATIC_PROPERTY',
                            className: {
                                name: 'N_SELF'
                            },
                            property: {
                                name: 'N_STRING',
                                string: 'MY_CONST'
                            }
                        }
                    }
                ]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(function () {' +
            'var currentClass = namespace.defineClass("MyClass", {' +
            'superClass: null, ' +
            'interfaces: [], ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {}, ' +
            'constants: {' +
            '"MY_CONST": function () { ' +
            'return tools.valueFactory.createInteger(1001); ' +
            '}, ' +
            '"ANOTHER_ONE": function () { ' +
            'return tools.valueFactory.createString(currentClass.getName())' +
            '.getStaticPropertyByName(tools.valueFactory.createBarewordString("MY_CONST"), namespaceScope).getValue(); ' +
            '}' +
            '}' +
            '}, namespaceScope);' +
            '}());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
