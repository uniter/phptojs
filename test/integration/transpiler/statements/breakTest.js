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
    phpToJS = require('../../../..'),
    PHPFatalError = require('phpcommon').PHPFatalError;

describe('Transpiler "break" statement test', function () {
    it('should correctly transpile a break inside a for loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOR_STATEMENT',
                initializer: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [{
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'i'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '0'
                            }
                        }]
                    }]
                },
                condition: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [{
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'i'
                        },
                        right: [{
                            operator: '<',
                            operand: {
                                name: 'N_INTEGER',
                                number: '2'
                            }
                        }]
                    }]
                },
                update: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [{
                        name: 'N_UNARY_EXPRESSION',
                        operator: '++',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'i'
                        },
                        prefix: false
                    }]
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, getVariable = core.getVariable, isLessThan = core.isLessThan, loop = core.loop, postIncrement = core.postIncrement, setValue = core.setValue;' +
            'block_1: for (' +
            'setValue(getVariable("i"), createInteger(0));' +
            'loop(0, isLessThan(getVariable("i"), createInteger(2)));' +
            'postIncrement(getVariable("i"))' +
            ') {' +
            'break block_1;' +
            '}' +
            '}'
        );
    });

    it('should correctly transpile a break inside a foreach loop', function () {
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
                    name: 'N_BREAK_STATEMENT',
                    levels: {
                        name: 'N_INTEGER',
                        number: '1'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var advance = core.advance, getCurrentElementValue = core.getCurrentElementValue, getIterator = core.getIterator, getVariable = core.getVariable, isNotFinished = core.isNotFinished, setValue = core.setValue;' +
            '' +
            'block_1: for (var iterator_1 = getIterator(getVariable("myArray")); ' +
            'isNotFinished(0, iterator_1); ' +
            'advance(iterator_1)) {' +
            'setValue(getVariable("item"), getCurrentElementValue(iterator_1));' +
            'break block_1;' +
            '}' +
            '}'
        );
    });

    it('should correctly transpile a break inside a while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_INTEGER',
                    number: 21
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, loop = core.loop;' +
            'block_1: while (loop(0, createInteger(21))) {' +
            'break block_1;' +
            '}' +
            '}'
        );
    });

    it('should correctly transpile a break inside a do..while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DO_WHILE_STATEMENT',
                condition: {
                    name: 'N_INTEGER',
                    number: 21
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, loop = core.loop;' +
            'block_1: do {' +
            'break block_1;' +
            '} while (loop(0, createInteger(21)));' +
            '}'
        );
    });

    it('should correctly transpile a break inside a switch', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_SWITCH_STATEMENT',
                expression: {
                    name: 'N_INTEGER',
                    number: 21
                },
                cases: [{
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 21
                    },
                    body: [{
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, switchCase = core.switchCase, switchOn = core.switchOn;' +
            'var switchExpression_1 = switchOn(createInteger(21)), ' +
            'switchMatched_1 = false;' +
            'block_1: {' +
            'if (switchMatched_1 || switchCase(switchExpression_1, createInteger(21))) {' +
            'switchMatched_1 = true;' +
            'break block_1;' +
            '}' +
            '}' +
            '}'
        );
    });

    it('should throw a compile time fatal error when zero is given as the break level', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_BREAK_STATEMENT',
                levels: {
                    name: 'N_INTEGER',
                    number: 0,
                    bounds: {start: {line: 4, column: 10}}
                },
                bounds: {start: {line: 2, column: 4}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: '/path/to/module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: \'break\' operator accepts only positive integers in /path/to/module.php on line 4'
        );
    });

    it('should throw a compile time fatal error when negative one is given as the break level', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_BREAK_STATEMENT',
                levels: {
                    name: 'N_INTEGER',
                    number: -1,
                    bounds: {start: {line: 5, column: 10}}
                },
                bounds: {start: {line: 2, column: 4}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: '/path/to/another.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: \'break\' operator with non-integer operand is no longer supported'
        );
    });

    it('should throw a compile time fatal error when not inside a looping structure for 1 level', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_BREAK_STATEMENT',
                levels: {
                    name: 'N_INTEGER',
                    number: 1,
                    bounds: {start: {line: 9, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: '/my/my_module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: \'break\' not in the \'loop\' or \'switch\' context in /my/my_module.php on line 9'
        );
    });

    it('should throw a compile time fatal error when code is not enough levels deep', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_INTEGER',
                    number: 21,
                    bounds: {start: {line: 1, column: 1}}
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: 2,
                            bounds: {start: {line: 6, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: '/your/your_module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: Cannot \'break\' 2 levels in /your/your_module.php on line 6'
        );
    });
});
