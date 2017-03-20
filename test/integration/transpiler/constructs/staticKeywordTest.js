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
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getStaticClassNameOrThrow().getStaticPropertyByName(tools.valueFactory.createBarewordString("myProp"), namespaceScope).getValue();' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
