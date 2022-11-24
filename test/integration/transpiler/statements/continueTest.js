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

describe('Transpiler "continue" statement test', function () {
    it('should correctly transpile a continue inside a for loop', function () {
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
                        name: 'N_CONTINUE_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, getVariable = core.getVariable, isLessThan = core.isLessThan, loop = core.loop, postIncrement = core.postIncrement, setValue = core.setValue;' +
            'block_1: for (' +
            'setValue(getVariable("i"))(createInteger(0));' +
            'loop(0, isLessThan(getVariable("i"))(createInteger(2)));' +
            'postIncrement(getVariable("i"))' +
            ') {' +
            'continue block_1;' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile a continue inside a foreach loop', function () {
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
                    name: 'N_CONTINUE_STATEMENT',
                    levels: {
                        name: 'N_INTEGER',
                        number: '1'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var advance = core.advance, getCurrentElementValue = core.getCurrentElementValue, getIterator = core.getIterator, getVariable = core.getVariable, isNotFinished = core.isNotFinished, setValue = core.setValue;' +
            '' +
            'block_1: for (var iterator_1 = getIterator(getVariable("myArray")); ' +
            'isNotFinished(0, iterator_1); ' +
            'advance(iterator_1)) {' +
            'setValue(getVariable("item"), getCurrentElementValue(iterator_1));' +
            'continue block_1;' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile a continue inside a while loop', function () {
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
                        name: 'N_CONTINUE_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, loop = core.loop;' +
            'block_1: while (loop(0, createInteger(21))) {' +
            'continue block_1;' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile a continue inside a do..while loop', function () {
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
                        name: 'N_CONTINUE_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, loop = core.loop;' +
            'block_1: do {' +
            'continue block_1;' +
            '} while (loop(0, createInteger(21)));' +
            '});'
        );
    });

    it('should correctly transpile a continue inside a switch', function () {
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
                        name: 'N_CONTINUE_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }]
            }]
        };

        // In PHP, `continue` inside a `switch` should behave the save as a `break`
        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, switchCase = core.switchCase, switchOn = core.switchOn;' +
            'var switchExpression_1 = switchOn(createInteger(21)), ' +
            'switchMatched_1 = false;' +
            'block_1: {' +
            'if (switchMatched_1 || switchCase(switchExpression_1, createInteger(21))) {' +
            'switchMatched_1 = true;' +
            'break block_1;' +
            '}' +
            '}' +
            '});'
        );
    });

    it('should throw a fatal error when zero is given as the continue level', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CONTINUE_STATEMENT',
                levels: {
                    name: 'N_INTEGER',
                    number: 0,
                    bounds: {start: {line: 7, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'my_module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: \'continue\' operator accepts only positive integers in my_module.php on line 7'
        );
    });

    it('should throw a fatal error when negative one is given as the continue level', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CONTINUE_STATEMENT',
                levels: {
                    name: 'N_INTEGER',
                    number: -1,
                    bounds: {start: {line: 4, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'their_module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: \'continue\' operator with non-integer operand is no longer supported in their_module.php on line 4'
        );
    });

    it('should throw a compile time fatal error when not inside a looping structure for 1 level', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_CONTINUE_STATEMENT',
                levels: {
                    name: 'N_INTEGER',
                    number: 1,
                    bounds: {start: {line: 5, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: '/my/my_module.php'});
        }).to.throw(
            PHPFatalError,
            'PHP Fatal error: \'continue\' not in the \'loop\' or \'switch\' context in /my/my_module.php on line 5'
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
                        name: 'N_CONTINUE_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: 2,
                            bounds: {start: {line: 8, column: 1}}
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
            'PHP Fatal error: Cannot \'continue\' 2 levels in /your/your_module.php on line 8'
        );
    });
});
