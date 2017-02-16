/*globals QUnit, sinon*/
jQuery.sap.require("sap.ui.fl.DefaultVariant");
jQuery.sap.require("sap.ui.fl.Change");

(function(QUnit, sinon, defaultVariant, Change) {
	"use strict";

	/*eslint-disable no-unused-vars */
	var defaultVariantChangeDefinitionSpecifics = {
		"fileType": "change", //set by Change.createInitialFileContent if not variant
		"layer": "USER", //enforced
		"fileName": "<name>", //currently set by Change.createInitialFileContent, must not be set
		"namespace": "<namespace>", //currently set by Change.createInitialFileContent, must not be set
		"packageName": "<packageName>", //currently set by Change.createInitialFileContent, must not be set
		"changeType": "defaultVariant",
		"creation": "<timestamp>", //set by Change.createInitialFileContent
		"reference": "<component>", //set by Change.createInitialFileContent
		"selector": {
			"persistenceKey": "control1"
		}, //optional
		"content": {
			"something": "createNewVariant"
		},
		"support": {  //set by Change.createInitialFileContent
			"generator": "<generator>",
			"user": "<user>",
			"service": "<service>"
		}
	};
	/*eslint-enable no-unused-vars */

	QUnit.module("sap.ui.fl.DefaultVariant", {
		beforeEach: function() {
			this.oDefaultVariant = new defaultVariant.constructor();
		},
		afterEach: function() {
		}
	});

	QUnit.test("getDefaultVariantId - happy path", function(assert) {
		var expectedDefaultVariantName = 'delurasini';

		var oChanges = {
			xyz: new Change({
				changeType: 'defaultVariant',
				content: {
					defaultVariantName: expectedDefaultVariantName
				},
				fileType: 'change',
				namespace: 'localchange'
			})
		};

		assert.strictEqual(this.oDefaultVariant.getDefaultVariantId(oChanges), expectedDefaultVariantName);
	});

	QUnit.test("getDefaultVariantId - GIVEN multiple defaultVariant changes WHEN getting the id THEN the id of the newest change should be returned and the rest deleted", function(assert) {
		var expectedDefaultVariantId = 'expectedVariantId';
		var otherDefaultVariantId = 'olderNotExpectedVariantId';

		var mChanges = {
			firstChange: new Change({
				changeType: 'defaultVariant',
				content: {
					defaultVariantName: otherDefaultVariantId
				},
				fileType: 'change',
				creation: new Date("2014-10-27T13:58:16.783Z").toISOString(),
				namespace: 'localchange'
			}),
			secondChange: new Change({
				changeType: 'defaultVariant',
				content: {
					defaultVariantName: expectedDefaultVariantId
				},
				creation: new Date("2014-10-27T14:58:16.783Z").toISOString(),
				fileType: 'change',
				namespace: 'localchange'
			})
		};

		assert.strictEqual(this.oDefaultVariant.getDefaultVariantId(mChanges), expectedDefaultVariantId);
		assert.strictEqual(mChanges.firstChange.getPendingAction(), 'DELETE');
	});

	QUnit.test("getDefaultVariantId - GIVEN multiple defaultVariant changes, one with an empty string as creation WHEN getting the id THEN the id of the change with empty string as creation should be returned", function(assert) {
		var expectedDefaultVariantId = 'expectedVariantId';
		var otherDefaultVariantId = 'olderNotExpectedVariantId';

		var oChanges = {
			firstChange: new Change({
				changeType: 'defaultVariant',
				content: {
					defaultVariantName: otherDefaultVariantId
				},
				fileType: 'change',
				creation: new Date("2014-10-27T13:58:16.783Z").toISOString(),
				namespace: 'localchange'
			}),
			secondChange: new Change({
				changeType: 'defaultVariant',
				content: {
					defaultVariantName: expectedDefaultVariantId
				},
				creation: "",
				fileType: 'change',
				namespace: 'localchange'
			})
		};

		assert.strictEqual(this.oDefaultVariant.getDefaultVariantId(oChanges), expectedDefaultVariantId);
	});

	QUnit.test("getDefaultVariantId - shall return an empty string if there are no defaultVariant changes", function(assert) {

		var oChanges = {};

		new Array(5).forEach(function(index) {
			oChanges[index] = new Change({
				changeType: 'hubbabubba',
				fileType: 'change',
			});
		});

		assert.strictEqual(this.oDefaultVariant.getDefaultVariantId(oChanges), "");
	});

	QUnit.test("createChangeFile shall return a new change", function(assert) {
		var mParameterBag, oChangeContent;
		mParameterBag = {defaultVariantId: "dominka", reference: "ribukombu"};

		oChangeContent = this.oDefaultVariant._createChangeFile(mParameterBag);

		assert.equal(oChangeContent.content.defaultVariantName, "dominka");
	});

	QUnit.test("createChangeFile shall write the component name into the change file", function(assert) {
		var mParameterBag, oChangeContent;
		mParameterBag = {reference: "ribukombu"};

		oChangeContent = this.oDefaultVariant._createChangeFile(mParameterBag);
		assert.equal(oChangeContent.reference, "ribukombu");
	});

	QUnit.test("createChangeObject with all possible default variant change specific options", function(assert) {
		var mParameterBag, oChange;
		mParameterBag = {
			reference: "Glennkadiko",
			componentName: "Glennkadiko",
			defaultVariantId: "Grendalin",
			selector: {
				stableId: "Galustika"
			}
		};

		//Call CUT
		oChange = this.oDefaultVariant.createChangeObject(mParameterBag);

		assert.ok(oChange);
		assert.ok(oChange instanceof Change);
		assert.equal(oChange.getContent().defaultVariantName, "Grendalin");
		assert.equal(oChange.getComponent(), "Glennkadiko");
		assert.equal(oChange.getChangeType(), 'defaultVariant');
		assert.equal(oChange.getSelector(), mParameterBag.selector);
		assert.equal(oChange.getLayer(), 'USER');
	});

	QUnit.test('getDefaultVariantChanges should return all default variant changes', function(assert) {
		var mChanges = {
			someChange: {
				getChangeType: sinon.stub().returns('some')
			},
			defaultVariantChange1: {
				getChangeType: sinon.stub().returns('defaultVariant')
			},
			someChange2: {
				getChangeType: sinon.stub().returns('some')
			},
			defaultVariantChange2: {
				getChangeType: sinon.stub().returns('defaultVariant')
			},
			someChange3: {
				getChangeType: sinon.stub().returns('some')
			}
		};

		var aChanges = this.oDefaultVariant.getDefaultVariantChanges(mChanges);

		assert.strictEqual(aChanges.length, 2);
		assert.strictEqual(aChanges.some(function(oChange) {
			return oChange === mChanges.defaultVariantChange1;
		}), true);
		assert.strictEqual(aChanges.some(function(oChange) {
			return oChange === mChanges.defaultVariantChange2;
		}), true);
	});

	QUnit.test('updateDefaultVariantChange shall return the updated change if a default variant change has been found and updated', function(assert) {
		var notExpectedDefaultVariantId = 'notExpectedVariantId';
		var newDefaultVariantId = 'newDefaultVariantId';

		var mChanges = {
			firstChange: new Change({
				changeType: 'defaultVariant',
				content: {
					defaultVariantName: notExpectedDefaultVariantId
				},
				fileType: 'change',
				creation: new Date("2014-10-27T13:58:16.783Z").toISOString(),
				namespace: 'localchange'
			})
		};

		var oUpdatedChange = this.oDefaultVariant.updateDefaultVariantId(mChanges, newDefaultVariantId);

		assert.strictEqual(oUpdatedChange, mChanges.firstChange);
		assert.strictEqual(mChanges.firstChange.getContent().defaultVariantName, newDefaultVariantId);
	});

	QUnit.test('updateDefaultVariantChange shall return undefined if no default variant change has been found', function(assert) {
		var newDefaultVariantId = 'newDefaultVariantId';

		var mChanges = {};

		var changeUpdated = this.oDefaultVariant.updateDefaultVariantId(mChanges, newDefaultVariantId);

		assert.strictEqual(changeUpdated, undefined);
	});

	QUnit.test('updateDefaultVariantChange shall delete older default variant changes, if multiple have been found', function(assert) {
		var notExpectedDefaultVariantId = 'notExpectedVariantId';
		var newDefaultVariantId = 'newDefaultVariantId';

		var mChanges = {
			firstChange: new Change({
				changeType: 'defaultVariant',
				content: {
					defaultVariantName: notExpectedDefaultVariantId
				},
				fileType: 'change',
				creation: new Date("2014-10-27T13:58:16.783Z").toISOString(),
				namespace: 'localchange'
			}),
			secondChange: new Change({
				changeType: 'defaultVariant',
				content: {
					defaultVariantName: notExpectedDefaultVariantId
				},
				creation: "",
				fileType: 'change',
				namespace: 'localchange'
			})
		};

		this.oDefaultVariant.updateDefaultVariantId(mChanges, newDefaultVariantId);

		assert.strictEqual(mChanges.firstChange.getPendingAction(), 'DELETE');
	});

}(QUnit, sinon, sap.ui.fl.DefaultVariant, sap.ui.fl.Change));
