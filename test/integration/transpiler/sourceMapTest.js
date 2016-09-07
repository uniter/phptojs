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
    phpToJS = require('../../..');

describe('Transpiler source map test', function () {
    it('should correctly transpile a simple return statement in default (async) mode', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '4',
                        offset: {
                            line: 8,
                            column: 20
                        }
                    },
                    offset: {
                        line: 8,
                        column: 10
                    }
                }],
                offset: {
                    line: 4,
                    column: 6
                }
            };

        expect(phpToJS.transpile(ast, {path: 'my_module.php', sourceMap: true})).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return tools.valueFactory.createInteger(4);' +
            'return tools.valueFactory.createNull();' +
            '})' +
            '\n\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm15X21vZHVsZS5wa' +
            'HAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR00ifQ==' +
            '\n;'
        );
    });

    it('should correctly transpile functions, methods and closures with debug vars');
});
