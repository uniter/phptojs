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

describe('Transpiler if statement test', function () {
    it('should correctly transpile an if statement with reference inside the condition', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_IF_STATEMENT',
                condition: {
                    name: 'N_OBJECT_PROPERTY',
                    object: {
                        name: 'N_VARIABLE',
                        variable: 'myObject'
                    },
                    property: {
                        name: 'N_STRING',
                        string: 'myProp'
                    }
                },
                consequentStatement: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: []
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, if_ = core.if_;' +
            'if (if_(getInstanceProperty(getVariable("myObject"))("myProp"))) {}' +
            '}'
        );
    });

    it('should correctly transpile an if statement with reference inside the condition when inside a closure', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [{
                        name: 'N_CLOSURE',
                        args: [],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: [{
                                name: 'N_IF_STATEMENT',
                                condition: {
                                    name: 'N_OBJECT_PROPERTY',
                                    object: {
                                        name: 'N_VARIABLE',
                                        variable: 'myObject'
                                    },
                                    property: {
                                        name: 'N_STRING',
                                        string: 'myProp'
                                    }
                                },
                                consequentStatement: {
                                    name: 'N_COMPOUND_STATEMENT',
                                    statements: []
                                }
                            }]
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callFunction = core.callFunction, createClosure = core.createClosure, getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, if_ = core.if_;' +
            'callFunction("myFunc")(' +
            'createClosure(function () {' +
            'if (if_(getInstanceProperty(getVariable("myObject"))("myProp"))) {}' +
            '})' +
            ')();' +
            '}'
        );
    });

    it('should correctly transpile an if statement with else clause', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_IF_STATEMENT',
                condition: {
                    name: 'N_BOOLEAN',
                    bool: 'true'
                },
                consequentStatement: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'firstFunc'
                            },
                            args: []
                        }
                    }]
                },
                alternateStatement: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'secondFunc'
                            },
                            args: []
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var callFunction = core.callFunction, if_ = core.if_, trueValue = core.trueValue;' +
            'if (if_(trueValue)) {' +
            'callFunction("firstFunc")();' +
            '} else {' +
            'callFunction("secondFunc")();' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile an if statement with two "||" operations containing a comparison', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_IF_STATEMENT',
                condition: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: 1
                        },
                        right: [{
                            operator: '===',
                            operand: {
                                name: 'N_INTEGER',
                                number: 2
                            }
                        }]
                    },
                    right: [{
                        operator: '||',
                        operand: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_INTEGER',
                                    number: 3
                                },
                                right: [{
                                    operator: '===',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: 4
                                    }
                                }]
                            },
                            right: [{
                                operator: '||',
                                operand: {
                                    name: 'N_EXPRESSION',
                                    left: {
                                        name: 'N_INTEGER',
                                        number: 5
                                    },
                                    right: [{
                                        operator: '===',
                                        operand: {
                                            name: 'N_INTEGER',
                                            number: 6
                                        }
                                    }]
                                }
                            }]
                        }
                    }]
                },
                consequentStatement: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: []
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createBoolean = core.createBoolean, createInteger = core.createInteger, if_ = core.if_, isIdentical = core.isIdentical, logicalTerm = core.logicalTerm;' +
            'if (' +
                'if_(' +
                    'createBoolean(' +
                        'logicalTerm(' +
                            'isIdentical(createInteger(1))(createInteger(2))' +
                        ') || logicalTerm(' +
                            'createBoolean(' +
                                'logicalTerm(' +
                                    'isIdentical(createInteger(3))(createInteger(4))' +
                                ') || logicalTerm(' +
                                    'isIdentical(createInteger(5))(createInteger(6))' +
                                ')' +
                            ')' +
                        ')' +
                    ')' +
                ')' +
            ') ' +
            '{}' +
            '}'
        );
    });
});
