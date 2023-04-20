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
    FUNCTION_STACK_MARKER = '__uniterFunctionStackMarker__',
    MODE = 'mode',
    MODULE_STACK_MARKER = '__uniterModuleStackMarker__',
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

    binaryOperatorToOpcode = {
        '+': 'add',
        '-': 'subtract',
        '*': 'multiply',
        '/': 'divide',
        '.': 'concat',
        '%': 'modulo',
        '&': 'bitwiseAnd',
        '|': 'bitwiseOr',
        '^': 'bitwiseXor',
        '<<': 'shiftLeft',
        '>>': 'shiftRight',
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
        '==': 'isEqual',
        '!=': 'isNotEqual',
        '<>': 'isNotEqual',
        '===': 'isIdentical',
        '!==': 'isNotIdentical',
        '<': 'isLessThan',
        '<=': 'isLessThanOrEqual',
        '>': 'isGreaterThan',
        '>=': 'isGreaterThanOrEqual',
        '=': {
            'false': 'setValue',
            'true': 'setReference'
        },
        // Note that XOR is the only operator here, as the others require
        // special short-circuit evaluation handling.
        'xor': 'logicalXor'
    },
    hasOwn = {}.hasOwnProperty,
    phpCommon = require('phpcommon'),
    sourceMap = require('source-map'),
    sourceMapToComment = require('source-map-to-comment'),
    transpilerMessages = require('./builtin/messages/transpiler'),
    unaryOperatorToMethod = {
        prefix: {
            '+': 'identity',
            '-': 'negate',
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

/**
 * Hoists declaration statements to the top of a given code block,
 * sorting class and interface declarations to allow for forward-references.
 *
 * Note that as interfaces are always sorted above classes, there is no need
 * to take implemented interfaces into account while sorting classes.
 *
 * @param {Object[]} statements
 * @returns {Object[]}
 */
function hoistDeclarations(statements) {
    var classDeclarations = [],
        classNameToReferencesMap = {},
        declarations = [],
        interfaceDeclarations = [],
        interfaceNameToReferencesMap = {},
        nonDeclarations = [],
        skipHoisting = false;

    // FIXME: Note that class and interface references should be resolved relative
    //        to the current namespace scope, but resolution is currently done at runtime.

    _.each(statements, function (statement) {
        var references;

        if (statement.name === 'N_CLASS_STATEMENT') {
            classDeclarations.push(statement);
            references = [];

            if (statement.extend) {
                // Class extends another, so add the parent class as a reference.
                references.push(statement.extend);
            }

            // Note that we do not need to include any interfaces implemented,
            // as those will always be hoisted above classes.

            classNameToReferencesMap[statement.className] = references;
        } else if (statement.name === 'N_INTERFACE_STATEMENT') {
            interfaceDeclarations.push(statement);

            interfaceNameToReferencesMap[statement.interfaceName] = statement.extend || [];
        } else if (statement.name === 'N_USE_STATEMENT') {
            if (classDeclarations.length > 0 || interfaceDeclarations.length > 0) {
                /*
                 * A "use" statement is defined after a class or interface -
                 * skip hoisting for now to preserve "Cannot use ..." fatal error behaviour.
                 *
                 * TODO: When NamespaceScope concept is removed, this logic should be improved.
                 */
                skipHoisting = true;

                return false;
            }

            declarations.push(statement);
        } else if (statement.name === 'N_FUNCTION_STATEMENT') {
            // Note that no special sorting of functions should be required.
            declarations.push(statement);
        } else {
            nonDeclarations.push(statement);
        }
    });

    if (skipHoisting) {
        // TODO: This is an incomplete solution: see notes above.
        return statements;
    }

    /**
     * Determines whether another class or interface is an ancestor of the given class or interface.
     *
     * @param {Object.<string, string[]>} nameToReferencesMap
     * @param {string} className
     * @param {string} ancestorName
     * @returns {boolean}
     */
    function classHasAncestor(nameToReferencesMap, className, ancestorName) {
        var i,
            references = nameToReferencesMap[className] || [];

        if (references.length === 0) {
            // Class does not refer to any parent so cannot have the specified ancestor.
            return false;
        }

        if (references.indexOf(ancestorName) !== -1) {
            // Easy case: ancestor is a direct parent of the class or interface.
            return true;
        }

        // Walk up the hierarchy of the class (within this block), looking for the ancestor.
        for (i = 0; i < references.length; i++) {
            if (classHasAncestor(nameToReferencesMap, references[i], ancestorName)) {
                return true;
            }
        }

        // Given name is not an ancestor of the given class.
        return false;
    }

    interfaceDeclarations.sort(function (statementA, statementB) {
        if (classHasAncestor(interfaceNameToReferencesMap, statementB.interfaceName, statementA.interfaceName)) {
            // B extends A (or a descendant of A), so A needs to be declared first.
            return -1;
        }

        if (classHasAncestor(interfaceNameToReferencesMap, statementA.interfaceName, statementB.interfaceName)) {
            // A extends B (or a descendant of B), so B needs to be declared first.
            return 1;
        }

        return 0; // Neither interface references the other, so there is no order to apply.
    });

    classDeclarations.sort(function (statementA, statementB) {
        if (classHasAncestor(classNameToReferencesMap, statementB.className, statementA.className)) {
            // B extends A (or a descendant of A), so A needs to be declared first.
            return -1;
        }

        if (classHasAncestor(classNameToReferencesMap, statementA.className, statementB.className)) {
            // A extends B (or a descendant of B), so B needs to be declared first.
            return 1;
        }

        return 0; // Neither class references the other, so there is no order to apply.
    });

    return declarations.concat(interfaceDeclarations, classDeclarations, nonDeclarations);
}

function interpretFunction(nameNode, argNodes, bindingNodes, statementNode, interpret, context) {
    var argumentAssignmentChunks = [],
        bindingAssignmentChunks = [],
        coreSymbolsUsed = {},
        coreSymbolDeclarators = [],
        labelRepository = new LabelRepository(),
        labels,
        loopIndex = 0,
        pendingLabelGotoNode,
        useCoreSymbol = function (name) {
            if (name === 'line' || name === 'ternaryCondition') {
                coreSymbolsUsed[name] = true;

                return name;
            }

            return context.useCoreSymbol(name);
        },
        subContext = {
            // This sub-context will be merged with the parent one,
            // so we need to override any value for the `assignment` option.
            assignment: undefined,
            blockContexts: [],
            labelRepository: labelRepository,
            nextLoopIndex: function () {
                return loopIndex++;
            },
            useCoreSymbol: useCoreSymbol,
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
            bindingAssignmentChunks.push(
                'var $' + name + ' = ',
                useCoreSymbol('createDebugVar'),
                '("' + name + '");'
            );
        });
    }

    if (context.lineNumbers) {
        useCoreSymbol('line');
    }

    _.each(bindingNodes, function (bindingNode) {
        // TODO: Consider loading bindings in the runtime (and not via opcodes) as we now do for parameter arguments.
        var isReference = bindingNode.name === 'N_REFERENCE',
            assignmentOpcode = isReference ? 'setReference' : 'setValue',
            bindingOpcode = isReference ? 'getReferenceBinding': 'getValueBinding',
            variableName = isReference ? bindingNode.operand.variable : bindingNode.variable;

        bindingAssignmentChunks.push(
            useCoreSymbol(assignmentOpcode),
            '(',
            useCoreSymbol('getVariable'),
            '(',
            JSON.stringify(variableName),
            '))(',
            useCoreSymbol(bindingOpcode),
            '(',
            JSON.stringify(variableName),
            ')',
            ');'
        );

        if (context.buildingSourceMap) {
            bindingAssignmentChunks.push(
                'var ',
                context.createInternalSourceNode(
                    ['$' + variableName],
                    isReference ? bindingNode.operand : bindingNode,
                    '$' + variableName
                ),
                ' = ',
                useCoreSymbol('createDebugVar'),
                '("' + variableName + '");'
            );
        }
    });

    // Copy passed values for any arguments
    if (context.buildingSourceMap) {
        _.each(argNodes, function (argNode) {
            var isReference = argNode.variable.name === 'N_REFERENCE',
                variableNode = isReference ? argNode.variable.operand : argNode.variable,
                variable = variableNode.variable;

            argumentAssignmentChunks.push(
                'var $' + variable + ' = ',
                useCoreSymbol('createDebugVar'),
                '("' + variable + '");'
            );
        });
    }

    // Prepend parts in correct order
    body = [argumentAssignmentChunks, bindingAssignmentChunks].concat(body);

    _.each(Object.keys(coreSymbolsUsed).sort(), function (name) {
        var declarator = name;

        if (name !== 'line' && name !== 'ternaryCondition') {
            declarator += ' = core.' + name;
        }

        coreSymbolDeclarators.push(declarator);
    });

    // Build function expression
    body = [
        'function ',
        nameNode ? context.createInternalSourceNode(['_' + nameNode.string], nameNode, nameNode.name) : '',
        context.stackCleaning ? FUNCTION_STACK_MARKER : '',
        '() {',
        coreSymbolDeclarators.length > 0 ?
            'var ' + coreSymbolDeclarators.join(', ') + ';' :
            '',
        // Add instrumentation code for fetching the current line number for this call if enabled
        context.lineNumbers ?
            [useCoreSymbol('instrument'), '(function () {return ', useCoreSymbol('line'), ';});'] :
            '',
        body,
        '}'
    ];

    return body;
}

/**
 * Produces an array containing the name and type of bindings for a closure.
 *
 * @param {Array} bindingNodes
 * @returns {Array}
 */
function interpretClosureBindings(bindingNodes) {
    var allBindingCodeChunks = [];

    if (bindingNodes.length === 0) {
        // Closure has no bindings: nothing to do.
        return [];
    }

    _.each(bindingNodes, function (bindingNode) {
        var isReference = bindingNode.name === 'N_REFERENCE',
            variableName = isReference ? bindingNode.operand.variable : bindingNode.variable,
            bindingData = {name: variableName};

        if (isReference) {
            // Omit the .ref property if false to save on bundle size.
            bindingData.ref = true;
        }

        allBindingCodeChunks.push(JSON.stringify(bindingData));
    });

    return ['[', allBindingCodeChunks.join(','), ']'];
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

/**
 * Transpiles an array of statements that constitute a code block (usually wrapped in braces).
 * Handles label statements and goto.
 *
 * @param {Object[]} statements
 * @param {Function} interpret
 * @param {Object} context
 * @param {LabelRepository} labelRepository
 * @returns {*[]}
 */
function processBlock(statements, interpret, context, labelRepository) {
    var codeChunks = [],
        labelsWithBackwardJumpLoopAdded = {},
        labelsWithForwardJumpBlockAdded = {},
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
            /*
             * When jumping backwards, we need to be able to skip over any code between the start
             * of the function (as we jump back to the top of the special loop added around the entire function)
             * and the target statement. Each nested block will need a separate jump-if.
             */
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
                [context.useCoreSymbol('coerceToArray'), '(', interpret(node.value), ')'],
                node
            );
        },
        'N_ARRAY_INDEX': function (node, interpret, context) {
            var indexNative = null;

            if (node.index) {
                if (node.index.name === 'N_STRING_LITERAL') {
                    indexNative = JSON.stringify(node.index.string);
                } else if (node.index.name === 'N_INTEGER') {
                    indexNative = node.index.number;
                }
            }

            return context.createExpressionSourceNode(
                node.index === null ?
                    [
                        context.useCoreSymbol('pushElement'),
                        '(',
                        interpret(node.array),
                        ')'
                    ] :
                    indexNative === null ?
                        [
                            context.useCoreSymbol('getVariableElement'),
                            '(',
                            interpret(node.array),
                            ')(',
                            interpret(node.index),
                            ')'
                        ] :
                        [
                            context.useCoreSymbol('getElement'),
                            '(',
                            interpret(node.array),
                            ', ',
                            String(indexNative),
                            ')'
                        ],
                node
            );
        },
        'N_ARRAY_LITERAL': function (node, interpret, context) {
            var allElementChunks = [];

            _.each(node.elements, function (element, index) {
                var elementChunks;

                if (index > 0) {
                    allElementChunks.push(')(');
                }

                elementChunks = (element.name === 'N_REFERENCE') ?
                    [
                        context.useCoreSymbol('createReferenceElement'),
                        '(',
                        interpret(element.operand),
                        ')'
                    ] :
                    interpret(element);

                allElementChunks.push(elementChunks);
            });

            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('createArray'),
                    // Only append elements if non-empty.
                    allElementChunks.length > 0 ?
                        ['(', allElementChunks, ')'] :
                        [],
                    '()'
                ],
                node
            );
        },
        'N_ARRAY_TYPE': function () {
            return '"type":"array"';
        },
        'N_BINARY_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('coerceToString'), '(', interpret(node.value), ')'],
                node
            );
        },
        'N_BINARY_LITERAL': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('createString'), '(', JSON.stringify(node.string), ')'],
                node
            );
        },
        'N_BOOLEAN': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol(String(node.bool) + 'Value')],
                node
            );
        },
        'N_BOOLEAN_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('coerceToBoolean'), '(', interpret(node.value), ')'],
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
            var bodyChunks,
                switchExpressionVariable = 'switchExpression_' + context.blockContexts.length,
                switchMatchedVariable = 'switchMatched_' + context.blockContexts.length;

            // Process the body of the case as a block (despite it technically not being braced)
            // to allow for goto/label etc.
            bodyChunks = processBlock(node.body, interpret, context, context.labelRepository);

            return context.createStatementSourceNode(
                [
                    'if (',
                    // Allow for fall-through.
                    switchMatchedVariable +
                    ' || ',
                    // Otherwise, if not falling-through, check the case value against the switched one.
                    context.useCoreSymbol('switchCase'),
                    '(',
                    switchExpressionVariable,
                    ', ',
                    interpret(node.expression),
                    ')) {' + switchMatchedVariable + ' = true;',
                    bodyChunks,
                    '}'
                ],
                node
            );
        },
        'N_CLASS_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol(
                        node.className.name === 'N_SELF' ?
                            'getCurrentClassConstant' :
                            'getClassConstant'
                    ),
                    '(',
                    interpret(node.className, {allowBareword: true}),
                    ')(',
                    JSON.stringify(node.constant),
                    ')'
                ],
                node
            );
        },
        'N_CLASS_STATEMENT': function (node, interpret, context) {
            var codeChunks,
                constantCodeChunks = [],
                methodCodeChunks = [],
                propertyCodeChunks = [],
                staticPropertyCodeChunks = [],
                superClass = node.extend ? JSON.stringify(node.extend) : 'null',
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
                ', staticProperties: {',
                staticPropertyCodeChunks,
                '}, properties: {', propertyCodeChunks,
                '}, methods: {', methodCodeChunks,
                '}, constants: {', constantCodeChunks, '}}'
            ];

            return context.createStatementSourceNode(
                [
                    context.useCoreSymbol('defineClass'),
                    '(' + JSON.stringify(node.className) + ', ',
                    codeChunks,
                    ');'
                ],
                node
            );
        },
        'N_CLASS_TYPE': function (node) {
            return '"type":"class","className":' + JSON.stringify(node.className);
        },
        'N_CLONE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('clone'), '(', interpret(node.operand), ')'],
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
                        value: interpretClosureBindings(node.bindings),
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
                [
                    context.useCoreSymbol('createClosure'),
                    '(',
                    func,
                    extraArgChunks,
                    ')'
                ],
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
            return context.createInternalSourceNode(
                processBlock(node.statements, interpret, context, context.labelRepository),
                node
            );
        },
        'N_CONSTANT_DEFINITION': function (node, interpret, context) {
            return node.constants.map(function (constant) {
                return {
                    name: constant.constant,
                    value: context.createInternalSourceNode(
                        [
                            'function (currentClass) { return ',
                            interpret(constant.value, {isConstantOrProperty: true}),
                            '; }'
                        ],
                        constant
                    )
                };
            });
        },
        'N_CONSTANT_STATEMENT': function (node, interpret, context) {
            var codeChunks = [];

            _.each(node.constants, function (constant) {
                codeChunks.push(
                    context.useCoreSymbol('defineConstant'),
                    '(',
                    JSON.stringify(constant.constant),
                    ', ',
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
            var blockContexts = context.blockContexts,
                switchExpressionVariable = 'switchExpression_' + blockContexts.length,
                switchMatchedVariable = 'switchMatched_' + blockContexts.length,
                bodyChunks = [switchMatchedVariable + ' = true;'];

            // Process the body of the case as a block (despite it technically not being braced)
            // to allow for goto/label etc.
            bodyChunks.push(processBlock(node.body, interpret, context, context.labelRepository));

            return context.createInternalSourceNode(
                context.defaultCaseIsFinal ?
                    // This default case is the last one in the switch - no wrapping logic is necessary.
                    bodyChunks :
                    // This default case is not the last one, we need to wrap it in a condition.
                    [
                        'if (',
                        // Allow for fall-through.
                        switchMatchedVariable,
                        ' || ',
                        /*
                         * When all cases have failed to match the switched value,
                         * execution will jump back to the top of the transpiled switch
                         * with the variable set to native null rather than a Value object,
                         * allowing us to detect that the default case (which need not be the final one)
                         * should be used.
                         */
                        context.useCoreSymbol('switchDefault'),
                        '(' + switchExpressionVariable + ')',
                        ') {',
                        bodyChunks,
                        '}'
                    ],
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
                conditionChunks = interpret(node.condition, subContext),
                loopIndex = context.nextLoopIndex();

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
                [
                    'block_' + blockContexts.length + ': do {',
                    codeChunks,
                    '} while (',
                    context.useCoreSymbol('loop'),
                    '(',
                    String(loopIndex),
                    ', ',
                    conditionChunks,
                    '));'
                ],
                node
            );
        },
        'N_DOUBLE_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('coerceToFloat'), '(', interpret(node.value), ')'],
                node
            );
        },
        'N_ECHO_STATEMENT': function (node, interpret, context) {
            var chunks = [];

            _.each(node.expressions, function (expressionNode) {
                chunks.push(
                    context.useCoreSymbol('echo'),
                    '(',
                    interpret(expressionNode),
                    ');'
                );
            });

            return context.createStatementSourceNode(chunks, node);
        },
        'N_EMPTY': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('isEmpty'),
                    '()(',
                    interpret(node.variable),
                    ')'
                ],
                node
            );
        },
        'N_EVAL': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('eval'),
                    '(',
                    interpret(node.code),
                    ')'
                ],
                node
            );
        },
        'N_EXIT': function (node, interpret, context) {
            if (hasOwn.call(node, 'status')) {
                return context.createExpressionSourceNode(
                    [context.useCoreSymbol('exit'), '(', interpret(node.status), ')'],
                    node
                );
            }

            if (hasOwn.call(node, 'message')) {
                return context.createExpressionSourceNode(
                    [
                        '(',
                        context.useCoreSymbol('print'),
                        '(',
                        interpret(node.message),
                        '), ',
                        context.useCoreSymbol('exit'),
                        '())'
                    ],
                    node
                );
            }

            return context.createExpressionSourceNode([context.useCoreSymbol('exit'), '()'], node);
        },
        'N_EXPRESSION': function (node, interpret, context) {
            var chunks = [],
                isAssignment = /^(?:[-+*/.%&|^]|<<|>>)?=$/.test(node.right[0].operator),
                isReference,
                leftChunks = interpret(node.left, {assignment: isAssignment}),
                opcode,
                operation,
                rightOperand,
                transpiledRightOperand;

            if (node.right.length !== 1) {
                throw new Error('Deprecated: N_EXPRESSION should have exactly one operation');
            }

            operation = node.right[0];

            isReference = operation.operand.name === 'N_REFERENCE';
            rightOperand = isReference ?
                operation.operand.operand :
                operation.operand;

            transpiledRightOperand = interpret(rightOperand);

            // Handle logical 'and' specially as it can short-circuit
            if (operation.operator === '&&' || operation.operator === 'and') {
                chunks.push(
                    context.useCoreSymbol('createBoolean'),
                    '(',
                    context.useCoreSymbol('logicalTerm'),
                    '(',
                    leftChunks,
                    ') && ',
                    context.useCoreSymbol('logicalTerm'),
                    '(',
                    transpiledRightOperand,
                    '))'
                );
            // Handle logical 'or' specially as it can short-circuit
            } else if (operation.operator === '||' || operation.operator === 'or') {
                chunks.push(
                    context.useCoreSymbol('createBoolean'),
                    '(',
                    context.useCoreSymbol('logicalTerm'),
                    '(',
                    leftChunks,
                    ') || ',
                    context.useCoreSymbol('logicalTerm'),
                    '(',
                    transpiledRightOperand,
                    '))'
                );
            } else {
                opcode = binaryOperatorToOpcode[operation.operator];

                if (!opcode) {
                    throw new Error('Unsupported binary operator "' + operation.operator + '"');
                }

                if (_.isPlainObject(opcode)) {
                    opcode = opcode[isReference];
                }

                chunks.push(context.useCoreSymbol(opcode), '(', leftChunks, ')(', transpiledRightOperand, ')');
            }

            return context.createExpressionSourceNode(chunks, node);
        },
        'N_EXPRESSION_STATEMENT': function (node, interpret, context) {
            return context.createStatementSourceNode(interpret(node.expression).concat(';'), node);
        },
        'N_FLOAT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('createFloat'), '(' + node.number + ')'],
                node
            );
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
                loopIndex = context.nextLoopIndex(),
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
                conditionCodeChunks.unshift(', ');
            }

            return context.createStatementSourceNode(
                [
                    'block_' + blockContexts.length + ': for (',
                    initializerCodeChunks,
                    ';',
                    context.useCoreSymbol('loop'),
                    '(',
                    String(loopIndex),
                    conditionCodeChunks || [],
                    ');',
                    updateCodeChunks,
                    ') {',
                    bodyCodeChunks,
                    '}'
                ],
                node
            );
        },
        'N_FOREACH_STATEMENT': function (node, interpret, context) {
            var arrayValue = interpret(node.array),
                iteratorVariable,
                codeChunks = [],
                key = node.key ? interpret(node.key) : null,
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
                value = interpret(nodeValue),
                loopIndex = context.nextLoopIndex();

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
                context.useCoreSymbol('getIterator'),
                '(',
                arrayValue,
                '); ',
                context.useCoreSymbol('isNotFinished'),
                '(',
                String(loopIndex),
                ', ',
                iteratorVariable,
                '); ',
                // Advance iterator to next element at end of loop body as per spec
                context.useCoreSymbol('advance'),
                '(',
                iteratorVariable,
                ')) {'
            );

            // Iterator value variable
            codeChunks.push(
                context.useCoreSymbol(valueIsReference ? 'setReference' : 'setValue'),
                '(',
                value,
                ', ',
                context.useCoreSymbol(valueIsReference ? 'getCurrentElementReference' : 'getCurrentElementValue'),
                '(',
                iteratorVariable,
                '));'
            );

            if (key) {
                // Iterator key variable (if specified)
                codeChunks.push(
                    context.useCoreSymbol('setValue'),
                    '(',
                    key,
                    ', ',
                    context.useCoreSymbol('getCurrentKey'),
                    '(',
                    iteratorVariable,
                    '));'
                );
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
                [
                    context.useCoreSymbol('defineFunction'), '(' + JSON.stringify(node.func.string) + ', ',
                    func,
                    extraArgChunks,
                    ');'
                ],
                node
            );
        },
        'N_FUNCTION_CALL': function (node, interpret, context) {
            var argChunks = [],
                callChunks;

            _.each(node.args, function (arg, index) {
                if (index > 0) {
                    argChunks.push(')(');
                }

                argChunks.push(interpret(arg));
            });

            if (node.func.name === 'N_STRING') {
                // Faster case: function call is to a statically-given function name

                callChunks = [
                    context.useCoreSymbol('callFunction'),
                    '(',
                    JSON.stringify(node.func.string),
                    ')',

                    // Only append arguments if non-empty.
                    argChunks.length > 0 ?
                        ['(', argChunks, ')'] :
                        [],
                    '()'
                ];
            } else {
                // Slower case: function call is to a variable function name

                callChunks = [
                    context.useCoreSymbol('callVariableFunction'),
                    '(',
                    interpret(node.func, {allowBareword: true}),
                    ')',

                    // Only append arguments if non-empty.
                    argChunks.length > 0 ?
                        ['(', argChunks, ')'] :
                        [],
                    '()'
                ];
            }

            return context.createExpressionSourceNode(callChunks, node);
        },
        'N_GLOBAL_STATEMENT': function (node, interpret, context) {
            var chunks = [];

            _.each(node.variables, function (variable) {
                chunks.push(
                    context.useCoreSymbol('importGlobal'),
                    '(',
                    JSON.stringify(variable.variable),
                    ');'
                );
            });

            return context.createStatementSourceNode(chunks, node);
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
                    codeChunks.push(', ');
                }

                codeChunks.push(
                    // Handle the common case of string literal fragments specially,
                    // to save on bundle size
                    part.name === 'N_STRING_LITERAL' ?
                        JSON.stringify(part.string) :
                        interpret(part)
                );
            });

            return context.createExpressionSourceNode(
                [context.useCoreSymbol('interpolate'), '([', codeChunks, '])'],
                node
            );
        },
        'N_IF_STATEMENT': function (node, interpret, context) {
            // Consequent statements are executed if the condition is truthy,
            // Alternate statements are executed if the condition is falsy
            var alternateCodeChunks,
                codeChunks,
                conditionCodeChunks = [context.useCoreSymbol('if_'), '(', interpret(node.condition), ')'],
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
                [context.useCoreSymbol('include'), '(', interpret(node.path), ')'],
                node
            );
        },
        'N_INCLUDE_ONCE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('includeOnce'), '(', interpret(node.path), ')'],
                node
            );
        },
        'N_INLINE_HTML_STATEMENT': function (node, interpret, context) {
            return context.createStatementSourceNode(
                [context.useCoreSymbol('printRaw'), '(' + JSON.stringify(node.html) + ');'],
                node
            );
        },
        'N_INSTANCE_OF': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('instanceOf'),
                    '(',
                    interpret(node.object),
                    ')(',
                    interpret(node['class'], {allowBareword: true}),
                    ')'
                ],
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
                    [
                        'function (currentClass) { return ',
                        node.value ? interpret(node.value, {isConstantOrProperty: true}) : ['null'],
                        '; }'
                    ],
                    node
                )
            };
        },
        'N_INTEGER': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('createInteger'), '(' + node.number + ')'],
                node
            );
        },
        'N_INTEGER_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('coerceToInteger'), '(', interpret(node.value), ')'],
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
                '}, methods: {',
                methodCodeChunks,
                '}, constants: {',
                constantCodeChunks,
                '}}'
            ];

            return context.createStatementSourceNode(
                [
                    context.useCoreSymbol('defineInterface'),
                    '(' + JSON.stringify(node.interfaceName) + ', ',
                    codeChunks,
                    ');'
                ],
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
                    issetChunks.push(', ');
                }

                issetChunks.push(interpret(variable));
            });

            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('isSet'),
                    '()([',
                    issetChunks,
                    '])'
                ],
                node
            );
        },
        'N_ITERABLE_TYPE': function () {
            return '"type":"iterable"';
        },
        'N_KEY_VALUE_PAIR': function (node, interpret, context) {
            var isReference = node.value.name === 'N_REFERENCE';

            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('createKey' + (isReference ? 'Reference' : 'Value') + 'Pair'),
                    '(',
                    interpret(node.key),
                    ')(',
                    // No need to wrap references in getReference(), createKeyReferencePair() will handle that
                    interpret(isReference ? node.value.operand : node.value),
                    ')'
                ],
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
                    elementsCodeChunks.push(')(');
                }

                elementsCodeChunks.push(interpret(element));
            });

            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('createList'),
                    // Only append elements if non-empty.
                    elementsCodeChunks.length > 0 ?
                        ['(', elementsCodeChunks, ')'] :
                        [],
                    '()'
                ],
                node
            );
        },
        'N_MAGIC_CLASS_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('getClassName'), '()'],
                node
            );
        },
        'N_MAGIC_DIR_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('getPathDirectory'), '()'],
                node
            );
        },
        'N_MAGIC_FILE_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('getPath'), '()'],
                node
            );
        },
        'N_MAGIC_FUNCTION_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('getFunctionName'), '()'],
                node
            );
        },
        'N_MAGIC_LINE_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                node.bounds ?
                    [context.useCoreSymbol('createInteger'), '(', String(node.bounds.start.line), ')'] :
                    // NB: In the reference implementation, __LINE__ should never be null. However,
                    //     if we have no bounds information then we cannot give a valid line number.
                    [context.useCoreSymbol('nullValue')],
                node
            );
        },
        'N_MAGIC_METHOD_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('getMethodName'), '()'],
                node
            );
        },
        'N_MAGIC_NAMESPACE_CONSTANT': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('getNamespaceName'), '()'],
                node
            );
        },
        'N_METHOD_CALL': function (node, interpret, context) {
            var argChunks = [],
                isVariable = node.method.name !== 'N_STRING';

            _.each(node.args, function (argNode, index) {
                if (index > 0) {
                    argChunks.push(')(');
                }

                argChunks.push(interpret(argNode));
            });

            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol(isVariable ? 'callVariableInstanceMethod' : 'callInstanceMethod'),
                    '(',
                    interpret(node.object),
                    ')(',

                    // Add the method name, which for a variable method call will be an expression.
                    isVariable ? interpret(node.method, {allowBareword: true}) : JSON.stringify(node.method.string),
                    ')',

                    // Only append arguments if non-empty.
                    argChunks.length > 0 ?
                        ['(', argChunks, ')'] :
                        [],
                    '()'
                ],
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

            return context.createStatementSourceNode(
                [
                    node.namespace === '' ?
                        [
                            context.useCoreSymbol('useGlobalNamespaceScope'),
                            '()'
                        ] :
                        [
                            context.useCoreSymbol('useDescendantNamespaceScope'),
                            '(',
                            JSON.stringify(node.namespace),
                            ')'
                        ],
                    ';',
                    bodyChunks
                ],
                node
            );
        },
        'N_NEW_EXPRESSION': function (node, interpret, context) {
            var argChunks = [];

            _.each(node.args, function (arg, index) {
                if (index > 0) {
                    argChunks.push(')(');
                }

                argChunks.push(interpret(arg));
            });

            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('createInstance'),
                    '(',
                    interpret(node.className, {allowBareword: true}),
                    ')',
                    // Only append arguments if non-empty.
                    argChunks.length > 0 ?
                        ['(', argChunks, ')'] :
                        [],
                    '()'
                ],
                node
            );
        },
        'N_NOWDOC': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('createString'), '(', JSON.stringify(node.string), ')'],
                node
            );
        },
        'N_NULL': function (node, interpret, context) {
            return context.createExpressionSourceNode([context.useCoreSymbol('nullValue')], node);
        },
        'N_NULL_COALESCE': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('nullCoalesce'),
                    '()(',
                    interpret(node.left),
                    ', ',
                    interpret(node.right),
                    ')'
                ],
                node
            );
        },
        'N_OBJECT_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('coerceToObject'), '(', interpret(node.value), ')'],
                node
            );
        },
        'N_OBJECT_PROPERTY': function (node, interpret, context) {
            var objectVariableCodeChunks,
                property,
                propertyCodeChunks = [];

            if (context.assignment) {
                objectVariableCodeChunks = [
                    interpret(node.object)
                ];
            } else {
                objectVariableCodeChunks = interpret(node.object);
            }

            property = node.property;

            if (property.name === 'N_STRING') {
                propertyCodeChunks.push(
                    context.useCoreSymbol('getInstanceProperty'),
                    '(',
                    objectVariableCodeChunks,
                    ')(',
                    JSON.stringify(property.string),
                    ')'
                );
            } else {
                propertyCodeChunks.push(
                    context.useCoreSymbol('getVariableInstanceProperty'),
                    '(',
                    objectVariableCodeChunks,
                    ')(',
                    interpret(property, {assignment: false, allowBareword: true}),
                    ')'
                );
            }

            return context.createExpressionSourceNode(propertyCodeChunks, node);
        },
        'N_PARENT': function (node, interpret, context) {
            if (context.isConstantOrProperty) {
                // Wrap in an opcode, so that a fatal error can be thrown if the class has no parent
                return context.createExpressionSourceNode(
                    [context.useCoreSymbol('getSuperClassName'), '(currentClass)'],
                    node
                );
            }

            return context.createExpressionSourceNode(
                [context.useCoreSymbol('getSuperClassNameOrThrow'), '()'],
                node
            );
        },
        'N_PRINT_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('print'),
                    '(',
                    interpret(node.operand),
                    ')'
                    // Note that core.print(...) will return int(1) as the result of the expression
                ],
                node
            );
        },
        'N_PROGRAM': function (node, interpret, options) {
            var bareMode,
                body = [],
                compiledBody,
                compiledSourceMap,
                coreSymbolDeclarators = [],
                coreSymbolsUsed = {},
                createSourceNode,
                createSpecificSourceNode,
                filePath = options ? options[PATH] : null,
                labelRepository = new LabelRepository(),
                loopIndex = 0,
                translator,
                useCoreSymbol = function (name) {
                    coreSymbolsUsed[name] = true;

                    return name;
                },
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
                    nextLoopIndex: function () {
                        return loopIndex++;
                    },
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
                    useCoreSymbol: useCoreSymbol,
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
            context.stackCleaning = !!options.stackCleaning;
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
                    body.push(
                        useCoreSymbol('instrument'),
                        '(function () {return ',
                        useCoreSymbol('line'),
                        ';});'
                    );
                }

                context.createExpressionSourceNode = function (chunks, node, name) {
                    var context = this;

                    if (chunks.length === 0) {
                        // Allow detecting empty comma expressions etc. by returning an empty array
                        // rather than an array containing an empty SourceNode
                        return [];
                    }

                    // Line numbers may be enabled or disabled for descendant structures
                    // (eg. property initialisers always have line tracking disabled)
                    if (context.lineNumbers) {
                        // TODO: Only assign line if it is different to the previous assigned value.
                        //       Assigning it here (for each expression) as well as below (for each statement)
                        //       is needed because statements can span multiple lines, however there are currently
                        //       lots of redundant identical assignments for the same line.
                        return [createSourceNode(node, ['(line = ' + node.bounds.start.line + ', ', chunks, ')'], name)];
                    }

                    // Lines are 1-based, but columns are 0-based
                    return [createSourceNode(node, chunks, name)];
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
                    var context = this;

                    if (chunks.length === 0) {
                        // Allow detecting empty comma expressions etc. by returning an empty array
                        // rather than an array containing an empty SourceNode
                        return [];
                    }

                    // Lines are 1-based, but columns are 0-based
                    return [createSourceNode(
                        node,
                        [
                            // Line numbers may be enabled or disabled for descendant structures
                            // (eg. property initialisers always have line tracking disabled)
                            context.lineNumbers ?
                                'line = ' + node.bounds.start.line + ';' :
                                '',
                            context.tick ?
                                // Ticking is enabled, so add a call to the tick callback before each statement
                                useCoreSymbol('tick') + '(' + [
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

            body.push(processBlock(hoistDeclarations(node.statements), interpret, context, context.labelRepository));

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
                    body.unshift(
                        'var $' + name + ' = ',
                        useCoreSymbol('createDebugVar'),
                        '("' + name + '");'
                    );
                });
            }

            labels = context.labelRepository.getLabels();

            if (labels.length > 0) {
                body.unshift('var goingToLabel_' + labels.join(' = false, goingToLabel_') + ' = false;');
            }

            _.each(Object.keys(coreSymbolsUsed).sort(), function (name) {
                var declarator = name;

                if (
                    name !== 'line' &&
                    name !== 'ternaryCondition'
                ) {
                    declarator += ' = core.' + name;
                }

                coreSymbolDeclarators.push(declarator);
            });

            if (coreSymbolDeclarators.length > 0) {
                body.unshift('var ' + coreSymbolDeclarators.join(', ') + ';');
            }

            // Wrap program in function for passing to runtime
            body = [
                'function ',
                context.stackCleaning ? MODULE_STACK_MARKER : '',
                '(core) {'
            ].concat(body, '}');

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
                [
                    context.useCoreSymbol('getReference'),
                    '(',
                    interpret(node.operand),
                    ')'
                ],
                node
            );
        },
        'N_REQUIRE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('require'), '(', interpret(node.path), ')'],
                node
            );
        },
        'N_REQUIRE_ONCE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('requireOnce'), '(', interpret(node.path), ')'],
                node
            );
        },
        'N_RETURN_STATEMENT': function (node, interpret, context) {
            var expression = node.expression ? interpret(node.expression) : null;

            return context.createStatementSourceNode(
                ['return'].concat(expression ? [' ', expression] : '', ';'),
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

            return context.createExpressionSourceNode([context.useCoreSymbol('getClassNameOrThrow'), '()'], node);
        },
        'N_STATIC': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('getStaticClassName'), '()'],
                node
            );
        },
        'N_STATIC_METHOD_CALL': function (node, interpret, context) {
            var argChunks = [],
                isForwarding = node.className.name === 'N_SELF' ||
                    node.className.name === 'N_PARENT' ||
                    node.className.name === 'N_STATIC',
                isVariable = node.method.name !== 'N_STRING';

            _.each(node.args, function (arg, index) {
                if (index > 0) {
                    argChunks.push(')(');
                }

                argChunks.push(interpret(arg));
            });

            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol(isVariable ? 'callVariableStaticMethod' : 'callStaticMethod'),
                    '(',
                    interpret(node.className, {allowBareword: true}),
                    ')',

                    // Add the method name, which for a variable method call will be an expression.
                    '(',
                    isVariable ? interpret(node.method, {allowBareword: true}) : JSON.stringify(node.method.string),
                    ')',

                    // Add whether the call is forwarding or non-forwarding.
                    '(',
                    isForwarding ? 'true' : 'false',
                    ')',

                    // Only append arguments if non-empty.
                    argChunks.length > 0 ?
                        ['(', argChunks, ')'] :
                        [],
                    '()'
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
            var classVariableCodeChunks = interpret(node.className, {allowBareword: true}),
                propertyCodeChunks = [];

            if (node.property.name === 'N_STRING') {
                propertyCodeChunks.push(
                    context.useCoreSymbol('getStaticProperty'),
                    '(',
                    classVariableCodeChunks,
                    ')(',
                    JSON.stringify(node.property.string),
                    ')'
                );
            } else {
                propertyCodeChunks.push(
                    context.useCoreSymbol('getVariableStaticProperty'),
                    '(',
                    classVariableCodeChunks,
                    ')(',
                    interpret(node.property, {assignment: false, allowBareword: true}),
                    ')'
                );
            }

            return context.createExpressionSourceNode(propertyCodeChunks, node);
        },
        'N_STATIC_PROPERTY_DEFINITION': function (node, interpret, context) {
            return {
                name: node.variable.variable,
                visibility: JSON.stringify(node.visibility),
                value: context.createInternalSourceNode(
                    [
                        'function (currentClass) { return ',
                        node.value ? interpret(node.value, {isConstantOrProperty: true}) : ['null'],
                        '; }'
                    ],
                    node
                )
            };
        },
        'N_STATIC_STATEMENT': function (node, interpret, context) {
            var codeChunks = [];

            _.each(node.variables, function (declarator) {
                codeChunks.push(
                    context.useCoreSymbol('importStatic'),
                    '(',
                    JSON.stringify(declarator.variable.variable)
                );

                if (declarator.initialiser) {
                    // An initialiser will be evaluated only once and assigned to the variable
                    // the first time the function it's in is called - subsequent calls to the function
                    // will have access to the most recent value of the variable.
                    codeChunks.push(', ', interpret(declarator.initialiser));
                }

                codeChunks.push(');');
            });

            return context.createStatementSourceNode(codeChunks, node);
        },
        'N_STRING': function (node, interpret, context) {
            if (context.allowBareword) {
                return context.createExpressionSourceNode(
                    [
                        context.useCoreSymbol('createBareword'),
                        '(',
                        JSON.stringify(node.string),
                        ')'
                    ],
                    node
                );
            }

            return context.createExpressionSourceNode(
                [context.useCoreSymbol('getConstant'), '(', JSON.stringify(node.string), ')'],
                node
            );
        },
        'N_STRING_CAST': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('coerceToString'), '(', interpret(node.value), ')'],
                node
            );
        },
        'N_STRING_EXPRESSION': function (node, interpret, context) {
            var codeChunks = [];

            _.each(node.parts, function (part, index) {
                if (index > 0) {
                    codeChunks.push(', ');
                }

                codeChunks.push(
                    // Handle the common case of string literal fragments specially,
                    // to save on bundle size
                    part.name === 'N_STRING_LITERAL' ?
                        JSON.stringify(part.string) :
                        interpret(part)
                );
            });

            return context.createExpressionSourceNode(
                [context.useCoreSymbol('interpolate'), '([', codeChunks, '])'],
                node
            );
        },
        'N_STRING_LITERAL': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [context.useCoreSymbol('createString'), '(' + JSON.stringify(node.string) + ')'],
                node
            );
        },
        'N_SUPPRESSED_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('suppressErrors'),
                    '()(',
                    interpret(node.expression),
                    ')'
                ],
                node
            );
        },
        'N_SWITCH_STATEMENT': function (node, interpret, context) {
            var caseChunks,
                codeChunks = [],
                containsNonFinalDefaultCase = false,
                labelRepository = context.labelRepository,
                labelsInsideLoopHash = {},
                // Record which labels have gotos to labels that are not yet defined,
                // meaning they could be defined either inside the switch body (invalid) or afterwards
                priorPendingLabelsHash = labelRepository.getPendingLabelsHash(),
                expressionCode = interpret(node.expression),
                blockContexts = context.blockContexts.concat(['switch']),
                switchLabel = 'block_' + blockContexts.length,
                switchExpressionVariable = 'switchExpression_' + blockContexts.length,
                switchMatchedVariable = 'switchMatched_' + blockContexts.length,
                subContext = {
                    blockContexts: blockContexts,
                    defaultCaseIsFinal: false // May be overridden in the loop below.
                };

            codeChunks.push(
                'var ' + switchExpressionVariable + ' = ',
                context.useCoreSymbol('switchOn'),
                '(',
                expressionCode,
                '),' +
                // NB: switchMatched is used for fall-through
                ' ' + switchMatchedVariable + ' = false;'
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

            // Go through the cases of this switch (shallowly: not any cases of descendant switches)
            // to look for a default case.
            _.each(node.cases, function (caseNode, index) {
                if (caseNode.name === 'N_DEFAULT_CASE') {
                    if (index === node.cases.length - 1) {
                        /*
                         * Default case is the last one in the switch: mark this,
                         * as we can apply an optimisation
                         * (no need to wrap transpiled default case in any logic).
                         */
                        subContext.defaultCaseIsFinal = true;
                    } else {
                        // Default case is not the last one, so we'll need some extra logic
                        // as we need to jump backwards after testing all other cases.
                        containsNonFinalDefaultCase = true;
                    }
                }
            });

            // Process the cases of this switch as a normal block, so that goto labels can be resolved etc.
            caseChunks = processBlock(node.cases, interpret, subContext, labelRepository);

            if (containsNonFinalDefaultCase) {
                codeChunks.push(
                    // Reuse the loop we need to add as the labelled target for break and continue statements.
                    switchLabel + ': ',
                    // We need a loop to be able to jump back to the top of the switch (to then go back down
                    // to the default case) if no non-default cases match.
                    'while (true) {',
                    caseChunks,
                    'if (' + switchMatchedVariable + ') {',
                    // A case matched (or we already jumped backwards to the default case),
                    // so we don't want to jump back to the top of the switch.
                    'break;',
                    '} else {',
                    // No non-default cases were matched, so use this special value
                    // for the expression variable to indicate we should jump to the default case.
                    switchExpressionVariable + ' = null;',
                    '}',
                    '}' // End of while loop.
                );
            } else {
                // Either no default case is present or it is the final one.
                codeChunks.push(switchLabel + ': {', caseChunks, '}');
            }

            labelRepository.off('found label', onFoundLabel);

            labelRepository.on('goto label', function (gotoNode) {
                var label = gotoNode.label.string;

                if (labelsInsideLoopHash[label] === true) {
                    // A goto below this switch (but within the same function)
                    // is attempting to jump backward into it
                    context.raiseError(GOTO_DISALLOWED, gotoNode.label);
                }
            });

            return context.createStatementSourceNode(codeChunks, node);
        },
        'N_TERNARY': function (node, interpret, context) {
            var condition = interpret(node.condition),
                consequent,
                expression;

            if (node.consequent) {
                consequent = interpret(node.consequent);
            } else {
                // Handle shorthand ternary
                condition = [context.useCoreSymbol('ternaryCondition'), ' = ', condition];
                consequent = context.useCoreSymbol('ternaryCondition');
            }

            expression = [
                '(',
                context.useCoreSymbol('ternary'),
                '(',
                condition,
                ') ? ',
                consequent,
                ' : ',
                interpret(node.alternate),
                ')'
            ];

            return context.createExpressionSourceNode(expression, node);
        },
        'N_THROW_STATEMENT': function (node, interpret, context) {
            return context.createStatementSourceNode(
                [context.useCoreSymbol('throw_'), '(', interpret(node.expression), ');'],
                node
            );
        },
        'N_TRY_STATEMENT': function (node, interpret, context) {
            var catchCodesChunks = [],
                codeChunks = [];

            _.each(node.catches, function (catchNode, index) {
                var catchCodeChunks = [
                    'if (',
                    context.useCoreSymbol('caught'),
                    '(',
                    JSON.stringify(catchNode.type.string), ', e)) {',
                    context.useCoreSymbol('setValue'),
                    '(',
                    interpret(catchNode.variable),
                    ', e);',
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
                codeChunks.unshift(' catch (e) {if (', context.useCoreSymbol('pausing'), '()) {throw e;} ');
                codeChunks.push(' else { throw e; }}');
            }

            codeChunks.unshift('try {', interpret(node.body), '}');

            if (node.finalizer) {
                codeChunks.push(
                    ' finally {if (!',
                    context.useCoreSymbol('pausing'),
                    '()) {',
                    interpret(node.finalizer),
                    '}}'
                );
            }

            return context.createStatementSourceNode(codeChunks, node);
        },
        'N_UNARY_EXPRESSION': function (node, interpret, context) {
            var operator = node.operator,
                operand = interpret(node.operand);

            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol(unaryOperatorToMethod[node.prefix ? 'prefix' : 'suffix'][operator]),
                    '(',
                    operand,
                    ')'
                ],
                node
            );
        },
        'N_UNSET_CAST': function (node, interpret, context) {
            // Unset cast coerces all values to NULL
            return context.createExpressionSourceNode(
                ['(', interpret(node.value), ', ', context.useCoreSymbol('nullValue'), ')'],
                node
            );
        },
        'N_UNSET_STATEMENT': function (node, interpret, context) {
            var statementChunks = [];

            _.each(node.variables, function (variableNode, index) {
                if (index > 0) {
                    statementChunks.push(')(');
                }

                statementChunks.push(interpret(variableNode));
            });

            return context.createStatementSourceNode(
                // TODO: Have a separate opcode that takes a list to remove need for variadic call
                //       when there is only a single item to unset, to shrink bundle and reduce GC pressure.
                [
                    context.useCoreSymbol('unset'),

                    // Only append references if non-empty.
                    statementChunks.length > 0 ?
                        ['(', statementChunks, ')'] :
                        [],
                    '();'
                ],
                node
            );
        },
        'N_USE_STATEMENT': function (node, interpret, context) {
            var codeChunks = [];

            _.each(node.uses, function (use) {
                if (use.alias) {
                    codeChunks.push(
                        context.useCoreSymbol('useClass'),
                        '(',
                        JSON.stringify(use.source),
                        ', ',
                        JSON.stringify(use.alias),
                        ');'
                    );
                } else {
                    codeChunks.push(
                        context.useCoreSymbol('useClass'),
                        '(',
                        JSON.stringify(use.source),
                        ');'
                    );
                }
            });

            return context.createStatementSourceNode(codeChunks, node);
        },
        'N_VARIABLE': function (node, interpret, context) {
            context.variableMap[node.variable] = true;

            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('getVariable'),
                    '(',
                    '"' + node.variable + '"',
                    ')'
                ],
                node,
                '$' + node.variable
            );
        },
        'N_VARIABLE_EXPRESSION': function (node, interpret, context) {
            return context.createExpressionSourceNode(
                [
                    context.useCoreSymbol('getVariableVariable'),
                    '(',
                    interpret(node.expression),
                    ')'
                ],
                node
            );
        },
        'N_VOID': function (node, interpret, context) {
            // Used for list(...) elements that indicate skipping of an array element

            return context.createExpressionSourceNode([context.useCoreSymbol('createVoid'), '()'], node);
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
                codeChunks,
                loopIndex = context.nextLoopIndex();

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
                    context.useCoreSymbol('loop'),
                    '(',
                    String(loopIndex),
                    ', ',
                    conditionChunks,
                    ')) {',
                    codeChunks,
                    '}'
                ],
                node
            );
        }
    }
};
