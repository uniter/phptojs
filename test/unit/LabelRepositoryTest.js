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
    sinon = require('sinon'),
    LabelRepository = require('../../src/LabelRepository');

describe('LabelRepository', function () {
    var labelRepository;

    beforeEach(function () {
        labelRepository = new LabelRepository();
    });

    describe('addGoto()', function () {
        describe('if it has not yet been found', function () {
            it('should mark the label as pending', function () {
                labelRepository.addGoto({label: {string: 'my_label'}});

                expect(labelRepository.isPending('my_label')).to.be.true;
            });

            it('should not mark the label as found', function () {
                labelRepository.addGoto({label: {string: 'my_label'}});

                expect(labelRepository.hasBeenFound('my_label')).to.be.false;
            });

            it('should dispatch a "goto label" event with the node', function () {
                var listener = sinon.spy();
                labelRepository.on('goto label', listener);

                labelRepository.addGoto({label: {string: 'my_label'}});

                expect(listener).to.have.been.calledOnce;
                expect(listener).to.have.been.calledWith({label: {string: 'my_label'}});
            });
        });

        describe('if it has already been found', function () {
            beforeEach(function () {
                labelRepository.found({label: {string: 'my_label'}});
            });

            it('should not mark the label as pending', function () {
                labelRepository.addGoto({label: {string: 'my_label'}});

                expect(labelRepository.isPending('my_label')).to.be.false;
            });

            it('should not unmark the label as found', function () {
                labelRepository.addGoto({label: {string: 'my_label'}});

                expect(labelRepository.hasBeenFound('my_label')).to.be.true;
            });

            it('should still dispatch a "goto label" event with the node', function () {
                var listener = sinon.spy();
                labelRepository.on('goto label', listener);

                labelRepository.addGoto({label: {string: 'my_label'}});

                expect(listener).to.have.been.calledOnce;
                expect(listener).to.have.been.calledWith({label: {string: 'my_label'}});
            });
        });
    });

    describe('found()', function () {
        describe('if it has not yet been found nor is pending', function () {
            it('should mark the label as found', function () {
                labelRepository.found({label: {string: 'my_label'}});

                expect(labelRepository.hasBeenFound('my_label')).to.be.true;
            });

            it('should not mark the label as pending', function () {
                labelRepository.found({label: {string: 'my_label'}});

                expect(labelRepository.isPending('my_label')).to.be.false;
            });

            it('should dispatch a "found label" event with the node', function () {
                var listener = sinon.spy();
                labelRepository.on('found label', listener);

                labelRepository.found({label: {string: 'my_label'}});

                expect(listener).to.have.been.calledOnce;
                expect(listener).to.have.been.calledWith({label: {string: 'my_label'}});
            });
        });

        describe('if it is pending', function () {
            beforeEach(function () {
                labelRepository.addGoto({label: {string: 'my_label'}});
            });

            it('should mark the label as found', function () {
                labelRepository.found({label: {string: 'my_label'}});

                expect(labelRepository.hasBeenFound('my_label')).to.be.true;
            });

            it('should unmark the label as pending', function () {
                labelRepository.found({label: {string: 'my_label'}});

                expect(labelRepository.isPending('my_label')).to.be.false;
            });

            it('should dispatch a "found label" event with the node', function () {
                var listener = sinon.spy();
                labelRepository.on('found label', listener);

                labelRepository.found({label: {string: 'my_label'}});

                expect(listener).to.have.been.calledOnce;
                expect(listener).to.have.been.calledWith({label: {string: 'my_label'}});
            });
        });

        describe('if it has already been found', function () {
            beforeEach(function () {
                labelRepository.found({label: {string: 'my_label'}});
            });

            it('should not unmark the label as found', function () {
                labelRepository.found({label: {string: 'my_label'}});

                expect(labelRepository.hasBeenFound('my_label')).to.be.true;
            });

            it('should not mark the label as pending', function () {
                labelRepository.found({label: {string: 'my_label'}});

                expect(labelRepository.isPending('my_label')).to.be.false;
            });

            it('should still dispatch a "found label" event with the node', function () {
                var listener = sinon.spy();
                labelRepository.on('found label', listener);

                labelRepository.found({label: {string: 'my_label'}});

                expect(listener).to.have.been.calledOnce;
                expect(listener).to.have.been.calledWith({label: {string: 'my_label'}});
            });
        });
    });

    describe('getFirstPendingLabelGotoNode()', function () {
        it('should throw when there are no pending labels', function () {
            expect(function () {
                labelRepository.getFirstPendingLabelGotoNode();
            }).to.throw('There are no pending labels');
        });

        it('should return the first pending label', function () {
            labelRepository.found({label: {string: 'first_label'}});
            labelRepository.addGoto({label: {string: 'second_label'}});
            labelRepository.addGoto({label: {string: 'third_label'}});

            expect(labelRepository.getFirstPendingLabelGotoNode())
                .to.deep.equal({label: {string: 'second_label'}});
        });
    });

    describe('getLabels()', function () {
        it('should return an empty array initially', function () {
            expect(labelRepository.getLabels()).to.deep.equal([]);
        });

        it('should return a list of both pending and found labels', function () {
            labelRepository.addGoto({label: {string: 'first_label'}});
            labelRepository.found({label: {string: 'second_label'}});

            expect(labelRepository.getLabels()).to.deep.equal(['first_label', 'second_label']);
        });

        it('should only list pending labels once, regardless of their number of gotos', function () {
            labelRepository.addGoto({label: {string: 'my_label'}});
            labelRepository.addGoto({label: {string: 'my_label'}});

            expect(labelRepository.getLabels()).to.deep.equal(['my_label']);
        });
    });

    describe('getPendingLabels()', function () {
        it('should return an empty array initially', function () {
            expect(labelRepository.getPendingLabels()).to.deep.equal([]);
        });

        it('should include only pending labels', function () {
            labelRepository.addGoto({label: {string: 'first_label'}});
            labelRepository.found({label: {string: 'second_label'}});

            expect(labelRepository.getPendingLabels()).to.deep.equal(['first_label']);
        });
    });

    describe('getPendingLabelGotoNodes()', function () {
        it('should return an empty array initially', function () {
            expect(labelRepository.getPendingLabelGotoNodes()).to.deep.equal([]);
        });

        it('should include only pending labels', function () {
            labelRepository.addGoto({label: {string: 'first_label'}});
            labelRepository.found({label: {string: 'second_label'}});

            expect(labelRepository.getPendingLabelGotoNodes()).to.deep.equal([
                {label: {string: 'first_label'}}
            ]);
        });
    });

    describe('getPendingLabelsHash()', function () {
        it('should return an empty plain object initially', function () {
            expect(labelRepository.getPendingLabelsHash()).to.deep.equal({});
        });

        it('should include only pending labels', function () {
            labelRepository.addGoto({label: {string: 'first_label'}});
            labelRepository.found({label: {string: 'second_label'}});

            expect(labelRepository.getPendingLabelsHash()).to.deep.equal({
                'first_label': {label: {string: 'first_label'}}
            });
        });
    });

    describe('hasBeenFound()', function () {
        it('should return true for a label that has been found but has no goto', function () {
            labelRepository.found({label: {string: 'my_label'}});

            expect(labelRepository.hasBeenFound('my_label')).to.be.true;
        });

        it('should return true for a label that has been found and has a goto', function () {
            labelRepository.found({label: {string: 'my_label'}});
            labelRepository.addGoto({label: {string: 'my_label'}});

            expect(labelRepository.hasBeenFound('my_label')).to.be.true;
        });

        it('should return false initially', function () {
            expect(labelRepository.hasBeenFound('my_label')).to.be.false;
        });

        it('should return false for a label that has a goto but has not been found', function () {
            labelRepository.addGoto({label: {string: 'my_label'}});

            expect(labelRepository.hasBeenFound('my_label')).to.be.false;
        });
    });

    describe('hasPending()', function () {
        it('should return false initially', function () {
            expect(labelRepository.hasPending()).to.be.false;
        });

        it('should return true when there is a pending label', function () {
            labelRepository.addGoto({label: {string: 'my_label'}});

            expect(labelRepository.hasPending()).to.be.true;
        });

        it('should return false when there is only a found label', function () {
            labelRepository.found({label: {string: 'my_label'}});

            expect(labelRepository.hasPending()).to.be.false;
        });
    });

    describe('isPending()', function () {
        it('should return false initially', function () {
            expect(labelRepository.isPending('any_label')).to.be.false;
        });

        it('should return true for a pending label', function () {
            labelRepository.addGoto({label: {string: 'my_label'}});

            expect(labelRepository.isPending('my_label')).to.be.true;
        });

        it('should return false for a found label', function () {
            labelRepository.found({label: {string: 'my_label'}});

            expect(labelRepository.isPending('my_label')).to.be.false;
        });
    });

    describe('off()', function () {
        it('should remove the given event listener', function () {
            var listener = sinon.spy();
            labelRepository.on('goto label', listener);

            labelRepository.off('goto label', listener);
            labelRepository.addGoto({label: {string: 'my_label'}});

            expect(listener).not.to.have.been.called;
        });
    });
});
