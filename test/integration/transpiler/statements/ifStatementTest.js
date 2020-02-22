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
                    properties: [{
                        property: {
                            name: 'N_STRING',
                            string: 'myProp'
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
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'if (scope.getVariable("myObject").getValue().getInstancePropertyByName(tools.valueFactory.createBarewordString("myProp")).getValue().coerceToBoolean().getNative()) {}' +
            'return tools.valueFactory.createNull();' +
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
                                    properties: [{
                                        property: {
                                            name: 'N_STRING',
                                            string: 'myProp'
                                        }
                                    }]
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
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            '(tools.valueFactory.createBarewordString("myFunc").call([' +
            'tools.createClosure(function () {var scope = this;' +
            'if (scope.getVariable("myObject").getValue().getInstancePropertyByName(tools.valueFactory.createBarewordString("myProp")).getValue().coerceToBoolean().getNative()) {}' +
            '}, scope, namespaceScope)' +
            '], namespaceScope) || tools.valueFactory.createNull());' +
            'return tools.valueFactory.createNull();}'
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
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'if (tools.valueFactory.createBoolean(true).coerceToBoolean().getNative()) {' +
            '(tools.valueFactory.createBarewordString("firstFunc").call([], namespaceScope) || tools.valueFactory.createNull());' +
            '} else {' +
            '(tools.valueFactory.createBarewordString("secondFunc").call([], namespaceScope) || tools.valueFactory.createNull());' +
            '}' +
            'return tools.valueFactory.createNull();' +
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
            'function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'if (tools.valueFactory.createBoolean(' +
            'tools.valueFactory.createInteger(1).isIdenticalTo(' +
            'tools.valueFactory.createInteger(2)).coerceToBoolean().getNative() || (' +
            'tools.valueFactory.createBoolean(tools.valueFactory.createInteger(3).isIdenticalTo(' +
            'tools.valueFactory.createInteger(4)).coerceToBoolean().getNative() || (' +
            'tools.valueFactory.createInteger(5).isIdenticalTo(tools.valueFactory.createInteger(6)' +
            ').coerceToBoolean().getNative())).coerceToBoolean().getNative()' +
            ')' +
            ').coerceToBoolean().getNative()) {}' +
            'return tools.valueFactory.createNull();' +
            '}'
        );
    });
});
