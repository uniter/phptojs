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
    phpCommon = require('phpcommon'),
    phpToJS = require('../../../..'),
    PHPFatalError = phpCommon.PHPFatalError;

describe('Transpiler function statement test', function () {
    it('should correctly transpile an empty function in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'gogo'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: []
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineFunction = core.defineFunction;' +
            'defineFunction("gogo", function _gogo() {});' +
            '});'
        );
    });

    it('should correctly transpile a function returning a number in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'gogo'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_RETURN_STATEMENT',
                        expression: {
                            name: 'N_INTEGER',
                            number: 1234
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, defineFunction = core.defineFunction;' +
            'defineFunction("gogo", function _gogo() {return createInteger(1234);});' +
            '});'
        );
    });

    it('should correctly transpile a function with four by-reference parameters in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'gogo'
                },
                args: [{
                    name: 'N_ARGUMENT',
                    type: {
                        name: 'N_ARRAY_TYPE'
                    },
                    variable: {
                        name: 'N_REFERENCE',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'myByRefArrayArg'
                        }
                    }
                }, {
                    name: 'N_ARGUMENT',
                    type: {
                        name: 'N_CALLABLE_TYPE'
                    },
                    variable: {
                        name: 'N_REFERENCE',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'myByRefCallableArg'
                        }
                    }
                }, {
                    name: 'N_ARGUMENT',
                    type: {
                        name: 'N_CLASS_TYPE',
                        className: 'My\\NS\\MyClass'
                    },
                    variable: {
                        name: 'N_REFERENCE',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'myByRefClassArg'
                        }
                    }
                }, {
                    name: 'N_ARGUMENT',
                    type: {
                        name: 'N_ITERABLE_TYPE'
                    },
                    variable: {
                        name: 'N_REFERENCE',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'myByRefIterableArg'
                        }
                    }
                }],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: []
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var defineFunction = core.defineFunction;' +
            'defineFunction("gogo", function _gogo() {' +
            '}, [' +
            '{"type":"array","name":"myByRefArrayArg","ref":true},' +
            '{"type":"callable","name":"myByRefCallableArg","ref":true},' +
            '{"type":"class","className":"My\\\\NS\\\\MyClass","name":"myByRefClassArg","ref":true},' +
            '{"type":"iterable","name":"myByRefIterableArg","ref":true}' +
            ']);' +
            '});'
        );
    });

    it('should allow defining __autoload with no arguments if it is inside a namespace', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_NAMESPACE_STATEMENT',
                namespace: 'This\\Is\\My\\Space',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: '__autoload'
                    },
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_RETURN_STATEMENT',
                            expression: {
                                name: 'N_INTEGER',
                                number: 1234
                            }
                        }]
                    }
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, defineFunction = core.defineFunction, useDescendantNamespaceScope = core.useDescendantNamespaceScope;' +
            'useDescendantNamespaceScope("This\\\\Is\\\\My\\\\Space");' +
            'defineFunction("__autoload", ' +
            'function ___autoload() {' +
            'return createInteger(1234);' +
            '});' +
            '});'
        );
    });

    it('should raise a fatal error on attempting to define __autoload with no arguments', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: '__autoload',
                    bounds: {start: {line: 1, column: 1}}
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_RETURN_STATEMENT',
                        expression: {
                            name: 'N_INTEGER',
                            number: 1234,
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                // Line reported should be that of the function statement itself
                bounds: {start: {line: 7, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'my_module.php'});
        }.bind(this)).to.throw(
            PHPFatalError,
            'PHP Fatal error: __autoload() must take exactly 1 argument in my_module.php on line 7'
        );
    });

    it('should raise a fatal error on attempting to define __autoload with mixed case and no arguments', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: '__AUTolOad',
                    bounds: {start: {line: 1, column: 1}}
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_RETURN_STATEMENT',
                        expression: {
                            name: 'N_INTEGER',
                            number: 1234,
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                // Line reported should be that of the function statement itself
                bounds: {start: {line: 7, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'my_module.php'});
        }.bind(this)).to.throw(
            PHPFatalError,
            'PHP Fatal error: __autoload() must take exactly 1 argument in my_module.php on line 7'
        );
    });

    it('should raise a fatal error on attempting to define __autoload with two arguments', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: '__autoload',
                    bounds: {start: {line: 1, column: 1}}
                },
                args: [{
                    name: 'N_ARGUMENT',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'arg1'
                    }
                }, {
                    name: 'N_ARGUMENT',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'arg2'
                    }
                }],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_RETURN_STATEMENT',
                        expression: {
                            name: 'N_INTEGER',
                            number: 1234,
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                // Line reported should be that of the function statement itself
                bounds: {start: {line: 9, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'my_module.php'});
        }.bind(this)).to.throw(
            PHPFatalError,
            'PHP Fatal error: __autoload() must take exactly 1 argument in my_module.php on line 9'
        );
    });
});
