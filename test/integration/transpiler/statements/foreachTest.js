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

describe('Transpiler "foreach" statement test', function () {
    it('should correctly transpile a foreach loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray'
                },
                value: {
                    name: 'N_VARIABLE',
                    variable: 'item'
                },
                body: {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '1'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var advance = core.advance, createInteger = core.createInteger, echo = core.echo, getCurrentElementValue = core.getCurrentElementValue, getIterator = core.getIterator, getVariable = core.getVariable, isNotFinished = core.isNotFinished, setValue = core.setValue;' +
            'block_1: for (var iterator_1 = getIterator(getVariable("myArray")); ' +
            'isNotFinished(0, iterator_1); ' +
            'advance(iterator_1)) {' +
            'setValue(getVariable("item"), getCurrentElementValue(iterator_1));' +
            'echo(createInteger(1));' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile a foreach loop where value variable is by reference', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray'
                },
                value: {
                    name: 'N_REFERENCE',
                    operand: {
                        name: 'N_VARIABLE',
                        variable: 'item'
                    }
                },
                body: {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '1'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var advance = core.advance, createInteger = core.createInteger, echo = core.echo, getCurrentElementReference = core.getCurrentElementReference, getIterator = core.getIterator, getVariable = core.getVariable, isNotFinished = core.isNotFinished, setReference = core.setReference;' +
            'block_1: for (var iterator_1 = getIterator(getVariable("myArray")); ' +
            'isNotFinished(0, iterator_1); ' +
            'advance(iterator_1)) {' +
            'setReference(getVariable("item"), getCurrentElementReference(iterator_1));' +
            'echo(createInteger(1));' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile a foreach loop with key variable', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray'
                },
                key: {
                    name: 'N_VARIABLE',
                    variable: 'theKey'
                },
                value: {
                    name: 'N_VARIABLE',
                    variable: 'item'
                },
                body: {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '1'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var advance = core.advance, createInteger = core.createInteger, echo = core.echo, getCurrentElementValue = core.getCurrentElementValue, getCurrentKey = core.getCurrentKey, getIterator = core.getIterator, getVariable = core.getVariable, isNotFinished = core.isNotFinished, setValue = core.setValue;' +
            'block_1: for (var iterator_1 = getIterator(getVariable("myArray")); ' +
            'isNotFinished(0, iterator_1); ' +
            'advance(iterator_1)) {' +
            'setValue(getVariable("item"), getCurrentElementValue(iterator_1));' +
            'setValue(getVariable("theKey"), getCurrentKey(iterator_1));' +
            'echo(createInteger(1));' +
            '}' +
            '});'
        );
    });
});
