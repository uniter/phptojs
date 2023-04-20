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

describe('Transpiler line numbers test', function () {
    it('should correctly transpile a simple return statement in default (async) mode', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '4',
                        bounds: {
                            start: {
                                line: 8,
                                column: 20
                            }
                        }
                    },
                    bounds: {
                        start: {
                            line: 6,
                            column: 10
                        }
                    }
                }],
                bounds: {
                    start: {
                        line: 1,
                        column: 6
                    }
                }
            },
            options = {
                path: 'my_module.php',
                lineNumbers: true
            };

        expect(phpToJS.transpile(ast, options)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, instrument = core.instrument, line;' +
            'instrument(function () {return line;});' +
            'line = 6;return (line = 8, createInteger(4));' +
            '});'
        );
    });

    it('should correctly transpile a root namespace statement in default (async) mode', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: '',
                    statements: [{
                        name: 'N_RETURN_STATEMENT',
                        expression: {
                            name: 'N_INTEGER',
                            number: '101',
                            bounds: {
                                start: {
                                    line: 8,
                                    column: 20
                                }
                            }
                        },
                        bounds: {
                            start: {
                                line: 6,
                                column: 10
                            }
                        }
                    }],
                    bounds: {
                        start: {
                            line: 4,
                            column: 15
                        }
                    }
                }],
                bounds: {
                    start: {
                        line: 1,
                        column: 6
                    }
                }
            },
            options = {
                path: 'my_module.php',
                lineNumbers: true
            };

        expect(phpToJS.transpile(ast, options)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, instrument = core.instrument, line, useGlobalNamespaceScope = core.useGlobalNamespaceScope;' +
            'instrument(function () {return line;});' +
            'line = 4;useGlobalNamespaceScope();' +
            'line = 6;return (line = 8, createInteger(101));' +
            '});'
        );
    });

    it('should correctly transpile a while loop in default (async) mode', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_WHILE_STATEMENT',
                    condition: {
                        name: 'N_VARIABLE',
                        variable: 'myCond',
                        bounds: {
                            start: {
                                line: 8,
                                column: 4
                            }
                        }
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_VARIABLE',
                                variable: 'myVar',
                                bounds: {
                                    start: {
                                        line: 9,
                                        column: 13
                                    }
                                }
                            }],
                            bounds: {
                                start: {
                                    line: 9,
                                    column: 8
                                }
                            }
                        }],
                        bounds: {
                            start: {
                                line: 8,
                                column: 4
                            }
                        }
                    },
                    bounds: {
                        start: {
                            line: 6,
                            column: 10
                        }
                    }
                }],
                bounds: {
                    start: {
                        line: 4,
                        column: 15
                    }
                }
            },
            options = {
                path: 'my_module.php',
                lineNumbers: true
            };

        expect(phpToJS.transpile(ast, options)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var echo = core.echo, getVariable = core.getVariable, instrument = core.instrument, line, loop = core.loop;' +
            'instrument(function () {return line;});' +
            'line = 6;block_1: while (loop(0, (line = 8, getVariable("myCond")))) {' +
            'line = 9;echo((line = 9, getVariable("myVar")));' +
            '}' +
            '});'
        );
    });

    it('should correctly transpile global code, functions, methods and closures in default (async) mode', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_VARIABLE',
                        variable: 'myGlobalCodeVar',
                        bounds: {
                            start: {
                                line: 1,
                                column: 20
                            }
                        }
                    },
                    bounds: {
                        start: {
                            line: 8,
                            column: 10
                        }
                    }
                }, {
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc',
                        bounds: {
                            start: {
                                line: 3,
                                column: 6
                            }
                        }
                    },
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_RETURN_STATEMENT',
                            expression: {
                                name: 'N_VARIABLE',
                                variable: 'myFunctionVar',
                                bounds: {
                                    start: {
                                        line: 8,
                                        column: 20
                                    }
                                }
                            },
                            bounds: {
                                start: {
                                    line: 8,
                                    column: 10
                                }
                            }
                        }],
                        bounds: {
                            start: {
                                line: 12,
                                column: 17
                            }
                        }
                    },
                    bounds: {
                        start: {
                            line: 3,
                            column: 6
                        }
                    }
                }, {
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_STATIC_PROPERTY_DEFINITION',
                        visibility: 'private',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myStaticProp',
                            bounds: {
                                start: {
                                    line: 5,
                                    column: 20
                                }
                            }
                        },
                        value: {
                            name: 'N_STRING',
                            string: 'MY_CONST',
                            bounds: {
                                start: {
                                    line: 5,
                                    column: 30
                                }
                            }
                        },
                        bounds: {
                            start: {
                                line: 5,
                                column: 3
                            }
                        }
                    }, {
                        name: 'N_METHOD_DEFINITION',
                        visibility: 'public',
                        func: {
                            name: 'N_STRING',
                            string: 'myMethod',
                            bounds: {
                                start: {
                                    line: 6,
                                    column: 8
                                }
                            }
                        },
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: [{
                                name: 'N_RETURN_STATEMENT',
                                expression: {
                                    name: 'N_VARIABLE',
                                    variable: 'myMethodVar',
                                    bounds: {
                                        start: {
                                            line: 10,
                                            column: 20
                                        }
                                    }
                                },
                                bounds: {
                                    start: {
                                        line: 8,
                                        column: 20
                                    }
                                }
                            }],
                            bounds: {
                                start: {
                                    line: 4,
                                    column: 5
                                }
                            }
                        },
                        bounds: {
                            start: {
                                line: 11,
                                column: 14
                            }
                        }
                    }],
                    bounds: {
                        start: {
                            line: 2,
                            column: 10
                        }
                    }
                }, {
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'MyThingInterface',
                    extend: [
                        'First\\SuperClass',
                        'Second\\SuperClass'
                    ],
                    members: [{
                        name: 'N_INTERFACE_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'doSomethingElse',
                            bounds: {
                                start: {
                                    line: 3,
                                    column: 2
                                }
                            }
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_ARRAY_TYPE'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'myBodyArgs',
                                bounds: {
                                    start: {
                                        line: 2,
                                        column: 5
                                    }
                                }
                            },
                            bounds: {
                                start: {
                                    line: 2,
                                    column: 4
                                }
                            }
                        }],
                        bounds: {
                            start: {
                                line: 2,
                                column: 1
                            }
                        }
                    }],
                    bounds: {
                        start: {
                            line: 3,
                            column: 10
                        }
                    }
                }, {
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        args: [{
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'myArgVar',
                                bounds: {
                                    start: {
                                        line: 8,
                                        column: 20
                                    }
                                }
                            },
                            bounds: {
                                start: {
                                    line: 8,
                                    column: 20
                                }
                            }
                        }],
                        bindings: [{
                            name: 'N_VARIABLE',
                            variable: 'myBoundVar',
                            bounds: {
                                start: {
                                    line: 8,
                                    column: 20
                                }
                            }
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: [{
                                name: 'N_RETURN_STATEMENT',
                                expression: {
                                    name: 'N_VARIABLE',
                                    variable: 'myClosureVar',
                                    bounds: {
                                        start: {
                                            line: 11,
                                            column: 20
                                        }
                                    }
                                },
                                bounds: {
                                    start: {
                                        line: 8,
                                        column: 20
                                    }
                                }
                            }],
                            bounds: {
                                start: {
                                    line: 8,
                                    column: 20
                                }
                            }
                        },
                        bounds: {
                            start: {
                                line: 12,
                                column: 20
                            }
                        }
                    },
                    bounds: {
                        start: {
                            line: 8,
                            column: 20
                        }
                    }
                }],
                bounds: {
                    start: {
                        line: 4,
                        column: 6
                    }
                }
            },
            options = {
                path: 'my_module.php',
                lineNumbers: true
            };

        expect(phpToJS.transpile(ast, options)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createClosure = core.createClosure, defineClass = core.defineClass, defineFunction = core.defineFunction, defineInterface = core.defineInterface, getConstant = core.getConstant, getValueBinding = core.getValueBinding, getVariable = core.getVariable, instrument = core.instrument, line, setValue = core.setValue;' +
            'instrument(function () {return line;});' +
            'line = 3;defineFunction("myFunc", function _myFunc() {' +
            'var line;' +
            'instrument(function () {return line;});' +
            'line = 8;return (line = 8, getVariable("myFunctionVar"));' +
            '}, [], 3);' +
            'line = 3;defineInterface("MyThingInterface", {' +
            'superClass: null, ' +
            'interfaces: ["First\\\\SuperClass","Second\\\\SuperClass"], ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {' +
            '"doSomethingElse": {isStatic: false, abstract: true}' +
            '}, ' +
            'constants: {}' +
            '});' +
            'line = 2;defineClass("MyClass", {' +
            'superClass: null, interfaces: [], staticProperties: {' +
            '"myStaticProp": {visibility: "private", value: function (currentClass) { return (line = 5, getConstant("MY_CONST")); }}' +
            '}, properties: {}, methods: {' +
            '"myMethod": {' +
            'isStatic: false, method: function _myMethod() {' +
            'var line;' +
            'instrument(function () {return line;});' +
            'line = 8;return (line = 10, getVariable("myMethodVar"));' +
            '}, args: [], line: 11' +
            '}}, constants: {}});' +
            'line = 8;return (line = 1, getVariable("myGlobalCodeVar"));' +
            'line = 8;return (line = 12, createClosure(function () {' +
            'var line;' +
            'instrument(function () {return line;});' +
            'setValue(getVariable("myBoundVar"))(getValueBinding("myBoundVar"));' +
            'line = 8;return (line = 11, getVariable("myClosureVar"));' +
            '}, [' +
            '{"name":"myArgVar"}' +
            '], [{"name":"myBoundVar"}], false, 12));' +
            '});'
        );
    });

    it('should throw an exception when line numbers enabled but AST has no node bounds', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_VARIABLE',
                        variable: 'myGlobalCodeVar'
                    }
                }]
            },
            options = {
                path: 'my_module.php',
                lineNumbers: true
            };

        expect(function () {
            phpToJS.transpile(ast, options);
        }).to.throw('Line number tracking enabled, but AST contains no node bounds');
    });
});
