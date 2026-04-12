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
    phpToJS = require('../../../../../..');

describe('Transpiler trait statement with abstract method definitions test', function () {
    it('should correctly transpile a trait with abstract instance method definition with one parameter', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRAIT_STATEMENT',
                traitName: 'MyTrait',
                members: [{
                    name: 'N_ABSTRACT_METHOD_DEFINITION',
                    visibility: 'public',
                    func: {
                        name: 'N_STRING',
                        string: 'myAbstractMethod'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myArg'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineTrait = core.defineTrait;' +
            'defineTrait("MyTrait", {' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {"myAbstractMethod": {' +
            'isStatic: false, abstract: true, args: [{"type":"array","name":"myArg"}]' +
            '}}, ' +
            'constants: {}});' +
            '}'
        );
    });

    it('should correctly transpile a trait with abstract instance method definition with two parameters', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRAIT_STATEMENT',
                traitName: 'MyTrait',
                members: [{
                    name: 'N_ABSTRACT_METHOD_DEFINITION',
                    visibility: 'public',
                    func: {
                        name: 'N_STRING',
                        string: 'myAbstractMethod'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myFirstArg'
                        }
                    }, {
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_CALLABLE_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'mySecondArg'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineTrait = core.defineTrait;' +
            'defineTrait("MyTrait", {' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {"myAbstractMethod": {' +
            'isStatic: false, abstract: true, args: [{"type":"array","name":"myFirstArg"},{"type":"callable","name":"mySecondArg"}]' +
            '}}, ' +
            'constants: {}});' +
            '}'
        );
    });

    it('should correctly transpile a trait with abstract instance method definition with no parameters', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRAIT_STATEMENT',
                traitName: 'MyTrait',
                members: [{
                    name: 'N_ABSTRACT_METHOD_DEFINITION',
                    visibility: 'public',
                    func: {
                        name: 'N_STRING',
                        string: 'myAbstractMethod'
                    },
                    args: []
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineTrait = core.defineTrait;' +
            'defineTrait("MyTrait", {' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {"myAbstractMethod": {' +
            'isStatic: false, abstract: true' +
            '}}, ' +
            'constants: {}});' +
            '}'
        );
    });

    it('should correctly transpile a trait with abstract instance method definition with all extra operand arguments', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRAIT_STATEMENT',
                traitName: 'MyTrait',
                members: [{
                    name: 'N_ABSTRACT_METHOD_DEFINITION',
                    visibility: 'public',
                    func: {
                        name: 'N_STRING',
                        string: 'myAbstractMethod',
                        bounds: {
                            start: {
                                line: 4
                            }
                        }
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE',
                            bounds: {
                                start: {
                                    line: 4
                                }
                            }
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myArg',
                            bounds: {
                                start: {
                                    line: 4
                                }
                            }
                        }
                    }],
                    returnByReference: true,
                    returnType: {
                        name: 'N_ARRAY_TYPE',
                        bounds: {
                            start: {
                                line: 4
                            }
                        }
                    },
                    bounds: {
                        start: {
                            line: 123
                        }
                    }
                }],
                bounds: {
                    start: {
                        line: 1
                    }
                }
            }],
            bounds: {
                start: {
                    line: 1
                }
            }
        };

        expect(phpToJS.transpile(ast, {bare: true, lineNumbers: true})).to.equal(
            'function (core) {' +
            'var defineTrait = core.defineTrait, instrument = core.instrument, line;' +
            'instrument(function () {return line;});line = 1;' +
            'defineTrait("MyTrait", {' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {"myAbstractMethod": {' +
            'isStatic: false, abstract: true, args: [{"type":"array","name":"myArg"}], ' +
            'ret: {"type":"array"}, line: 123, ref: true}}, ' +
            'constants: {}});' +
            '}'
        );
    });

    it('should correctly transpile a trait with abstract static method definition with one parameter', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRAIT_STATEMENT',
                traitName: 'MyTrait',
                members: [{
                    name: 'N_ABSTRACT_STATIC_METHOD_DEFINITION',
                    visibility: 'protected',
                    method: {
                        name: 'N_STRING',
                        string: 'myAbstractStaticMethod'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myArg'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineTrait = core.defineTrait;' +
            'defineTrait("MyTrait", {' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {"myAbstractStaticMethod": {' +
            'isStatic: true, abstract: true, args: [{"type":"array","name":"myArg"}]' +
            '}}, ' +
            'constants: {}});' +
            '}'
        );
    });

    it('should correctly transpile a trait with abstract static method definition with two parameters', function () {
        var ast = {
            name: 'N_PROGRAM',
            statements: [{
                name: 'N_TRAIT_STATEMENT',
                traitName: 'MyTrait',
                members: [{
                    name: 'N_ABSTRACT_STATIC_METHOD_DEFINITION',
                    visibility: 'protected',
                    method: {
                        name: 'N_STRING',
                        string: 'myAbstractStaticMethod'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myFirstArg'
                        }
                    }, {
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'mySecondArg'
                        }
                    }]
                }]
            }]
        };

        expect(phpToJS.transpile(ast, {bare: true})).to.equal(
            'function (core) {' +
            'var defineTrait = core.defineTrait;' +
            'defineTrait("MyTrait", {' +
            'staticProperties: {}, ' +
            'properties: {}, ' +
            'methods: {"myAbstractStaticMethod": {' +
            'isStatic: true, abstract: true, args: [{"type":"array","name":"myFirstArg"},{"type":"array","name":"mySecondArg"}]' +
            '}}, ' +
            'constants: {}});' +
            '}'
        );
    });
});
