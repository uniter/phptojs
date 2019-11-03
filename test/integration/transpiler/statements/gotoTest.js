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

describe('Transpiler "goto" statement test', function () {
    it('should correctly transpile a basic goto that just jumps forward by two lines', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'Let us begin...'
                }]
            }, {
                name: 'N_GOTO_STATEMENT', // Jump over the "... continue ..." echo
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... continue...'
                }]
            }, {
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... and let us finish'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var goingToLabel_my_goto_label = false;' +
            'break_my_goto_label: {' +
                'if (!goingToLabel_my_goto_label) {' +
                    'stdout.write(tools.valueFactory.createString("Let us begin...").coerceToString().getNative());' +
                '}' +
                'if (!goingToLabel_my_goto_label) {' +
                    'goingToLabel_my_goto_label = true; ' +
                    'break break_my_goto_label;' +
                '}' +
                'if (!goingToLabel_my_goto_label) {' +
                    'stdout.write(tools.valueFactory.createString("... continue...").coerceToString().getNative());' +
                '}' +
            '}' +
            'goingToLabel_my_goto_label = false;' +
            'stdout.write(tools.valueFactory.createString("... and let us finish").coerceToString().getNative());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a basic goto that just jumps backward by two lines', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'Let us begin...'
                }]
            }, {
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... continue...'
                }]
            }, {
                name: 'N_GOTO_STATEMENT', // Jump back to just before the "... continue ..." label indefinitely
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... and let us finish'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var goingToLabel_my_goto_label = false;' +
            'continue_my_goto_label: do {' +
                'if (!goingToLabel_my_goto_label) {' +
                    'stdout.write(tools.valueFactory.createString("Let us begin...").coerceToString().getNative());' +
                '}' +
                'goingToLabel_my_goto_label = false;' +
                'stdout.write(tools.valueFactory.createString("... continue...").coerceToString().getNative());' +
                'goingToLabel_my_goto_label = true; ' +
                'continue continue_my_goto_label;' +
                'stdout.write(tools.valueFactory.createString("... and let us finish").coerceToString().getNative());' +
            '} while (goingToLabel_my_goto_label);' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile two gotos at the root level that jump forward to the same label', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'I am in between...'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... I am also...'
                }]
            }, {
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... and we are done'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var goingToLabel_my_goto_label = false;' +
            'break_my_goto_label: {' +
                'if (!goingToLabel_my_goto_label) {' +
                    'goingToLabel_my_goto_label = true; ' +
                    'break break_my_goto_label;' +
                '}' +
                'if (!goingToLabel_my_goto_label) {' +
                    'stdout.write(tools.valueFactory.createString("I am in between...").coerceToString().getNative());' +
                '}' +
                'if (!goingToLabel_my_goto_label) {' +
                    'goingToLabel_my_goto_label = true; ' +
                    'break break_my_goto_label;' +
                '}' +
                'if (!goingToLabel_my_goto_label) {' +
                    'stdout.write(tools.valueFactory.createString("... I am also...").coerceToString().getNative());' +
                '}' +
            '}' +
            'goingToLabel_my_goto_label = false;' +
            'stdout.write(tools.valueFactory.createString("... and we are done").coerceToString().getNative());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile two gotos at the root level that jump backward to the same label', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'I am in between...'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... I am also...'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_goto_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... and we are done'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var goingToLabel_my_goto_label = false;' +
            'continue_my_goto_label: do {' +
                'goingToLabel_my_goto_label = false;' +
                'stdout.write(tools.valueFactory.createString("I am in between...").coerceToString().getNative());' +
                'goingToLabel_my_goto_label = true; ' +
                'continue continue_my_goto_label;' +
                'stdout.write(tools.valueFactory.createString("... I am also...").coerceToString().getNative());' +
                'goingToLabel_my_goto_label = true; ' +
                'continue continue_my_goto_label;' +
                'stdout.write(tools.valueFactory.createString("... and we are done").coerceToString().getNative());' +
            '} while (goingToLabel_my_goto_label);' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile two overlapping forward gotos', function () {
        /*
         * <?php
         *     echo 'first';
         *     goto first_label;
         *
         *     echo 'second';
         *     goto second_label;
         * first_label:
         *     echo 'third';
         *
         *     echo 'fourth';
         * second_label:
         *     echo 'fifth';
         */

        /*
         * Expected stdout: firstthirdfourthfifth
         */

        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'first'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'first_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'second'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'second_label'
                }
            }, {
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'first_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'third'
                }]
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'fourth'
                }]
            }, {
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'second_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'fifth'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
                'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
                'var goingToLabel_first_label = false, goingToLabel_second_label = false;' +
                'break_second_label: {' +
                    'break_first_label: {' +
                        'if (!goingToLabel_first_label && !goingToLabel_second_label) {' +
                            'stdout.write(tools.valueFactory.createString("first").coerceToString().getNative());' +
                        '}' +
                        'if (!goingToLabel_first_label && !goingToLabel_second_label) {' +
                            'goingToLabel_first_label = true; ' +
                            'break break_first_label;' +
                        '}' +
                        'if (!goingToLabel_first_label && !goingToLabel_second_label) {' +
                            'stdout.write(tools.valueFactory.createString("second").coerceToString().getNative());' +
                        '}' +
                        'if (!goingToLabel_first_label && !goingToLabel_second_label) {' +
                            'goingToLabel_second_label = true; ' +
                            'break break_second_label;' +
                        '}' +
                    '}' +
                    'if (!goingToLabel_second_label) {' +
                        'goingToLabel_first_label = false;' +
                    '}' +
                    'if (!goingToLabel_second_label) {' +
                        'stdout.write(tools.valueFactory.createString("third").coerceToString().getNative());' +
                    '}' +
                    'if (!goingToLabel_second_label) {' +
                        'stdout.write(tools.valueFactory.createString("fourth").coerceToString().getNative());' +
                    '}' +
                '}' +
                'goingToLabel_second_label = false;' +
                'stdout.write(tools.valueFactory.createString("fifth").coerceToString().getNative());' +
                'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile two overlapping forward and backward gotos', function () {
        /*
         * <?php
         *     echo 'first';
         *     goto second_label;
         *
         *     echo 'second';
         * first_label:
         *     echo 'third';
         *     return; // Stop so we don't infinitely loop
         * second_label:
         *
         *     echo 'fourth';
         *
         *     goto first_label;
         *     echo 'fifth';
         */

        /*
         * Expected stdout: firstfourththird
         */

        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'first'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'second_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'second'
                }]
            }, {
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'first_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'third'
                }]
            }, {
                name: 'N_RETURN_STATEMENT',
                expression: {
                    name: 'N_NULL'
                }
            }, {
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'second_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'fourth'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'first_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'fifth'
                }]
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
                'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
                'var goingToLabel_second_label = false, goingToLabel_first_label = false;' +
                'continue_first_label: do {' +
                    'break_second_label: {' +
                        'if (!goingToLabel_first_label && !goingToLabel_second_label) {' +
                            'stdout.write(tools.valueFactory.createString("first").coerceToString().getNative());' +
                        '}' +
                        'if (!goingToLabel_first_label && !goingToLabel_second_label) {' +
                            'goingToLabel_second_label = true; ' +
                            'break break_second_label;' +
                        '}' +
                        'if (!goingToLabel_first_label && !goingToLabel_second_label) {' +
                            'stdout.write(tools.valueFactory.createString("second").coerceToString().getNative());' +
                        '}' +
                        'if (!goingToLabel_second_label) {' +
                            'goingToLabel_first_label = false;' +
                        '}' +
                        'if (!goingToLabel_second_label) {' +
                            'stdout.write(tools.valueFactory.createString("third").coerceToString().getNative());' +
                        '}' +
                        'if (!goingToLabel_second_label) {' +
                            'return tools.valueFactory.createNull();' +
                        '}' +
                    '}' +
                    'goingToLabel_second_label = false;' +
                    'stdout.write(tools.valueFactory.createString("fourth").coerceToString().getNative());' +
                    'goingToLabel_first_label = true; ' +
                    'continue continue_first_label;' +
                    'stdout.write(tools.valueFactory.createString("fifth").coerceToString().getNative());' +
                '} while (goingToLabel_first_label);' +
                'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a jump within a while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition'
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_GOTO_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label'
                        }
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }, {
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var goingToLabel_my_label = false;' +
            'block_1: while (scope.getVariable("myCondition").getValue().coerceToBoolean().getNative()) {' +
                'break_my_label: {' +
                    'if (!goingToLabel_my_label) {' +
                        'goingToLabel_my_label = true; ' +
                        'break break_my_label;' +
                    '}' +
                    'if (!goingToLabel_my_label) {' +
                        'stdout.write(tools.valueFactory.createInteger(4).coerceToString().getNative());' +
                    '}' +
                '}' +
                'goingToLabel_my_label = false;' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a jump within a do..while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DO_WHILE_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition'
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_GOTO_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label'
                        }
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }, {
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var goingToLabel_my_label = false;' +
            'block_1: do {' +
                'break_my_label: {' +
                    'if (!goingToLabel_my_label) {' +
                        'goingToLabel_my_label = true; ' +
                        'break break_my_label;' +
                    '}' +
                    'if (!goingToLabel_my_label) {' +
                        'stdout.write(tools.valueFactory.createInteger(4).coerceToString().getNative());' +
                    '}' +
                '}' +
                'goingToLabel_my_label = false;' +
            '} while (scope.getVariable("myCondition").getValue().coerceToBoolean().getNative());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile an unused label', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'first'
                }]
            }, {
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_unused_label'
                }
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'second'
                }]
            }]
        };

        // TODO: Improve this - unused labels _could_ just be completely removed.
        //       Perhaps one to solve with a compiler pass once we have an IR stage?
        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var goingToLabel_my_unused_label = false;' +
            'if (!goingToLabel_my_unused_label) {' +
                'stdout.write(tools.valueFactory.createString("first").coerceToString().getNative());' +
            '}' +
            'goingToLabel_my_unused_label = false;' +
            'stdout.write(tools.valueFactory.createString("second").coerceToString().getNative());' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a jump into an if statement consequent clause', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'first'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label'
                }
            }, {
                name: 'N_IF_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition'
                },
                consequentStatement: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'second'
                        }]
                    }, {
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var goingToLabel_my_label = false;' +
            'break_my_label: {' +
                'if (!goingToLabel_my_label) {' +
                    'stdout.write(tools.valueFactory.createString("first").coerceToString().getNative());' +
                '}' +
                'if (!goingToLabel_my_label) {' +
                    'goingToLabel_my_label = true; ' +
                    'break break_my_label;' +
                '}' +
            '}' +
            // The if statement's condition must allow execution to pass if we need to jump to a label
            // that is inside its consequent clause's body
            'if (goingToLabel_my_label || (scope.getVariable("myCondition").getValue().coerceToBoolean().getNative())) {' +
                'if (!goingToLabel_my_label) {' +
                    'stdout.write(tools.valueFactory.createString("second").coerceToString().getNative());' +
                '}' +
                'goingToLabel_my_label = false;' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a jump into an if statement alternate clause', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'first'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label'
                }
            }, {
                name: 'N_IF_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition'
                },
                consequentStatement: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'second'
                        }]
                    }]
                },
                alternateStatement: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'third'
                        }]
                    }, {
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var goingToLabel_my_label = false;' +
            'break_my_label: {' +
                'if (!goingToLabel_my_label) {' +
                    'stdout.write(tools.valueFactory.createString("first").coerceToString().getNative());' +
                '}' +
                'if (!goingToLabel_my_label) {' +
                    'goingToLabel_my_label = true; ' +
                    'break break_my_label;' +
                '}' +
            '}' +
            // The if statement's condition must _not_ allow execution to pass if we need to jump to a label
            // that is inside its alternate clause's body
            'if (scope.getVariable("myCondition").getValue().coerceToBoolean().getNative()) {' +
                'stdout.write(tools.valueFactory.createString("second").coerceToString().getNative());' +
            '} else {' +
                'if (!goingToLabel_my_label) {' +
                    'stdout.write(tools.valueFactory.createString("third").coerceToString().getNative());' +
                '}' +
                'goingToLabel_my_label = false;' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a jump into an if statement consequent clause when there is also a backward jump inside', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'first'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label'
                }
            }, {
                name: 'N_IF_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition'
                },
                consequentStatement: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label'
                        }
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'second'
                        }]
                    }, {
                        name: 'N_GOTO_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label'
                        }
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'var goingToLabel_my_label = false;' +
            'break_my_label: {' +
                'if (!goingToLabel_my_label) {' +
                    'stdout.write(tools.valueFactory.createString("first").coerceToString().getNative());' +
                '}' +
                'if (!goingToLabel_my_label) {' +
                    'goingToLabel_my_label = true; ' +
                    'break break_my_label;' +
                '}' +
            '}' +
            // The if statement's condition must allow execution to pass if we need to jump to a label
            // that is inside its consequent clause's body
            'if (goingToLabel_my_label || (scope.getVariable("myCondition").getValue().coerceToBoolean().getNative())) {' +
                'continue_my_label: do {' +
                    'goingToLabel_my_label = false;' +
                    'stdout.write(tools.valueFactory.createString("second").coerceToString().getNative());' +
                    'goingToLabel_my_label = true; ' +
                    'continue continue_my_label;' +
                '} while (goingToLabel_my_label);' +
            '}' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should correctly transpile a goto to a label inside a function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'myFunc'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_GOTO_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label'
                        }
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'first'
                        }]
                    }, {
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label'
                        }
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'second'
                        }]
                    }]
                }
            }]
        };

        expect(phpToJS.transpile(ast)).to.equal(
            'require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;' +
            'namespace.defineFunction("myFunc", function _myFunc() {' +
                'var scope = this;' +
                'var goingToLabel_my_label = false;' +
                'break_my_label: {' +
                    'if (!goingToLabel_my_label) {' +
                        'goingToLabel_my_label = true; ' +
                        'break break_my_label;' +
                    '}' +
                    'if (!goingToLabel_my_label) {' +
                        'stdout.write(tools.valueFactory.createString("first").coerceToString().getNative());' +
                    '}' +
                '}' +
                'goingToLabel_my_label = false;' +
                'stdout.write(tools.valueFactory.createString("second").coerceToString().getNative());' +
            '}, namespaceScope);' +
            'return tools.valueFactory.createNull();' +
            '});'
        );
    });

    it('should throw a fatal error when attempting to jump forwards into a while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 8, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition',
                    bounds: {start: {line: 1, column: 1}}
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'my_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed in my_module.php on line 8');
    });

    it('should throw a fatal error when attempting to jump backwards into a while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition',
                    bounds: {start: {line: 1, column: 1}}
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 6, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'my_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed in my_module.php on line 6');
    });

    it('should throw a fatal error when attempting to jump forwards into a do..while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 7, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_DO_WHILE_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition',
                    bounds: {start: {line: 1, column: 1}}
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'your_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed in your_module.php on line 7');
    });

    it('should throw a fatal error when attempting to jump backwards into a do..while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_DO_WHILE_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition',
                    bounds: {start: {line: 1, column: 1}}
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 4, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'my_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed in my_module.php on line 4');
    });

    it('should throw a fatal error when attempting to jump forwards into a for loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 12, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_FOR_STATEMENT',
                initializer: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [],
                    bounds: {start: {line: 1, column: 1}}
                },
                condition: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [],
                    bounds: {start: {line: 1, column: 1}}
                },
                update: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [],
                    bounds: {start: {line: 1, column: 1}}
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'their_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed in their_module.php on line 12');
    });

    it('should throw a fatal error when attempting to jump backwards into a for loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOR_STATEMENT',
                initializer: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [],
                    bounds: {start: {line: 1, column: 1}}
                },
                condition: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [],
                    bounds: {start: {line: 1, column: 1}}
                },
                update: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: [],
                    bounds: {start: {line: 1, column: 1}}
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 3, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'my_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed in my_module.php on line 3');
    });

    it('should throw a fatal error when attempting to jump forwards into a foreach loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 7, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray',
                    bounds: {start: {line: 1, column: 1}}
                },
                value: {
                    name: 'N_REFERENCE',
                    operand: {
                        name: 'N_VARIABLE',
                        variable: 'item',
                        bounds: {start: {line: 1, column: 1}}
                    },
                    bounds: {start: {line: 1, column: 1}}
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'your_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed in your_module.php on line 7');
    });

    it('should throw a fatal error when attempting to jump backwards into a foreach loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray',
                    bounds: {start: {line: 1, column: 1}}
                },
                value: {
                    name: 'N_REFERENCE',
                    operand: {
                        name: 'N_VARIABLE',
                        variable: 'item',
                        bounds: {start: {line: 1, column: 1}}
                    },
                    bounds: {start: {line: 1, column: 1}}
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 7, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'your_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed in your_module.php on line 7');
    });

    it('should throw a fatal error when attempting to jump forwards into a switch statement', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 6, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_SWITCH_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 21,
                        bounds: {start: {line: 1, column: 1}}
                    },
                    right: [{
                        operator: '+',
                        operand: {
                            name: 'N_INTEGER',
                            number: 6,
                            bounds: {start: {line: 1, column: 1}}
                        }
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                cases: [{
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 27,
                        bounds: {start: {line: 1, column: 1}}
                    },
                    body: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                }],
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'my_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed in my_module.php on line 6');
    });

    it('should throw a fatal error when attempting to jump backwards into a switch statement', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_SWITCH_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 21,
                        bounds: {start: {line: 1, column: 1}}
                    },
                    right: [{
                        operator: '+',
                        operand: {
                            name: 'N_INTEGER',
                            number: 6,
                            bounds: {start: {line: 1, column: 1}}
                        }
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                cases: [{
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 27,
                        bounds: {start: {line: 1, column: 1}}
                    },
                    body: [{
                        name: 'N_LABEL_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_label',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1',
                            bounds: {start: {line: 1, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                }],
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 8, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'the_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed in the_module.php on line 8');
    });

    it('should throw a fatal error when the target label of the goto does not exist outside any function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'start',
                    bounds: {start: {line: 1, column: 1}}
                }],
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_GOTO_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_undefined_label',
                    bounds: {start: {line: 7, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'your_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' to undefined label \'my_undefined_label\' in your_module.php on line 7');
    });

    it('should throw a fatal error when the target label of the goto does not exist inside a function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'my_function',
                    bounds: {start: {line: 1, column: 1}}
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'start',
                            bounds: {start: {line: 1, column: 1}}
                        }],
                        bounds: {start: {line: 1, column: 1}}
                    }, {
                        name: 'N_GOTO_STATEMENT',
                        label: {
                            name: 'N_STRING',
                            string: 'my_undefined_label',
                            bounds: {start: {line: 4, column: 1}}
                        },
                        bounds: {start: {line: 1, column: 1}}
                    }],
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        expect(function () {
            phpToJS.transpile(ast, {path: 'my_module.php'});
        }).to.throw(PHPFatalError, '\'goto\' to undefined label \'my_undefined_label\' in my_module.php on line 4');
    });

    it('should throw a fatal error when attempting to define a label twice', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 1, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'Hello world',
                    bounds: {start: {line: 1, column: 1}}
                }],
                bounds: {start: {line: 1, column: 1}}
            }, {
                name: 'N_LABEL_STATEMENT',
                label: {
                    name: 'N_STRING',
                    string: 'my_label',
                    bounds: {start: {line: 9, column: 1}}
                },
                bounds: {start: {line: 1, column: 1}}
            }],
            bounds: {start: {line: 1, column: 1}}
        };

        // NB: The line number quoted should be that of the second label found, not the first
        expect(function () {
            phpToJS.transpile(ast, {path: '/path/to/their_module.php'});
        }).to.throw(PHPFatalError, 'Label \'my_label\' already defined in /path/to/their_module.php on line 9');
    });
});
