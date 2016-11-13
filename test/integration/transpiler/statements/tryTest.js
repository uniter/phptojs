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

describe('Transpiler try statement test', function () {
    it('should correctly transpile a try with only a finally clause', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRY_STATEMENT',
                body: {
                    name: 'N_COMPOUND_STATEMENT',
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
                },
                catches: [],
                finalizer: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'yourFunc'
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
            'try {' +
            '(tools.valueFactory.createBarewordString("myFunc").call([], namespaceScope) || tools.valueFactory.createNull());' +
            '} catch (e) {throw e;} finally {' +
            '(tools.valueFactory.createBarewordString("yourFunc").call([], namespaceScope) || tools.valueFactory.createNull());' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a try with two catches but no finally clause', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRY_STATEMENT',
                body: {
                    name: 'N_COMPOUND_STATEMENT',
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
                },
                catches: [{
                    type: {
                        name: 'N_STRING',
                        string: 'My\\Exception\\Type'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'ex1'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_FUNCTION_CALL',
                                func: {
                                    name: 'N_STRING',
                                    string: 'catchFunc1();'
                                },
                                args: []
                            }
                        }]
                    }
                }, {
                    type: {
                        name: 'N_STRING',
                        string: 'Another\\Exception\\Type'
                    },
                    variable: {
                        name: 'N_VARIABLE',
                        variable: 'ex2'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_FUNCTION_CALL',
                                func: {
                                    name: 'N_STRING',
                                    string: 'catchFunc1();'
                                },
                                args: []
                            }
                        }]
                    }
                }],
                finalizer: null
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'try {' +
            '(tools.valueFactory.createBarewordString("myFunc").call([], namespaceScope) || tools.valueFactory.createNull());' +
            '} catch (e) {' +
            'if (!tools.valueFactory.isValue(e)) {throw e;}' +
            'if (tools.valueFactory.createBarewordString("My\\\\Exception\\\\Type").isTheClassOfObject(e, namespaceScope).getNative()) {' +
            'scope.getVariable("ex1").setValue(e);' +
            '(tools.valueFactory.createBarewordString("catchFunc1();").call([], namespaceScope) || tools.valueFactory.createNull());' +
            '} else if (tools.valueFactory.createBarewordString("Another\\\\Exception\\\\Type").isTheClassOfObject(e, namespaceScope).getNative()) {' +
            'scope.getVariable("ex2").setValue(e);' +
            '(tools.valueFactory.createBarewordString("catchFunc1();").call([], namespaceScope) || tools.valueFactory.createNull());' +
            '} else { throw e; }' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
