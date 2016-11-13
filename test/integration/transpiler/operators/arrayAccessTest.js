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
    it('should correctly transpile a return statement with a single array index', function () {
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
                    indices: [{
                        index: {
                            name: 'N_INTEGER',
                            number: 21
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getVariable("myArray").getValue().getElementByKey(tools.valueFactory.createInteger(21)).getValue();' +
            'return tools.valueFactory.createNull();' +
            '});'
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
                        name: 'N_VARIABLE',
                        variable: 'myArray'
                    },
                    indices: [{
                        index: {
                            name: 'N_INTEGER',
                            number: 21
                        }
                    }, {
                        index: {
                            name: 'N_INTEGER',
                            number: 101
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'return scope.getVariable("myArray").getValue().getElementByKey(tools.valueFactory.createInteger(21)).getValue().getElementByKey(tools.valueFactory.createInteger(101)).getValue();' +
            'return tools.valueFactory.createNull();' +
            '});'
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
                        indices: [{
                            index: {
                                name: 'N_INTEGER',
                                number: '21'
                            }
                        }]
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

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'tools.implyArray(scope.getVariable("myArray")).getElementByKey(tools.valueFactory.createInteger(21)).setValue(tools.valueFactory.createInteger(5));' +
            'return tools.valueFactory.createNull();' +
            '});'
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
                            name: 'N_VARIABLE',
                            variable: 'myArray'
                        },
                        indices: [{
                            index: {
                                name: 'N_INTEGER',
                                number: '21'
                            }
                        }, {
                            index: {
                                name: 'N_INTEGER',
                                number: '24'
                            }
                        }]
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

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'tools.implyArray(tools.implyArray(scope.getVariable("myArray")).getElementByKey(tools.valueFactory.createInteger(21))).getElementByKey(tools.valueFactory.createInteger(24)).setValue(tools.valueFactory.createInteger(5));' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a push', function () {
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
                        indices: true
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

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'tools.implyArray(scope.getVariable("myArray")).getPushElement().setValue(tools.valueFactory.createInteger(21));' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });
});
