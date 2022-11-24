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

describe('Transpiler "switch" statement test', function () {
    it('should correctly transpile a switch with two cases and no default', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_SWITCH_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 21
                    },
                    right: [{
                        operator: '+',
                        operand: {
                            name: 'N_INTEGER',
                            number: 6
                        }
                    }]
                },
                cases: [{
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 27
                    },
                    body: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '7'
                                }
                            }]
                        }
                    }, {
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }, {
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 101
                    },
                    body: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '10'
                                }
                            }]
                        }
                    }, {
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var add = core.add, createInteger = core.createInteger, getVariable = core.getVariable, setValue = core.setValue, switchCase = core.switchCase, switchOn = core.switchOn;' +
            'var switchExpression_1 = switchOn(add(createInteger(21))(createInteger(6))), ' +
            'switchMatched_1 = false;' +
            'block_1: {' +
            'if (switchMatched_1 || switchCase(switchExpression_1, createInteger(27))) {' +
            'switchMatched_1 = true;' +
            'setValue(getVariable("a"))(createInteger(7));' +
            'break block_1;' +
            '}' +
            'if (switchMatched_1 || switchCase(switchExpression_1, createInteger(101))) {' +
            'switchMatched_1 = true;' +
            'setValue(getVariable("a"))(createInteger(10));' +
            'break block_1;' +
            '}' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile a switch with one case and default with default as last', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_SWITCH_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 21
                    },
                    right: [{
                        operator: '+',
                        operand: {
                            name: 'N_INTEGER',
                            number: 6
                        }
                    }]
                },
                cases: [{
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 27
                    },
                    body: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '7'
                                }
                            }]
                        }
                    }, {
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }, {
                    name: 'N_DEFAULT_CASE',
                    body: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '8'
                                }
                            }]
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var add = core.add, createInteger = core.createInteger, getVariable = core.getVariable, setValue = core.setValue, switchCase = core.switchCase, switchOn = core.switchOn;' +
            'var switchExpression_1 = switchOn(add(createInteger(21))(createInteger(6))), ' +
            'switchMatched_1 = false;' +
            'block_1: {' +
            'if (switchMatched_1 || switchCase(switchExpression_1, createInteger(27))) {' +
            'switchMatched_1 = true;' +
            'setValue(getVariable("a"))(createInteger(7));' +
            'break block_1;' +
            '}' +
            'switchMatched_1 = true;' +
            'setValue(getVariable("a"))(createInteger(8));' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile a switch with two cases and default with default as second', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_SWITCH_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 21
                    },
                    right: [{
                        operator: '+',
                        operand: {
                            name: 'N_INTEGER',
                            number: 6
                        }
                    }]
                },
                cases: [{
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 101
                    },
                    body: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '7'
                                }
                            }]
                        }
                    }, {
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }, {
                    name: 'N_DEFAULT_CASE',
                    body: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '8'
                                }
                            }]
                        }
                    }]
                }, {
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 27
                    },
                    body: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '1001'
                                }
                            }]
                        }
                    }, {
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var add = core.add, createInteger = core.createInteger, getVariable = core.getVariable, setValue = core.setValue, switchCase = core.switchCase, switchDefault = core.switchDefault, switchOn = core.switchOn;' +
            'var switchExpression_1 = switchOn(add(createInteger(21))(createInteger(6))), ' +
            'switchMatched_1 = false;' +
            'block_1: while (true) {' +
            'if (switchMatched_1 || switchCase(switchExpression_1, createInteger(101))) {' +
            'switchMatched_1 = true;' +
            'setValue(getVariable("a"))(createInteger(7));' +
            'break block_1;' +
            '}' +
            'if (switchMatched_1 || switchDefault(switchExpression_1)) {' +
            'switchMatched_1 = true;' +
            'setValue(getVariable("a"))(createInteger(8));' +
            '}' +
            'if (switchMatched_1 || switchCase(switchExpression_1, createInteger(27))) {' +
            'switchMatched_1 = true;' +
            'setValue(getVariable("a"))(createInteger(1001));' +
            'break block_1;' +
            '}' +
            'if (switchMatched_1) {break;} else {switchExpression_1 = null;}' +
            '}' +
            '});'
        );
    });
});
