/*global introJs _*/
sap.ui.define([
	"hcm/ux/hapv3/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"hcm/ux/hapv3/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function (BaseController, JSONModel, History, formatter, Filter, FilterOperator, MessageBox) {
	"use strict";

	return BaseController.extend("hcm.ux.hapv3.controller.FormList", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("idFormListTable"),
				oIconTabBar = this.byId("idFormListTabs"),
				oThis = this;

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			this._oTable = oTable;
			this._oIconTabBar = oIconTabBar;
			this._aFormList = [];
			// keeps the search state
			this._oTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				formListTableTitle: this.getResourceBundle()
					.getText("formListTableTitleME"),
				tableNoDataText: this.getResourceBundle()
					.getText("formListNoDataText"),
				appraisalPeriodBeginDate: new Date(new Date()
					.getFullYear() - 2, 0, 1),
				appraisalPeriodEndDate: new Date(new Date()
					.getFullYear(), 11, 31),
				appraisalPeriodBeginYear: new Date()
					.getFullYear() - 1,
				appraisalPeriodEndYear: new Date()
					.getFullYear(),
				tableBusyDelay: 0,
				currentFormList: [],
				filterVisibleME: true,
				formCountME: 0,
				filterVisibleMA: false,
				formCountMA: 0,
				filterVisibleMB: false,
				formCountMB: 0,
				selectionToggle: "sap-icon://hide",
				filterFormVisible: true,
				selectedTabKey: "ME", //Initially me,
				dateSelection: (oThis._initiateYears)(),
				selectedDates: (function () {
					return [new Date()
						.getFullYear()
					];
				})(),
				viewBusy: false
			});
			this.setModel(oViewModel, "formListModel");
			this.getUIHelper()
				.setListViewModel(oViewModel);

			this.getRouter()
				.getRoute("formlist")
				.attachPatternMatched(this._onListPatternMatched, this);

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			//this._initiateYears();

			/*Form list will be automatically updated*/
			this.getUIHelper()
				.setFormListUpdated(false);

		},

		onBeforeRendering: function () {

		},
		onAfterRendering: function () {

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total"),
				oIconTab = this.byId("idFormListTabs"),
				sSelTab = oIconTab.getSelectedKey();

			// only update the counter if the length is final and
			// the table is not empty
			// if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
			// 	sTitle = this.getResourceBundle().getText("formListTableTitleCount" + sSelTab, [iTotalItems]);
			// } else {
			sTitle = this.getResourceBundle()
				.getText("formListTableTitle" + sSelTab);
			// }
			this.getModel("formListModel")
				.setProperty("/formListTableTitle", sTitle);
		},
		onStartIntro: function () {
			var intro = introJs();
			var oThis = this;
			intro.setOptions({
				steps: [{
					element: "#" + oThis.byId("idPeriodBeginDate")
						.getId(),
					intro: "Başlangıç dönemi girilir"
				}, {
					element: "#" + oThis.byId("idPeriodEndDate")
						.getId(),
					intro: "Bitiş dönemi girilir"
				}, {
					element: "#" + oThis.byId("idButtonGetForms")
						.getId(),
					intro: 'Formları listele düğmesine basılır'
				}, {
					element: "#" + oThis.byId("idFormListTable")
						.getId(),
					intro: 'Bulunan değerlendirme formları bu alanda listelenir'
				}],
				showProgress: true,
				overlayOpacity: 0.5
			});

			intro.start();
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onNavHome: function (oEvent) {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			var oRenderer = sap.ushell.Container.getRenderer("fiori2");
			oRenderer.setHeaderVisibility(true, true, ["app"]);

			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "#"
				}
			});
		},
		onFormShowHide: function (oEvent) {
			this._doShowHideSelection();
		},
		onRefreshFormList: function (oEvent) {
			var oModel = this.getModel();
			var oViewModel = this.getModel("formListModel");
			var sBatchGroup = "getFormList";
			var oThis = this;
			// var sBeginYear = this.byId("idPeriodBeginDate").getSelectedKey();
			// var sEndYear = this.byId("idPeriodEndDate").getSelectedKey();
			var aSelectedDates = oViewModel.getProperty("/selectedDates");
			var aDates = oViewModel.getProperty("/dateSelection");

			var aRoles = [
				"ME", "MA", "MB"
			];

			var sParams = this.getOwnerComponent()
				.getStartupParameters();

			if (!sParams.hasOwnProperty("formType")) {
				sParams.formType = "appraisal";
			}

			this.getUIHelper()
				.setFormListUpdated(true);

			// if (sBeginYear > sEndYear) {
			// 	sEndYear = sBeginYear;
			// 	this.byId("idPeriodEndDate").setSelectedKey(sBeginYear);
			// }

			var _getDate = function (sYear) {
				var oDate = _.find(aDates, ["Year", parseInt(sYear, 10)]);
				if (oDate) {
					return [oDate.Begda, oDate.Endda];
				} else {
					return [];
				}

			};

			oViewModel.setProperty("/currentFormList", []);
			oViewModel.setProperty("/filterVisibleMA", false);
			oViewModel.setProperty(
				"/filterVisibleMB", false);
			oViewModel.setProperty("/formCountME", 0);
			oViewModel.setProperty("/formCountMA", 0);
			oViewModel.setProperty(
				"/formCountMB", 0);

			this._aFormList = [];

			//Set odata model options
			oModel.setUseBatch(true);
			oModel.setDeferredBatchGroups([sBatchGroup]);

			var oBatchPack = {
				batchGroupId: sBatchGroup,
				method: "GET"
			};

			switch (sParams.formType) {
			case "probation":
			case "typiep":
			case "terfi":
				aRoles.shift(); //remove ME role
				oViewModel.setProperty("/filterVisibleME", false);
				oViewModel.setProperty("/filterVisibleMA", true);
				this._oIconTabBar.setSelectedKey("MA");
				break;
			default:
				break;
			}
			var sFilterName;
			var sCountName;
			$.each(aRoles, function (i, sRole) {
				$.each(aSelectedDates, function (j, sYear) {
					var aDate = _getDate(sYear);
					var oUrlParam = {
						"StartDate": aDate[0],
						"EndDate": aDate[1],
						"RoleId": sRole,
						"FormType": sParams.formType
					};
					oBatchPack.urlParameters = oUrlParam;
					oModel.callFunction("/GetDocumentList", oBatchPack);
				});

				//Initiate icon tab statistics
				// sFilterName = "/filterVisible" + sRole;
				// sCountName = "/formCount" + sRole;
				// if (sFilterName !== "filterVisibleME") {
				// 	oViewModel.setProperty(sFilterName, false);
				// }
				// oViewModel.setProperty(sCountName, 0);
			});

			this._openBusyFragment("formListPrepared", []);
			oModel.submitChanges({
				groupId: sBatchGroup,
				success: function (d, r) {
					if (r.statusCode === 202) {
						$.each(d.__batchResponses, function (i, oResponse) {
							if (oResponse.hasOwnProperty("data")) {
								var aResults = oResponse.data.results;
								$.each(aResults, function (sIndex, oResult) {
									if (sIndex === 0) {
										sFilterName = "/filterVisible" + oResult.RoleId;
										oViewModel.setProperty(sFilterName, true);
									}
									oThis._aFormList.push(oResult);
								});
							}
						});

						oThis._aFormList = _.uniqBy(oThis._aFormList, "AppraisalId");

						$.each(aRoles, function (i, sRole) {
							var aCount = _.filter(oThis._aFormList, [
								"RoleId", sRole
							]) || [];
							var sCountName = "/formCount" + sRole;
							oViewModel.setProperty(sCountName, aCount.length);
						});

					}
					oThis._closeBusyFragment();
					oThis.onRefreshTable();

				},
				error: function (oErr) {
					jQuery.sap.log.error(oErr);
				}
			});

		},
		onRoleSelect: function () {
			this.onRefreshTable();
		},

		onRefreshTable: function () {
			var sKey = this._oIconTabBar.getSelectedKey();
			var oViewModel = this.getModel("formListModel");
			var aCurrentForms = [];
			oViewModel.setProperty("/currentFormList", []);

			$.each(this._aFormList, function (i, oForm) {
				if (oForm.RoleId === sKey) {
					aCurrentForms.push(oForm);
				}
			});

			oViewModel.setProperty("/currentFormList", aCurrentForms);
		},

		onFormPress: function (oEvent) {
			var oViewModel = this.getModel("formListModel");
			var sPath = oEvent.getSource()
				.getBindingContextPath();

			//Set selected form to the shared model
			this.getUIHelper()
				.setCurrentForm(oViewModel.getProperty(sPath));

			this.getUIHelper()
				.setListViewBusy(true);

			this.getRouter()
				.navTo("formdetail", {
					appraisalId: oViewModel.getProperty(sPath + "/AppraisalId")
				});
		},

		onSearch: function (oEvent) {
			if (oEvent.getParameters()
				.refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var oTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					oTableSearchState = [new Filter("AppraisalName", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(oTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			this._oTable.getBinding("items")
				.refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		_checkMobile: function (fnCallBack) {
			var that = this;
			if (!sap.ui.Device.system.desktop) {
				MessageBox.warning("Sadece masaüstü erişimi destekleniyor", {
					actions: [MessageBox.Action.CLOSE],
					onClose: function (sAction) {
						that.onNavHome();
					}.bind(this)
				});
			} else {
				fnCallBack();
			}
		},
		_onListPatternMatched: function (oEvent) {
			var oRenderer = sap.ushell.Container.getRenderer("fiori2");
			var sFormType = oEvent.getParameter("arguments")
				.formType;
			var that = this;

			var doContinue = function () {
				oRenderer.setHeaderVisibility(false, false, ["app"]);
				if (!that.getUIHelper()
					.getFormListUpdated()) {
					that.onRefreshFormList();
				}
			};

			this._checkMobile(doContinue);

		},
		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function (oItem) {
			this.getRouter()
				.navTo("object", {
					objectId: oItem.getBindingContext()
						.getProperty("AppraisalId")
				});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {object} oTableSearchState an array of filters for the search
		 * @private
		 */
		_applySearch: function (oTableSearchState) {
			var oViewModel = this.getModel("formListModel");
			this._oTable.getBinding("items")
				.filter(oTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (oTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle()
					.getText("formListNoDataWithSearchText"));
			}
		},

		/**
		 * Internal helper method to show hide selection bar
		 * @private
		 */
		_doShowHideSelection: function () {
			var oViewModel = this.getModel("formListModel");
			//var sId = this.byId("idFormSelectionContainer").getId() + "--Grid";
			//var oThis = this;

			//var doToggleIcon = function (oObj) {
			var sIcon = oViewModel.getProperty("/selectionToggle");
			var sFilter = oViewModel.getProperty("/filterFormVisible");
			if (sIcon === "sap-icon://hide") {
				//$(oObj).parent().parent().addClass("zeroPadding");
				sIcon = "sap-icon://show";
			} else {
				//$(oObj).parent().parent().removeClass("zeroPadding");
				sIcon = "sap-icon://hide";
			}

			sFilter = sFilter ? false : true;

			oViewModel.setProperty("/selectionToggle", sIcon);
			oViewModel.setProperty("/filterFormVisible", sFilter);
			//};

			// $("#" + sId).slideToggle({
			// 	duration: 400,
			// 	easing: "swing",
			// 	done: function () {
			// 		doToggleIcon(this);
			// 	}
			// });
		},

		_initiateYears: function () {
			//var oViewModel = this.getModel("formListModel");
			var sToday = new Date()
				.getFullYear();
			var aDates = [];
			var sYearFrom = sToday - 3;
			while (sToday > sYearFrom) {
				var oDate = {
					"Year": sToday,
					"Begda": new Date(sToday, 0, 1),
					"Endda": new Date(sToday, 11, 31)
				};
				oDate.Begda.setHours(9);
				oDate.Endda.setHours(9);
				aDates.push(oDate);
				sToday--;
			}
			return aDates;
			//oViewModel.setProperty("/dateSelection", aDates);
		}

	});
});