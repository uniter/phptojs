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

describe('Transpiler interface statement test', function () {
    it('should correctly transpile an interface in default (async) mode', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'Thing',
                extend: [
                    'First\\SuperClass',
                    'Second\\SuperClass'
                ],
                members: [{
                    name: 'N_CONSTANT_DEFINITION',
                    constants: [{
                        constant: 'SHAPE_ONE',
                        value: {
                            name: 'N_STRING_LITERAL',
                            string: 'sphere'
                        }
                    }, {
                        // Also test one statement with two declarations (would be comma-separated)
                        constant: 'SHAPE_TWO',
                        value: {
                            name: 'N_STRING_LITERAL',
                            string: 'circle'
                        }
                    }]
                }, {
                    name: 'N_STATIC_INTERFACE_METHOD_DEFINITION',
                    method: {
                        name: 'N_STRING',
                        string: 'doSomething'
                    },
                    visibility: 'public',
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'someQueryArgs'
                        }
                    }]
                }, {
                    name: 'N_INTERFACE_METHOD_DEFINITION',
                    func: {
                        name: 'N_STRING',
                        string: 'doSomethingElse'
                    },
                    visibility: 'public',
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myBodyArgs'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(function () {' +
            'var currentClass = namespace.defineClass("Thing", {' +
            'superClass: null, ' +
            'interfaces: ["First\\\\SuperClass","Second\\\\SuperClass"], ' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {' +
            '"doSomething": {isStatic: true, abstract: true}, ' +
            '"doSomethingElse": {isStatic: false, abstract: true}' +
            '}, ' +
            'constants: {' +
            '"SHAPE_ONE": function () { return tools.valueFactory.createString("sphere"); }, ' +
            '"SHAPE_TWO": function () { return tools.valueFactory.createString("circle"); }' +
            '}' +
            '}, namespaceScope);' +
            '}());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should throw a compile time fatal error when attempting to define an instance property inside an interface', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'Thing',
                extend: [
                    'A\\SuperClass'
                ],
                members: [{
                    name: 'N_INSTANCE_PROPERTY_DEFINITION',
                    visibility: 'private',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'myInvalidProp',
                        bounds: {start: {line: 8, column: 1}}
                    },
                    bounds: {start: {line: 1, column: 1}}
                }],
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: '/path/to/your_module.php'});
        }).to.throw(PHPFatalError, 'Interfaces may not include member variables in /path/to/your_module.php on line 8');
    });

    it('should throw a compile time fatal error when attempting to define a static property inside an interface', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'Thing',
                extend: [
                    'A\\SuperClass'
                ],
                members: [{
                    name: 'N_STATIC_PROPERTY_DEFINITION',
                    visibility: 'private',
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'firstProp',
                        bounds: {start: {line: 7, column: 1}}
                    },
                    bounds: {start: {line: 1, column: 1}}
                }],
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: '/path/to/the_module.php'});
        }).to.throw(PHPFatalError, 'Interfaces may not include member variables in /path/to/the_module.php on line 7');
    });

    it('should throw a compile time fatal error when attempting to define an instance method body inside an interface', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'Thing',
                extend: [
                    'A\\SuperClass'
                ],
                members: [{
                    name: 'N_METHOD_DEFINITION',
                    visibility: 'public',
                    func: {
                        name: 'N_STRING',
                        string: 'myMethod',
                        bounds: {start: {line: 1, column: 1}}
                    },
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_RETURN_STATEMENT',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    },
                    bounds: {start: {line: 7, column: 1}}
                }],
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: '/path/to/module.php'});
        }).to.throw(
            PHPFatalError,
            'Fatal error: Interface function Thing::myMethod() cannot contain body in /path/to/module.php on line 7'
        );
    });

    it('should throw a compile time fatal error when attempting to define a static method body inside an interface', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_INTERFACE_STATEMENT',
                interfaceName: 'Thing',
                extend: [
                    'A\\SuperClass'
                ],
                members: [{
                    name: 'N_STATIC_METHOD_DEFINITION',
                    method: {
                        name: 'N_STRING',
                        string: 'myMethod',
                        bounds: {start: {line: 1, column: 1}}
                    },
                    modifier: 'final',
                    visibility: 'protected',
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [],
                        bounds: {start: {line: 1, column: 1}}
                    },
                    bounds: {start: {line: 9, column: 1}}
                }],
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: '/path/to/module.php'});
        }).to.throw(
            PHPFatalError,
            'Fatal error: Interface function Thing::myMethod() cannot contain body in /path/to/module.php on line 9'
        );
    });
});
