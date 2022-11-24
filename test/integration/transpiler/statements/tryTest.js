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

describe('Transpiler try statement test', function () {
    it('should correctly transpile a try with only a finally clause', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRY_STATEMENT',
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                },
                catches: [],
                finalizer: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'yourFunc'
                            },
                            args: []
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var callFunction = core.callFunction, pausing = core.pausing;' +
            'try {' +
            'callFunction("myFunc")();' +
            '} finally {' +
            // Skip finally clause if we're pausing
            'if (!pausing()) {' +
            'callFunction("yourFunc")();' +
            '}' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile a try with two catches but no finally clause', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRY_STATEMENT',
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                },
                catches: [{
                    type: {
                        name: 'N_STRING',
                        string: 'My\\Exception\\Type'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'ex1'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_FUNCTION_CALL',
                                func: {
                                    name: 'N_STRING',
                                    string: 'catchFunc1'
                                },
                                args: []
                            }
                        }]
                    }
                }, {
                    type: {
                        name: 'N_STRING',
                        string: 'Another\\Exception\\Type'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'ex2'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_FUNCTION_CALL',
                                func: {
                                    name: 'N_STRING',
                                    string: 'catchFunc1'
                                },
                                args: []
                            }
                        }]
                    }
                }],
                finalizer: null
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var callFunction = core.callFunction, caught = core.caught, getVariable = core.getVariable, pausing = core.pausing, setValue = core.setValue;' +
            'try {' +
            'callFunction("myFunc")();' +
            '} catch (e) {' +
            // Re-throw the error if we're pausing
            'if (pausing()) {throw e;} ' +
            'if (caught("My\\\\Exception\\\\Type", e)) {' +
            'setValue(getVariable("ex1"), e);' +
            'callFunction("catchFunc1")();' +
            '} else if (caught("Another\\\\Exception\\\\Type", e)) {' +
            'setValue(getVariable("ex2"), e);' +
            'callFunction("catchFunc1")();' +
            // Rethrow if none of the catch guards matched, as the throwable was not caught
            '} else { throw e; }' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile a try with two catches and finally clause', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRY_STATEMENT',
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                },
                catches: [{
                    type: {
                        name: 'N_STRING',
                        string: 'My\\Exception\\Type'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'ex1'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_FUNCTION_CALL',
                                func: {
                                    name: 'N_STRING',
                                    string: 'catchFunc1'
                                },
                                args: []
                            }
                        }]
                    }
                }, {
                    type: {
                        name: 'N_STRING',
                        string: 'Another\\Exception\\Type'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'ex2'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_FUNCTION_CALL',
                                func: {
                                    name: 'N_STRING',
                                    string: 'catchFunc1'
                                },
                                args: []
                            }
                        }]
                    }
                }],
                finalizer: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'yourFunc'
                            },
                            args: []
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var callFunction = core.callFunction, caught = core.caught, getVariable = core.getVariable, pausing = core.pausing, setValue = core.setValue;' +
            'try {' +
            'callFunction("myFunc")();' +
            '} catch (e) {' +
            // Re-throw the error if we're pausing
            'if (pausing()) {throw e;} ' +
            'if (caught("My\\\\Exception\\\\Type", e)) {' +
            'setValue(getVariable("ex1"), e);' +
            'callFunction("catchFunc1")();' +
            '} else if (caught("Another\\\\Exception\\\\Type", e)) {' +
            'setValue(getVariable("ex2"), e);' +
            'callFunction("catchFunc1")();' +
            // Rethrow if none of the catch guards matched, as the throwable was not caught
            '} else { throw e; }' +
            '} finally {' +
            // Skip finally clause if we're pausing
            'if (!pausing()) {' +
            'callFunction("yourFunc")();' +
            '}' +
            '}' +
            '});'
        );
    });
});
