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
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var line;tools.instrument(function () {return line;});' +
            'line = 6;return (line = 8, tools.valueFactory.createInteger(4));' +
            'return tools.valueFactory.createNull();' +
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
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var line;tools.instrument(function () {return line;});' +
            'line = 4;line = 6;return (line = 8, tools.valueFactory.createInteger(101));' +
            'return tools.valueFactory.createNull();' +
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
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var line;tools.instrument(function () {return line;});' +
            'line = 6;block_1: while ((line = 8, scope.getVariable("myCond").getValue()).coerceToBoolean().getNative()) {' +
            'line = 9;stdout.write((line = 9, scope.getVariable("myVar").getValue()).coerceToString().getNative());' +
            '}' +
            'return tools.valueFactory.createNull();' +
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
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var line;tools.instrument(function () {return line;});' +
            'line = 3;namespace.defineFunction("myFunc", function _myFunc() {' +
            'var scope = this;' +
            'var line;tools.instrument(function () {return line;});' +
            'line = 8;return (line = 8, scope.getVariable("myFunctionVar").getValue());' +
            '}, namespaceScope, [], 3);' +
            'line = 2;(function () {var currentClass = namespace.defineClass("MyClass", {' +
            'superClass: null, interfaces: [], staticProperties: {}, properties: {}, methods: {' +
            '"myMethod": {' +
            'isStatic: false, method: function _myMethod() {' +
            'var scope = this;' +
            'var line;tools.instrument(function () {return line;});' +
            'line = 8;return (line = 10, scope.getVariable("myMethodVar").getValue());' +
            '}, args: [], line: 11' +
            '}}, constants: {}}, namespaceScope);}());' +
            'line = 8;return (line = 1, scope.getVariable("myGlobalCodeVar").getValue());' +
            'line = 3;(function () {var currentClass = namespace.defineClass("MyThingInterface", {' +
            'superClass: null, ' +
            'interfaces: ["First\\\\SuperClass","Second\\\\SuperClass"], ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {' +
            '"doSomethingElse": {isStatic: false, abstract: true}' +
            '}, ' +
            'constants: {}' +
            '}, namespaceScope);' +
            '}());' +
            'line = 8;return (line = 12, tools.createClosure((function (parentScope) { return function ($myArgVar) {' +
            'var scope = this;' +
            'var line;tools.instrument(function () {return line;});' +
            'scope.getVariable("myArgVar").setValue($myArgVar.getValue());' +
            'scope.getVariable("myBoundVar").setValue(parentScope.getVariable("myBoundVar").getValue());' +
            'line = 8;return (line = 11, scope.getVariable("myClosureVar").getValue());' +
            '}; }(scope)), scope, namespaceScope, [' +
            '{"name":"myArgVar"}' +
            '], false, 12));' +
            'return tools.valueFactory.createNull();' +
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
