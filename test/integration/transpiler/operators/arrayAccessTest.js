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

describe('Transpiler array access operator test', function () {
    it('should correctly transpile a return statement with a single integer array index', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ARRAY_INDEX',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'myArray'
                    },
                    index: {
                        name: 'N_INTEGER',
                        number: 21
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getElement = core.getElement, getVariable = core.getVariable;' +
            'return getElement(getVariable("myArray"), 21);' +
            '}'
        );
    });

    it('should correctly transpile a return statement with a single string array index', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ARRAY_INDEX',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'myArray'
                    },
                    index: {
                        name: 'N_STRING_LITERAL',
                        string: 'myKey'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getElement = core.getElement, getVariable = core.getVariable;' +
            'return getElement(getVariable("myArray"), "myKey");' +
            '}'
        );
    });

    it('should correctly transpile a return statement with a variable value as array index', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ARRAY_INDEX',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'myArray'
                    },
                    index: {
                        name: 'N_VARIABLE',
                        variable: 'myKeyVar'
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getVariable = core.getVariable, getVariableElement = core.getVariableElement;' +
            'return getVariableElement(getVariable("myArray"), getVariable("myKeyVar"));' +
            '}'
        );
    });

    it('should correctly transpile a return statement with a complex expression as array index', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ARRAY_INDEX',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'myArray'
                    },
                    index: {
                        name: 'N_TERNARY',
                        condition: {
                            name: 'N_VARIABLE',
                            variable: 'myCondition'
                        },
                        consequent: {
                            name: 'N_STRING_LITERAL',
                            string: 'myKeyIfTruthy'
                        },
                        alternate: {
                            name: 'N_STRING_LITERAL',
                            string: 'myKeyIfFalsy'
                        }
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, getVariable = core.getVariable, getVariableElement = core.getVariableElement, snapshot = core.snapshot, ternary = core.ternary;' +
            'return getVariableElement(' +
            // Plain variable array/object operand must be snapshotted due to complex subsequent operand (ternary).
            'snapshot(getVariable("myArray")), ' +
            '(ternary(getVariable("myCondition")) ? ' +
            'createString("myKeyIfTruthy") : ' +
            'createString("myKeyIfFalsy")' +
            '));' +
            '}'
        );
    });

    it('should correctly transpile a return statement with multiple array indices', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_ARRAY_INDEX',
                    array: {
                        name: 'N_ARRAY_INDEX',
                        array: {
                            name: 'N_VARIABLE',
                            variable: 'myArray'
                        },
                        index: {
                            name: 'N_INTEGER',
                            number: 21
                        }
                    },
                    index: {
                        name: 'N_INTEGER',
                        number: 101
                    }
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getElement = core.getElement, getVariable = core.getVariable;' +
            'return getElement(getElement(getVariable("myArray"), 21), 101);' +
            '}'
        );
    });

    it('should correctly transpile an assignment with a single array index', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_ARRAY_INDEX',
                        array: {
                            name: 'N_VARIABLE',
                            variable: 'myArray'
                        },
                        index: {
                            name: 'N_INTEGER',
                            number: '21'
                        }
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_INTEGER',
                            number: '5'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, getElement = core.getElement, getVariable = core.getVariable, setValue = core.setValue;' +
            'setValue(getElement(getVariable("myArray"), 21), createInteger(5));' +
            '}'
        );
    });

    it('should correctly transpile an assignment with multiple array indices', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_ARRAY_INDEX',
                        array: {
                            name: 'N_ARRAY_INDEX',
                            array: {
                                name: 'N_VARIABLE',
                                variable: 'myArray'
                            },
                            index: {
                                name: 'N_INTEGER',
                                number: '21'
                            }
                        },
                        index: {
                            name: 'N_INTEGER',
                            number: '24'
                        }
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_INTEGER',
                            number: '5'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, getElement = core.getElement, getVariable = core.getVariable, setValue = core.setValue;' +
            'setValue(getElement(getElement(getVariable("myArray"), 21), 24), createInteger(5));' +
            '}'
        );
    });

    it('should correctly transpile a push of integer', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_ARRAY_INDEX',
                        array: {
                            name: 'N_VARIABLE',
                            variable: 'myArray'
                        },
                        index: null // Indicates a push.
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_INTEGER',
                            number: '21'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createInteger = core.createInteger, getVariable = core.getVariable, pushElement = core.pushElement, setValue = core.setValue;' +
            'setValue(pushElement(getVariable("myArray")), createInteger(21));' +
            '}'
        );
    });

    it('should correctly transpile a push of instance property (not reference)', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_ARRAY_INDEX',
                        array: {
                            name: 'N_VARIABLE',
                            variable: 'myArray'
                        },
                        index: null // Indicates a push.
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'myTarget'
                            },
                            property: {
                                name: 'N_STRING',
                                string: 'myProp'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getInstanceProperty = core.getInstanceProperty, getVariable = core.getVariable, pushElement = core.pushElement, setValue = core.setValue;' +
            'setValue(pushElement(getVariable("myArray")), getInstanceProperty(getVariable("myTarget"), "myProp"));' +
            '}'
        );
    });

    it('should correctly transpile a push of variable reference', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_ARRAY_INDEX',
                        array: {
                            name: 'N_VARIABLE',
                            variable: 'myArray'
                        },
                        index: null // Indicates a push.
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'myTarget'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var getVariable = core.getVariable, pushElement = core.pushElement, setReference = core.setReference;' +
            'setReference(pushElement(getVariable("myArray")), getVariable("myTarget"));' +
            '}'
        );
    });

    it('should correctly transpile a push of complex expression', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_EXPRESSION_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_ARRAY_INDEX',
                        array: {
                            name: 'N_VARIABLE',
                            variable: 'myArray'
                        },
                        index: null // Indicates a push.
                    },
                    right: [{
                        operator: '=',
                        operand: {
                            name: 'N_TERNARY',
                            condition: {
                                name: 'N_VARIABLE',
                                variable: 'myCondition'
                            },
                            consequent: {
                                name: 'N_STRING_LITERAL',
                                string: 'myRightStringIfTruthy'
                            },
                            alternate: {
                                name: 'N_STRING_LITERAL',
                                string: 'myRightStringIfFalsy'
                            }
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var createString = core.createString, getVariable = core.getVariable, pushElement = core.pushElement, setValue = core.setValue, ternary = core.ternary;' +
            'setValue(' +
            // No snapshotting is required as push element is resolved first.
            'pushElement(getVariable("myArray")), ' +
            '(ternary(getVariable("myCondition")) ? ' +
            'createString("myRightStringIfTruthy") : ' +
            'createString("myRightStringIfFalsy")' +
            '));' +
            '}'
        );
    });
});
