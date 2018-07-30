/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/Component",
	"sap/ui/fl/Utils",
	"sap/ui/core/routing/History",
	"sap/ui/core/routing/HashChanger",
	"sap/base/Log",
	"sap/base/util/equal"
], function(
	jQuery,
	Component,
	flUtils,
	History,
	HashChanger,
	Log,
	equal
) {
	"use strict";

	/**
	 * Provides utility functions for sap.ui.fl.variants.VariantModel
	 * The functions should be called with an instance of sap.ui.fl.variants.VariantModel
	 *
	 * @namespace
	 * @alias sap.ui.fl.variants.util.VariantUtil
	 * @author SAP SE
	 * @version 1.56.5
	 * @experimental Since 1.56.0
	 */
	var sVariantParameterName = "sap-ui-fl-control-variant-id";
	var VariantUtil = {

		initializeHashRegister: function () {
			this._oHashRegister = {
				currentIndex: null,
				hashParams: []
			};

			// register navigation filter for custom navigation
			VariantUtil._setOrUnsetCustomNavigationForParameter.call(this, true);
		},

		attachHashHandlers: function () {
			// only for first variant management control with 'updateVariantInURL' property set to true
			if (this._oHashRegister.currentIndex === null) {
				var oHashChanger = HashChanger.getInstance();

				// attach handler to check if hash was replaced
				oHashChanger.attachEvent("hashReplaced", VariantUtil._handleHashReplaced, this);
				// attach handler to process hash changes
				oHashChanger.attachEvent("hashChanged", VariantUtil._navigationHandler, this);

				// de-register method to process hash changes
				var fnOriginalDestroy = this.oComponent.destroy;
				this.oComponent.destroy = function () {
					// deregister navigation filter if ushell is available
					VariantUtil._setOrUnsetCustomNavigationForParameter.call(this, false);
					// detach handler to check if hash was replaced
					oHashChanger.detachEvent("hashReplaced", VariantUtil._handleHashReplaced, this);
					// detach navigation handler
					oHashChanger.detachEvent("hashChanged", VariantUtil._navigationHandler, this);
					// destroy VariantModel
					this.destroy();
					fnOriginalDestroy.apply(this.oComponent, arguments);
				}.bind(this);

				VariantUtil._navigationHandler.call(this);
			}
		},

		updateHasherEntry: function(mPropertyBag) {
			if (!mPropertyBag || !Array.isArray(mPropertyBag.parameters)) {
				Log.info("Variant URL parameters could not be updated since invalid parameters were received");
				return;
			}
			if (mPropertyBag.updateURL) {
				flUtils.setTechnicalURLParameterValues(
					mPropertyBag.component || this.oComponent,
					sVariantParameterName,
					mPropertyBag.parameters
				);
			}
			if (!mPropertyBag.ignoreRegisterUpdate) {
				this._oHashRegister.hashParams[this._oHashRegister.currentIndex] = mPropertyBag.parameters;
			}
		},

		_handleHashReplaced: function (oEvent) {
			this._sReplacedHash = oEvent.getParameter("sHash");
		},

		_navigationHandler: function(oEvent) {
			var sDirection;
			var sNewHash = oEvent && oEvent.getParameter("newHash");

			// check 2 for navigation - do not handle replaced hashes
			if (sNewHash && this._sReplacedHash === sNewHash) {
				delete this._sReplacedHash;
				return;
			}
			// initialization - no direction required
			if (this._oHashRegister.currentIndex === null) {
				this._oHashRegister.currentIndex = 0;
				sDirection = "NewEntry";
			} else {
				sDirection = History.getInstance().getDirection();
				switch (sDirection) {
					case "Backwards":
						this._oHashRegister.currentIndex--;
						break;
					case "Forwards":
					case "NewEntry":
						this._oHashRegister.currentIndex++;
						break;
					case "Unknown":
						//if direction ambiguity is present reset hash register
						this._oHashRegister.currentIndex = 0;
						this._oHashRegister.hashParams = [];
						this.switchToDefaultVariant();
						break;
					default:
						return;
				}
			}

			if (this._oHashRegister.currentIndex >= 0) {

				var aVariantParamValues;
				var mPropertyBag = {};
				if (sDirection === "NewEntry" || sDirection === "Unknown") {
					// get URL hash parameters
					var mHashParameters = flUtils.getParsedURLHash() && flUtils.getParsedURLHash().params;
					aVariantParamValues = ( mHashParameters && mHashParameters[sVariantParameterName] ) || [];

					// check if variant management control for previously existing register entry exists
					// if yes, reset to default variant
					var aExisitingParams = this._oHashRegister.hashParams[this._oHashRegister.currentIndex];
					if (Array.isArray(aExisitingParams)){
						aExisitingParams.forEach(function(sParam){
							this.switchToDefaultVariant(sParam);
						}.bind(this));
					}

					// do not update URL parameters if new entry/unknown
					mPropertyBag = {
						parameters: aVariantParamValues
					};
				} else {
					aVariantParamValues = this._oHashRegister.hashParams[this._oHashRegister.currentIndex];
					mPropertyBag = {
						parameters: aVariantParamValues,
						updateURL: true,
						ignoreRegisterUpdate: true
					};
				}
			} else {
				// e.g. when index is -1, variant parameter is removed with no entry
				mPropertyBag = {
					parameters: [],
					updateURL: true,
					ignoreRegisterUpdate: true
				};
			}
			this.updateHasherEntry(mPropertyBag);
		},

		_setOrUnsetCustomNavigationForParameter: function(bSet) {
			var sMethodName = bSet ? "registerNavigationFilter" : "unregisterNavigationFilter";
			var oUshellContainer = flUtils.getUshellContainer();
			if (oUshellContainer) {
				oUshellContainer.getService("ShellNavigation")[sMethodName](VariantUtil._navigationFilter);
			}
		},

		_navigationFilter: function(sNewHash, sOldHash) {
			var oUshellContainer = flUtils.getUshellContainer();
			var oURLParsing = oUshellContainer.getService("URLParsing");
			var oShellNavigation = oUshellContainer.getService("ShellNavigation");

			var oOldParsed = oURLParsing.parseShellHash(sOldHash);
			var oNewParsed = oURLParsing.parseShellHash(sNewHash);

			// params should exists on both parsed urls
			// check 1 for navigation - suppress should only work when variant parameters have changed
			var bSuppressDefaultNavigation = oOldParsed
				&& oNewParsed
				&& !equal(oOldParsed.params[sVariantParameterName], oNewParsed.params[sVariantParameterName]);

			if (bSuppressDefaultNavigation) {
				// Verify if others parsed url properties are same
				for (var sKey in oOldParsed) {
					if (
						sKey !== "params"
						&& sKey !== "appSpecificRoute"
						&& oOldParsed[sKey] !== oNewParsed[sKey]
					) {
						bSuppressDefaultNavigation = false;
						break;
					}
				}
			}

			if (bSuppressDefaultNavigation) {
				bSuppressDefaultNavigation = false;
				[oOldParsed, oNewParsed].forEach(
					function (oParsedHash) {
						// Parameter should exists on either of the parsed hashes
						// If parameter exists but it's not the only one, it's invalid
						// If parameter doesn't exist but other parameters exist, it's invalid
						if (oParsedHash.params.hasOwnProperty(sVariantParameterName)) {
							bSuppressDefaultNavigation = true;
							if (Object.keys(oParsedHash.params).length !== 1) {
								bSuppressDefaultNavigation = false;
							}
						} else if (Object.keys(oParsedHash.params).length !== 0) {
							bSuppressDefaultNavigation = false;
						}
					}
				);
			}

			if (bSuppressDefaultNavigation) {
				var sAppSpecificRoute = (oNewParsed.appSpecificRoute || "  ").substring(2);  // strip &/
				var sOldAppSpecificRoute = (oOldParsed.appSpecificRoute || "  ").substring(2);  // strip &/
				oShellNavigation.hashChanger.fireEvent("hashChanged", { newHash : sAppSpecificRoute, oldHash : sOldAppSpecificRoute });
				return {
					// causes no navigation to happen and replaces hash in the URL
					status: oShellNavigation.NavigationFilterStatus.Custom
				};
			}
			return oShellNavigation.NavigationFilterStatus.Continue;
		},

		getCurrentHashParamsFromRegister: function () {
			if (jQuery.isNumeric(this._oHashRegister.currentIndex)) {
				return this._oHashRegister.hashParams[this._oHashRegister.currentIndex];
			}
		}

	};
	return VariantUtil;
}, true);