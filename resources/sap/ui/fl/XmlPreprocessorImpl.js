/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"jquery.sap.global", "sap/ui/core/Component", "sap/ui/fl/FlexControllerFactory", "sap/ui/fl/Utils", "sap/ui/fl/LrepConnector", "sap/ui/fl/ChangePersistenceFactory"
], function(jQuery, Component, FlexControllerFactory, Utils, LrepConnector, ChangePersistenceFactory) {
	"use strict";

	/**
	 * The implementation of the <code>XmlPreprocessor</code> for the SAPUI5 flexibility services that can be hooked in the <code>View</code> life cycle.
	 *
	 * @name sap.ui.fl.XmlPreprocessorImpl
	 * @class
	 * @constructor
	 * @author SAP SE
	 * @version 1.44.33
	 * @experimental Since 1.27.0
	 */
	var XmlPreprocessorImpl = function(){
	};

	/**
	 * Asynchronous view processing method.
	 *
	 * @param {Node} oView xml node of the view to process
	 * @param {object} mProperties
	 * @param {string} mProperties.componentId - id of the component creating the view
	 *
	 * @returns {jquery.sap.promise} result of the processing, promise if executed asynchronously
	 *
	 * @public
	 */
	XmlPreprocessorImpl.process = function(oView, mProperties){
		try {
			if (!mProperties || mProperties.sync) {
				Utils.log.warning("Flexibility feature for applying changes on an xml view is only available for " +
					"asynchronous views. The merging will be done later on the JS controls itself.");
				return (oView);
			}

			// align view id attribute with the js processing (getting the id passed in "viewId" instead of "id"
			mProperties.viewId = mProperties.id;

			var oComponent = sap.ui.getCore().getComponent(mProperties.componentId);

			if (!oComponent) {
				Utils.log.warning("View is generated without an component. Flexibility features are not possible.");
				return Promise.resolve(oView);
			}

			var sFlexReference = Utils.getComponentClassName(oComponent);

			var oFlexController = FlexControllerFactory.create(sFlexReference);
			return oFlexController.processXmlView(oView, mProperties).then(function() {
				jQuery.sap.log.debug("flex processing view " + mProperties.id + " finished");
				return oView;
			});
		} catch (error) {
			var sError = "view " + mProperties.id + ": " + error;
			jQuery.sap.log.info(sError); //to allow control usage in applications that do not work with UI flex and components
			// throw new Error(sError); // throw again, when caller handles the promise
			return Promise.resolve(oView);
		}
	 };

	/**
	 * Asynchronous determination of a hash key for caching purposes
	 *
	 * @param {Node} oView xml node of the view for which the key should be determined
	 * @returns {jquery.sap.promise} promise returning the hash key
	 *
	 * @public
	 */
	XmlPreprocessorImpl.getCacheKey = function(mProperties) {
		var oComponent = sap.ui.getCore().getComponent(mProperties.componentId);
		var sFlexReference = Utils.getComponentClassName(oComponent);
		var oChangePersistence = ChangePersistenceFactory.getChangePersistenceForComponent(sFlexReference);
		return oChangePersistence.getCacheKey();
	};

	 return XmlPreprocessorImpl;

}, /* bExport= */true);
