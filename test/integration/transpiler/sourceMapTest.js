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

describe('Transpiler source map test', function () {
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
                            line: 8,
                            column: 10
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
                sourceMap: {
                    sourceContent: '<?php $this = "is my source PHP";'
                }
            };

        expect(phpToJS.transpile(ast, options)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return tools.valueFactory.createInteger(4);' +
            'return tools.valueFactory.createNull();' +
            '});' +
            '\n\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm15' +
            'X21vZHVsZS5waHAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6InVNQU9TLE9BQVUsbUNBQVYsQyIsInNvdXJjZXNDb2' +
            '50ZW50IjpbIjw/cGhwICR0aGlzID0gXCJpcyBteSBzb3VyY2UgUEhQXCI7Il19' +
            '\n'
        );
    });

    it('should correctly transpile a simple return statement in default (async) mode wih returnMap option', function () {
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
                            line: 8,
                            column: 10
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
                sourceMap: {
                    returnMap: true,
                    sourceContent: '<?php $this = "is my source PHP";'
                }
            };

        expect(phpToJS.transpile(ast, options)).to.deep.equal({
            code: 'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return tools.valueFactory.createInteger(4);' +
            'return tools.valueFactory.createNull();' +
            '});',
            map: {
                mappings: 'uMAOS,OAAU,mCAAV,C',
                names: [],
                sources: [
                    'my_module.php'
                ],
                sourcesContent: [
                    '<?php $this = "is my source PHP";'
                ],
                version: 3
            }
        });
    });

    it('should correctly transpile global code, functions, methods and closures with debug vars in default (async) mode', function () {
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_VARIABLE',
                        variable: 'myGlobalCodeVar',
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
                sourceMap: {
                    sourceContent: '<?php $this = "is my source PHP";'
                }
            };

        expect(phpToJS.transpile(ast, options)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            // Debug variable will be inserted for better debugging in Chrome dev tools
            'var $myGlobalCodeVar = tools.createDebugVar(scope, "myGlobalCodeVar");' +
            'namespace.defineFunction("myFunc", function _myFunc() {' +
            'var scope = this;' +
            'var $this = tools.createDebugVar(scope, "this");' +
            'var $myFunctionVar = tools.createDebugVar(scope, "myFunctionVar");' +
            'return scope.getVariable("myFunctionVar").getValue();' +
            '}, namespaceScope);' +
            '(function () {var currentClass = namespace.defineClass("MyClass", {' +
            'superClass: null, interfaces: [], staticProperties: {}, properties: {}, methods: {' +
            '"myMethod": {' +
            'isStatic: false, method: function _myMethod() {' +
            'var scope = this;var $this = tools.createDebugVar(scope, "this");' +
            'var $myMethodVar = tools.createDebugVar(scope, "myMethodVar");' +
            'return scope.getVariable("myMethodVar").getValue();' +
            '}' +
            '}}, constants: {}}, namespaceScope);}());' +
            'return scope.getVariable("myGlobalCodeVar").getValue();' +
            'return tools.createClosure((function (parentScope) { return function ($myArgVar) {' +
            'var scope = this;scope.getVariable("myArgVar").setValue($myArgVar.getValue());' +
            'var $myArgVar = tools.createDebugVar(scope, "myArgVar");' +
            'var $this = tools.createDebugVar(scope, "this");' +
            'var $myClosureVar = tools.createDebugVar(scope, "myClosureVar");' +
            'scope.getVariable("myBoundVar").setValue(parentScope.getVariable("myBoundVar").getValue());' +
            'var $myBoundVar = tools.createDebugVar(scope, "myBoundVar");' +
            'return scope.getVariable("myClosureVar").getValue();' +
            '}; }(scope)), scope, namespaceScope, [' +
            '{"name":"myArgVar"}' +
            ']);' +
            'return tools.valueFactory.createNull();' +
            '});' +
            '\n\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm15X21' +
            'vZHVsZS5waHAiXSwibmFtZXMiOlsiTl9TVFJJTkciLCIkbXlGdW5jdGlvblZhciIsIiRteU1ldGhvZFZhciIsIiRteUds' +
            'b2JhbENvZGVWYXIiLCIkbXlCb3VuZFZhciIsIiRteUNsb3N1cmVWYXIiXSwibWFwcGluZ3MiOiI2UUFFSyw0Q0FBQUEsT' +
            '0FBQSx1SUFLSSxPQUFVQyw2Q0FBVixDQUxKLG1CQURJLGlLQVNJLG1DQUxORCxTQUtNLG1JQUhNLE9BQUFFLDJDQUFBLE' +
            'NBR04sRUFUSix3Q0FNQSxPQUFVQywrQ0FBVixDQUFVLHVhQUFBQyxXQUFBLG9EQUFBQyw0Q0FBQSw2RCIsInNvdXJjZXN' +
            'Db250ZW50IjpbIjw/cGhwICR0aGlzID0gXCJpcyBteSBzb3VyY2UgUEhQXCI7Il19' +
            '\n'
        );
    });

    it('should throw an exception when source map enabled but AST has no node bounds', function () {
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
                sourceMap: true
            };

        expect(function () {
            phpToJS.transpile(ast, options);
        }).to.throw('Source map enabled, but AST contains no node bounds');
    });
});
