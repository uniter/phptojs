/*
 * PHPToJS - PHP-to-JavaScript transpiler
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phptojs
 *
 * Released under the MIT license
 * https://github.com/uniter/phptojs/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    BARE = 'bare',
    MODE = 'mode',
    PATH = 'path',
    PREFIX = 'prefix',
    RETURN_SOURCE_MAP = 'returnMap',
    RUNTIME_PATH = 'runtimePath',
    SOURCE_CONTENT = 'sourceContent',
    SOURCE_MAP = 'sourceMap',
    SUFFIX = 'suffix',
    SYNC = 'sync',
    TRANSLATOR = 'translator',

    BREAK_OR_CONTINUE_IN_WRONG_CONTEXT = 'core.break_or_continue_in_wrong_context',
    BREAK_OR_CONTINUE_NON_INTEGER_OPERAND = 'core.break_or_continue_non_integer_operand',
    CANNOT_BREAK_OR_CONTINUE = 'core.cannot_break_or_continue',
    EXPECT_EXACTLY_ONE_ARG = 'core.expect_exactly_one_arg',
    GOTO_DISALLOWED = 'core.goto_disallowed',
    GOTO_TO_UNDEFINED_LABEL = 'core.goto_to_undefined_label',
    INTERFACE_METHOD_BODY_NOT_ALLOWED = 'core.interface_method_body_not_allowed',
    INTERFACE_PROPERTY_NOT_ALLOWED = 'core.interface_property_not_allowed',
    LABEL_ALREADY_DEFINED = 'core.label_already_defined',
    OPERATOR_REQUIRES_POSITIVE_INTEGER = 'core.operator_requires_positive_integer',

    binaryOperatorToMethod = {
        '+': 'add',
        '-': 'subtract',
        '*': 'multiply',
        '/': 'divide',
        '.': 'concat',
        '%': 'modulo',
        '&': 'bitwiseAnd',
        '|': 'bitwiseOr',
        '^': 'bitwiseXor',
        '<<': 'shiftLeftBy',
        '>>': 'shiftRightBy',
        '+=': 'incrementBy',
        '-=': 'decrementBy',
        '*=': 'multiplyBy',
        '/=': 'divideBy',
        '.=': 'concatWith',
        '%=': 'moduloWith',
        '&=': 'bitwiseAndWith',
        '|=': 'bitwiseOrWith',
        '^=': 'bitwiseXorWith',
        '<<=': 'shiftLeftBy',
        '>>=': 'shiftRightBy',
        '==': 'isEqualTo',
        '!=': 'isNotEqualTo',
        '<>': 'isNotEqualTo',
        '===': 'isIdenticalTo',
        '!==': 'isNotIdenticalTo',
        '<': 'isLessThan',
        '<=': 'isLessThanOrEqual',
        '>': 'isGreaterThan',
        '>=': 'isGreaterThanOrEqual',
        '=': {
            'false': 'setValue',
            'true': 'setReference'
        }
    },
    hasOwn = {}.hasOwnProperty,
    phpCommon = require('phpcommon'),
    sourceMap = require('source-map'),
    sourceMapToComment = require('source-map-to-comment'),
    transpilerMessages = require('./builtin/messages/transpiler'),
    unaryOperatorToMethod = {
        prefix: {
            '+': 'toPositive',
            '-': 'toNegative',
            '++': 'preIncrement',
            '--': 'preDecrement',
            '~': 'onesComplement',
            '!': 'logicalNot'
        },
        suffix: {
            '++': 'postIncrement',
            '--': 'postDecrement'
        }
    },
    LabelRepository = require('./LabelRepository'),
    PHPFatalError = phpCommon.PHPFatalError,
    SourceNode = sourceMap.SourceNode,
    Translator = phpCommon.Translator;

/**
 * Builds chunks for the optional extra arguments that may need to be passed
 * when defining a function, method or closure. These include the parameter
 * spec data, line number and whether the method or closure is static.
 *
 * @param {Object[]} argSpecs
 * @return {Array}
 */
function buildExtraFunctionDefinitionArgChunks(argSpecs) {
    var argChunks = [],
        optionalChunks = [];

    _.each(argSpecs, function (argSpec) {
        var prefix = argSpec.name ? [argSpec.name + ': '] : [];

        if (argSpec.value && argSpec.value.length) {
            [].push.apply(argChunks, optionalChunks);
            optionalChunks = [];
            argChunks.push(prefix.concat(argSpec.value));
        } else {
            optionalChunks.push(prefix.concat(argSpec.emptyValue));
        }
    });

    // NB: If there are some optional args left at the end, omit them

    return argChunks.map(function (argChunk) {
        return [', '].concat(argChunk);
    });
}

function hoistDeclarations(statements) {
    var declarations = [],
        nonDeclarations = [];

    _.each(statements, function (statement) {
        if (/^N_(CLASS|FUNCTION|USE)_STATEMENT$/.test(statement.name)) {
            declarations.push(statement);
        } else {
            nonDeclarations.push(statement);
        }
    });

    return declarations.concat(nonDeclarations);
}

function interpretFunction(nameNode, argNodes, bindingNodes, statementNode, interpret, context) {
    var args = [],
        argumentAssignmentChunks = [],
        bindingAssignmentChunks = [],
        labelRepository = new LabelRepository(),
        labels,
        pendingLabelGotoNode,
        subContext = {
            // This sub-context will be merged with the parent one,
            // so we need to override any value for the `assignment` and `getValue` options
            assignment: undefined,
            blockContexts: [],
            getValue: undefined,
            labelRepository: labelRepository,
            variableMap: {
                'this': true
            }
        },
        body = context.createInternalSourceNode(interpret(statementNode, subContext), statementNode);

    if (labelRepository.hasPending()) {
        // After processing the body of the function, one or more gotos were found targetting labels
        // that were never defined, so throw a compile-time fatal error
        pendingLabelGotoNode = labelRepository.getFirstPendingLabelGotoNode();

        context.raiseError(GOTO_TO_UNDEFINED_LABEL, pendingLabelGotoNode.label, {
            'label': pendingLabelGotoNode.label.string
        });
    }

    labels = labelRepository.getLabels();

    // Define a flag variable for jumps to any labels
    if (labels.length > 0) {
        body.unshift('var goingToLabel_' + labels.join(' = false, goingToLabel_') + ' = false;');
    }

    if (context.buildingSourceMap) {
        _.forOwn(subContext.variableMap, function (t, name) {
            bindingAssignmentChunks.push('var $' + name + ' = tools.createDebugVar(scope, "' + name + '");');
        });
    }

    _.each(bindingNodes, function (bindingNode) {
        var isReference = bindingNode.name === 'N_REFERENCE',
            methodSuffix = isReference ? 'Reference' : 'Value',
            variableName = isReference ? bindingNode.operand.variable : bindingNode.variable;

        bindingAssignmentChunks.push(
            'scope.getVariable("' +
            variableName +
            '").set' + methodSuffix +
            '(parentScope.getVariable("' + variableName +
            '").get' + methodSuffix + '());'
        );

        if (context.buildingSourceMap) {
            bindingAssignmentChunks.push(
                'var ',
                context.createInternalSourceNode(
                    ['$' + variableName],
                    isReference ? bindingNode.operand : bindingNode,
                    '$' + variableName
                ),
                ' = tools.createDebugVar(scope, "' + variableName + '");'
            );
        }
    });

    // Copy passed values for any arguments
    _.each(argNodes, function (argNode, index) {
        var isReference = argNode.variable.name === 'N_REFERENCE',
            variableNode = isReference ? argNode.variable.operand : argNode.variable,
            variable = variableNode.variable;

        if (isReference) {
            if (argNode.value) {
                // Either a reference could be passed or the default value could be provided
                argumentAssignmentChunks.push(
                    'scope.getVariable("' + variable + '").setReferenceOrValue($', variable, ');'
                );
            } else {
                // Only a reference could be passed as no default value is defined for this parameter
                argumentAssignmentChunks.push(
                    'scope.getVariable("' + variable + '").setReference($', variable, '.getReference());'
                );
            }
        } else {
            argumentAssignmentChunks.push(
                'scope.getVariable("' + variable + '").setValue($', variable, '.getValue());'
            );
        }

        args[index] = '$' + variable;

        if (context.buildingSourceMap) {
            argumentAssignmentChunks.push(
                'var $' + variable + ' = tools.createDebugVar(scope, "' + variable + '");'
            );
        }
    });

    // Prepend parts in correct order
    body = [argumentAssignmentChunks, bindingAssignmentChunks].concat(body);

    // Build function expression
    body = [
        'function ',
        nameNode ? context.createInternalSourceNode(['_' + nameNode.string], nameNode, nameNode.name) : '',
        '(' + args.join(', ') + ') {',
        'var scope = this;',
        // Add instrumentation code for fetching the current line number for this call if enabled
        context.lineNumbers ? 'var line;tools.instrument(function () {return line;});' : '',
        body,
        '}'
    ];

    if (bindingNodes && bindingNodes.length > 0) {
        body = ['(function (parentScope) { return '].concat(body, '; }(scope))');
    }

    return body;
}

/**
 * Produces an array or object literal containing all the information about
 * the parameters to a function, closure or static/instance method.
 *
 * @param {Object[]} argNodes
 * @param {Function} interpret
 * @return {Array}
 */
function interpretFunctionArgs(argNodes, interpret) {
    var allArgCodeChunks = [];

    _.each(argNodes, function (argNode, argIndex) {
        var argCodeChunks = ['{'].concat(
                argNode.type ?
                interpret(argNode.type).concat(',') :
                // NB: Omit the type for "mixed" to save on bundle space
                []
            ),
            isReference = argNode.variable.name === 'N_REFERENCE';

        argCodeChunks.push('"name":', JSON.stringify(
            isReference ?
                argNode.variable.operand.variable :
                argNode.variable.variable
        ));

        if (isReference) {
            argCodeChunks.push(',"ref":true');
        }

        if (argNode.value) {
            argCodeChunks.push(
                ',"value":',
                'function () { return ',
                interpret(argNode.value, {isConstantOrProperty: true}),
                '; }'
            );
        }

        argCodeChunks.push('}');

        if (argIndex > 0) {
            allArgCodeChunks.push(',');
        }

        [].push.apply(allArgCodeChunks, argCodeChunks);
    });

    // TODO: To optimise bundle size, when not all parameters' info is needed (when a flag is set),
    //       output the array literal with the omitted parameters left blank eg. `[{},,,,{},,]`
    return allArgCodeChunks.length > 0 ?
        ['['].concat(allArgCodeChunks, ']') :
        [];
}

/**
 * Transpiles the list of statements given, recording all labels and gotos within each one
 *
 * @param {object[]} statements
 * @param {Function} interpret
 * @param {object} context
 * @param {LabelRepository} labelRepository
 * @return {object[]}
 */
function transpileWithLabelsAndGotos(statements, interpret, context, labelRepository) {
    var gotos,
        labels,
        statementDatas = [];

    function onGoto(gotoNode) {
        gotos[gotoNode.label.string] = true;
    }

    function onFoundLabel(labelNode) {
        labels[labelNode.label.string] = true;
    }

    labelRepository.on('goto label', onGoto);
    labelRepository.on('found label', onFoundLabel);

    _.each(statements, function (statement) {
        var statementCodeChunks;

        labels = {};
        gotos = {};

        statementCodeChunks = interpret(statement, context);

        statementDatas.push({
            codeChunks: statementCodeChunks,
            gotos: gotos,
            labels: labels,
            prefix: '',
            suffix: ''
        });
    });

    labelRepository.off('goto label', onGoto);
    labelRepository.off('found label', onFoundLabel);

    return statementDatas;
}

function processBlock(statements, interpret, context) {
    var codeChunks = [],
        labelsWithBackwardJumpLoopAdded = {},
        labelsWithForwardJumpBlockAdded = {},
        labelRepository = context.labelRepository,
        statementDatas = transpileWithLabelsAndGotos(statements, interpret, context, labelRepository);

    _.each(statementDatas, function (statementData, index) {
        var subsequentIndex,
            subsequentLabels = [];

        // If any statements after the current one contain a label declaration,
        // add an if statement so that this statement may be skipped over after performing
        // a goto jump via JS break or continue that doesn't quite take execution to the right place
        for (subsequentIndex = index + 1; subsequentIndex < statementDatas.length; subsequentIndex++) {
            subsequentLabels = subsequentLabels.concat(Object.keys(statementDatas[subsequentIndex].labels));
        }

        if (subsequentLabels.length > 0) {
            statementData.prefix = 'if (!goingToLabel_' + subsequentLabels.join(' && !goingToLabel_') + ') {' + statementData.prefix;
            statementData.suffix += '}';
        }
    });

    _.each(statementDatas, function (statementData, statementIndex) {
        _.each(Object.keys(statementData.gotos), function (label) {
            if (!hasOwn.call(statementData.labels, label)) {
                // This is a goto to a label in another statement: find the statement containing the label
                _.each(statementDatas, function (otherStatementData, otherStatementIndex) {
                    if (otherStatementData === statementData) {
                        // No need to check the statement against itself
                        return;
                    }

                    if (!hasOwn.call(otherStatementData.labels, label)) {
                        // This statement does not contain the label the goto targets: try the next one
                        return;
                    }

                    // If we reach here, we have found the label we are trying to jump to

                    if (otherStatementIndex > statementIndex) {
                        // [Forward jump] the label is (or is nested inside) a statement after the goto

                        if (hasOwn.call(labelsWithForwardJumpBlockAdded, label)) {
                            // We have already added a block that can be used for this forward jump's JS break statement
                            return;
                        }

                        labelsWithForwardJumpBlockAdded[label] = true;

                        statementDatas[0].prefix = 'break_' + label + ': {' + statementDatas[0].prefix;
                        otherStatementData.prefix = '}' + otherStatementData.prefix;
                    } else {
                        // [Backward jump] the goto is (or is nested inside) a statement after the label

                        if (hasOwn.call(labelsWithBackwardJumpLoopAdded, label)) {
                            // We have already added a loop (that wraps the entire body of the function)
                            // that can be used for this backward jump's JS continue statement
                            return;
                        }

                        labelsWithBackwardJumpLoopAdded[label] = true;

                        // We can use `break` but not `continue` with plain JS block statements.
                        // However, if we use a loop we can then use `continue` in order to jump backwards.
                        // TODO: Should this just be an infinite loop (eg. `for (;;) {...}`) with a `break;` at the end
                        //       so that it only ever executes once? Or a do..while with `while (false);`?
                        statementDatas[0].prefix = 'continue_' + label + ': do {' + statementDatas[0].prefix;
                        statementDatas[statementDatas.length - 1].suffix += '} while (goingToLabel_' + label + ');';
                    }

                    return false;
                });
            }
        });
    });

    _.each(statementDatas, function (statementData) {
        codeChunks.push(statementData.prefix, statementData.codeChunks, statementData.suffix);
    });

    return codeChunks;
}

module.exports = {
    nodes: {
        'N_ABSTRACT_METHOD_DEFINITION': function (node) {
            return {
                name: node.func.string,
                body: '{isStatic: false, abstract: true}'
            };
        },
        'N_ABSTRACT_STATIC_METHOD_DEFINITION': function (node) {
            return {
                name: node.method.string,
                body: '{isStatic: false, abstract: true}'
            };
        },
        'N_ARRAY_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                interpret(node.value, {getValue: true}).concat('.coerceToArray()'),
                node
            );
        },
        'N_ARRAY_INDEX': function (node, interpret, context) {
            var arrayVariableChunks = [],
                indexValueChunks = [],
                suffix = '';

            if (node.indices !== true) {
                _.each(node.indices, function (index, indexIndex) {
                    if (context.assignment && indexIndex < node.indices.length - 1) {
                        arrayVariableChunks.unshift('tools.implyArray(');
                    }

                    if (indexIndex > 0) {
                        indexValueChunks.push(
                            context.assignment ?
                                ')).getElementByKey(' :
                                ').getValue().getElementByKey('
                        );
                    }

                    indexValueChunks.push(interpret(index.index, {assignment: false, getValue: true}));
                });
            }

            if (context.assignment) {
                arrayVariableChunks.push('tools.implyArray(');
                [].push.apply(arrayVariableChunks, interpret(node.array, {getValue: false}));
                arrayVariableChunks.push(')');
            } else {
                if (context.getValue !== false) {
                    suffix = '.getValue()';
                }

                [].push.apply(arrayVariableChunks, interpret(node.array, {getValue: true}));
            }

            if (indexValueChunks.length > 0) {
                if (context.assignment) {
                    // _.each(indexValueChunks.slice(0, -1), function () {
                    //     arrayVariableChunks.unshift('tools.implyArray(');
                    // });

                    return context.createExpressionSourceNode(
                        arrayVariableChunks.concat('.getElementByKey(', indexValueChunks, ')' + suffix),
                        node
                    );
                }

                return context.createExpressionSourceNode(
                    arrayVariableChunks.concat('.getElementByKey(', indexValueChunks, ')' + suffix),
                    node
                );
            }

            return context.createExpressionSourceNode(arrayVariableChunks.concat('.getPushElement()' + suffix), node);
        },
        'N_ARRAY_LITERAL': function (node, interpret, context) {
            var elementValueChunks = [];

            _.each(node.elements, function (element, index) {
                if (index > 0) {
                    elementValueChunks.push(', ');
                }

                elementValueChunks.push(interpret(element, {getValue: true}));
            });

            return context.createExpressionSourceNode(['tools.valueFactory.createArray(['].concat(elementValueChunks, '])'), node);
        },
        'N_ARRAY_TYPE': function () {
            return '"type":"array"';
        },
        'N_BINARY_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(interpret(node.value, {getValue: true}).concat('.coerceToString()'), node);
        },
        'N_BINARY_LITERAL': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                ['tools.valueFactory.createString('].concat(JSON.stringify(node.string), ')'),
                node
            );
        },
        'N_BOOLEAN': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                ['tools.valueFactory.createBoolean('].concat(node.bool.toLowerCase(), ')'),
                node
            );
        },
        'N_BOOLEAN_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                interpret(node.value, {getValue: true}).concat('.coerceToBoolean()'),
                node
            );
        },
        'N_BREAK_STATEMENT': function (node, interpret, context) {
            var levels = node.levels.number,
                targetLevel = context.blockContexts.length - (levels - 1);

            // Invalid target levels throw a compile-time fatal error
            if (node.levels.number === 0) {
                context.raiseError(OPERATOR_REQUIRES_POSITIVE_INTEGER, node.levels, {
                    'operator': 'break'
                });
            } else if (node.levels.number < 0) {
                context.raiseError(BREAK_OR_CONTINUE_NON_INTEGER_OPERAND, node.levels, {
                    'operator': 'break'
                });
            }

            if (context.blockContexts.length === 0) {
                // We're not inside a loop or switch statement, so any break is invalid
                context.raiseError(BREAK_OR_CONTINUE_IN_WRONG_CONTEXT, node.levels, {
                    'operator': 'break',
                    'levels': levels
                });
            }

            // When the target level is not available it will actually
            // throw a fatal error at runtime rather than compile-time
            if (targetLevel < 1) {
                context.raiseError(CANNOT_BREAK_OR_CONTINUE, node.levels, {
                    'operator': 'break',
                    'levels': levels
                });
            }

            return context.createStatementSourceNode(['break block_' + targetLevel + ';'], node);
        },
        'N_CALLABLE_TYPE': function () {
            return '"type":"callable"';
        },
        'N_CASE': function (node, interpret, context) {
            var bodyChunks = [];

            _.each(node.body, function (statement) {
                bodyChunks.push(interpret(statement));
            });

            return context.createStatementSourceNode(
                [
                    'if (switchMatched_' + context.blockContexts.length +
                    ' || switchExpression_' + context.blockContexts.length + '.isEqualTo('
                ].concat(
                    interpret(node.expression),
                    ').getNative()) {switchMatched_' + context.blockContexts.length + ' = true; ',
                    bodyChunks,
                    '}'
                ),
                node
            );
        },
        'N_CLASS_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                interpret(node.className, {getValue: true, allowBareword: true}).concat(
                    '.getConstantByName(' + JSON.stringify(node.constant) + ', namespaceScope)'
                ),
                node
            );
        },
        'N_CLASS_STATEMENT': function (node, interpret, context) {
            var codeChunks,
                constantCodeChunks = [],
                methodCodeChunks = [],
                propertyCodeChunks = [],
                staticPropertyCodeChunks = [],
                superClass = node.extend ? 'namespaceScope.getClass(' + JSON.stringify(node.extend) + ')' : 'null',
                interfaces = JSON.stringify(node.implement || []);

            _.each(node.members, function (member) {
                var data = interpret(member);

                if (member.name === 'N_INSTANCE_PROPERTY_DEFINITION') {
                    if (propertyCodeChunks.length > 0) {
                        propertyCodeChunks.push(', ');
                    }

                    propertyCodeChunks.push('"' + data.name + '": {visibility: ' + data.visibility + ', value: ', data.value, '}');
                } else if (member.name === 'N_STATIC_PROPERTY_DEFINITION') {
                    if (staticPropertyCodeChunks.length > 0) {
                        staticPropertyCodeChunks.push(', ');
                    }

                    staticPropertyCodeChunks.push('"' + data.name + '": {visibility: ' + data.visibility + ', value: ', data.value, '}');
                } else if (member.name === 'N_METHOD_DEFINITION' || member.name === 'N_STATIC_METHOD_DEFINITION') {
                    if (methodCodeChunks.length > 0) {
                        methodCodeChunks.push(', ');
                    }

                    methodCodeChunks.push('"' + data.name + '": ', data.body);
                } else if (member.name === 'N_CONSTANT_DEFINITION') {
                    _.each(data, function (constant) {
                        if (constantCodeChunks.length > 0) {
                            constantCodeChunks.push(', ');
                        }

                        constantCodeChunks.push('"' + constant.name + '": ', constant.value);
                    });
                }
            });

            codeChunks = [
                '{superClass: ' + superClass +
                ', interfaces: ' + interfaces +
                ', staticProperties: {'
            ].concat(
                staticPropertyCodeChunks,
                '}, properties: {', propertyCodeChunks,
                '}, methods: {', methodCodeChunks,
                '}, constants: {', constantCodeChunks, '}}'
            );

            return context.createStatementSourceNode(
                [
                    '(function () {var currentClass = namespace.defineClass(' + JSON.stringify(node.className) + ', '
                ].concat(codeChunks, ', namespaceScope);}());'),
                node
            );
        },
        'N_CLASS_TYPE': function (node) {
            return '"type":"class","className":' + JSON.stringify(node.className);
        },
        'N_CLONE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [interpret(node.operand, {getValue: true}), '.clone()'],
                node
            );
        },
        'N_CLOSURE': function (node, interpret, context) {
            var func = interpretFunction(null, node.args, node.bindings, node.body, interpret, context),
                extraArgChunks = buildExtraFunctionDefinitionArgChunks([
                    {
                        value: interpretFunctionArgs(node.args, interpret),
                        emptyValue: '[]'
                    },
                    {
                        value: node.static ? 'true' : null,
                        emptyValue: 'false'
                    },
                    {
                        value: context.lineNumbers ?
                            ['' + node.bounds.start.line] :
                            null,
                        emptyValue: 'null'
                    }
                ]);

            return context.createExpressionSourceNode(
                ['tools.createClosure('].concat(func, ', scope, namespaceScope', extraArgChunks, ')'),
                node
            );
        },
        'N_COMMA_EXPRESSION': function (node, interpret, context) {
            var expressionCodeChunks = [];

            _.each(node.expressions, function (expression, index) {
                if (index > 0) {
                    expressionCodeChunks.push(', ');
                }

                expressionCodeChunks.push(interpret(expression));
            });

            return context.createExpressionSourceNode(expressionCodeChunks, node);
        },
        'N_COMPOUND_STATEMENT': function (node, interpret, context) {
            return context.createInternalSourceNode(processBlock(node.statements, interpret, context), node);
        },
        'N_CONSTANT_DEFINITION': function (node, interpret, context) {
            return node.constants.map(function (constant) {
                return {
                    name: constant.constant,
                    value: context.createInternalSourceNode(
                        ['function () { return '].concat(interpret(constant.value, {isConstantOrProperty: true}), '; }'),
                        constant
                    )
                };
            });
        },
        'N_CONSTANT_STATEMENT': function (node, interpret, context) {
            var codeChunks = [];

            _.each(node.constants, function (constant) {
                codeChunks.push(
                    'namespace.defineConstant(' + JSON.stringify(constant.constant) + ', ',
                    interpret(constant.value),
                    ');'
                );
            });

            return context.createStatementSourceNode(codeChunks, node);
        },
        'N_CONTINUE_STATEMENT': function (node, interpret, context) {
            var levels = node.levels.number,
                statement,
                targetLevel = context.blockContexts.length - (levels - 1);

            // Invalid target levels throw a compile-time fatal error
            if (node.levels.number === 0) {
                context.raiseError(OPERATOR_REQUIRES_POSITIVE_INTEGER, node.levels, {
                    'operator': 'continue'
                });
            } else if (node.levels.number < 0) {
                context.raiseError(BREAK_OR_CONTINUE_NON_INTEGER_OPERAND, node.levels, {
                    'operator': 'continue'
                });
            }

            if (context.blockContexts.length === 0) {
                // We're not inside a loop or switch statement, so any break is invalid
                context.raiseError(BREAK_OR_CONTINUE_IN_WRONG_CONTEXT, node.levels, {
                    'operator': 'continue',
                    'levels': levels
                });
            }

            // When the target level is not available it will actually
            // throw a fatal error at runtime rather than compile-time
            if (targetLevel < 1) {
                context.raiseError(CANNOT_BREAK_OR_CONTINUE, node.levels, {
                    'operator': 'continue',
                    'levels': levels
                });
            }

            statement = context.blockContexts[targetLevel - 1] === 'switch' ? 'break' : 'continue';

            return context.createStatementSourceNode([statement + ' block_' + targetLevel + ';'], node);
        },
        'N_DEFAULT_CASE': function (node, interpret, context) {
            var bodyChunks = [];

            _.each(node.body, function (statement) {
                bodyChunks.push(interpret(statement));
            });

            return context.createInternalSourceNode(
                ['if (!switchMatched_' + context.blockContexts.length +
                ') {switchMatched_' + context.blockContexts.length + ' = true; '
                ].concat(bodyChunks, '}'),
                node
            );
        },
        'N_DO_WHILE_STATEMENT': function (node, interpret, context) {
            var blockContexts = context.blockContexts.concat(['do-while']),
                labelRepository = context.labelRepository,
                labelsInsideLoopHash = {},
                // Record which labels have gotos to labels that are not yet defined,
                // meaning they could be defined either inside the loop body (invalid) or afterwards
                priorPendingLabelsHash = labelRepository.getPendingLabelsHash(),
                subContext = {
                    blockContexts: blockContexts
                },
                codeChunks,
                conditionChunks = interpret(node.condition, subContext);

            function onFoundLabel(labelNode) {
                var label = labelNode.label.string;

                labelsInsideLoopHash[label] = true;

                if (hasOwn.call(priorPendingLabelsHash, label)) {
                    // A goto above this do..while loop (but within the same function)
                    // is attempting to jump forward into it
                    context.raiseError(GOTO_DISALLOWED, priorPendingLabelsHash[label].label);
                }
            }

            labelRepository.on('found label', onFoundLabel);

            codeChunks = interpret(node.body, subContext);

            labelRepository.off('found label', onFoundLabel);

            labelRepository.on('goto label', function (gotoNode) {
                var label = gotoNode.label.string;

                if (labelsInsideLoopHash[label] === true) {
                    // A goto below this do..while loop (but within the same function)
                    // is attempting to jump backward into it
                    context.raiseError(GOTO_DISALLOWED, gotoNode.label);
                }
            });

            return context.createStatementSourceNode(
                ['block_' + blockContexts.length + ': do {'].concat(
                    codeChunks,
                    '} while (',
                    conditionChunks,
                    '.coerceToBoolean().getNative());'
                ),
                node
            );
        },
        'N_DOUBLE_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                interpret(node.value, {getValue: true}).concat('.coerceToFloat()'),
                node
            );
        },
        'N_ECHO_STATEMENT': function (node, interpret, context) {
            var chunks = [];

            _.each(node.expressions, function (expressionNode) {
                chunks.push(
                    'stdout.write(',
                    interpret(expressionNode),
                    '.coerceToString().getNative());'
                );
            });

            return context.createStatementSourceNode(chunks, node);
        },
        'N_EMPTY': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    '(function (scope) {scope.suppressOwnErrors();' +
                    'var result = tools.valueFactory.createBoolean('
                ].concat(
                    interpret(node.variable, {getValue: false}),
                    '.isEmpty());' +
                    'scope.unsuppressOwnErrors(); return result;}(scope))'
                ),
                node
            );
        },
        'N_EVAL': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                ['tools.eval(' + interpret(node.code, {getValue: true}) + '.getNative(), scope)'],
                node
            );
        },
        'N_EXIT': function (node, interpret, context) {
            if (hasOwn.call(node, 'status')) {
                return context.createExpressionSourceNode(
                    ['tools.exit('].concat(
                        interpret(node.status),
                        ')'
                    ),
                    node
                );
            }

            if (hasOwn.call(node, 'message')) {
                return context.createExpressionSourceNode(
                    ['(stdout.write('].concat(
                        interpret(node.message),
                        '.getNative()), tools.exit())'
                    ),
                    node
                );
            }

            return context.createStatementSourceNode(['tools.exit()'], node);
        },
        'N_EXPRESSION': function (node, interpret, context) {
            var isAssignment = /^(?:[-+*/.%&|^]|<<|>>)?=$/.test(node.right[0].operator),
                expressionEnd = [],
                expressionStart = interpret(node.left, {assignment: isAssignment, getValue: !isAssignment});

            _.each(node.right, function (operation, index) {
                var getValueIfApplicable,
                    isReference = operation.operand.name === 'N_REFERENCE',
                    method,
                    rightOperand = isReference ?
                        operation.operand.operand :
                        operation.operand,
                    transpiledRightOperand,
                    valuePostProcess = isReference ? '.getReference()' : '';

                getValueIfApplicable = (!isAssignment || index === node.right.length - 1) && !isReference;

                transpiledRightOperand = interpret(rightOperand, {getValue: getValueIfApplicable});

                // Handle logical 'and' specially as it can short-circuit
                if (operation.operator === '&&' || operation.operator === 'and') {
                    expressionStart = ['tools.valueFactory.createBoolean('].concat(
                        expressionStart,
                        '.coerceToBoolean().getNative() && (',
                        transpiledRightOperand,
                        valuePostProcess +
                        '.coerceToBoolean().getNative()'
                    );
                    expressionEnd.push('))');
                // Handle logical 'or' specially as it can short-circuit
                } else if (operation.operator === '||' || operation.operator === 'or') {
                    expressionStart = ['tools.valueFactory.createBoolean('].concat(
                        expressionStart,
                        '.coerceToBoolean().getNative() || (',
                        transpiledRightOperand,
                        valuePostProcess +
                        '.coerceToBoolean().getNative()'
                    );
                    expressionEnd.push('))');
                // Xor should be true if LHS is not equal to RHS:
                // coerce to booleans then compare for inequality
                } else if (operation.operator === 'xor') {
                    expressionStart = ['tools.valueFactory.createBoolean('].concat(
                        expressionStart,
                        '.coerceToBoolean().getNative() !== (',
                        transpiledRightOperand,
                        valuePostProcess +
                        '.coerceToBoolean().getNative()'
                    );
                    expressionEnd.push('))');
                } else {
                    method = binaryOperatorToMethod[operation.operator];

                    if (!method) {
                        throw new Error('Unsupported binary operator "' + operation.operator + '"');
                    }

                    if (_.isPlainObject(method)) {
                        method = method[isReference];
                    }

                    expressionStart.push('.' + method + '(', transpiledRightOperand, valuePostProcess);
                    expressionEnd.push(')');
                }

                if (isReference && context.getValue) {
                    expressionEnd.push('.getValue()');
                }
            });

            return context.createExpressionSourceNode(expressionStart.concat(expressionEnd), node);
        },
        'N_EXPRESSION_STATEMENT': function (node, interpret, context) {
            return context.createStatementSourceNode(interpret(node.expression).concat(';'), node);
        },
        'N_FLOAT': function (node, interpret, context) {
            return context.createExpressionSourceNode(['tools.valueFactory.createFloat(' + node.number + ')'], node);
        },
        'N_FOR_STATEMENT': function (node, interpret, context) {
            var blockContexts = context.blockContexts.concat(['for']),
                labelRepository = context.labelRepository,
                labelsInsideLoopHash = {},
                // Record which labels have gotos to labels that are not yet defined,
                // meaning they could be defined either inside the loop body (invalid) or afterwards
                priorPendingLabelsHash = labelRepository.getPendingLabelsHash(),
                subContext = {
                    blockContexts: blockContexts
                },
                bodyCodeChunks,
                conditionCodeChunks = interpret(node.condition, subContext),
                initializerCodeChunks = interpret(node.initializer, subContext),
                updateCodeChunks = interpret(node.update, subContext);

            function onFoundLabel(labelNode) {
                var label = labelNode.label.string;

                labelsInsideLoopHash[label] = true;

                if (hasOwn.call(priorPendingLabelsHash, label)) {
                    // A goto above this for loop (but within the same function)
                    // is attempting to jump forward into it
                    context.raiseError(GOTO_DISALLOWED, priorPendingLabelsHash[label].label);
                }
            }

            labelRepository.on('found label', onFoundLabel);

            bodyCodeChunks = interpret(node.body, subContext);

            labelRepository.off('found label', onFoundLabel);

            labelRepository.on('goto label', function (gotoNode) {
                var label = gotoNode.label.string;

                if (labelsInsideLoopHash[label] === true) {
                    // A goto below this for loop (but within the same function)
                    // is attempting to jump backward into it
                    context.raiseError(GOTO_DISALLOWED, gotoNode.label);
                }
            });

            if (conditionCodeChunks.length > 0) {
                conditionCodeChunks.push('.coerceToBoolean().getNative()');
            }

            return context.createStatementSourceNode(
                ['block_' + blockContexts.length + ': for ('].concat(
                    initializerCodeChunks,
                    ';',
                    conditionCodeChunks || [],
                    ';',
                    updateCodeChunks,
                    ') {',
                    bodyCodeChunks,
                    '}'
                ),
                node
            );
        },
        'N_FOREACH_STATEMENT': function (node, interpret, context) {
            var arrayValue = interpret(node.array),
                iteratorVariable,
                codeChunks = [],
                key = node.key ? interpret(node.key, {getValue: false}) : null,
                blockContexts = context.blockContexts.concat(['foreach']),
                labelRepository = context.labelRepository,
                labelsInsideLoopHash = {},
                // Record which labels have gotos to labels that are not yet defined,
                // meaning they could be defined either inside the loop body (invalid) or afterwards
                priorPendingLabelsHash = labelRepository.getPendingLabelsHash(),
                subContext = {
                    blockContexts: blockContexts
                },
                valueIsReference = node.value.name === 'N_REFERENCE',
                nodeValue = valueIsReference ? node.value.operand : node.value,
                value = interpret(nodeValue, {getValue: false});

            iteratorVariable = 'iterator_' + blockContexts.length;

            // Prepend label for `break;` and `continue;` to reference
            codeChunks.push('block_' + blockContexts.length + ': ');

            // Loop management
            codeChunks.push(
                // Create an iterator for the loop - for an array, this will be an instance
                // of an internal class called ArrayIterator. For instances of Iterator,
                // it will be the ObjectValue itself, whereas for instances of IteratorAggregate
                // it will be the ObjectValue returned from the PHP ->getIterator() method
                'for (var ' + iteratorVariable + ' = ',
                arrayValue,
                '.getIterator(); ' + iteratorVariable + '.isNotFinished(); ',
                // Advance iterator to next element at end of loop body as per spec
                iteratorVariable + '.advance()',
                ') {'
            );

            // Iterator value variable
            if (valueIsReference) {
                codeChunks.push(value, '.setReference(' + iteratorVariable + '.getCurrentElementReference());');
            } else {
                codeChunks.push(value, '.setValue(' + iteratorVariable + '.getCurrentElementValue());');
            }

            if (key) {
                // Iterator key variable (if specified)
                codeChunks.push(key, '.setValue(' + iteratorVariable + '.getCurrentKey());');
            }

            function onFoundLabel(labelNode) {
                var label = labelNode.label.string;

                labelsInsideLoopHash[label] = true;

                if (hasOwn.call(priorPendingLabelsHash, label)) {
                    // A goto above this foreach loop (but within the same function)
                    // is attempting to jump forward into it
                    context.raiseError(GOTO_DISALLOWED, priorPendingLabelsHash[label].label);
                }
            }

            labelRepository.on('found label', onFoundLabel);

            codeChunks = codeChunks.concat(interpret(node.body, subContext));

            labelRepository.off('found label', onFoundLabel);

            labelRepository.on('goto label', function (gotoNode) {
                var label = gotoNode.label.string;

                if (labelsInsideLoopHash[label] === true) {
                    // A goto below this foreach loop (but within the same function)
                    // is attempting to jump backward into it
                    context.raiseError(GOTO_DISALLOWED, gotoNode.label);
                }
            });

            codeChunks.push('}');

            return context.createStatementSourceNode(codeChunks, node);
        },
        'N_FUNCTION_STATEMENT': function (node, interpret, context) {
            var extraArgChunks,
                func;

            if (
                context.currentNamespace === '' && // Magic __autoload function can only exist in the root namespace
                node.func.string.toLowerCase() === '__autoload' &&
                node.args.length !== 1
            ) {
                context.raiseError(EXPECT_EXACTLY_ONE_ARG, node, {
                    name: node.func.string.toLowerCase()
                });
            }

            func = interpretFunction(node.func, node.args, null, node.body, interpret, context);
            extraArgChunks = buildExtraFunctionDefinitionArgChunks([
                {
                    value: interpretFunctionArgs(node.args, interpret),
                    emptyValue: '[]'
                },
                {
                    value: context.lineNumbers ?
                        ['' + node.bounds.start.line] :
                        null,
                    emptyValue: 'null'
                }
            ]);

            return context.createStatementSourceNode(
                ['namespace.defineFunction(' + JSON.stringify(node.func.string) + ', '].concat(func, ', namespaceScope', extraArgChunks, ');'),
                node
            );
        },
        'N_FUNCTION_CALL': function (node, interpret, context) {
            var argChunks = [];

            _.each(node.args, function (arg, index) {
                if (index > 0) {
                    argChunks.push(', ');
                }

                argChunks.push(interpret(arg, {getValue: false}));
            });

            return context.createExpressionSourceNode(
                ['('].concat(
                    interpret(node.func, {getValue: true, allowBareword: true}),
                    '.call([',
                    argChunks,
                    '], namespaceScope) || tools.valueFactory.createNull())'
                ),
                node
            );
        },
        'N_GLOBAL_STATEMENT': function (node, interpret, context) {
            var code = '';

            _.each(node.variables, function (variable) {
                code += 'scope.importGlobal(' + JSON.stringify(variable.variable) + ');';
            });

            return context.createStatementSourceNode([code], node);
        },
        'N_GOTO_STATEMENT': function (node, interpret, context) {
            var code = '',
                label = node.label.string;

            context.labelRepository.addGoto(node);

            code += 'goingToLabel_' + label + ' = true;';

            if (context.labelRepository.hasBeenFound(label)) {
                code += ' continue continue_' + label + ';';
            } else {
                code += ' break break_' + label + ';';
            }

            return context.createStatementSourceNode([code], node);
        },
        'N_HEREDOC': function (node, interpret, context) {
            var codeChunks = [];

            _.each(node.parts, function (part, index) {
                if (index > 0) {
                    codeChunks.push(' + ');
                }

                codeChunks.push(interpret(part), '.coerceToString().getNative()');
            });

            return context.createExpressionSourceNode(
                ['tools.valueFactory.createString('].concat(codeChunks, ')'),
                node
            );
        },
        'N_IF_STATEMENT': function (node, interpret, context) {
            // Consequent statements are executed if the condition is truthy,
            // Alternate statements are executed if the condition is falsy
            var alternateCodeChunks,
                codeChunks,
                conditionCodeChunks = interpret(node.condition, {getValue: true}).concat('.coerceToBoolean().getNative()'),
                consequentCodeChunks,
                gotosJumpingIn = {},
                labelRepository = context.labelRepository;

            function onFoundLabel(labelNode) {
                var label = labelNode.label.string;

                gotosJumpingIn[label] = true;
            }

            labelRepository.on('found label', onFoundLabel);
            consequentCodeChunks = interpret(node.consequentStatement);
            labelRepository.off('found label', onFoundLabel);

            _.each(Object.keys(gotosJumpingIn), function (label) {
                conditionCodeChunks = ['goingToLabel_' + label + ' || ('].concat(conditionCodeChunks, ')');
            });

            consequentCodeChunks = ['{'].concat(consequentCodeChunks, '}');

            alternateCodeChunks = node.alternateStatement ?
                [' else {'].concat(interpret(node.alternateStatement), '}') :
                [];

            codeChunks = ['if ('].concat(conditionCodeChunks, ') ', consequentCodeChunks, alternateCodeChunks);

            return context.createStatementSourceNode(codeChunks, node);
        },
        'N_INCLUDE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                ['tools.include('].concat(interpret(node.path), '.getNative(), scope)'),
                node
            );
        },
        'N_INCLUDE_ONCE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                ['tools.includeOnce('].concat(interpret(node.path), '.getNative(), scope)'),
                node
            );
        },
        'N_INLINE_HTML_STATEMENT': function (node, interpret, context) {
            return context.createStatementSourceNode(
                ['stdout.write(' + JSON.stringify(node.html) + ');'],
                node
            );
        },
        'N_INSTANCE_OF': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                interpret(node.object, {getValue: true}).concat([
                    '.isAnInstanceOf(',
                    interpret(node['class'], {allowBareword: true}),
                    ', namespaceScope)'
                ]),
                node
            );
        },
        'N_INSTANCE_PROPERTY_DEFINITION': function (node, interpret, context) {
            return {
                name: node.variable.variable,
                visibility: JSON.stringify(node.visibility),
                value: context.createInternalSourceNode(
                    // Output a function that can be called to create the property's value,
                    // so that each instance gets a separate array object (if one is used as the value)
                    // FIXME: Why does this func not take a currentClass arg when N_STATIC_PROPERTY_DEFINITION does??
                    ['function () { return '].concat(node.value ? interpret(node.value, {isConstantOrProperty: true}) : ['null'], '; }'),
                    node
                )
            };
        },
        'N_INTEGER': function (node, interpret, context) {
            return context.createExpressionSourceNode(['tools.valueFactory.createInteger(' + node.number + ')'], node);
        },
        'N_INTEGER_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                interpret(node.value, {getValue: true}).concat('.coerceToInteger()'),
                node
            );
        },
        'N_INTERFACE_METHOD_DEFINITION': function (node) {
            return {
                name: node.func.string,
                body: '{isStatic: false, abstract: true}'
            };
        },
        'N_INTERFACE_STATEMENT': function (node, interpret, context) {
            var codeChunks,
                constantCodeChunks = [],
                methodCodeChunks = [],
                extend = JSON.stringify(node.extend || []);

            _.each(node.members, function (member) {
                var data = interpret(member);

                if (member.name === 'N_INSTANCE_PROPERTY_DEFINITION' || member.name === 'N_STATIC_PROPERTY_DEFINITION') {
                    // NB: The line number must actually be that of the variable name itself if spanning multiple lines
                    context.raiseError(INTERFACE_PROPERTY_NOT_ALLOWED, member.variable);
                } else if (member.name === 'N_METHOD_DEFINITION' || member.name === 'N_STATIC_METHOD_DEFINITION') {
                    // NB: The line number must actually be that of the function keyword itself if spanning multiple lines
                    context.raiseError(INTERFACE_METHOD_BODY_NOT_ALLOWED, member, {
                        className: node.interfaceName,
                        methodName: member.func ? member.func.string : member.method.string
                    });
                } else if (member.name === 'N_INTERFACE_METHOD_DEFINITION' || member.name === 'N_STATIC_INTERFACE_METHOD_DEFINITION') {
                    if (methodCodeChunks.length > 0) {
                        methodCodeChunks.push(', ');
                    }

                    methodCodeChunks.push(context.createInternalSourceNode(['"' + data.name + '": '].concat(data.body), member));
                } else if (member.name === 'N_CONSTANT_DEFINITION') {
                    _.each(data, function (constant) {
                        if (constantCodeChunks.length > 0) {
                            constantCodeChunks.push(', ');
                        }

                        constantCodeChunks.push(
                            context.createInternalSourceNode(
                                ['"' + constant.name + '": '].concat(constant.value),
                                member
                            )
                        );
                    });
                }
            });

            codeChunks = [
                '{superClass: null' +
                ', interfaces: ' + extend + // Interfaces can extend multiple other interfaces
                ', staticProperties: {' +
                '}, properties: {' +
                '}, methods: {'
            ].concat(
                methodCodeChunks,
                '}, constants: {',
                constantCodeChunks,
                '}}'
            );

            return context.createStatementSourceNode(
                [
                    '(function () {var currentClass = namespace.defineClass(' + JSON.stringify(node.interfaceName) + ', '
                ].concat(
                    codeChunks,
                    ', namespaceScope);}());'
                ),
                node
            );
        },
        'N_STATIC_INTERFACE_METHOD_DEFINITION': function (node) {
            return {
                name: node.method.string,
                body: '{isStatic: true, abstract: true}'
            };
        },
        'N_ISSET': function (node, interpret, context) {
            var issetChunks = [];

            _.each(node.variables, function (variable, index) {
                if (index > 0) {
                    issetChunks.push(' && ');
                }

                issetChunks.push(interpret(variable, {getValue: false}), '.isSet()');
            });

            return context.createExpressionSourceNode(
                [
                    '(function (scope) {scope.suppressOwnErrors();' +
                    'var result = tools.valueFactory.createBoolean('
                ].concat(
                    issetChunks,
                    ');' +
                    'scope.unsuppressOwnErrors(); return result;}(scope))'
                ),
                node
            );
        },
        'N_ITERABLE_TYPE': function () {
            return '"type":"iterable"';
        },
        'N_KEY_VALUE_PAIR': function (node, interpret, context) {
            var isReference = node.value.name === 'N_REFERENCE';

            return context.createExpressionSourceNode(
                ['tools.createKey' + (isReference ? 'Reference' : 'Value') + 'Pair('].concat(interpret(node.key), ', ', interpret(node.value), ')'),
                node
            );
        },
        'N_LABEL_STATEMENT': function (node, interpret, context) {
            var label = node.label.string;

            if (context.labelRepository.hasBeenFound(label)) {
                // This is an attempt to redefine the label, so throw a compile-time fatal error
                // (NB: when spanning multiple lines, it is the label itself whose line should be reported,
                // not the label statement)
                context.raiseError(LABEL_ALREADY_DEFINED, node.label, {
                    'label': label
                });
            }

            context.labelRepository.found(node);

            return [
                // Once we've reached the label, reset the flag that indicates we were going to it
                // so that no more skipping will occur (until/unless this label is jumped to again)
                'goingToLabel_' + label + ' = false;'
            ];
        },
        'N_LIST': function (node, interpret, context) {
            var elementsCodeChunks = [];

            _.each(node.elements, function (element, index) {
                if (index > 0) {
                    elementsCodeChunks.push(',');
                }

                elementsCodeChunks.push(interpret(element, {getValue: false}));
            });

            return context.createExpressionSourceNode(
                ['tools.createList(['].concat(elementsCodeChunks, '])'),
                node
            );
        },
        'N_MAGIC_CLASS_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(['scope.getClassName()'], node);
        },
        'N_MAGIC_DIR_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(['tools.getPathDirectory()'], node);
        },
        'N_MAGIC_FILE_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(['tools.getPath()'], node);
        },
        'N_MAGIC_FUNCTION_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(['scope.getFunctionName()'], node);
        },
        'N_MAGIC_LINE_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                ['tools.valueFactory.createInteger(' + node.bounds.start.line + ')'],
                node
            );
        },
        'N_MAGIC_METHOD_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(['scope.getMethodName()'], node);
        },
        'N_MAGIC_NAMESPACE_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(['namespaceScope.getNamespaceName()'], node);
        },
        'N_METHOD_CALL': function (node, interpret, context) {
            var codeChunks = [];

            _.each(node.calls, function (call) {
                var argChunks = [];

                _.each(call.args, function (arg, index) {
                    if (index > 0) {
                        argChunks.push(', ');
                    }

                    argChunks.push(interpret(arg, {getValue: false}));
                });

                codeChunks.push('.callMethod(');
                [].push.apply(codeChunks, interpret(call.func, {allowBareword: true}));
                codeChunks.push('.getNative(), [');
                [].push.apply(codeChunks, argChunks);
                codeChunks.push('])');
            });

            return context.createExpressionSourceNode(
                interpret(node.object, {getValue: true}).concat(codeChunks),
                node
            );
        },
        'N_METHOD_DEFINITION': function (node, interpret, context) {
            var extraArgChunks = buildExtraFunctionDefinitionArgChunks([
                {
                    name: 'args',
                    value: interpretFunctionArgs(node.args, interpret),
                    emptyValue: '[]'
                },
                {
                    name: 'line',
                    value: context.lineNumbers ?
                        ['' + node.bounds.start.line] :
                        null,
                    emptyValue: 'null'
                }
            ]);

            return {
                name: node.func.string,
                body: context.createInternalSourceNode(
                    ['{isStatic: false, method: '].concat(
                        interpretFunction(node.func, node.args, null, node.body, interpret, context),
                        extraArgChunks,
                        '}'
                    ),
                    node
                )
            };
        },
        'N_NAMESPACE_STATEMENT': function (node, interpret, context) {
            var bodyChunks = [];

            _.each(hoistDeclarations(node.statements), function (statement) {
                [].push.apply(bodyChunks, interpret(statement, {currentNamespace: node.namespace}));
            });

            if (node.namespace === '') {
                // Global namespace
                return context.createStatementSourceNode(bodyChunks, node);
            }

            if (context.buildingSourceMap) {
                _.forOwn(context.variableMap, function (t, name) {
                    bodyChunks.unshift('var $' + name + ' = tools.createDebugVar(scope, "' + name + '");');
                });
            }

            return context.createStatementSourceNode(
                [
                    'if (namespaceResult = (function (globalNamespace) {var namespace = globalNamespace.getDescendant(' +
                    JSON.stringify(node.namespace) +
                    '), namespaceScope = tools.createNamespaceScope(namespace);',
                    bodyChunks,
                    '}(namespace))) { return namespaceResult; }'
                ],
                node
            );
        },
        'N_NEW_EXPRESSION': function (node, interpret, context) {
            var argChunks = [];

            _.each(node.args, function (arg, index) {
                if (index > 0) {
                    argChunks.push(', ');
                }

                argChunks.push(interpret(arg));
            });

            return context.createExpressionSourceNode(
                ['tools.createInstance(namespaceScope, '].concat(
                    interpret(node.className, {allowBareword: true, getValue: true}),
                    ', [',
                    argChunks,
                    '])'
                ),
                node
            );
        },
        'N_NOWDOC': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                ['tools.valueFactory.createString(', JSON.stringify(node.string), ')'],
                node
            );
        },
        'N_NULL': function (node, interpret, context) {
            return context.createExpressionSourceNode(['tools.valueFactory.createNull()'], node);
        },
        'N_OBJECT_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                interpret(node.value, {getValue: true}).concat('.coerceToObject()'),
                node
            );
        },
        'N_OBJECT_PROPERTY': function (node, interpret, context) {
            var objectVariableCodeChunks,
                propertyCodeChunks = [],
                suffix = '';

            if (context.assignment) {
                objectVariableCodeChunks = [
                    'tools.implyObject(',
                    interpret(node.object, {getValue: false}),
                    ')'
                ];
            } else {
                if (context.getValue !== false) {
                    suffix = '.getValue()';
                }

                objectVariableCodeChunks = interpret(node.object, {getValue: true});
            }

            _.each(node.properties, function (property, index) {
                var nameValue = interpret(property.property, {assignment: false, getValue: true, allowBareword: true});

                propertyCodeChunks.push('.getInstancePropertyByName(', nameValue, ')');

                if (index < node.properties.length - 1) {
                    propertyCodeChunks.push('.getValue()');
                }
            });

            return context.createExpressionSourceNode(
                [objectVariableCodeChunks, propertyCodeChunks, suffix],
                node
            );
        },
        'N_PARENT': function (node, interpret, context) {
            if (context.isConstantOrProperty) {
                // Wrap in a tools method call, so that a fatal error can be thrown if the class has no parent
                return context.createExpressionSourceNode(
                    ['tools.getParentClassName(currentClass)'],
                    node
                );
            }

            return context.createExpressionSourceNode(['scope.getParentClassNameOrThrow()'], node);
        },
        'N_PRINT_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    '(stdout.write(',
                    interpret(node.operand, {getValue: true}),
                    '.coerceToString().getNative()), tools.valueFactory.createInteger(1))'
                ],
                node
            );
        },
        'N_PROGRAM': function (node, interpret, options) {
            var bareMode,
                body = [],
                compiledBody,
                compiledSourceMap,
                createSourceNode,
                createSpecificSourceNode,
                filePath = options ? options[PATH] : null,
                labelRepository = new LabelRepository(),
                translator,
                context = {
                    // Whether source map is to be built will be set later based on options
                    blockContexts: [],
                    buildingSourceMap: null,
                    // Optimized SourceNode factories will be defined later depending on mode
                    createExpressionSourceNode: null,
                    createInternalSourceNode: null,
                    createStatementSourceNode: null,
                    currentNamespace: '', // We're in the global namespace by default
                    labelRepository: labelRepository,
                    lineNumbers: null,
                    /**
                     * Raises a PHPFatalError for the given translation key, variables and AST node
                     *
                     * @param {string} translationKey
                     * @param {object} node
                     * @param {Object.<String, string>=} placeholderVariables
                     * @throws {PHPFatalError}
                     */
                    raiseError: function (translationKey, node, placeholderVariables) {
                        var message = translator.translate(translationKey, placeholderVariables),
                            lineNumber = node.bounds ? node.bounds.start.line : null;

                        throw new PHPFatalError(message, filePath, lineNumber);
                    },
                    tick: null,
                    variableMap: {}
                },
                labels,
                name,
                pendingLabelGotoNode,
                sourceMap,
                sourceMapOptions;

            options = _.extend({
                'runtimePath': 'phpruntime'
            }, options);

            name = options[RUNTIME_PATH];
            bareMode = options[BARE] === true;
            sourceMapOptions = options[SOURCE_MAP] ?
                (options[SOURCE_MAP] === true ? {} : options[SOURCE_MAP]) :
                null;

            translator = options[TRANSLATOR] || new Translator();
            // Add our transpilation-related messages to the translator
            // (note that these may be overridden later by an external library)
            translator.addTranslations(transpilerMessages);

            context.buildingSourceMap = !!sourceMapOptions;
            context.lineNumbers = !!options.lineNumbers;
            context.tick = !!options.tick;

            // Define optimized SourceNode factory, depending on mode
            if (node.bounds) {
                createSourceNode = function (node, chunks, name) {
                    // Lines are 1-based, but columns are 0-based
                    return new SourceNode(node.bounds.start.line, node.bounds.start.column - 1, filePath, chunks, name);
                };

                if (context.lineNumbers) {
                    // For efficiency, line number tracking is done by just assigning to this local `line` variable
                    // before every statement/expression rather than calling a method. This function
                    // allows the line number to be read later
                    body.push('var line;tools.instrument(function () {return line;});');

                    context.createExpressionSourceNode = function (chunks, node, name) {
                        if (chunks.length === 0) {
                            // Allow detecting empty comma expressions etc. by returning an empty array
                            // rather than an array containing an empty SourceNode
                            return [];
                        }

                        return [createSourceNode(node, ['(line = ' + node.bounds.start.line + ', ', chunks, ')'], name)];
                    };
                    // "Internal" nodes are those that do not map directly back to a PHP construct,
                    // or where we do not need them to. For example, a function declaration's name
                    context.createInternalSourceNode = function (chunks, node, name) {
                        if (chunks.length === 0) {
                            // Allow detecting empty comma expressions etc. by returning an empty array
                            // rather than an array containing an empty SourceNode
                            return [];
                        }

                        // Lines are 1-based, but columns are 0-based
                        return [createSourceNode(node, chunks, name)];
                    };
                    context.createStatementSourceNode = function (chunks, node, name) {
                        if (chunks.length === 0) {
                            // Allow detecting empty comma expressions etc. by returning an empty array
                            // rather than an array containing an empty SourceNode
                            return [];
                        }

                        // Lines are 1-based, but columns are 0-based
                        return [createSourceNode(
                            node,
                            [
                                'line = ' + node.bounds.start.line + ';',
                                context.tick ?
                                    // Ticking is enabled, so add a call to the tick callback before each statement
                                    'tools.tick(' + [
                                        node.bounds.start.line,
                                        node.bounds.start.column,
                                        node.bounds.end.line,
                                        node.bounds.end.column
                                    ].join(', ') + ');' :
                                    '',
                                chunks
                            ],
                            name
                        )];
                    };
                } else {
                    createSpecificSourceNode = function (chunks, node, name) {
                        if (chunks.length === 0) {
                            // Allow detecting empty comma expressions etc. by returning an empty array
                            // rather than an array containing an empty SourceNode
                            return [];
                        }

                        // Lines are 1-based, but columns are 0-based
                        return [createSourceNode(node, chunks, name)];
                    };

                    context.createExpressionSourceNode = createSpecificSourceNode;
                    context.createInternalSourceNode = createSpecificSourceNode;
                    context.createStatementSourceNode = function (chunks, node, name) {
                        return [createSourceNode(
                            node,
                            [
                                context.tick ?
                                    // Ticking is enabled, so add a call to the tick callback before each statement
                                    'tools.tick(' + [
                                        node.bounds.start.line,
                                        node.bounds.start.column,
                                        node.bounds.end.line,
                                        node.bounds.end.column
                                    ].join(', ') + ');' :
                                    '',
                                chunks
                            ],
                            name
                        )];
                    };
                }
            } else {
                if (context.buildingSourceMap) {
                    throw new Error('Source map enabled, but AST contains no node bounds');
                }

                if (context.lineNumbers) {
                    throw new Error('Line number tracking enabled, but AST contains no node bounds');
                }

                if (context.tick) {
                    throw new Error('Ticking enabled, but AST contains no node bounds');
                }

                createSpecificSourceNode = function (chunks) {
                    // Just return the chunks array: all chunks will be flattened
                    // into the final concatenated string by one outer SourceNode object in this mode
                    return chunks;
                };

                context.createExpressionSourceNode = createSpecificSourceNode;
                context.createInternalSourceNode = createSpecificSourceNode;
                context.createStatementSourceNode = createSpecificSourceNode;
            }

            if (options[MODE] && options[SYNC]) {
                throw new Error('Only one of "mode" and "sync" options should be specified');
            }

            if (options[MODE] === 'sync' || options[SYNC]) {
                // Synchronous mode
                name += '/sync';
            } else if (options[MODE] === 'psync') {
                // Promise-synchronous mode
                name += '/psync';
            } else if (options[MODE] && options[MODE] !== 'async') {
                throw new Error('Invalid mode "' + options[MODE] + '" given');
            }

            body.push(processBlock(hoistDeclarations(node.statements), interpret, context));

            if (labelRepository.hasPending()) {
                // After processing the root body of the program, one or more gotos were found targetting labels
                // that were never defined, so throw a compile-time fatal error
                pendingLabelGotoNode = labelRepository.getFirstPendingLabelGotoNode();

                context.raiseError(GOTO_TO_UNDEFINED_LABEL, pendingLabelGotoNode.label, {
                    'label': pendingLabelGotoNode.label.string
                });
            }

            if (context.buildingSourceMap) {
                _.forOwn(context.variableMap, function (t, name) {
                    body.unshift('var $' + name + ' = tools.createDebugVar(scope, "' + name + '");');
                });
            }

            labels = context.labelRepository.getLabels();

            if (labels.length > 0) {
                body.unshift('var goingToLabel_' + labels.join(' = false, goingToLabel_') + ' = false;');
            }

            body.unshift('var namespaceScope = tools.topLevelNamespaceScope, namespaceResult, scope = tools.topLevelScope, currentClass = null;');

            // Program returns null rather than undefined if nothing is returned
            body.push('return tools.valueFactory.createNull();');

            // Wrap program in function for passing to runtime
            body = ['function (stdin, stdout, stderr, tools, namespace) {'].concat(body, '}');

            if (!bareMode) {
                body = ['require(\'' + name + '\').compile('].concat(body, ')');
            }

            // Allow some predefined code to be prepended to the output,
            // but included in source map calculations
            if (options[PREFIX]) {
                body.unshift(options[PREFIX]);
            }

            // Allow some predefined code to be appended to the output,
            // but included in source map calculations
            if (options[SUFFIX]) {
                body.push(options[SUFFIX]);
            }

            if (!bareMode) {
                body.push(';');
            }

            // Don't provide a line or column number for the program node itself
            sourceMap = new SourceNode(null, null, filePath, body);

            if (context.buildingSourceMap) {
                if (sourceMapOptions[SOURCE_CONTENT]) {
                    // The original source PHP for the module will be embedded inside the source map itself
                    sourceMap.setSourceContent(filePath, sourceMapOptions[SOURCE_CONTENT]);
                }

                compiledSourceMap = sourceMap.toStringWithSourceMap();

                if (sourceMapOptions[RETURN_SOURCE_MAP]) {
                    // Return the source map data object rather than embedding it in a comment,
                    // much more efficient when we need to hand the source map data off
                    // to the next processor in a chain, eg. for Webpack when used with PHPify
                    return {
                        code: compiledSourceMap.code,
                        map: compiledSourceMap.map.toJSON() // Data object, not actually stringified to JSON
                    };
                }

                // Append a source map comment containing the entire source map data as a data: URI,
                // in the form `//# sourceMappingURL=data:application/json;base64,...`
                compiledBody = compiledSourceMap.code + '\n\n' +
                    sourceMapToComment(compiledSourceMap.map.toJSON()) + '\n';
            } else {
                compiledBody = sourceMap.toString();
            }

            return compiledBody;
        },
        'N_REFERENCE': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                interpret(node.operand, {getValue: false}).concat('.getReference()'),
                node
            );
        },
        'N_REQUIRE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                ['tools.require('].concat(interpret(node.path), '.getNative(), scope)'),
                node
            );
        },
        'N_REQUIRE_ONCE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                ['tools.requireOnce('].concat(interpret(node.path), '.getNative(), scope)'),
                node
            );
        },
        'N_RETURN_STATEMENT': function (node, interpret, context) {
            var expression = node.expression ? interpret(node.expression) : null;

            return context.createStatementSourceNode(
                ['return '].concat(expression ? expression : 'tools.valueFactory.createNull()', ';'),
                node
            );
        },
        'N_SELF': function (node, interpret, context) {
            if (context.isConstantOrProperty) {
                return context.createExpressionSourceNode(
                    ['currentClass'],
                    node
                );
            }

            return context.createExpressionSourceNode(['scope.getClassNameOrThrow()'], node);
        },
        'N_STATIC': function (node, interpret, context) {
            return context.createExpressionSourceNode(['scope.getStaticClassNameOrThrow()'], node);
        },
        'N_STATIC_METHOD_CALL': function (node, interpret, context) {
            var argChunks = [],
                isForwarding = node.className.name === 'N_SELF' ||
                    node.className.name === 'N_PARENT' ||
                    node.className.name === 'N_STATIC';

            _.each(node.args, function (arg, index) {
                if (index > 0) {
                    argChunks.push(', ');
                }

                argChunks.push(interpret(arg, {getValue: false}));
            });

            return context.createExpressionSourceNode(
                [
                    interpret(node.className, {allowBareword: true}),
                    '.callStaticMethod(',
                    interpret(node.method, {allowBareword: true}),
                    ', [',
                    argChunks,
                    '], namespaceScope, ' +
                    !!isForwarding +
                    ')'
                ],
                node
            );
        },
        'N_STATIC_METHOD_DEFINITION': function (node, interpret, context) {
            var extraArgChunks = buildExtraFunctionDefinitionArgChunks([
                {
                    name: 'args',
                    value: interpretFunctionArgs(node.args, interpret),
                    emptyValue: '[]'
                },
                {
                    name: 'line',
                    value: context.lineNumbers ?
                        ['' + node.bounds.start.line] :
                        null,
                    emptyValue: 'null'
                }
            ]);

            return {
                name: node.method.string,
                body: context.createInternalSourceNode(
                    ['{isStatic: true, method: '].concat(
                        interpretFunction(node.method, node.args, null, node.body, interpret, context),
                        extraArgChunks,
                        '}'
                    ),
                    node
                )
            };
        },
        'N_STATIC_PROPERTY': function (node, interpret, context) {
            var classVariableCode = interpret(node.className, {getValue: true, allowBareword: true}),
                propertyCodeChunks = ['.getStaticPropertyByName('].concat(
                    interpret(node.property, {assignment: false, getValue: true, allowBareword: true}),
                    ', namespaceScope)'
                ),
                suffix = '';

            if (!context.assignment && context.getValue !== false) {
                suffix = '.getValue()';
            }

            return context.createExpressionSourceNode(
                classVariableCode.concat(propertyCodeChunks, suffix),
                node
            );
        },
        'N_STATIC_PROPERTY_DEFINITION': function (node, interpret, context) {
            return {
                name: node.variable.variable,
                visibility: JSON.stringify(node.visibility),
                value: context.createInternalSourceNode(
                    // TODO: Is this currentClass param needed?
                    ['function (currentClass) { return '].concat(node.value ? interpret(node.value, {isConstantOrProperty: true}) : ['tools.valueFactory.createNull()'], '; }'),
                    node
                )
            };
        },
        'N_STATIC_STATEMENT': function (node, interpret, context) {
            var code = '';

            _.each(node.variables, function (declarator) {
                code += 'scope.importStatic(' + JSON.stringify(declarator.variable.variable);

                if (declarator.initialiser) {
                    // An initialiser will be evaluated only once and assigned to the variable
                    // the first time the function it's in is called - subsequent calls to the function
                    // will have access to the most recent value of the variable.
                    code += ', ' + interpret(declarator.initialiser);
                }

                code += ');';
            });

            return context.createStatementSourceNode([code], node);
        },
        'N_STRING': function (node, interpret, context) {
            if (context.allowBareword) {
                return context.createExpressionSourceNode(
                    ['tools.valueFactory.createBarewordString(' + JSON.stringify(node.string) + ')'],
                    node
                );
            }

            return context.createExpressionSourceNode(
                ['namespaceScope.getConstant(' + JSON.stringify(node.string) + ')'],
                node
            );
        },
        'N_STRING_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                interpret(node.value, {getValue: true}).concat('.coerceToString()'),
                node
            );
        },
        'N_STRING_EXPRESSION': function (node, interpret, context) {
            var codeChunks = [];

            _.each(node.parts, function (part, index) {
                if (index > 0) {
                    codeChunks.push(' + ');
                }

                codeChunks.push(interpret(part), '.coerceToString().getNative()');
            });

            return context.createExpressionSourceNode(
                ['tools.valueFactory.createString('].concat(codeChunks, ')'),
                node
            );
        },
        'N_STRING_LITERAL': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                ['tools.valueFactory.createString(' + JSON.stringify(node.string) + ')'],
                node
            );
        },
        'N_SUPPRESSED_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    '(function (scope) {scope.suppressErrors();' +
                    'var result = '
                ].concat(
                    interpret(node.expression),
                    ';' +
                    'scope.unsuppressErrors(); return result;}(scope))'
                ),
                node
            );
        },
        'N_SWITCH_STATEMENT': function (node, interpret, context) {
            var codeChunks = [],
                labelRepository = context.labelRepository,
                labelsInsideLoopHash = {},
                // Record which labels have gotos to labels that are not yet defined,
                // meaning they could be defined either inside the switch body (invalid) or afterwards
                priorPendingLabelsHash = labelRepository.getPendingLabelsHash(),
                expressionCode = interpret(node.expression),
                blockContexts = context.blockContexts.concat(['switch']),
                subContext = {
                    blockContexts: blockContexts
                };

            codeChunks.push(
                'var switchExpression_' + blockContexts.length + ' = ',
                expressionCode,
                ',' +
                ' switchMatched_' + blockContexts.length + ' = false;'
            );

            function onFoundLabel(labelNode) {
                var label = labelNode.label.string;

                labelsInsideLoopHash[label] = true;

                if (hasOwn.call(priorPendingLabelsHash, label)) {
                    // A goto above this switch (but within the same function)
                    // is attempting to jump forward into it
                    context.raiseError(GOTO_DISALLOWED, priorPendingLabelsHash[label].label);
                }
            }

            labelRepository.on('found label', onFoundLabel);

            _.each(node.cases, function (caseNode) {
                codeChunks.push(interpret(caseNode, subContext));
            });

            labelRepository.off('found label', onFoundLabel);

            labelRepository.on('goto label', function (gotoNode) {
                var label = gotoNode.label.string;

                if (labelsInsideLoopHash[label] === true) {
                    // A goto below this switch (but within the same function)
                    // is attempting to jump backward into it
                    context.raiseError(GOTO_DISALLOWED, gotoNode.label);
                }
            });

            return context.createStatementSourceNode(
                ['block_' + blockContexts.length + ': {', codeChunks, '}'],
                node
            );
        },
        'N_TERNARY': function (node, interpret, context) {
            var condition = interpret(node.condition, {getValue: true}),
                consequent,
                expression;

            if (node.consequent) {
                consequent = interpret(node.consequent);
            } else {
                // Handle shorthand ternary
                condition = ['(tools.ternaryCondition = ', condition, ')'];
                consequent = 'tools.ternaryCondition';
            }

            expression = [
                '(',
                condition,
                '.coerceToBoolean().getNative() ? ',
                consequent,
                ' : ',
                interpret(node.alternate),
                ')'
            ];

            return context.createExpressionSourceNode(expression, node);
        },
        'N_THROW_STATEMENT': function (node, interpret, context) {
            return context.createStatementSourceNode(
                ['throw ', interpret(node.expression), ';'],
                node
            );
        },
        'N_TRY_STATEMENT': function (node, interpret, context) {
            var catchCodesChunks = [],
                codeChunks = [];

            _.each(node.catches, function (catchNode, index) {
                var catchCodeChunks = [
                    'if (', interpret(catchNode.type, {allowBareword: true}), '.isTheClassOfObject(e, namespaceScope).getNative()) {',
                    interpret(catchNode.variable, {getValue: false}), '.setValue(e);',
                    interpret(catchNode.body),
                    '}'
                ];

                if (index > 0) {
                    catchCodeChunks.unshift(' else ');
                }

                catchCodesChunks.push(catchCodeChunks);
            });

            [].push.apply(codeChunks, catchCodesChunks);

            if (node.catches.length > 0) {
                codeChunks.unshift('if (!tools.valueFactory.isValue(e)) {throw e;}');
                codeChunks.push(' else { throw e; }');
            } else {
                codeChunks.push('throw e;');
            }

            codeChunks.unshift('try {', interpret(node.body), '} catch (e) {');
            codeChunks.push('}');

            if (node.finalizer) {
                codeChunks.push(' finally {', interpret(node.finalizer), '}');
            }

            return context.createStatementSourceNode(codeChunks, node);
        },
        'N_UNARY_EXPRESSION': function (node, interpret, context) {
            var operator = node.operator,
                operand = interpret(node.operand, {getValue: operator !== '++' && operator !== '--'});

            return context.createExpressionSourceNode(
                [operand, '.' + unaryOperatorToMethod[node.prefix ? 'prefix' : 'suffix'][operator] + '()'],
                node
            );
        },
        'N_UNSET_CAST': function (node, interpret, context) {
            // Unset cast coerces all values to NULL
            return context.createExpressionSourceNode(
                ['(', interpret(node.value, {getValue: true}), ', tools.valueFactory.createNull())'],
                node
            );
        },
        'N_UNSET_STATEMENT': function (node, interpret, context) {
            var statementChunks = [];

            _.each(node.variables, function (variableNode, index) {
                if (index > 0) {
                    statementChunks.push('; ');
                }

                statementChunks.push(interpret(variableNode, {getValue: false}), '.unset()');
            });

            statementChunks.push(';');

            return context.createStatementSourceNode(statementChunks, node);
        },
        'N_USE_STATEMENT': function (node, interpret, context) {
            var code = '';

            _.each(node.uses, function (use) {
                if (use.alias) {
                    code += 'namespaceScope.use(' + JSON.stringify(use.source) + ', ' + JSON.stringify(use.alias) + ');';
                } else {
                    code += 'namespaceScope.use(' + JSON.stringify(use.source) + ');';
                }
            });

            return context.createStatementSourceNode([code], node);
        },
        'N_VARIABLE': function (node, interpret, context) {
            context.variableMap[node.variable] = true;

            /*
             * TODO: To optimize bundle size, detect whether the current function ever sets
             *       a local variable's reference (or if a parameter, whether it is by-reference).
             *       If so then we need to access it via scope.getVariable(...), but otherwise
             *       (as should be the case in 90% of cases) we can use a JS local variable
             *       with a closure at the end to register with the runtime for fetching the variable
             *       as required by variable-variables for example.
             */
            return context.createExpressionSourceNode(
                ['scope.getVariable("' + node.variable + '")' + (context.getValue !== false ? '.getValue()' : '')],
                node,
                '$' + node.variable
            );
        },
        'N_VARIABLE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    'scope.getVariable(',
                    interpret(node.expression),
                    '.getNative())' + (context.getValue !== false ? '.getValue()' : '')
                ],
                node
            );
        },
        'N_VOID': function (node, interpret, context) {
            return context.createExpressionSourceNode(['tools.referenceFactory.createNull()'], node);
        },
        'N_WHILE_STATEMENT': function (node, interpret, context) {
            var blockContexts = context.blockContexts.concat(['while']),
                labelRepository = context.labelRepository,
                labelsInsideLoopHash = {},
                // Record which labels have gotos to labels that are not yet defined,
                // meaning they could be defined either inside the loop body (invalid) or afterwards
                priorPendingLabelsHash = labelRepository.getPendingLabelsHash(),
                subContext = {
                    blockContexts: blockContexts
                },
                conditionChunks = interpret(node.condition, subContext),
                codeChunks;

            function onFoundLabel(labelNode) {
                var label = labelNode.label.string;

                labelsInsideLoopHash[label] = true;

                if (hasOwn.call(priorPendingLabelsHash, label)) {
                    // A goto above this while loop (but within the same function)
                    // is attempting to jump forward into it
                    context.raiseError(GOTO_DISALLOWED, priorPendingLabelsHash[label].label);
                }
            }

            labelRepository.on('found label', onFoundLabel);

            codeChunks = interpret(node.body, subContext);

            labelRepository.off('found label', onFoundLabel);

            labelRepository.on('goto label', function (gotoNode) {
                var label = gotoNode.label.string;

                if (labelsInsideLoopHash[label] === true) {
                    // A goto below this while loop (but within the same function)
                    // is attempting to jump backward into it
                    context.raiseError(GOTO_DISALLOWED, gotoNode.label);
                }
            });

            return context.createStatementSourceNode(
                [
                    'block_' + blockContexts.length + ': while (',
                    conditionChunks,
                    '.coerceToBoolean().getNative()) {',
                    codeChunks,
                    '}'
                ],
                node
            );
        }
    }
};
