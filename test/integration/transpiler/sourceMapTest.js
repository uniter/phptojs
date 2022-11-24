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
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger;' +
            'return createInteger(4);' +
            '});' +
            '\n\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm' +
            '15X21vZHVsZS5waHAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6InNGQU9TLE9BQVUsZ0JBQVYsQyIsInNvdXJjZX' +
            'NDb250ZW50IjpbIjw/cGhwICR0aGlzID0gXCJpcyBteSBzb3VyY2UgUEhQXCI7Il19' +
            '\n'
        );
    });

    it('should correctly transpile a simple return statement in default (async) mode with returnMap option', function () {
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
            code: 'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger;' +
            'return createInteger(4);' +
            '});',
            map: {
                mappings: 'sFAOS,OAAU,gBAAV,C',
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
            'require(\'phpruntime\').compile(function (core) {' +
            'var createClosure = core.createClosure, createDebugVar = core.createDebugVar, defineClass = core.defineClass, defineFunction = core.defineFunction, getValueBinding = core.getValueBinding, getVariable = core.getVariable, setValue = core.setValue;' +
            // Debug variable will be inserted for better debugging in Chrome dev tools
            'var $myGlobalCodeVar = createDebugVar("myGlobalCodeVar");' +
            'defineFunction("myFunc", function _myFunc() {' +
            'var $this = createDebugVar("this");' +
            'var $myFunctionVar = createDebugVar("myFunctionVar");' +
            'return getVariable("myFunctionVar");' +
            '});' +
            'defineClass("MyClass", {' +
            'superClass: null, interfaces: [], staticProperties: {}, properties: {}, methods: {' +
            '"myMethod": {' +
            'isStatic: false, method: function _myMethod() {' +
            'var $this = createDebugVar("this");' +
            'var $myMethodVar = createDebugVar("myMethodVar");' +
            'return getVariable("myMethodVar");' +
            '}' +
            '}}, constants: {}});' +
            'return getVariable("myGlobalCodeVar");' +
            'return createClosure(function () {' +
            'var $myArgVar = createDebugVar("myArgVar");' +
            'var $this = createDebugVar("this");' +
            'var $myClosureVar = createDebugVar("myClosureVar");' +
            'setValue(getVariable("myBoundVar"))(getValueBinding("myBoundVar"));' +
            'var $myBoundVar = createDebugVar("myBoundVar");' +
            'return getVariable("myClosureVar");' +
            '}, [' +
            '{"name":"myArgVar"}' +
            '], [{"name":"myBoundVar"}]);' +
            '});' +
            '\n\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1' +
            '5X21vZHVsZS5waHAiXSwibmFtZXMiOlsiTl9TVFJJTkciLCIkbXlGdW5jdGlvblZhciIsIiRteU1ldGhvZFZhciIs' +
            'IiRteUdsb2JhbENvZGVWYXIiLCIkbXlCb3VuZFZhciIsIiRteUNsb3N1cmVWYXIiXSwibWFwcGluZ3MiOiI2VkFFS' +
            'yxrQ0FBQUEsT0FBQSw0RkFLSSxPQUFVQyw0QkFBVixDQUxKLEdBREksc0hBU0ksbUNBTE5ELFNBS00sd0ZBSE0sT0' +
            'FBQUUsMEJBQUEsQ0FHTixFQVRKLG1CQU1BLE9BQVVDLDhCQUFWLENBQVUsME9BQUFDLFdBQUEsdUNBQUFDLDJCQUF' +
            'BLG9EIiwic291cmNlc0NvbnRlbnQiOlsiPD9waHAgJHRoaXMgPSBcImlzIG15IHNvdXJjZSBQSFBcIjsiXX0=' +
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
