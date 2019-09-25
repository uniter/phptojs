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
                label: 'my_goto_label'
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... continue...'
                }]
            }, {
                name: 'N_LABEL_STATEMENT',
                label: 'my_goto_label'
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
                label: 'my_goto_label'
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... continue...'
                }]
            }, {
                name: 'N_GOTO_STATEMENT', // Jump back to just before the "... continue ..." label indefinitely
                label: 'my_goto_label'
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
                label: 'my_goto_label'
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'I am in between...'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'my_goto_label'
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... I am also...'
                }]
            }, {
                name: 'N_LABEL_STATEMENT',
                label: 'my_goto_label'
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
                label: 'my_goto_label'
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'I am in between...'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'my_goto_label'
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: '... I am also...'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'my_goto_label'
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
                label: 'first_label'
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'second'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'second_label'
            }, {
                name: 'N_LABEL_STATEMENT',
                label: 'first_label'
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
                label: 'second_label'
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
                label: 'second_label'
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'second'
                }]
            }, {
                name: 'N_LABEL_STATEMENT',
                label: 'first_label'
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
                label: 'second_label'
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'fourth'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'first_label'
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
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }, {
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
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
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }, {
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
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
                label: 'my_unused_label'
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

    it('should throw a fatal error when attempting to jump forwards into a while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: 'my_label'
            }, {
                name: 'N_WHILE_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition'
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }]
                }
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed');
    });

    it('should throw a fatal error when attempting to jump backwards into a while loop', function () {
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
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }]
                }
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'my_label'
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed');
    });

    it('should throw a fatal error when attempting to jump forwards into a do..while loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: 'my_label'
            }, {
                name: 'N_DO_WHILE_STATEMENT',
                condition: {
                    name: 'N_VARIABLE',
                    variable: 'myCondition'
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }]
                }
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed');
    });

    it('should throw a fatal error when attempting to jump backwards into a do..while loop', function () {
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
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }]
                }
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'my_label'
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed');
    });

    it('should throw a fatal error when attempting to jump forwards into a for loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: 'my_label'
            }, {
                name: 'N_FOR_STATEMENT',
                initializer: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: []
                },
                condition: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: []
                },
                update: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: []
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }]
                }
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed');
    });

    it('should throw a fatal error when attempting to jump backwards into a for loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOR_STATEMENT',
                initializer: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: []
                },
                condition: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: []
                },
                update: {
                    name: 'N_COMMA_EXPRESSION',
                    expressions: []
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }]
                }
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'my_label'
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed');
    });

    it('should throw a fatal error when attempting to jump forwards into a foreach loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: 'my_label'
            }, {
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray'
                },
                value: {
                    name: 'N_REFERENCE',
                    operand: {
                        name: 'N_VARIABLE',
                        variable: 'item'
                    }
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }]
                }
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed');
    });

    it('should throw a fatal error when attempting to jump backwards into a foreach loop', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FOREACH_STATEMENT',
                array: {
                    name: 'N_VARIABLE',
                    variable: 'myArray'
                },
                value: {
                    name: 'N_REFERENCE',
                    operand: {
                        name: 'N_VARIABLE',
                        variable: 'item'
                    }
                },
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }]
                }
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'my_label'
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed');
    });

    it('should throw a fatal error when attempting to jump forwards into a switch statement', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_GOTO_STATEMENT',
                label: 'my_label'
            }, {
                name: 'N_SWITCH_STATEMENT',
                expression: {
                    name: 'N_EXPRESSION',
                    left: {
                        name: 'N_INTEGER',
                        number: 21
                    },
                    right: [{
                        operator: '+',
                        operand: {
                            name: 'N_INTEGER',
                            number: 6
                        }
                    }]
                },
                cases: [{
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 27
                    },
                    body: [{
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }, {
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }]
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed');
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
                        number: 21
                    },
                    right: [{
                        operator: '+',
                        operand: {
                            name: 'N_INTEGER',
                            number: 6
                        }
                    }]
                },
                cases: [{
                    name: 'N_CASE',
                    expression: {
                        name: 'N_INTEGER',
                        number: 27
                    },
                    body: [{
                        name: 'N_LABEL_STATEMENT',
                        label: 'my_label'
                    }, {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }, {
                        name: 'N_BREAK_STATEMENT',
                        levels: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'my_label'
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' into loop or switch statement is disallowed');
    });

    it('should throw a fatal error when the target label of the goto does not exist outside any function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'start'
                }]
            }, {
                name: 'N_GOTO_STATEMENT',
                label: 'my_undefined_label'
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' to undefined label \'my_undefined_label\'');
    });

    it('should throw a fatal error when the target label of the goto does not exist inside a function', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_FUNCTION_STATEMENT',
                func: {
                    name: 'N_STRING',
                    string: 'my_function'
                },
                args: [],
                body: {
                    name: 'N_COMPOUND_STATEMENT',
                    statements: [{
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'start'
                        }]
                    }, {
                        name: 'N_GOTO_STATEMENT',
                        label: 'my_undefined_label'
                    }]
                }
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, '\'goto\' to undefined label \'my_undefined_label\'');
    });

    it('should throw a fatal error when attempting to define a label twice', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_LABEL_STATEMENT',
                label: 'my_label'
            }, {
                name: 'N_ECHO_STATEMENT',
                expressions: [{
                    name: 'N_STRING_LITERAL',
                    string: 'Hello world'
                }]
            }, {
                name: 'N_LABEL_STATEMENT',
                label: 'my_label'
            }]
        };

        expect(function () {
            phpToJS.transpile(ast);
        }).to.throw(PHPFatalError, 'Label \'my_label\' already defined');
    });
});
