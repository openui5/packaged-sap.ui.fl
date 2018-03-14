/* global sinon QUnit */
jQuery.sap.require("sap.ui.qunit.qunit-coverage");

QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/fl/variants/VariantController",
	"sap/ui/fl/variants/VariantModel",
	"sap/ui/fl/variants/VariantManagement",
	"sap/ui/fl/Utils",
	"sap/ui/core/Manifest",
	"sap/ui/fl/variants/ControlVariantsAPI"
], function(
	VariantController,
	VariantModel,
	VariantManagement,
	Utils,
	Manifest,
	ControlVariantsAPI
) {
	"use strict";
	sinon.config.useFakeTimers = false;
	QUnit.start();

	var sandbox = sinon.sandbox.create();

	var fnStubTechnicalParameterValues = function (aUrlTechnicalParameters) {
		sandbox.stub(this.oModel, "_getLocalId").returns("variantMgmtId1");
		sandbox.stub(this.oModel.oVariantController, "getVariant").withArgs("variantMgmtId1", "variant1").returns(true);
		sandbox.stub(Utils, "getUshellContainer").returns(true);
		sandbox.stub(Utils, "getTechnicalParametersForComponent").returns({
			'sap-ui-fl-control-variant-id' : aUrlTechnicalParameters
		});
		sandbox.stub(Utils, "setTechnicalURLParameterValues");
	};

	var fnStubUpdateCurrentVariant = function () {
		sandbox.stub(this.oModel, "updateCurrentVariant").returns(Promise.resolve());
	};

	var fnCheckUpdateCurrentVariantCalled = function (assert, sVariantManagement, sVariant) {
		assert.ok(this.oModel.updateCurrentVariant.calledOnce, "then variantModel.updateCurrentVariant called once");
		assert.ok(this.oModel.updateCurrentVariant.calledWithExactly(sVariantManagement, sVariant), "then variantModel.updateCurrentVariant called to activate the target variant");
	};

	var fnCheckActivateVariantErrorResponse = function (assert, sExpectedError, sReceivedError) {
		assert.equal(sExpectedError, sReceivedError, "then Promise.reject() with the appropriate error message returned");
		assert.equal(this.oModel.updateCurrentVariant.callCount, 0, "then variantModel.updateCurrentVariant not called");
	};

	QUnit.module("Given an instance of VariantModel", {
		beforeEach: function(assert) {
			this.oData = {
				"variantMgmtId1": {
					"defaultVariant": "variantMgmtId1",
					"originalDefaultVariant": "variantMgmtId1",
					"variants": [
						{
							"author": "SAP",
							"key": "variantMgmtId1",
							"layer": "VENDOR",
							"title": "Standard",
							"favorite": true,
							"visible": true
						},
						{
							"author": "Me",
							"key": "variant1",
							"layer": "CUSTOMER",
							"title": "variant B",
							"favorite": false,
							"visible": true
						}
					]
				}
			};

			this.oModel = new VariantModel(this.oData, {}, this.oComponent);

			this.oModel.oVariantController = {
				getVariant: function () {},
				sVariantTechnicalParameterName: "sap-ui-fl-control-variant-id"
			};

			this.oDummyControl = new sap.ui.core.Element("dummyControl");
			this.oComponent = new sap.ui.core.Component("RTADemoAppMD");
			this.oComponent.setModel(this.oModel, "$FlexVariants");
			var fnGetAppComponentForControlStub = sandbox.stub(Utils, "getAppComponentForControl");
			fnGetAppComponentForControlStub.withArgs(this.oDummyControl).returns(this.oComponent);
			fnGetAppComponentForControlStub.withArgs(this.oComponent).returns(this.oComponent);

		},
		afterEach: function(assert) {
			sandbox.restore();
			this.oModel.destroy();
			this.oComponent.destroy();
			this.oDummyControl.destroy();
		}
	});

	QUnit.test("when calling 'clearVariantParameterInURL' with a control as parameter", function(assert) {
		var aUrlTechnicalParameters = ["fakevariant", "variant1"];
		fnStubTechnicalParameterValues.call(this, aUrlTechnicalParameters);

		ControlVariantsAPI.clearVariantParameterInURL(this.oDummyControl);

		assert.ok(Utils.getTechnicalParametersForComponent.calledWithExactly(this.oModel.oComponent), "then 'sap-ui-fl-control-variant-id' parameter values are requested");
		assert.ok(Utils.setTechnicalURLParameterValues.calledWithExactly(this.oComponent, 'sap-ui-fl-control-variant-id', [aUrlTechnicalParameters[0]]), "then 'sap-ui-fl-control-variant-id' parameter value for the provided variant management control is cleared");
	});

	QUnit.test("when calling 'clearVariantParameterInURL' without a parameter", function(assert) {
		var aUrlTechnicalParameters = ["fakevariant", "variant1"];
		fnStubTechnicalParameterValues.call(this, aUrlTechnicalParameters);

		ControlVariantsAPI.clearVariantParameterInURL();

		assert.equal(Utils.getTechnicalParametersForComponent.callCount, 0, "then 'sap-ui-fl-control-variant-id' parameter values are not requested");
		assert.ok(Utils.setTechnicalURLParameterValues.calledWithExactly(undefined, 'sap-ui-fl-control-variant-id', []), "then all 'sap-ui-fl-control-variant-id' parameter values are cleared");
	});

	QUnit.test("when calling 'activateVariant' with a control id", function(assert) {
		fnStubUpdateCurrentVariant.call(this);

		return ControlVariantsAPI.activateVariant("dummyControl", "variant1")
			.then( function () {
				fnCheckUpdateCurrentVariantCalled.call(this, assert, "variantMgmtId1", "variant1");
			}.bind(this));
	});

	QUnit.test("when calling 'activateVariant' with a control", function(assert) {
		fnStubUpdateCurrentVariant.call(this);

		return ControlVariantsAPI.activateVariant(this.oDummyControl, "variant1")
			.then( function () {
				fnCheckUpdateCurrentVariantCalled.call(this, assert, "variantMgmtId1", "variant1");
			}.bind(this));
	});

	QUnit.test("when calling 'activateVariant' with a component id", function(assert) {
		fnStubUpdateCurrentVariant.call(this);

		return ControlVariantsAPI.activateVariant(this.oComponent.getId(), "variant1")
			.then( function () {
				fnCheckUpdateCurrentVariantCalled.call(this, assert, "variantMgmtId1", "variant1");
			}.bind(this));
	});

	QUnit.test("when calling 'activateVariant' with a component", function(assert) {
		fnStubUpdateCurrentVariant.call(this);

		return ControlVariantsAPI.activateVariant(this.oComponent, "variant1")
			.then( function () {
				fnCheckUpdateCurrentVariantCalled.call(this, assert, "variantMgmtId1", "variant1");
			}.bind(this));
	});

	QUnit.test("when calling 'activateVariant' with an invalid variant reference", function(assert) {
		fnStubUpdateCurrentVariant.call(this);

		return ControlVariantsAPI.activateVariant(this.oComponent, "variantInvalid")
			.then( function() {},
				function (oError) {
						fnCheckActivateVariantErrorResponse.call(this, assert, "A valid control or component, and variant id combination is required", oError.message);
					}.bind(this));
	});

	QUnit.test("when calling 'activateVariant' with a random object", function(assert) {
		fnStubUpdateCurrentVariant.call(this);

		return ControlVariantsAPI.activateVariant({}, "variant1")
			.then( function() {},
				function (oError) {
					fnCheckActivateVariantErrorResponse.call(this, assert, "A valid variant management control or component (instance or id) should be passed as parameter", oError.message);
				}.bind(this));
	});

	QUnit.test("when calling 'activateVariant' with an invalid id", function(assert) {
		fnStubUpdateCurrentVariant.call(this);

		return ControlVariantsAPI.activateVariant("invalidId", "variant1")
			.then( function() {},
				function (oError) {
					fnCheckActivateVariantErrorResponse.call(this, assert, "A valid component or control cannot be found for the provided Id", oError.message);
				}.bind(this));
	});

	QUnit.test("when calling 'activateVariant' with a control with an invalid variantModel", function(assert) {
		fnStubUpdateCurrentVariant.call(this);
		this.oComponent.setModel(null, "$FlexVariants");

		return ControlVariantsAPI.activateVariant(this.oDummyControl, "variant1")
			.then( function() {},
				function (oError) {
					fnCheckActivateVariantErrorResponse.call(this, assert, "No variant management model found for the passed control or component", oError.message);
				}.bind(this));
	});
});
