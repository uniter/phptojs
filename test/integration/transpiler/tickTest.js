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

describe('Transpiler tick feature test', function () {
    it('should correctly transpile a simple return statement with embedded newline and line numbers disabled in default (async) mode', function () {
        // Code: `<?php\nreturn \n4;`
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '4',
                        bounds: {
                            start: {
                                offset: 14,
                                line: 3,
                                column: 9
                            },
                            end: {
                                offset: 15,
                                line: 3,
                                column: 10
                            }
                        }
                    },
                    bounds: {
                        start: {
                            offset: 6,
                            line: 2,
                            column: 1
                        },
                        end: {
                            offset: 16,
                            line: 3,
                            column: 11
                        }
                    }
                }],
                bounds: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1
                    },
                    end: {
                        offset: 16,
                        line: 3,
                        column: 11
                    }
                }
            },
            options = {
                path: 'my_module.php',
                tick: true
            };

        expect(phpToJS.transpile(ast, options)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, tick = core.tick;' +
            'tick(2, 1, 3, 11);return createInteger(4);' +
            '});'
        );
    });

    it('should correctly transpile a simple return statement with embedded newline and line numbers enabled in default (async) mode', function () {
        // Code: `<?php\nreturn \n4;`
        var ast = {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '4',
                        bounds: {
                            start: {
                                offset: 14,
                                line: 3,
                                column: 9
                            },
                            end: {
                                offset: 15,
                                line: 3,
                                column: 10
                            }
                        }
                    },
                    bounds: {
                        start: {
                            offset: 6,
                            line: 2,
                            column: 1
                        },
                        end: {
                            offset: 16,
                            line: 3,
                            column: 11
                        }
                    }
                }],
                bounds: {
                    start: {
                        offset: 0,
                        line: 1,
                        column: 1
                    },
                    end: {
                        offset: 16,
                        line: 3,
                        column: 11
                    }
                }
            },
            options = {
                path: 'my_module.php',
                lineNumbers: true,
                tick: true
            };

        expect(phpToJS.transpile(ast, options)).to.equal(
            'require(\'phpruntime\').compile(function (core) {' +
            'var createInteger = core.createInteger, instrument = core.instrument, line, tick = core.tick;' +
            'instrument(function () {return line;});' +
            'line = 2;tick(2, 1, 3, 11);return (line = 3, createInteger(4));' +
            '});'
        );
    });

    it('should throw an exception when ticking is enabled but AST has no node bounds', function () {
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
                tick: true
            };

        expect(function () {
            phpToJS.transpile(ast, options);
        }).to.throw('Ticking enabled, but AST contains no node bounds');
    });
});
