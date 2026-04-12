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

describe('Transpiler function call expression test', function () {
    it('should correctly transpile a call with no arguments', function () {
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
                    args: []
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callFunction = core.callFunction;' +
            'callFunction("myFunc");' +
            '}'
        );
    });

    it('should correctly transpile a call to static function name having arguments with simple values', function () {
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
                        name: 'N_STRING_LITERAL',
                        string: 'My string'
                    }, {
                        name: 'N_INTEGER',
                        number: 21
                    }, {
                        name: 'N_FLOAT',
                        number: 101.4
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callFunction = core.callFunction, createFloat = core.createFloat, createInteger = core.createInteger, createString = core.createString;' +
            'callFunction("myFunc", ' +
            'createString("My string"), ' +
            'createInteger(21), ' +
            'createFloat(101.4)' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a call having arguments with complex values', function () {
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
                        name: 'N_ARRAY_LITERAL',
                        elements: [{
                            name: 'N_KEY_VALUE_PAIR',
                            key: {
                                name: 'N_STRING_LITERAL',
                                string: 'myVarElement'
                            },
                            value: {
                                name: 'N_VARIABLE',
                                variable: 'myVarInNamedElement'
                            }
                        }, {
                            name: 'N_KEY_VALUE_PAIR',
                            key: {
                                name: 'N_STRING_LITERAL',
                                string: 'myPropertyElement'
                            },
                            value: {
                                name: 'N_OBJECT_PROPERTY',
                                object: {
                                    name: 'N_VARIABLE',
                                    variable: 'myObject'
                                },
                                property: {
                                    name: 'N_STRING',
                                    string: 'myProp'
                                }
                            }
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'myVarInIndexedElement'
                        }]
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'myVarAsArgBeforeComplex'
                    }, {
                        name: 'N_TERNARY',
                        condition: {
                            name: 'N_VARIABLE',
                            variable: 'myVarAsCondition'
                        },
                        consequent: {
                            name: 'N_STRING',
                            string: 'show me if truthy'
                        },
                        alternate: {
                            name: 'N_STRING',
                            string: 'show me if falsy'
                        }
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'myVarAsArgAfterComplex'
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callFunction = core.callFunction, createArray = core.createArray, createKeyValuePair = core.createKeyValuePair, createString = core.createString, getConstant = core.getConstant, getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, snapshot = core.snapshot, ternary = core.ternary;' +
            'callFunction("myFunc", ' +
            'createArray(' +
            'createKeyValuePair(' +
            'createString("myVarElement"), ' +
            'getVariable("myVarInNamedElement")' +
            '), ' +
            'createKeyValuePair(' +
            'createString("myPropertyElement"), ' +
            'getInstanceProperty(getVariable("myObject"), "myProp")' +
            '), ' +
            'getVariable("myVarInIndexedElement")' +
            '), ' +
            // Plain variable argument must be snapshotted due to complex subsequent argument (ternary).
            'snapshot(getVariable("myVarAsArgBeforeComplex")), ' +
            '(ternary(getVariable("myVarAsCondition")) ? ' +
            'getConstant("show me if truthy") : ' +
            'getConstant("show me if falsy")' +
            '), ' +
            // Plain variable argument must be snapshotted as its parameter could be by-reference.
            'getVariable("myVarAsArgAfterComplex")' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a call to static function name with named arguments only', function () {
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
                    args: [],
                    namedArgs: {
                        firstParam: {
                            name: 'N_STRING_LITERAL',
                            string: 'my first arg'
                        },
                        secondParam: {
                            name: 'N_STRING_LITERAL',
                            string: 'my second arg'
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callFunctionNamed = core.callFunctionNamed, createString = core.createString;' +
            'callFunctionNamed("myFunc", ' +
            '{"firstParam": createString("my first arg"), "secondParam": createString("my second arg")}' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a call to variable function name with named arguments only', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_VARIABLE',
                        variable: 'myFuncName'
                    },
                    args: [],
                    namedArgs: {
                        firstParam: {
                            name: 'N_STRING_LITERAL',
                            string: 'my first arg'
                        },
                        secondParam: {
                            name: 'N_STRING_LITERAL',
                            string: 'my second arg'
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callVariableFunctionNamed = core.callVariableFunctionNamed, createString = core.createString, getVariable = core.getVariable;' +
            'callVariableFunctionNamed(getVariable("myFuncName"), ' +
            '{"firstParam": createString("my first arg"), "secondParam": createString("my second arg")}' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a call to static function name with one positional and two named arguments', function () {
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
                        name: 'N_STRING_LITERAL',
                        string: 'my first arg'
                    }],
                    namedArgs: {
                        secondParam: {
                            name: 'N_STRING_LITERAL',
                            string: 'my second arg'
                        },
                        thirdParam: {
                            name: 'N_STRING_LITERAL',
                            string: 'my third arg'
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callFunctionNamed = core.callFunctionNamed, createString = core.createString;' +
            'callFunctionNamed("myFunc", ' +
            '{"secondParam": createString("my second arg"), "thirdParam": createString("my third arg")}, ' +
            'createString("my first arg")' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a call to static function name with two positional and two named arguments', function () {
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
                        name: 'N_STRING_LITERAL',
                        string: 'my first arg'
                    }, {
                        name: 'N_STRING_LITERAL',
                        string: 'my second arg'
                    }],
                    namedArgs: {
                        thirdParam: {
                            name: 'N_STRING_LITERAL',
                            string: 'my third arg'
                        },
                        fourthParam: {
                            name: 'N_STRING_LITERAL',
                            string: 'my fourth arg'
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callFunctionNamed = core.callFunctionNamed, createString = core.createString;' +
            'callFunctionNamed("myFunc", ' +
            '{"thirdParam": createString("my third arg"), "fourthParam": createString("my fourth arg")}, ' +
            'createString("my first arg"), ' +
            'createString("my second arg")' +
            ');' +
            '}'
        );
    });

    it('should correctly transpile a call to variable function name with two positional and two named arguments', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_FUNCTION_CALL',
                    func: {
                        name: 'N_VARIABLE',
                        variable: 'myFuncName'
                    },
                    args: [{
                        name: 'N_STRING_LITERAL',
                        string: 'my first arg'
                    }, {
                        name: 'N_STRING_LITERAL',
                        string: 'my second arg'
                    }],
                    namedArgs: {
                        thirdParam: {
                            name: 'N_STRING_LITERAL',
                            string: 'my third arg'
                        },
                        fourthParam: {
                            name: 'N_STRING_LITERAL',
                            string: 'my fourth arg'
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var callVariableFunctionNamed = core.callVariableFunctionNamed, createString = core.createString, getVariable = core.getVariable;' +
            'callVariableFunctionNamed(getVariable("myFuncName"), ' +
            '{"thirdParam": createString("my third arg"), "fourthParam": createString("my fourth arg")}, ' +
            'createString("my first arg"), ' +
            'createString("my second arg")' +
            ');' +
            '}'
        );
    });
});
