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

describe('Transpiler variable-variable construct test', function () {
    it('should correctly transpile a return of variable-variable', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_VARIABLE_EXPRESSION',
                    expression: {
                        name: 'N_VARIABLE',
                        variable: 'myVariableNameVar'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var getVariable = core.getVariable, getVariableVariable = core.getVariableVariable;' +
            'return getVariableVariable(getVariable("myVariableNameVar"));' +
            '});'
        );
    });
});
