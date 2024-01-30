/*global location*/
/*global window*/
/*global setTimeout*/
/*global setInterval*/
/*global clearTimeout*/
/*global clearInterval*/
/*global console*/
/*global document*/
/*global _*/
sap.ui.define(
  [
    "hcm/ux/hapv3/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "hcm/ux/hapv3/model/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/MessagePopover",
    "sap/m/MessagePopoverItem",
    "smod/ui5/controls/HapIndicatorPanel",
    "smod/ui5/controls/HapMessageStrip",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    // "sap/viz/ui5/controls/VizFrame",
    // "sap/viz/ui5/data/FlattenedDataset",
    // "sap/viz/ui5/data/DimensionDefinition",
    // "sap/viz/ui5/data/MeasureDefinition",
    // "sap/viz/ui5/controls/common/feeds/FeedItem",
    // "sap/viz/ui5/format/ChartFormatter",
    // "sap/viz/ui5/api/env/Format",
    // "hcm/ux/hapv3/utils/CustomChartFormatter",
    "sap/ui/core/format/DateFormat",
    "smod/ui5/controls/SmodTabContainer",
    "smod/ui5/controls/SmodTabHeader",
    "smod/ui5/controls/SmodTabContent",
    "smod/ui5/controls/SmodApexChart",
  ],
  function (
    BaseController,
    JSONModel,
    History,
    formatter,
    MessageToast,
    MessageBox,
    MessagePopover,
    MessageItem,
    HapIndicatorPanel,
    HapMessageStrip,
    Filter,
    FilterOperator,
    // VizFrame,
    // FlattenedDataset,
    // DimensionDefinition,
    // MeasureDefinition,
    // FeedItem,
    // ChartFormatter,
    // Format,
    // CustomChartFormatter,
    DateFormat,
    SmodTabContainer,
    SmodTabHeader,
    SmodTabContent,
    SmodApexChart
  ) {
    "use strict";

    return BaseController.extend("hcm.ux.hapv3.controller.FormDetails", {
      formatter: formatter,
      hasChanges: false,
      _aFormUIElements: [],

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: function () {
        // Model used to manipulate control states. The chosen values make sure,
        // detail page is busy indication immediately so there is no break in
        // between the busy indication for loading the view's meta data
        var oViewModel = new JSONModel({
          busy: true,
          delay: 0,
          appraisalId: null,
          currentRowIid: null,
          currentAppraisalId: null,
          devPlanAppraisalId: null,
          navigationData: [],
          sidebarData: {
            visible: false,
            appeeInfo: {},
            apper1stInfo: {},
            apper2ndInfo: {},
            apper3rdInfo: {},
            statusInfo: [],
            footerData: [],
          },
          formProp: [],
          formParameters: {},
          formData: {},
          bodyElements: {},
          bodyElementsCopy: {},
          bodyCells: {},
          bodyCellsCopy: {},
          bodyColumns: {},
          bodyCellValues: {},
          currentForm: {},
          formMessages: [],
          newElement: {
            Value: null,
            RowIid: null,
            PlaceHolder: null,
            ParentName: null,
          },
          beforeAddFreeFormData: {},
          objectiveDialog: {
            AppraisalId: null,
            Objectives: [],
            FormParameters: {},
          },
          attachmentCollection: {},
          elementSurveys: {},
          surveyCloseButtonVisible: false,
          headerVisible: false,
          currentCellValueDescription: [],
          introSteps: [],
          footerButtons: [],
          formSections: [],
          allSectionsClicked: false,
          developmentPlan: {},
        });

        var oGraphModel = new JSONModel();

        //Set page layout
        this._oPageLayout = this.byId("idDetailObjectPageLayout");
        this._oNavContainer = this.byId("idPageNavigationContainer");

        // Store original busy indicator delay, so it can be restored later on
        this.setModel(oViewModel, "formDetailsModel");
        this.setModel(oGraphModel, "formGraphModel");

        this.getRouter()
          .getRoute("formdetail")
          .attachPatternMatched(this._onPatternMatched, this);

        /*this._oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			this._oMessageManager = sap.ui.getCore().getMessageManager();

			this._oMessageManager.registerMessageProcessor(this._oMessageProcessor);*/

        /*Register customer format*/
        //CustomChartFormatter.registerCustomFormat();

        var oThis = this;

        $(function () {
          window.onhashchange = function (oEvent) {
            var oHash = oEvent.currentTarget.hasher.getHash();
            if (oHash.indexOf("GetDetail") === -1) {
              oThis._initializeViewModel();
              oThis._setChangeListeners(false);
            }
          };
          /*jQuery.sap.history({
					routes: [], //please refer to the jQuery.sap.history function comment for the format.
					defaultHandler: function () {
						oThis._doNavBack();
					}
				});*/
        });
      },
      onAfterRendering: function () {},

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      onNavBack: function (sFromSave) {
        this._doNavBack(false);
      },

      onExit: function (oEvent) {
        this._initializeViewModel();
      },

      onMessagesButtonPress: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var oThis = this;
        if (!this._oMessagePopover) {
          this._oMessagePopover = new MessagePopover({
            items: {
              path: "/formMessages",
              template: new MessageItem({
                type: "{type}",
                title: "{message}",
              }),
            },
            headerButton: new sap.m.Button({
              icon: "sap-icon://delete",
              text: "{i18n>clearMessages}",
              press: function () {
                oThis._removeAllMessages();
                oThis._oMessagePopover.close();
              },
            }),
          });
          this._oMessagePopover.setModel(oViewModel);
          // this._oMessagePopover.attachAfterClose(null, function () {
          // 	oThis._removeAllMessages();
          // }, this);
        }
        if (oEvent) {
          this._oMessagePopover.openBy(oEvent.getSource());
        } else {
          var oNavContainer = this.byId("idPageNavigationContainer");
          var oCurrentPage = oNavContainer.getCurrentPage();
          this._oMessagePopover.openBy(
            oCurrentPage.getFooter().getAggregation("content")[0]
          );
        }
      },

      /**
       * Handlers
       * @function
       * @private
       */
      _doNavBack: function (sFromSave) {
        var oThis = this;
        if (sFromSave) {
          this._setChangeListeners(false);
          this._doNavToMain();
        } else {
          if (this.hasChanges) {
            this._generateConfirmDialog(
              "formHasChanges",
              "formQuitWithoutSave",
              [],
              "exitWithoutSave",
              "Emphasized",
              "sap-icon://nav-back",
              oThis._doNavToMain,
              "Warning"
            );
          } else {
            this._setChangeListeners(false);
            this._doNavToMain();
          }
        }
      },
      _generateConfirmDialog: function (
        sConfirmHeaderi18n,
        sConfirmTexti18n,
        sConfirmTextParams,
        sButtonText,
        sButtonType,
        sButtonIcon,
        oCallBack,
        sDialogType,
        sEndButtonText,
        sEndButtonType,
        sEndButtonIcon,
        oEndCallBack
      ) {
        var sConfirmHeader =
          this.getResourceBundle().getText(sConfirmHeaderi18n);
        var sConfirmText = this.getResourceBundle().getText(
          sConfirmTexti18n,
          sConfirmTextParams
        );
        var oThis = this;
        var oEndButtonProp = null;

        var oBeginButtonProp = {
          text: oThis.getResourceBundle().getText(sButtonText),
          type: sButtonType,
          icon: sButtonIcon,
          onPressed: oCallBack.bind(oThis),
        };

        if (sEndButtonText) {
          oEndButtonProp = {
            text: oThis.getResourceBundle().getText(sEndButtonText),
            type: sEndButtonType,
            icon: sEndButtonIcon,
            onPressed: oEndCallBack.bind(oThis),
          };
        }

        oThis.confirmDialog = this._callConfirmDialog(
          sConfirmHeader,
          "Message",
          sDialogType,
          sConfirmText,
          oBeginButtonProp,
          oEndButtonProp
        );

        oThis.confirmDialog.open();
      },

      _showShepherdIntro: function () {
        this._oTour.start();
      },
      _addShepherdStep: function (
        sTitle,
        sText,
        sElementSelector,
        sPosition,
        bArrow,
        bBack,
        bNext,
        bDone,
        sId
      ) {
        let oStep = {
          title: sTitle ? sTitle : null,
          text: sText,
          arrow: bArrow,
          canClickTarget: false,
          attachTo: {
            element: sElementSelector,
            on: sPosition,
          },
          buttons: [],
          id: sId ? sId : "id" + new Date().getTime(),
        };

        if (bBack) {
          oStep.buttons.push({
            action() {
              return this.back();
            },
            classes: "shepherd-button-secondary",
            text: "&larr;\tGeri",
          });
        }

        if (bDone) {
          oStep.buttons.push({
            action() {
              return this.complete();
            },
            classes: "shepherd-button-complete",
            text: "Bitir",
          });
        }
        if (bNext) {
          oStep.buttons.push({
            action() {
              return this.next();
            },
            text: "İleri\t&rarr;",
          });
        }

        this._oTour.addStep(oStep);
      },

      _doNavToMain: function () {
        this._initializeViewModel();
        this.getRouter().navTo("formlist", null, true);
      },
      _formatDate: function (sDate) {
        try {
          var oDateFormat = DateFormat.getDateTimeInstance({
            pattern: "dd/MM/yyyy",
          });

          return oDateFormat.format(sDate);
        } catch (ex) {
          return "";
        }
      },
      _prepareSideBarData: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var sMainAppraisalId = oViewModel.getProperty("/appraisalId");
        if (sMainAppraisalId === sAppraisalId) {
          var oAppraisee = oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/HeaderAppraisee/0"
          );
          var oAppraiser1st = oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/HeaderAppraiser/0"
          );
          var oAppraiser2nd = oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/HeaderOthers/0"
          );
          var oAppraiser3rd = oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/HeaderOthers/1"
          );
          var oStatus = oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/HeaderStatus"
          );
          var oDates = oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/HeaderDates"
          );
          var aResultsTable = oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ResultTable"
          );
          var oFormParameters = oViewModel.getProperty(
            "/formParameters/" + sAppraisalId
          );
          var oBodyCells = oViewModel.getProperty("/bodyCells/" + sAppraisalId);
          var oSideBarData = oViewModel.getProperty("/sidebarData");
          oSideBarData.visible = true;

          /*Appraisee Data*/
          oSideBarData.appeeInfo.ImageSource =
            "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
            oAppraisee.Id +
            "')/$value";
          oSideBarData.appeeInfo.Title = oAppraisee.Name;
          oSideBarData.appeeInfo.Line1 = oAppraisee.Plstx;
          oSideBarData.appeeInfo.Line2 = oAppraisee.Orgtx;
          /*Appraisee Data*/

          if (oAppraiser1st) {
            /*Appraiser 1st Data*/
            oSideBarData.apper1stInfo.ImageSource =
              "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
              oAppraiser1st.Id +
              "')/$value";
            oSideBarData.apper1stInfo.Id = oAppraiser1st.Id;
            oSideBarData.apper1stInfo.Title = oAppraiser1st.Name;
            oSideBarData.apper1stInfo.Line1 = oAppraiser1st.Plstx;
            oSideBarData.apper1stInfo.Line2 = oAppraiser1st.Orgtx;
            /*Appraiser 1st Data*/
          }

          if (oAppraiser2nd) {
            /*Appraiser 2nd Data*/
            oSideBarData.apper2ndInfo.ImageSource =
              "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
              oAppraiser2nd.Id +
              "')/$value";
            oSideBarData.apper2ndInfo.Id = oAppraiser2nd.Id;
            oSideBarData.apper2ndInfo.Title = oAppraiser2nd.Name;
            oSideBarData.apper2ndInfo.Line1 = oAppraiser2nd.Plstx;
            oSideBarData.apper2ndInfo.Line2 = oAppraiser2nd.Orgtx;
            /*Appraiser 2nd Data*/
          }

          if (oAppraiser3rd) {
            /*Appraiser 3rd Data*/
            oSideBarData.apper3rdInfo.ImageSource =
              "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
              oAppraiser3rd.Id +
              "')/$value";
            oSideBarData.apper3rdInfo.Id = oAppraiser3rd.Id;
            oSideBarData.apper3rdInfo.Title = oAppraiser3rd.Name;
            oSideBarData.apper3rdInfo.Line1 = oAppraiser3rd.Plstx;
            oSideBarData.apper3rdInfo.Line2 = oAppraiser3rd.Orgtx;
            /*Appraiser 3rd Data*/
          }

          /*Status Data*/
          oSideBarData.statusInfo = [];
          oSideBarData.statusInfo.push(
            {
              Label: "Form Durumu",
              Value: oStatus.ApStatusName,
            },
            {
              Label: "Alt Durum",
              Value: oStatus.ApStatusSubName,
            },
            {
              Label: "Dönem Başlangıcı",
              Value: this._formatDate(oDates.ApStartDate),
            },
            {
              Label: "Dönem Sonu",
              Value: this._formatDate(oDates.ApEndDate),
            }
          );
          /*Status Data*/

          /*Footer Data*/
          var aResults = _.filter(aResultsTable, function (oResultLine) {
            if (oResultLine.Sort === "099") {
              return false;
            }
            if (oResultLine.Sort.includes) {
              return !oResultLine.Sort.includes(".");
            } else {
              if (oResultLine.Sort.indexOf(".") !== -1) {
                return false;
              } else {
                return true;
              }
            }
          });
          var aCaption = _.uniqBy(aResults, "RowName");
          var aColumns = _.uniqBy(aResults, "ColIid");
          var aFinalRow = _.filter(aResultsTable, ["Sort", "099"]);
          var sRowIndex = 0;
          var sColIndex = 0;

          oSideBarData.footerData = {
            TableData: [],
            FooterData: [],
          };
          //SUMMARY_WEIGHT_SHOW

          //Form captions
          if (aCaption.length > 0) {
            oSideBarData.footerData.TableData[sColIndex] = {
              Type: "Caption",
              ColumnIndex: sColIndex,
              Data: [
                {
                  Value: oFormParameters["SUMMARY_HEADER_TITLE"], //SUMMARY_HEADER_TITLE
                  Type: "HeaderEmpty",
                  ColumnIndex: sColIndex,
                  RowIndex: sRowIndex,
                },
              ],
            };
          }

          $.each(aCaption, function (sIndex, oCaption) {
            sRowIndex++;
            var sColValue = "";
            if (oFormParameters["SUMMARY_WEIGHT_SHOW"] === "X") {
              try {
                var oCell = oBodyCells[oCaption.RowIid][oCaption.ColumnIid];
                sColValue =
                  oCaption.RowName +
                  " (" +
                  oCell.ValueTxt +
                  "" +
                  oCell.ValueText +
                  ")";
              } catch (oEx) {
                sColValue = oCaption.RowName;
              }
            } else {
              sColValue = oCaption.RowName;
            }
            oSideBarData.footerData.TableData[0].Data.push({
              Value: sColValue,
              Type: "RowLabel",
              ColumnIndex: sColIndex,
              RowIndex: sRowIndex,
            });
          });

          $.each(aColumns, function (sInd1, oColumn) {
            sColIndex++;
            sRowIndex = 0;
            oSideBarData.footerData.TableData[sColIndex] = {
              Type: "Column",
              ColumnIndex: sColIndex,
              Data: [
                {
                  Value: oColumn.ColName,
                  Type: "Header",
                  ColumnIndex: sColIndex,
                  RowIndex: sRowIndex,
                },
              ],
            };
            var aCellVal = _.filter(aResults, ["ColIid", oColumn.ColIid]);
            $.each(aCellVal, function (sInd2, oCell) {
              sRowIndex++;
              oSideBarData.footerData.TableData[sColIndex].Data.push({
                Value: oCell.Value,
                Type: "RowValue",
                ColumnIndex: sColIndex,
                RowIndex: sRowIndex,
              });
            });
          });
          /*Footer of Footer Begin*/
          if (aFinalRow[0]) {
            var sFooterRowColSpan = aFinalRow.length === 1 ? 2 : 1;
            oSideBarData.footerData.FooterData[0] = {
              Type: "Footer",
              Data: [
                {
                  Value: aFinalRow[0].RowName,
                  Type: "FooterLabel",
                  ColSpan: sFooterRowColSpan,
                },
              ],
            };

            $.each(aColumns, function (sIndex, oColumn) {
              var aCellVal = _.filter(aFinalRow, ["ColIid", oColumn.ColIid]);
              $.each(aCellVal, function (sInd3, oCell) {
                oSideBarData.footerData.FooterData[0].Data.push({
                  Value: oCell.Value,
                  Type: "FooterValue",
                  ColSpan: sFooterRowColSpan,
                });
              });
            });

            if (oFormParameters["FINAL_NOTE_AFTER_CALIB"]) {
              oSideBarData.footerData.FooterData.push({
                Type: "FooterFinal",
                Data: [
                  {
                    Value: "KALİBRASYON SONUCU",
                    Type: "FooterLabel",
                    ColSpan: aFinalRow.length === 1 ? 2 : 1,
                  },
                  {
                    Value: oFormParameters["FINAL_NOTE_AFTER_CALIB"],
                    Type: "FooterValue",
                    ColSpan: aFinalRow.length === 1 ? 2 : 3,
                  },
                ],
              });
            }

            if (oFormParameters["FINAL_TEXT_AFTER_CALIB"]) {
              oSideBarData.footerData.FooterData.push({
                Type: "FooterNote",
                Data: [
                  {
                    Value: oFormParameters["FINAL_TEXT_AFTER_CALIB"],
                    Type: "FooterValue",
                    ColSpan: 3,
                  },
                ],
              });
            }

            //FINAL_NOTE_AFTER_CALIB
            //FINAL_TEXT_AFTER_CALIB
          }

          /*Footer of Footer End*/
          /*Footer Data*/

          oViewModel.setProperty("/sidebarData", oSideBarData);
        }
      },
      _initializeViewModel: function () {
        var oViewModel = this.getModel("formDetailsModel");

        this._resetSections();

        //this._oNavContainer.destroyPages();
        //this._oNavContainer.removeAllPages();
        this._oNavContainer.setInitialPage(null);

        //Initiate
        oViewModel.setProperty("/navigationData", []);
        oViewModel.setProperty("/sidebarData", {
          visible: false,
          appeeInfo: {},
          apper1stInfo: {},
          apper2ndInfo: {},
          apper3rdInfo: {},
          statusInfo: [],
          footerData: [],
        });
        oViewModel.setProperty("/formData", {});
        oViewModel.setProperty("/formParameters", {});
        oViewModel.setProperty("/formProp", []);
        oViewModel.setProperty("/bodyElementsCopy", {});
        oViewModel.setProperty("/bodyColumns", {});
        oViewModel.setProperty("/bodyCells", {});
        oViewModel.setProperty("/bodyCellsCopy", {});
        oViewModel.setProperty("/bodyCellValues", {});
        oViewModel.setProperty("/currentForm", {});
        oViewModel.setProperty("/formMessages", []);
        oViewModel.setProperty("/appraisalId", null);
        oViewModel.setProperty("/devPlanAppraisalId", null);
        oViewModel.setProperty("/currentRowIid", null);
        oViewModel.setProperty("/currentAppraisalId", null);
        oViewModel.setProperty("/attachmentCollection", {});
        oViewModel.setProperty("/elementSurveys", {});
        oViewModel.setProperty("/surveyCloseButtonVisible", false);
        oViewModel.setProperty("/surveyUIElements", []);
        oViewModel.setProperty("/headerVisible", false);
        oViewModel.setProperty("/currentCellValueDescription", []);
        oViewModel.setProperty("/introSteps", []);
        oViewModel.setProperty("/footerButtons", {});
        oViewModel.setProperty("/formSections", []);
        oViewModel.setProperty("/allSectionsClicked", false);
        oViewModel.setProperty("/newElement", {
          Value: null,
          RowIid: null,
          PlaceHolder: null,
          ParentName: null,
          AppraisalId: null,
        });
        oViewModel.setProperty("/objectiveDialog", {
          AppraisalId: null,
          Objectives: [],
          FormParameters: {},
        });
        oViewModel.setProperty("/beforeAddFreeFormData", {});
        oViewModel.setProperty("/developmentPlan", {});

        this.hasChanges = false;

        this._removeAllMessages();

        this._oIntro = null;
        this._sIntro = false;

        this._aFormUIElements = [];
      },
      _onPatternMatched: function (oEvent) {
        var oRenderer = sap.ushell.Container.getRenderer("fiori2");
        oRenderer.setHeaderVisibility(false, false, ["app"]);

        /*Initiate view data*/
        this._initializeViewModel();

        /*Close busy dialog*/
        this.getUIHelper().setListViewBusy(false);

        var sAppraisalId = oEvent.getParameter("arguments").appraisalId;
        var oViewModel = this.getModel("formDetailsModel");
        var oFormData = this.getUIHelper().getCurrentForm();
        //console.log(oFormData);
        //Set form data and appraisal id
        oViewModel.setProperty("/currentForm", oFormData);
        oViewModel.setProperty("/appraisalId", sAppraisalId);

        //Get other details form
        this._getDocumentDetail();
      },
      _setHeaderOthersVisibility: function (sVal) {
        $("#idOthersHeaderSection").css("display", sVal);
      },
      _setHeaderAppraiserVisibility: function (sVal) {
        $("#idAppraiserHeaderSection").css("display", sVal);
      },
      _setHeaderStatusVisibility: function (sVal) {
        $("#idStatusHeaderSection").css("display", sVal);
      },
      _convertToGuid: function (sId) {
        var regexGroupGuid = /(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/;
        return sId.toLowerCase().replace(regexGroupGuid, "$1-$2-$3-$4-$5");
      },
      _getDevPlanDetail: function (oDevPlan, sAppraisalId) {
        var oModel = this.getModel();
        var aFilters = [];
        var oViewModel = this.getModel("formDetailsModel");
        var that = this;
        var sGuid = this._convertToGuid(oDevPlan.Value);

        var sQuery =
          "/DocumentOperationsSet(AppraisalId=guid'" +
          sGuid +
          "',PartApId='0000')";
        var oFormData = {};
        var aFormProp = [];
        var sExpand =
          "BodyElements,BodyColumns,BodyCells,BodyCellValues," +
          "BodyCellRanges,BodyElementButtons,HeaderAppraisee," +
          "HeaderAppraiser,HeaderOthers,HeaderDates,HeaderDisplay," +
          "HeaderText,HeaderStatus,DocProcessing,Buttons,DocTab,Return," +
          "FeAlreadyChosen,FeFlatAvailable,FeSelectableOtype,FeStrucAvailable," +
          "FeBodyElementsAdd,ReturnOp,FormQuestions,FormAnswers,Competencies," +
          "Objectives,FormParameters,ResultTable,DevPlanActivities";

        aFilters.push(
          new sap.ui.model.Filter("Mode", sap.ui.model.FilterOperator.EQ, "X")
        );

        oViewModel.setProperty("/devPlanAppraisalId", sGuid);

        oModel.read(sQuery, {
          urlParameters: {
            $expand: sExpand,
          },
          filters: aFilters,
          success: function (oData, oResponse) {
            aFormProp = sExpand.split(",");
            for (var i = 0; i < aFormProp.length; i++) {
              if (oData[aFormProp[i]].hasOwnProperty("results")) {
                oFormData[aFormProp[i]] = _.cloneDeep(
                  oData[aFormProp[i]].results
                );
              } else {
                oFormData[aFormProp[i]] = _.cloneDeep(oData[aFormProp[i]]);
              }
            }

            oViewModel.setProperty(
              "/developmentPlan/selectedFilterKey",
              "DP_STAT_TAB"
            );
            oViewModel.setProperty("/developmentPlan/formData", oFormData);
            oViewModel.setProperty("/formData/" + oData.AppraisalId, oFormData);
            oViewModel.setProperty("/formProp/" + oData.AppraisalId, aFormProp);
            that._formBodyElementsObject(oData.AppraisalId);
            that._formBodyColumnsObject(oData.AppraisalId);
            that._formBodyCellsObject(oData.AppraisalId);
            that._cloneComparisonObjects(oData.AppraisalId);
            that._formElementSurveysObject(oData.AppraisalId);
            that._formParametersObject(oData.AppraisalId);

            that._setDevPlanData(oData);

            that._buildUINew(sAppraisalId);
            that._refreshAttachmentList(oData.AppraisalId);
            that._closeBusyFragment();
          },
          error: function (oError) {
            that._closeBusyFragment();
          },
        });
      },
      _setDevPlanData: function (oData) {
        var oViewModel = this.getModel("formDetailsModel");
        var aSection = [];
        var sFirst = true;

        //Set body elements, cells, columns, parameters

        /*Body Elements*/
        var aBodyElements = oViewModel.getProperty(
          "/developmentPlan/formData/BodyElements"
        );
        var oBodyElements = {};

        $.each(aBodyElements, function (sIndex, oElement) {
          var oBodyElement = {};

          oBodyElement[oElement.RowIid] = oElement;
          if (typeof Object.assign === "function") {
            Object.assign(oBodyElements, oBodyElement);
          } else {
            $.extend(oBodyElements, oBodyElement);
          }
        });

        oViewModel.setProperty("/developmentPlan/bodyElements", oBodyElements);
        /*Body Elements*/

        /*Body Columns*/
        var aBodyColumns = oViewModel.getProperty(
          "/developmentPlan/formData/BodyColumns"
        );
        var oBodyColumns = {};
        var oSpecialColumns = {};

        $.each(aBodyColumns, function (sIndex, oColumn) {
          oSpecialColumns[oColumn.ColumnId] = oColumn.ColumnIid;
          var oBodyColumn = {};
          oBodyColumn[oColumn.ColumnIid] = oColumn;
          if (typeof Object.assign === "function") {
            Object.assign(oBodyColumns, oBodyColumn);
          } else {
            $.extend(oBodyColumns, oBodyColumn);
          }
        });

        oViewModel.setProperty("/developmentPlan/bodyColumns", oBodyColumns);
        oViewModel.setProperty(
          "/developmentPlan/specialColumns",
          oSpecialColumns
        );
        /*Body Columns*/

        /*Body Cells*/

        var aBodyCells = oViewModel.getProperty(
          "/developmentPlan/formData/BodyCells"
        );
        var aBodyCellValues = oViewModel.getProperty(
          "/developmentPlan/formData/BodyCellValues"
        );
        var oBodyCells = {};
        var oBodyCellValues = {};

        $.each(aBodyElements, function (sIndex, oElement) {
          oBodyCells[oElement.RowIid] = {};
          oBodyCellValues[oElement.RowIid] = {};
        });

        $.each(aBodyCells, function (sIndex, oCell) {
          oBodyCells[oCell.RowIid][oCell.ColumnIid] = oCell;
          oBodyCellValues[oCell.RowIid][oCell.ColumnIid] = {};
          oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues = [];
          $.each(aBodyCellValues, function (sValin, oCellValue) {
            if (
              oCellValue.RowIid === oCell.RowIid &&
              oCellValue.ColumnIid === oCell.ColumnIid
            ) {
              oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues.push(
                oCellValue
              );
            }
          });
        });

        oViewModel.setProperty("/developmentPlan/bodyCells", oBodyCells);
        oViewModel.setProperty(
          "/developmentPlan/bodyCellValues",
          oBodyCellValues
        );
        /*Body Cells*/

        /*Form Parameters*/
        var aParams = oViewModel.getProperty(
          "/developmentPlan/formData/FormParameters"
        );
        var oParams = {};

        $.each(aParams, function (sIndex, oParam) {
          oParams[oParam.Param] = oParam.Value;
        });
        oViewModel.setProperty("/developmentPlan/formParameters", oParams);
        /*Form Parameters*/

        var sParStrengths = oParams["FORM_VB_DP_STRENGTHS"];
        var sParOppurts = oParams["FORM_VB_DP_OPPURTS"];
        var sParWeakness = oParams["FORM_VB_DP_WEAKNESS"];

        if (sParStrengths) {
          this._setDevPlanSection(
            sParStrengths,
            aSection,
            sFirst,
            "sap-icon://favorite"
          );
          sFirst = false;
        }

        if (sParOppurts) {
          this._setDevPlanSection(
            sParOppurts,
            aSection,
            sFirst,
            "sap-icon://begin"
          );
          sFirst = false;
        }

        if (sParWeakness) {
          this._setDevPlanSection(
            sParWeakness,
            aSection,
            sFirst,
            "sap-icon://media-play"
          );
          sFirst = false;
        }

        oViewModel.setProperty(
          "/developmentPlan/developmentPlanSections",
          aSection
        );
      },
      _setDevPlanSection: function (sPar, aSection, sFirst, sIcon) {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty(
          "/developmentPlan/formData/BodyElements"
        );
        var oSec = _.find(aBodyElements, {
          ElementType: "VB",
          ElementId: sPar,
        });
        if (oSec) {
          var oSection = {
            RowIid: oSec.RowIid,
            SectionId: oSec.ElementType + oSec.ElementId,
            IsActive: _.clone(sFirst),
            Type: "Regular",
            SectionName: oSec.Name,
            Icon: sIcon,
          };
          this._setDevPlanCompetencies(oSection);
          aSection.push(oSection);
        }
      },
      _setDevPlanCompetencies: function (oSection) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty(
          "/developmentPlan/formData/BodyElements"
        );
        var aComp = _.filter(aBodyElements, {
          Parent: oSection.RowIid,
        });

        oSection.Competencies = [];

        if (aComp.length > 0) {
          oSection.ActiveCompetencyId =
            aComp[0].ForeignType + aComp[0].ForeignId;

          $.each(aComp, function (sIndex, oComp) {
            var oCompetency = {
              AppraisalId: oComp.AppraisalId,
              RowIid: oComp.RowIid,
              CompetencyId: oComp.ForeignType + oComp.ForeignId,
              SectionId: oSection.SectionId,
              CompetencyName: oComp.Name,
            };

            that._setBehavioralIndicators(oCompetency);
            that._setDevPlanTrainings(oCompetency);
            that._setDevPlanActivity(oCompetency);

            oCompetency.SelectedSegment =
              oCompetency.BehavioralIndicators.length > 0
                ? oSection.SectionId + "BI"
                : oSection.SectionId + "EP";

            oSection.Competencies.push(oCompetency);
          });
        }
      },
      _setBehavioralIndicators: function (oComp) {
        var oViewModel = this.getModel("formDetailsModel");
        var aFormParam = oViewModel.getProperty(
          "/developmentPlan/formData/FormParameters"
        );
        var aBodyElements = oViewModel.getProperty(
          "/developmentPlan/formData/BodyElements"
        );
        var oBIPar = _.find(aFormParam, ["Param", "FORM_VB_DP_REF_BIND"]);
        oComp.BehavioralIndicators = [];
        if (oBIPar) {
          var oBI = _.find(aBodyElements, {
            ElementType: "VB",
            ElementId: oBIPar.Value,
            Parent: oComp.RowIid,
          });
          if (oBI) {
            var aBI = _.filter(aBodyElements, {
              Parent: oBI.RowIid,
            });
            $.each(aBI, function (sIndex, oInd) {
              oComp.BehavioralIndicators.push({
                AppraisalId: oInd.AppraisalId,
                RowIid: oInd.RowIid,
                CompetencyId: oComp.CompetencyId,
                Id: oInd.ForeignType + oInd.ForeignId,
                Name: oInd.Name,
              });
            });
          }
        }
      },
      _setDevPlanActivity: function (oComp) {
        var oViewModel = this.getModel("formDetailsModel");
        var aFormParam = oViewModel.getProperty(
          "/developmentPlan/formData/FormParameters"
        );
        var aBodyElements = oViewModel.getProperty(
          "/developmentPlan/formData/BodyElements"
        );
        var oActPar = _.find(aFormParam, ["Param", "FORM_VB_DP_REF_DACT"]);

        oComp.ActivityPlan = null;
        if (oActPar) {
          var oAct = _.find(aBodyElements, {
            ElementType: "VB",
            ElementId: oActPar.Value,
            Parent: oComp.RowIid,
          });
          if (oAct) {
            oComp.ActivityPlan = _.clone(oAct);
          }
        }
      },
      _setDevPlanTrainings: function (oComp) {
        var oViewModel = this.getModel("formDetailsModel");
        var aFormParam = oViewModel.getProperty(
          "/developmentPlan/formData/FormParameters"
        );
        var aBodyElements = oViewModel.getProperty(
          "/developmentPlan/formData/BodyElements"
        );
        var oTCPar = _.find(aFormParam, ["Param", "FORM_VB_DP_REF_TCAT"]);
        var oTFPar = _.find(aFormParam, ["Param", "FORM_VB_DP_REF_TFRE"]);

        if (oTCPar) {
          var oTC = _.find(aBodyElements, {
            ElementType: "VB",
            ElementId: oTCPar.Value,
            Parent: oComp.RowIid,
          });
          if (oTC) {
            oComp.TrainingFromCatalog = _.clone(oTC);
          }
        } else {
          oComp.TrainingFromCatalog = null;
        }
        if (oTFPar) {
          var oTF = _.find(aBodyElements, {
            ElementType: "VB",
            ElementId: oTFPar.Value,
            Parent: oComp.RowIid,
          });
          if (oTF) {
            oComp.TrainingFreeSelection = _.clone(oTF);
          }
        } else {
          oComp.TrainingFreeSelection = null;
        }
      },
      _getDocumentDetail: function () {
        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");
        var oThis = this;
        var oFormData = {};
        var aFormProp = [];
        var aFilters = [];
        var sHasErrors = false;
        var sAppraisalId = oViewModel.getProperty("/appraisalId");

        //Set header others invisible
        this._setHeaderOthersVisibility("none");
        this._setHeaderAppraiserVisibility("none");
        this._setHeaderStatusVisibility("none");

        var sQuery =
          "/DocumentOperationsSet(AppraisalId=guid'" +
          sAppraisalId +
          "',PartApId='0000')";
        var sExpand =
          "BodyElements,BodyColumns,BodyCells,BodyCellValues," +
          "BodyCellRanges,BodyElementButtons,HeaderAppraisee," +
          "HeaderAppraiser,HeaderOthers,HeaderDates,HeaderDisplay," +
          "HeaderText,HeaderStatus,DocProcessing,Buttons,DocTab,Return," +
          "FeAlreadyChosen,FeFlatAvailable,FeSelectableOtype,FeStrucAvailable," +
          "FeBodyElementsAdd,ReturnOp,FormQuestions,FormAnswers,Competencies," +
          "Objectives,FormParameters,ResultTable,DevPlanActivities,Intros";

        aFilters.push(
          new sap.ui.model.Filter("Mode", sap.ui.model.FilterOperator.EQ, "X")
        );

        this._openBusyFragment("formDetailPrepared", []);

        oViewModel.setProperty("/formData", {});
        oViewModel.setProperty("/headerVisible", false);
        oViewModel.setProperty("/formProp", []);

        oModel.read(sQuery, {
          urlParameters: {
            $expand: sExpand,
          },
          filters: aFilters,
          success: function (oData, oResponse) {
            aFormProp = sExpand.split(",");
            for (var i = 0; i < aFormProp.length; i++) {
              if (oData[aFormProp[i]].hasOwnProperty("results")) {
                oFormData[aFormProp[i]] = _.cloneDeep(
                  oData[aFormProp[i]].results
                );
              } else {
                oFormData[aFormProp[i]] = _.cloneDeep(oData[aFormProp[i]]);
              }
            }

            oViewModel.setProperty("/formData/" + sAppraisalId, oFormData);
            oViewModel.setProperty("/formProp/" + sAppraisalId, aFormProp);
            oThis._formBodyElementsObject(sAppraisalId);
            oThis._formBodyColumnsObject(sAppraisalId);
            oThis._formBodyCellsObject(sAppraisalId);
            oThis._cloneComparisonObjects(sAppraisalId);
            oThis._formElementSurveysObject(sAppraisalId);
            oThis._formParametersObject(sAppraisalId);
            oThis._prepareSideBarData(sAppraisalId);
            oThis._refreshAttachmentList(sAppraisalId);

            var oDevPlan = _.find(oFormData.FormParameters, [
              "Param",
              "FORM_DP_APPRAISAL_ID",
            ]);
            if (oDevPlan) {
              oThis._getDevPlanDetail(oDevPlan, sAppraisalId);
            } else {
              oThis._buildUINew(sAppraisalId);
              oThis._closeBusyFragment();
            }

            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = oThis._processReturnMessagesNew(
                  oData.Return.results,
                  true
                );
              }
            }
          },
          error: function (oError) {
            oThis._closeBusyFragment();
          },
        });
      },

      _setChangeListeners: function (sSet, sAppraisalId) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oCellsModel = new sap.ui.model.Binding(
          oViewModel,
          "/",
          oViewModel.getContext("/bodyCells/" + sAppraisalId)
        );
        var oElementsModel = new sap.ui.model.Binding(
          oViewModel,
          "/",
          oViewModel.getContext("/bodyElements/" + sAppraisalId)
        );
        if (sSet) {
          oCellsModel.attachChange(function (oEvent) {
            if (!oThis._compareClonedObjects(sAppraisalId)) {
              oThis.hasChanges = true;
            }
          });

          oElementsModel.attachChange(function (oEvent) {
            if (!oThis._compareClonedObjects(sAppraisalId)) {
              oThis.hasChanges = true;
            }
          });

          oThis.hasChanges = false;
        } else {
          oCellsModel.detachChange(function () {
            oThis.hasChanges = false;
          });
          oElementsModel.detachChange(function () {
            oThis.hasChanges = false;
          });
        }
      },

      _refreshAttachmentList: function (sAppraisalId) {
        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");
        var oThis = this;

        /*Initiate attachment list*/
        oViewModel.setProperty("/attachmentCollection/" + sAppraisalId, {});

        var oUrlParams = {
          AppraisalId: sAppraisalId,
        };

        var oAttCollection = {};

        oModel.callFunction("/GetAttachmentList", {
          method: "GET",
          urlParameters: oUrlParams,
          success: function (oData, oResponse) {
            $.each(oData.results, function (sIndex, oLine) {
              if (!oAttCollection.hasOwnProperty(oLine.RowIid)) {
                oAttCollection[oLine.RowIid] = {
                  attachmentList: [],
                };
              }
              oLine.Type = oLine.Type.toLowerCase();
              oAttCollection[oLine.RowIid].attachmentList.push(oLine);
            });
            oViewModel.setProperty(
              "/attachmentCollection/" + sAppraisalId,
              oAttCollection
            );

            oThis._setChangeListeners(true, sAppraisalId);
            oThis.hasChange = false;
          },
          error: function (oError) {
            oThis.hasChange = false;
          },
        });
      },
      onNavItemSelected: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var aNavigationData = oViewModel.getProperty("/navigationData");

        var oElement = _.find(aNavigationData, [
          "RowIid",
          oEvent.getParameter("rowIid"),
        ]);
        try {
          if (
            oElement &&
            !_.isEqual(
              this._oNavContainer.getCurrentPage().getId(),
              oElement.PageId
            )
          ) {
            this._oNavContainer.to(oElement.PageId);
          }
        } catch (oEx) {
          jQuery.sap.log.error("Navigation failed:" + oElement);
        }
      },
      /**
       * Build UI of performance form
       * @function
       * @private
       */
      _getToolbarTemplateNew: function (sAppraisalId) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");
        var sDevPlanAppraisalId = oViewModel.getProperty("/devPlanAppraisalId");

        this._adjustButtonsNew(sAppraisalId);

        var oActionButton = new sap.m.Button({
          text: "{formDetailsModel>Text}",
          visible: {
            parts: [
              {
                path: "formDetailsModel>Availability",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>/developmentPlan/selectedFilterKey",
              },
            ],
            formatter: function (
              sAvailability,
              sStatusRelevant,
              sButtonId,
              sKey
            ) {
              if (sAppraisalId === sDevPlanAppraisalId) {
                var sSelectedFilter = oViewModel.getProperty(
                  "/developmentPlan/selectedFilterKey"
                );
                if (sSelectedFilter === "DP_STAT_TAB") {
                  if (sButtonId === "START_DEV_PLAN") {
                    return true;
                  } else {
                    return false;
                  }
                } else {
                  if (sButtonId === "START_DEV_PLAN") {
                    return false;
                  } else {
                    if (sAvailability === "" || sAvailability === "B") {
                      return true;
                    } else {
                      return false;
                    }
                  }
                }
              } else {
                if (sAvailability === "" || sAvailability === "B") {
                  return true;
                } else {
                  return false;
                }
              }
            },
          },
          enabled: {
            parts: [
              {
                path: "formDetailsModel>Availability",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
            ],
            formatter: function (sAvailability, sStatusRelevant) {
              if (sAvailability === "" || sAvailability === "B") {
                if (sStatusRelevant) {
                  return true;
                } else {
                  return true;
                }
              } else {
                return false;
              }
            },
          },
          type: {
            parts: [
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Icon",
              },
            ],
            formatter: function (sId, sStatusRelevant, sIcon) {
              if (sStatusRelevant === true) {
                return "Emphasized";
              }

              if (sId === "SAVE") {
                return "Accept";
              }

              if (sId === "START_DEV_PLAN") {
                return "Accept";
              }

              if (sId === "CANCEL") {
                return "Reject";
              }

              if (sId === "SHOW_INTRO") {
                return "Accept";
              }

              return "Default";
            },
          },
          icon: {
            parts: [
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Icon",
              },
            ],
            formatter: function (sId, sStatusRelevant, sIcon) {
              switch (sId) {
                case "SAVE":
                  return "sap-icon://save";
                case "CANCEL":
                  return "sap-icon://sys-cancel-2";
                case "PRINT":
                  return "sap-icon://print";
                case "SHOW_INTRO":
                  return "sap-icon://hint";
              }
            },
          },
          press: oThis._handleActionButtonPressed.bind(this),
        }).addStyleClass("sapUiTinyMarginEnd");

        /*Add custom data 2 for binding*/
        var oAppraisalId = new sap.ui.core.CustomData({
          key: "AppraisalId",
          value: sAppraisalId,
        });
        oActionButton.addCustomData(oAppraisalId);

        var oButtonId = new sap.ui.core.CustomData({
          key: "ButtonId",
          value: "{formDetailsModel>Id}",
          writeToDom: true,
        });
        oActionButton.addCustomData(oButtonId);
        var oStatusRelevant = new sap.ui.core.CustomData({
          key: "StatusRelevant",
          value: "{formDetailsModel>StatusRelevant}",
        });
        oActionButton.addCustomData(oStatusRelevant);
        var oStatusNoteAvailability = new sap.ui.core.CustomData({
          key: "StatusNoteAvailability",
          value: "{formDetailsModel>StatusNoteAvailability}",
        });
        oActionButton.addCustomData(oStatusNoteAvailability);
        var oEmphasize = new sap.ui.core.CustomData({
          key: "IsEmphasized",
          value:
            "{= ${formDetailsModel>StatusRelevant} ? 'Emphasized' : 'None'}",
          writeToDom: true,
        });
        oActionButton.addCustomData(oEmphasize);
        var oTargetSection = new sap.ui.core.CustomData({
          key: "TargetSection",
          value: "{formDetailsModel>TargetSection}",
        });
        oActionButton.addCustomData(oTargetSection);

        /*var oToolbar = new sap.m.Toolbar();
			oToolbar.bindAggregation("content", {
				path: "formDetailsModel>/footerButtons",
				template: oActionButton
			});*/

        return oActionButton;
      },
      _prepareIntro: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var sAppraisalId = oViewModel.getProperty("/appraisalId");
        var aIntros =
          oViewModel.getProperty("/formData/" + sAppraisalId + "/Intros") || [];

        if (!aIntros.length > 0) {
          return;
        }
        var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);

        var sStoreKey = aIntros[0].TemplateId + "_Intro";

        if (!this._oTour) {
          this._oTour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
              scrollTo: true,
            },
          });

          Shepherd.on("complete", () => {
            oStore && oStore.put(sStoreKey, true);
          });
        }

        //--Clear old steps
        this._oTour?.steps &&
        this._oTour.steps?.length &&
        this._oTour.steps?.length > 0
          ? [...this._oTour.steps].forEach((s) => s?.destroy())
          : null;

        aIntros.forEach((o, i) => {
          this._addShepherdStep(
            o.Title, // sTitle,
            o.ContentLine1 + o.ContentLine2 + o.ContentLine3, // sText,
            o.Selector, // sElementSelector,
            o.Location, // sPosition,
            o.Arrow, // bArrow,
            i !== 0, // bBack,
            i !== aIntros.length - 1, // bNext,
            true, // bDone,
            "idShepherdStep" + o.Seqnr // sId
          );
        });

        var bShow = oStore.get(sStoreKey) === true ? false : true;
        if (bShow) {
          var waitForEl = function (selector, callback) {
            if (jQuery(selector).length) {
              callback();
            } else {
              setTimeout(function () {
                waitForEl(selector, callback);
              }, 500);
            }
          };

          waitForEl(aIntros[0].Selector, () => {
            this._showShepherdIntro();
          });
        }
      },
      _buildUINew: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oFormData = oViewModel.getProperty("/formData/" + sAppraisalId);
        var oBodyElements = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );
        var aTabs = _.filter(oFormData.DocTab, ["Tab", "X"]);
        var aNavigationData = [];
        var oThis = this;

        $.each(aTabs, function (sIndex, oTab) {
          if (
            oTab.ElementType !== "VA" &&
            oBodyElements[oTab.RowIid].Availability !== "H"
          ) {
            var oElement = _.find(oFormData.BodyElements, [
              "RowIid",
              oTab.RowIid,
            ]);

            var oButtonRow = new sap.m.FlexBox({
              direction: "Row",
            }).bindAggregation("items", {
              path: "formDetailsModel>/footerButtons/" + sAppraisalId,
              template: oThis._getToolbarTemplateNew(sAppraisalId),
            }).addStyleClass("hapPageFooterButtons");

            var oToolbar = new sap.m.OverflowToolbar({
              content: [
                //	oButton,
                new sap.m.ToolbarSpacer(),
                oButtonRow,
              ],
            }).addStyleClass("hapPageFooter");

            var oPage = new sap.m.Page({
              title:
                "{formDetailsModel>/bodyElements/" +
                sAppraisalId +
                "/" +
                oTab.RowIid +
                "/Name}",
              showNavButton: true,
              showFooter: true,
              floatingFooter: false,
              navButtonPress: function () {
                oThis._doNavToMain();
              },
              footer: oToolbar,
            }).addStyleClass("hapPage");

            var oNavigation = {
              RowIid: oTab.RowIid,
              ElementType: oTab.ElementType,
              ElementId: oTab.ElementId,
              Name: oElement.Name,
              Children: [],
              Icon: oTab.TabIcon,
              PageId: oPage.getId(),
              Active: false,
            };

            var oPageLayout = new sap.uxap.ObjectPageLayout({
              enableLazyLoading: true,
            });

            oThis._buildObjectPageLayoutContent(
              oPageLayout,
              sAppraisalId,
              oTab.RowIid
            );

            oPage.addContent(oPageLayout);

            oThis._oNavContainer.addPage(oPage);

            if (!oThis._oNavContainer.getInitialPage()) {
              oNavigation.Active = true;
              oThis._oNavContainer.setInitialPage(oPage);
              oThis._oNavContainer.to(oPage.getId());
            }
            aNavigationData.push(oNavigation);
          }
        });

        /*Development Plan Extension*/
        var oDevPlanForm = _.find(oFormData.FormParameters, [
          "Param",
          "FORM_DP_APPRAISAL_ID",
        ]);
        if (oDevPlanForm) {
          var sDevPlanId = this._convertToGuid(oDevPlanForm.Value);
          var oDevPlanButtonRow = new sap.m.FlexBox({
            direction: "Row",
          }).bindAggregation("items", {
            path: "formDetailsModel>/footerButtons/" + sDevPlanId,
            template: oThis._getToolbarTemplateNew(sDevPlanId),
          });

          var oDevPlanToolbar = new sap.m.OverflowToolbar({
            content: [
              //	oButton,
              new sap.m.ToolbarSpacer(),
              oDevPlanButtonRow,
            ],
          }).addStyleClass("hapPageFooter");
          var oDevPlanPage = new sap.m.Page({
            title: "{i18n>personalDevelopmentPlanCapital}",
            showNavButton: true,
            showFooter: true,
            floatingFooter: false,
            navButtonPress: function () {
              oThis._doNavToMain();
            },
            footer: oDevPlanToolbar,
          }).addStyleClass("hapPage");

          $.each(aNavigationData, function (sInd, oNav) {
            oNav.Active = false;
          });

          aNavigationData.push({
            RowIid: "DevPlan",
            ElementType: "VA",
            ElementId: oDevPlanForm.Value,
            Name: this.getText("personalDevelopmentPlanCapital"),
            Children: [],
            Icon: "sap-icon://leads",
            PageId: oDevPlanPage.getId(),
            Active: true,
          });

          var oDevPageLayout = new sap.m.IconTabBar({
            expandable: false,
            applyContentPadding: false,
            height: "100%",
            selectedKey: "formDetailsModel>/developmentPlan/selectedFilterKey",
            select: function (oEvent) {
              oViewModel.setProperty(
                "/developmentPlan/selectedFilterKey",
                oEvent.getParameter("selectedKey")
              );
            },
          }).addStyleClass("hapIconTabTextOnly");

          this._addUIElement(
            {
              AppraisalId: sDevPlanId,
              RowIid: "0001",
              ElementType: "VA",
              ElementId: oDevPlanForm.Value,
            },
            "DevPlanIconTab",
            null,
            oDevPageLayout,
            null
          );

          var oResultSection = new sap.m.IconTabFilter({
            text: "{i18n>appraisalResultCapital}",
            height: "100%",
            key: "DP_STAT_TAB",
          });
          oDevPageLayout.addItem(oResultSection);

          this._addPerformanceReportSection(oResultSection, oDevPlanForm);

          var oDevPlanSection = new sap.m.IconTabFilter({
            text: "{i18n>personalDevelopmentPlanStatus}",
            key: "DP_PLAN_TAB",
          });

          this._addUIElement(
            {
              AppraisalId: sDevPlanId,
              RowIid: "0001",
              ElementType: "VA",
              ElementId: oDevPlanForm.Value,
            },
            "DevPlanIconTabFilter",
            null,
            oDevPlanSection,
            null
          );

          this._addDevPlanSubSection(oDevPlanSection);
          oDevPageLayout.addItem(oDevPlanSection);

          oDevPlanPage.addContent(oDevPageLayout);

          oThis._oNavContainer.addPage(oDevPlanPage);

          //Navigate initially
          oThis._oNavContainer.setInitialPage(oDevPlanPage);
          oThis._oNavContainer.to(oDevPlanPage.getId());
        }
        /*Development Plan Extension*/

        oViewModel.setProperty("/navigationData", aNavigationData);

        oViewModel.setProperty("/busy", false);
        oViewModel.setProperty("/headerVisible", true);

        //--Prepare sidebar
        this._prepareIntro();
      },

      _buildObjectPageLayoutContent: function (
        oPageLayout,
        sAppraisalId,
        sRowIid
      ) {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyElements"
        );
        var aChildren = _.filter(aBodyElements, ["Parent", sRowIid]);
        var oThis = this;

        $.each(aChildren, function (sIndex, oChild) {
          var oSection = new sap.uxap.ObjectPageSection({
            title:
              "{formDetailsModel>/bodyElements/" +
              sAppraisalId +
              "/" +
              oChild.RowIid +
              "/Name}",
            titleUppercase: false,
          }).addStyleClass("sapUiNoContentPadding");

          oThis._addSubSections(oSection, sAppraisalId, oChild);

          oPageLayout.addSection(oSection);
        });
      },
      /**
       * Add root section in case of there ise no doc tab config
       * @function
       * @private
       */
      _addUIElement: function (oObject, sUIType, sColumnIid, oElem, oRef) {
        var oElemRow = {
          AppraisalId: oObject.AppraisalId,
          RowIid: oObject.RowIid,
          UIType: sUIType,
          ColumnIid: sColumnIid,
          UIElement: oElem,
          ReferenceType: oRef ? oRef.ReferenceType : null,
          ReferenceId: oRef ? oRef.ReferenceId : null,
        };

        this._aFormUIElements.push(oElemRow);
      },

      _navigateToSection: function (sSection) {
        //	this._oPageLayout.setSelectedSection(sSection);
        //	this._markSectionAsClicked(sSection);
      },
      _markSectionAsClicked: function (sSection) {
        var oViewModel = this.getModel("formDetailsModel");
        var aSections = oViewModel.getProperty("/formSections");
        var sAllClicked = true;

        $.each(aSections, function (sKey, oSection) {
          if (oSection.element.getId() === sSection) {
            oSection.clicked = true;
          }
          if (!oSection.clicked) {
            sAllClicked = false;
          }
        });

        oViewModel.setProperty("/allSectionsClicked", sAllClicked);

        oViewModel.setProperty("/formSections", aSections);
      },

      _checkAllSectionsRendered: function () {
        var q = $.Deferred();
        var aSections = this._oPageLayout.getSections();
        var oThis = this;
        try {
          document.body.addEventListener(
            "DOMNodeInserted",
            function (event) {
              try {
                if (event.hasOwnProperty("path")) {
                  if (
                    event.path.indexOf(
                      $("section[id*='idDetailObjectPageLayout-anchorBar'")[0]
                    ) !== -1
                  ) {
                    setTimeout(function () {
                      q.resolve();
                    }, 1000);
                    document.body.removeEventListener("DOMNodeInserted", oThis);
                  }
                } else if (event.hasOwnProperty("currentTarget")) {
                  if (
                    event.currentTarget.id ==
                    $("section[id*='idDetailObjectPageLayout-anchorBar'")[0]
                  ) {
                    setTimeout(function () {
                      q.resolve();
                    }, 1000);
                    document.body.removeEventListener("DOMNodeInserted", oThis);
                  }
                } else {
                  setTimeout(function () {
                    q.resolve();
                  }, 3000);
                  document.body.removeEventListener("DOMNodeInserted", oThis);
                }
              } catch (oErr) {
                setTimeout(function () {
                  q.resolve();
                }, 3000);
                document.body.removeEventListener("DOMNodeInserted", oThis);
              }
            },
            false
          );
        } catch (oErr) {
          setTimeout(function () {
            q.resolve();
          }, 3000);
          document.body.removeEventListener("DOMNodeInserted", oThis);
        }

        return q.promise();
      },

      /**
       * Add performance report subsection as dashboard
       * @function
       * @private
       */
      _handlePerformanceReportBackNav: function (oEvent) {
        this._oPerfReportNavCon.back();
      },

      _handlePerformanceReportTileNav: function (oEvent) {
        var oNavCon = this.byId("idPerformanceReportNavCon");
        var oSource = oEvent.getSource();
        var sTarget = oSource.data("target");
        var oViewModel = this.getModel("formDetailsModel");
        var sHeader = oSource.getHeader();
        var that = this;
        var sRowIid = oSource.data("elementRowIid");
        var sAppraisalId = oSource.data("appraisalId");
        var aBodyElements = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyElements"
        );
        var oBodyCells = oViewModel.getProperty("/bodyCells/" + sAppraisalId);
        var oBodyElements = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );
        var oFormParameters = oViewModel.getProperty(
          "/formParameters/" + sAppraisalId
        );
        var oGraphModel = this.getModel("formGraphModel");
        var sFappColumnIid = this._getColumnIid(sAppraisalId, "FAPP");
        var oBodyCell = oBodyCells[sRowIid][sFappColumnIid];
        var oBodyElement = oBodyElements[sRowIid];
        var aData = [];
        var aPopData = [];
        var sPopIndex = 0;
        var sRowPerResult = oFormParameters["FORM_VB_ROW_PER_RESULT"];

        var oGraph1 = {
          series: [
            {
              name: "Çalışan",
              data: [oBodyCell.ValueNum],
              appraisalId: sAppraisalId,
              rowIid: sRowIid,
              columnId: "FAPP",
            },
            {
              name: "Müdürlük",
              data: [oBodyElement.FappAvgLvl11],
              appraisalId: sAppraisalId,
              rowIid: sRowIid,
              columnId: "FAPPLVL11",
            },
            {
              name: "Başkanlık",
              data: [oBodyElement.FappAvgLvl05],
              appraisalId: sAppraisalId,
              rowIid: sRowIid,
              columnId: "FAPPLVL05",
            },
          ],
          colors: ["#59698d", "#c62828", "#303f9f"],
          categories: [oBodyElement.Name],
        };

        var aChildren = _.filter(aBodyElements, ["Parent", sRowIid]);
        var oGraph2 = {
          series: [
            {
              name: "Çalışan",
              data: [],
              rows: [],
              appraisalId: sAppraisalId,
              rowIid: null,
              columnId: "FAPP",
            },
            {
              name: "Müdürlük",
              data: [],
              rows: [],
              appraisalId: sAppraisalId,
              rowIid: null,
              columnId: "FAPPLVL11",
            },
            {
              name: "Başkanlık",
              data: [],
              rows: [],
              appraisalId: sAppraisalId,
              rowIid: null,
              columnId: "FAPPLVL05",
            },
          ],
          colors: ["#59698d", "#c62828", "#303f9f"],
          categories: [],
        };
        $.each(aChildren, function (sInd, oChildElement) {
          var oChildCell = oBodyCells[oChildElement.RowIid][sFappColumnIid];
          oGraph2.categories[sInd] = oChildElement.Name;
          oGraph2.series[0].rows[sInd] = oChildElement.RowIid;
          oGraph2.series[0].data[sInd] = oChildCell.ValueNum;
          oGraph2.series[1].data[sInd] = oChildElement.FappAvgLvl11;
          oGraph2.series[2].data[sInd] = oChildElement.FappAvgLvl05;
        });

        //Generate popover data
        $.each(aBodyElements, function (sIndex, oElement) {
          if (oElement.Parent === sRowIid) {
            aData.push({
              RowIid: oElement.RowIid,
              Name: oElement.Name,
              Value:
                oBodyCells[oElement.RowIid][
                  that._getColumnIid(sAppraisalId, "FAPP")
                ].ValueNum,
            });

            /*GENEL DEĞERLENDİRME İSE PUAN ÇIKARMAYA GEREK YOK*/
            if (oBodyElements[sRowIid].ElementId !== sRowPerResult) {
              if (
                oBodyCells[oElement.RowIid].hasOwnProperty(
                  that._getColumnIid(oElement.AppraisalId, "ZTK6")
                )
              ) {
                var sChildValueExp = formatter.convertToIntegerDecimal(
                  oBodyCells[oElement.RowIid][
                    that._getColumnIid(oElement.AppraisalId, "ZTTD")
                  ].ValueNum
                );
                var sChildValueRea = formatter.convertToIntegerDecimal(
                  oBodyCells[oElement.RowIid][
                    that._getColumnIid(oElement.AppraisalId, "ZTTE")
                  ].ValueNum
                );
                aPopData.push({
                  Index: sPopIndex,
                  RowIid: oElement.RowIid,
                  ElementName: oElement.Name,
                  ExpectedValue:
                    (oBodyCells[oElement.RowIid][
                      that._getColumnIid(oElement.AppraisalId, "ZTK6")
                    ].ValueText === "Eşit"
                      ? ""
                      : oBodyCells[oElement.RowIid][
                          that._getColumnIid(oElement.AppraisalId, "ZTK6")
                        ].ValueText + " ") +
                    sChildValueExp +
                    " " +
                    oBodyCells[oElement.RowIid][
                      that._getColumnIid(oElement.AppraisalId, "ZTK7")
                    ].ValueText,
                  RealizedValue: sChildValueRea,
                });
                sPopIndex++;
              } else {
                var oChildPopData = {};
                oChildPopData.Index = sPopIndex;
                oChildPopData.RowIid = oElement.RowIid;
                oChildPopData.ElementName = oElement.Name;
                oChildPopData.Values = [];
                $.each(aBodyElements, function (sChild, oChildElement) {
                  if (oChildElement.Parent === oElement.RowIid) {
                    oChildPopData.Values.push({
                      RowIid: oChildElement.RowIid,
                      ElementName: oChildElement.Name,
                      FinalAppraisal:
                        oBodyCells[oChildElement.RowIid][
                          that._getColumnIid(sAppraisalId, "FAPP")
                        ].ValueTxt,
                    });
                  }
                });
                if (oChildPopData.Values.length > 0) {
                  aPopData.push(oChildPopData);
                }
                sPopIndex++;
              }
            }
          }
        });

        oGraphModel.setData({
          graph1: oGraph1,
          graph2: oGraph2,
          popData: aPopData,
        });

        this._oPerfReportPage2Title.setText(sHeader);
        this._oPerfReportNavCon.to(this._oPerfReportPage2.getId());
      },
      _handlePerformanceReportNav: function (oEvent) {
        var oNavCon = this.byId("idPerformanceReportNavCon");
        var oSource = oEvent.getSource();
        var sTarget = oSource.data("target");
        var oThis = this;

        if (sTarget) {
          var sRowIid = oSource.data("elementRowIid");
          var sAppraisalId = oSource.data("appraisalId");
          var sName = oSource.data("elementName");
          var sStyle = oSource.data("elementStyle");
          var oViewModel = this.getModel("formDetailsModel");
          var sHeader = oSource.getHeader();

          var aBodyElements = oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyElements"
          );
          var oBodyCells = oViewModel.getProperty("/bodyCells/" + sAppraisalId);
          var oBodyElements = oViewModel.getProperty(
            "/bodyElements/" + sAppraisalId
          );
          var oFormParameters = oViewModel.getProperty(
            "/formParameters/" + sAppraisalId
          );
          var aData = [];
          var aPopData = [];
          var sPopIndex = 0;
          var sRowPerResult = oFormParameters["FORM_VB_ROW_PER_RESULT"];

          $.each(aBodyElements, function (sIndex, oElement) {
            if (oElement.Parent === sRowIid) {
              aData.push({
                Name: oElement.Name,
                Value:
                  oBodyCells[oElement.RowIid][
                    oThis._getColumnIid(sAppraisalId, "FAPP")
                  ].ValueNum,
              });

              /*GENEL DEĞERLENDİRME İSE PUAN ÇIKARMAYA GEREK YOK*/
              if (oBodyElements[sRowIid].ElementId !== sRowPerResult) {
                if (
                  oBodyCells[oElement.RowIid].hasOwnProperty(
                    oThis._getColumnIid(oElement.AppraisalId, "ZTK6")
                  )
                ) {
                  var sChildValueExp = formatter.convertToIntegerDecimal(
                    oBodyCells[oElement.RowIid][
                      oThis._getColumnIid(oElement.AppraisalId, "ZTTD")
                    ].ValueNum
                  );
                  var sChildValueRea = formatter.convertToIntegerDecimal(
                    oBodyCells[oElement.RowIid][
                      oThis._getColumnIid(oElement.AppraisalId, "ZTTE")
                    ].ValueNum
                  );
                  aPopData.push({
                    Index: sPopIndex,
                    ElementName: oElement.Name,
                    ExpectedValue:
                      (oBodyCells[oElement.RowIid][
                        oThis._getColumnIid(oElement.AppraisalId, "ZTK6")
                      ].ValueText === "Eşit"
                        ? ""
                        : oBodyCells[oElement.RowIid][
                            oThis._getColumnIid(oElement.AppraisalId, "ZTK6")
                          ].ValueText + " ") +
                      sChildValueExp +
                      " " +
                      oBodyCells[oElement.RowIid][
                        oThis._getColumnIid(oElement.AppraisalId, "ZTK7")
                      ].ValueText,
                    RealizedValue: sChildValueRea,
                  });
                  sPopIndex++;
                } else {
                  var oChildPopData = {};
                  oChildPopData.Index = sPopIndex;
                  oChildPopData.Values = [];
                  $.each(aBodyElements, function (sChild, oChildElement) {
                    if (oChildElement.Parent === oElement.RowIid) {
                      oChildPopData.Values.push({
                        ElementName: oChildElement.Name,
                        FinalAppraisal:
                          oBodyCells[oChildElement.RowIid][
                            oThis._getColumnIid(sAppraisalId, "FAPP")
                          ].ValueTxt,
                      });
                    }
                  });
                  if (oChildPopData.Values.length > 0) {
                    aPopData.push(oChildPopData);
                  }
                  sPopIndex++;
                }
              }
            }
          });

          /*First calculate graph data*/
          // var oGraphModel = new JSONModel({
          // 	"PerfData": aData
          // });

          // this._oPerfReportPage2Title.setText(sHeader);

          // var oVizProp = this._oPerfGraph.getVizProperties();

          // oVizProp.plotArea.colorPalette = [$(sStyle)
          // 	.css("backgroundColor")
          // ];

          // this._oPerfGraph.setVizProperties(oVizProp);
          // this._oPerfGraph.data("PopData", aPopData);

          // this._oPerfGraph.setModel(oGraphModel);
          // /*First calculate graph data*/
          // if (this._oPopOver) {
          // 	this._oPopOver.destroy();
          // }
          // this._oPerfReportNavCon.to(this._oPerfReportPage2.getId());

          // if (aPopData.length > 0) {
          // 	var _showGraphNotice = function () {
          // 		MessageToast.show("Detaylar için grafiğe tıklayınız...", {
          // 			duration: 5000, // default
          // 			width: "300px", // default
          // 			my: "center center", // default
          // 			at: "center center" // default
          // 		});
          // 	};
          // 	jQuery.sap.delayedCall(500, this, _showGraphNotice, []);
          // }
        } else {
          this._oPerfReportNavCon.back();
        }
      },
      onApexDataPointSelection: function (oEvent) {
        var oSource = oEvent.getParameter("originalEvent").srcElement;
        var oSP = oEvent.getParameter("selectedPoint");
        var oConfig = oEvent.getParameter("config");
        var sRowIid = oSP.rows[oConfig.dataPointIndex];
        var oViewModel = this.getModel("formDetailsModel");
        var oElem = oViewModel.getProperty(
          "/bodyElements/" + oSP.appraisalId + "/" + sRowIid
        );

        if (oElem.Name !== "BİREYSEL HEDEFLER") {
          this._onSelectGraphPopoverData(sRowIid, oSource);
        }
        // var oPO = new sap.m.Popover({
        // 	content: [
        // 		new sap.m.Text({
        // 			text: oSP.rowIid
        // 		})
        // 	],
        // 	placement: sap.m.PlacementType.Top
        // });

        // oPO.openBy(oSource);
      },
      _addPerformanceReportSection: function (oSection, oDevPlanParam) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");
        var sAppraisalId = this._convertToGuid(oDevPlanParam.Value);
        var oFormParameters = oViewModel.getProperty(
          "/formParameters/" + sAppraisalId
        );
        var sResultRow = oFormParameters["FORM_VB_ROW_PER_RESULT"];
        if (sResultRow) {
          var oBodyElements = oViewModel.getProperty(
            "/bodyElements/" + sAppraisalId
          );
          var aBodyElements = oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyElements"
          );
          var oBodyElement = _.find(aBodyElements, {
            ElementId: sResultRow,
          });
          oSection.bindProperty("visible", {
            path:
              "formDetailsModel>/bodyElements/" +
              sAppraisalId +
              "/" +
              oBodyElement.RowIid +
              "/Availability",
            formatter: function (sAvailability) {
              if (sAvailability === "H") {
                return false;
              } else {
                return true;
              }
            },
          });
          if (oBodyElement) {
            var oNavCon = new sap.m.NavContainer({
              defaultTransitionName: "flip",
            });

            this._oPerfReportNavCon = oNavCon;

            var oPage1 = new sap.m.Page({
              showFooter: false,
              showHeader: false,
              height: "100%",
            }).addStyleClass("hapDevPlanStatPage");

            this._oPerfReportPage1 = oPage1;

            var oMainBox = new sap.m.FlexBox({
              direction: "Column",
              alignItems: "Center",
              justifyContent: "Center",
              height: "100%",
            });

            var oBoxLine1 = new sap.m.FlexBox({
              alignItems: "Center",
              justifyContent: "Center",
            });

            var oBoxLine2 = new sap.m.FlexBox({
              alignItems: "Center",
              justifyContent: "Center",
            }).addStyleClass("hapLargeMarginTop");

            oMainBox.addItem(oBoxLine1);
            oMainBox.addItem(oBoxLine2);

            var _addTile = function (oEl, oBox, sSecond) {
              var sRowPerResult = oFormParameters["FORM_VB_ROW_PER_RESULT"];
              var oTile = new sap.m.GenericTile({
                header:
                  "{= ${formDetailsModel>/bodyElements/" +
                  oEl.AppraisalId +
                  "/" +
                  oEl.RowIid +
                  "/ElementId} === '" +
                  sRowPerResult +
                  "' ? 'GENEL DEĞERLENDİRME PUANI' : '" +
                  oEl.Name +
                  "' }",
                //press: [oThis._handlePerformanceReportNav, oThis],
                press: [oThis._handlePerformanceReportTileNav, oThis],
                tooltip: "{i18n>clickForDetails}",
              }).addStyleClass("hapPerfResultTile");

              oTile.addStyleClass("sapUiLargeMarginEnd");
              oTile.addStyleClass("hapPerfResultTileLevel" + oEl.ApLevel);

              oTile.data("target", "PerformanceReportPage2");
              oTile.data("elementRowIid", oEl.RowIid);
              oTile.data("appraisalId", oEl.AppraisalId);
              oTile.data("elementName", oEl.Name);
              oTile.data(
                "elementStyle",
                ".hapPerfResultTileLevel" + oEl.ApLevel
              );

              var oTileContent = new sap.m.TileContent();

              var oNumericContent = new sap.m.NumericContent({
                value:
                  "{formDetailsModel>/bodyCells/" +
                  oEl.AppraisalId +
                  "/" +
                  oEl.RowIid +
                  "/" +
                  oThis._getColumnIid(oEl.AppraisalId, "FAPP") +
                  "/ValueNum}",
                valueColor:
                  "{= ${formDetailsModel>/bodyCells/" +
                  oEl.AppraisalId +
                  "/" +
                  oEl.RowIid +
                  "/" +
                  oThis._getColumnIid(oEl.AppraisalId, "FAPP") +
                  "/ValueNum} < 3 ? 'Error' : 'Good' }",
              });

              oTileContent.setContent(oNumericContent);

              oTile.addTileContent(oTileContent);

              oBox.addItem(oTile);
            };

            $.each(oBodyElements, function (sIndex, oElement) {
              if (oElement.RowIid === oBodyElement.RowIid) {
                _addTile(oElement, oBoxLine1, false);
              }

              if (oElement.Parent === oBodyElement.RowIid) {
                _addTile(oElement, oBoxLine2, true);
              }
            });

            oPage1.addContent(oMainBox);

            var oPage2 = new sap.m.Page({
              showHeader: true,
              showFooter: false,
            }).addStyleClass("hapPerfResultPageGraph");

            var oPage2Title = new sap.m.Title();
            var oBar = new sap.m.Bar({
              contentLeft: [
                new sap.m.Button({
                  icon: "sap-icon://nav-back",
                  text: "{i18n>returnTo}",
                  press: [oThis._handlePerformanceReportBackNav, oThis],
                }).addStyleClass("hapButtonWhite"),
              ],
              contentMiddle: [oPage2Title],
            });

            oPage2.setCustomHeader(oBar);

            //Apex Chart
            var oVL = new sap.ui.layout.VerticalLayout({
              width: "100%",
              height: "100%",
            }).addStyleClass("gridWrapper");
            var oVLG = new sap.ui.layout.Grid({
              //containerQuery: true,
              height: "100%",
              defaultSpan: "XL6 L6 M12 S12",
              content: [
                new SmodApexChart({
                  chartSeries: "{formGraphModel>/graph1/series}",
                  xaxisCategories: "{formGraphModel>/graph1/categories}",
                  colorPallette: "{formGraphModel>/graph1/colors}",
                  columnWidth: "30%",
                  chartSize: {
                    height: 400,
                  },
                  dataPointSelected: oThis.onApexDataPointSelection.bind(oThis),
                }),
                new SmodApexChart({
                  chartSeries: "{formGraphModel>/graph2/series}",
                  xaxisCategories: "{formGraphModel>/graph2/categories}",
                  colorPallette: "{formGraphModel>/graph2/colors}",
                  columnWidth: "55%",
                  chartSize: {
                    height: 400,
                  },
                  dataPointSelected: oThis.onApexDataPointSelection.bind(oThis),
                }),
              ],
            }).addStyleClass("hapGraphGrid");
            //oVL.addContent(oVLG);
            oPage2.addContent(oVLG);
            //Apex Chart

            this._oPerfReportPage2 = oPage2;
            this._oPerfReportPage2Title = oPage2Title;

            // /*Set graph properties*/
            // var oPerfGraph = new VizFrame({
            // 		height: "80%",
            // 		width: "100%",
            // 		vizType: "column",
            // 		uiConfig: {
            // 			"applicationSet": "fiori",
            // 			"showErrorMessage": true
            // 		},
            // 		selectData: oThis._onSelectGraphData.bind(oThis)
            // 	})
            // 	.addStyleClass("sapUiMediumMarginTop");

            // var oGraphModel = new JSONModel({
            // 	"PerfData": []
            // });

            // oPerfGraph.setModel(oGraphModel);

            // oPerfGraph.setVizProperties({
            // 	plotArea: {
            // 		dataLabel: {
            // 			visible: true,
            // 			formatString: CustomChartFormatter.HAP_NUM_FORMATTER
            // 		},
            // 		primaryScale: {
            // 			"minValue": 0,
            // 			"maxValue": 5,
            // 			"fixedRange": true
            // 		}
            // 	},
            // 	valueAxis: {

            // 		title: {
            // 			visible: true,
            // 			text: "Puan"
            // 		}
            // 	},
            // 	categoryAxis: {
            // 		title: {
            // 			visible: false
            // 		}
            // 	},
            // 	legend: {
            // 		visible: false
            // 	},
            // 	title: {
            // 		visible: false
            // 	}
            // });

            // var oDataSet = new FlattenedDataset({
            // 	data: "{/PerfData}"
            // });

            // oDataSet.addDimension(new DimensionDefinition({
            // 	name: "Name",
            // 	value: "{Name}"
            // }));

            // oDataSet.addMeasure(new MeasureDefinition({
            // 	name: "Value",
            // 	value: "{Value}"
            // }));

            // oPerfGraph.addFeed(new FeedItem({
            // 	uid: "valueAxis",
            // 	type: "Measure",
            // 	values: ["Value"]
            // }));

            // oPerfGraph.addFeed(new FeedItem({
            // 	uid: "categoryAxis",
            // 	type: "Dimension",
            // 	values: ["Name"]
            // }));

            // oPerfGraph.setDataset(oDataSet);

            // this._oPerfGraph = oPerfGraph;
            //oPage2.addContent(oPerfGraph);

            oNavCon.addPage(oPage1);
            oNavCon.addPage(oPage2);

            oSection.addContent(oNavCon);
          }
        }
      },
      _onSelectGraphPopoverData: function (sRowIid, oSource) {
        var oGraphModel = this.getModel("formGraphModel");
        var aPopData = oGraphModel.getProperty("/popData");
        var oPopData = _.find(aPopData, ["RowIid", sRowIid]);

        if (this._oGraphPopover) {
          this._oGraphPopover.close();
          this._oGraphPopover.destroyContent();
        } else {
          this._oGraphPopover = new sap.m.Popover({
            placement: "Top",
          });
        }

        try {
          if (oPopData) {
            this._oGraphPopover.destroyFooter();
            var divStr = "";
            this._oGraphPopover.setTitle(oPopData.ElementName);
            if (aPopData[0].hasOwnProperty("ExpectedValue")) {
              divStr =
                "<div class='hapPopoverContainer'>" +
                "<table class='hapPopoverTable'>" +
                "<thead>" +
                "<tr>" +
                "<th class='hapPopoverBgPurple'>Beklenen Değer</th>" +
                "<th class='hapPopoverBgBlue'>Gerçekleşen Değer</th>" +
                "</tr>" +
                "</thead>" +
                "<tbody>" +
                "<tr>" +
                "<td>" +
                oPopData.ExpectedValue +
                "</td>" +
                "<td>" +
                oPopData.RealizedValue +
                "</td>" +
                "</tr>" +
                "</tbody>" +
                "</table></div>";
              this._oGraphPopover.setFooter(
                new sap.m.Button({
                  type: "Accept",
                  text: "Hesaplama Detayı",
                  press: function () {
                    window.open(
                      "https://webapps01.thy.com/intranets/kurumsal-operasyonel-cozumler/web10/TTASDocuments/2017_BGDS_De%C4%9Ferlendirme%20Kriterleri.pdf",
                      "_blank"
                    );
                  },
                  width: "95%",
                }).addStyleClass("sapUiTinyMargin")
              );
            } else if (oPopData.hasOwnProperty("Values")) {
              divStr =
                "<div class='hapPopoverContainerLarge'>" +
                "<table class='hapPopoverTable'>" +
                "<thead>" +
                "<tr>" +
                "<th class='hapPopoverBgPurple hapPopoverColumnLarge'>Yetkinlik Adı</th>" +
                "<th class='hapPopoverBgBlue'>Puan</th>" +
                "</tr>" +
                "</thead>" +
                "<tbody>";
              for (var i = 0; i < oPopData.Values.length; i++) {
                divStr =
                  divStr +
                  "<tr>" +
                  "<td class='hapPopoverAlignLeft'>" +
                  oPopData.Values[i].ElementName +
                  "</td>" +
                  "<td>" +
                  oPopData.Values[i].FinalAppraisal +
                  "</td>" +
                  "</tr>";
              }

              divStr = divStr + "</tbody>" + "</table></div>";
            }
            this._oGraphPopover.addContent(
              new sap.ui.core.HTML({
                content: divStr,
              })
            );

            this._oGraphPopover.openBy(oSource);
          }
        } catch (oErr) {
          jQuery.sap.log.error(oErr);
        }
      },
      _onSelectGraphData: function (oEvent) {
        var aPopData = this._oPerfGraph.data("PopData");
        var data = oEvent.getParameter("data");

        if (this._oGraphPopover) {
          this._oGraphPopover.close();
          this._oGraphPopover.destroyContent();
        } else {
          this._oGraphPopover = new sap.m.Popover({
            placement: "Top",
          });
        }

        try {
          if (data[0].data.Value) {
            this._oGraphPopover.destroyFooter();
            var divStr = "";
            var sIndex = data[0].data._context_row_number;
            this._oGraphPopover.setTitle(data[0].data.Name);
            if (aPopData[0].hasOwnProperty("ExpectedValue")) {
              divStr =
                "<div class='hapPopoverContainer'>" +
                "<table class='hapPopoverTable'>" +
                "<thead>" +
                "<tr>" +
                "<th class='hapPopoverBgPurple'>Beklenen Değer</th>" +
                "<th class='hapPopoverBgBlue'>Gerçekleşen Değer</th>" +
                "</tr>" +
                "</thead>" +
                "<tbody>" +
                "<tr>" +
                "<td>" +
                aPopData[sIndex].ExpectedValue +
                "</td>" +
                "<td>" +
                aPopData[sIndex].RealizedValue +
                "</td>" +
                "</tr>" +
                "</tbody>" +
                "</table></div>";
              this._oGraphPopover.setFooter(
                new sap.m.Button({
                  type: "Accept",
                  text: "Hesaplama Detayı",
                  press: function () {
                    window.open(
                      "https://webapps01.thy.com/intranets/kurumsal-operasyonel-cozumler/web10/TTASDocuments/2017_BGDS_De%C4%9Ferlendirme%20Kriterleri.pdf",
                      "_blank"
                    );
                  },
                  width: "95%",
                }).addStyleClass("sapUiTinyMargin")
              );
            } else if (aPopData[0].hasOwnProperty("Values")) {
              divStr =
                "<div class='hapPopoverContainerLarge'>" +
                "<table class='hapPopoverTable'>" +
                "<thead>" +
                "<tr>" +
                "<th class='hapPopoverBgPurple hapPopoverColumnLarge'>Yetkinlik Adı</th>" +
                "<th class='hapPopoverBgBlue'>Puan</th>" +
                "</tr>" +
                "</thead>" +
                "<tbody>";
              for (var i = 0; i < aPopData[sIndex].Values.length; i++) {
                divStr =
                  divStr +
                  "<tr>" +
                  "<td class='hapPopoverAlignLeft'>" +
                  aPopData[sIndex].Values[i].ElementName +
                  "</td>" +
                  "<td>" +
                  aPopData[sIndex].Values[i].FinalAppraisal +
                  "</td>" +
                  "</tr>";
              }

              divStr = divStr + "</tbody>" + "</table></div>";
            }
            this._oGraphPopover.addContent(
              new sap.ui.core.HTML({
                content: divStr,
              })
            );

            this._oGraphPopover.openBy(data[0].target);
          }
        } catch (oErr) {
          jQuery.sap.log.error(oErr);
        }
      },
      _getPopoverProps: function () {
        var aPopData = this._oPerfGraph.data("PopData");
        var oThis = this;
        return {
          customDataControl: function (data) {
            try {
              if (data.data.val) {
                var sIndex = data.data.val[1].value;

                var _changeHeader = function () {
                  $(
                    $('[data-sap-ui*="vizHeaderBar-popoverHeaderTitle"]')[0]
                  ).html(aPopData[sIndex].ElementName);
                };
                setTimeout(_changeHeader(), 2500);

                var divStr =
                  "<div>" +
                  "<table class='hapPopoverTable'>" +
                  "<thead>" +
                  "<tr>" +
                  "<th class='hapPopoverBgPurple'>Beklenen Değer</th>" +
                  "<th class='hapPopoverBgBlue'>Gerçekleşen Değer</th>" +
                  "</tr>" +
                  "</thead>" +
                  "<tbody>" +
                  "<tr>" +
                  "<td>" +
                  aPopData[sIndex].ExpectedValue +
                  "</td>" +
                  "<td>" +
                  aPopData[sIndex].RealizedValue +
                  "</td>" +
                  "</tr>" +
                  "</tbody>" +
                  "</table></div>";
                return new sap.ui.core.HTML({
                  content: divStr,
                });
              }
            } catch (oErr) {
              jQuery.sap.log.error(oErr);
            }
          },
        };
      },

      /**
       * Add dev plan subsections according to the body elements (Special development)
       * @function
       * @private
       */
      _addDevPlanSubSection: function (oDpSection) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var aSections = oViewModel.getProperty(
          "/developmentPlan/developmentPlanSections"
        );
        var sRootPath =
          "formDetailsModel>/developmentPlan/developmentPlanSections";
        var sSectionPath = "";
        var sCompPath = "";

        var oST = new SmodTabContainer();

        //Tab Headers
        $.each(aSections, function (sSecIndex, oSection) {
          sSectionPath = sRootPath + "/" + sSecIndex;
          var oSTH = new SmodTabHeader({
            title: {
              parts: [
                {
                  path: sSectionPath + "/SectionName",
                },
                {
                  path: sSectionPath + "/Competencies",
                },
              ],
              formatter: that._getItemsCount.bind(that),
            },
            refSectionId: "{" + sSectionPath + "/SectionId}",
            checked: "{" + sSectionPath + "/IsActive}",
            type: "{" + sSectionPath + "/Type}",
            icon: "{" + sSectionPath + "/Icon}",
          });

          oST.addTabHeader(oSTH);

          var oSTC = new SmodTabContent({
            sectionId: "{" + sSectionPath + "/SectionId}",
          });

          var oSTL2 = new SmodTabContainer().addStyleClass(
            "dpMediumContentPadding"
          );

          oSTC.setContent(oSTL2);

          oST.addTabContent(oSTC);

          $.each(oSection.Competencies, function (sComIndex, oComp) {
            sCompPath = sSectionPath + "/Competencies/" + sComIndex;
            var oSTHL2 = new SmodTabHeader({
              title: {
                path: sCompPath + "/CompetencyName",
              },
              refSectionId:
                "{" +
                sCompPath +
                "/SectionId}-{" +
                sCompPath +
                "/CompetencyId}",
              checked: "{" + sCompPath + "/IsActive}",
              type: "Neutral",
              size: "M",
              emphasizeIcon: true,
              icon: {
                parts: [
                  {
                    path: sCompPath + "/TrainingFromCatalog",
                  },
                  {
                    path: sCompPath + "/TrainingFreeSelection",
                  },
                  {
                    path: sCompPath + "/ActivityPlan",
                  },
                ],
                formatter: function (oTC, oTF, oAP) {
                  var sIcon = null;
                  try {
                    var aElements = oViewModel.getProperty(
                      "/formData/" + oComp.AppraisalId + "/BodyElements"
                    );
                    var aCells = oViewModel.getProperty(
                      "/formData/" + oComp.AppraisalId + "/BodyCells"
                    );
                    var aActChild = [];
                    var aCatChild = [];
                    var aFreChild = [];

                    if (oAP) {
                      aActChild =
                        _.filter(aElements, {
                          Parent: oAP.RowIid,
                        }) || [];
                    }

                    if (oTF) {
                      aFreChild =
                        _.filter(aElements, {
                          Parent: oTF.RowIid,
                        }) || [];
                    }

                    var sCatChildCount = 0;
                    if (oTC) {
                      aCatChild =
                        _.filter(aElements, {
                          Parent: oTC.RowIid,
                        }) || [];

                      var sColIid = that._getColumnIid(
                        oComp.AppraisalId,
                        "ZSEC"
                      );

                      $.each(aCatChild, function (sChInd, oCatChild) {
                        var oCell = _.find(aCells, {
                          RowIid: oCatChild.RowIid,
                          ColumnIid: sColIid,
                        });
                        if (
                          oCell.ValueNum === "1" ||
                          oCell.ValueNum == 1 ||
                          oCell.ValueNum === "0001"
                        ) {
                          sCatChildCount++;
                        }
                      });
                    }

                    var sElemCount =
                      aActChild.length + sCatChildCount + aFreChild.length;

                    if (sElemCount > 0) {
                      sIcon = "sap-icon://accept";
                    }

                    return sIcon;
                  } catch (oEx) {
                    console.log(oEx);
                    return "";
                  }
                },
              },
            });
            oSTL2.addTabHeader(oSTHL2);

            var oVBL3 = new sap.m.VBox().addStyleClass(
              "hapMediumContentPadding"
            );

            var oTBL3 = new sap.m.Toolbar().addStyleClass(
              "sapUiTinyMarginBottom"
            );

            var oSBL3 = new sap.m.SegmentedButton({
              selectedKey: "{" + sCompPath + "/SelectedSegment}",
              items: [
                new sap.m.SegmentedButtonItem({
                  key: "{" + sCompPath + "/SectionId}BI",
                  text: {
                    parts: [
                      {
                        path: "i18n>behavioralIndicators",
                      },
                      {
                        path: sCompPath + "/BehavioralIndicators",
                      },
                    ],
                    formatter: that._getItemsCount.bind(that),
                  },
                  visible: {
                    path: sCompPath + "/BehavioralIndicators",
                    formatter: function (aBI) {
                      try {
                        return aBI.length > 0;
                      } catch (oEx) {
                        return false;
                      }
                    },
                  },
                }),
                new sap.m.SegmentedButtonItem({
                  key: "{" + sCompPath + "/SectionId}EP",
                  text: {
                    parts: [
                      {
                        path: "i18n>trainingPlan",
                      },
                      {
                        path: sCompPath + "/TrainingFromCatalog",
                      },
                      {
                        path: sCompPath + "/TrainingFreeSelection",
                      },
                    ],
                    formatter: function (sTitle, oTC, oTF) {
                      try {
                        var sAppid = oTC.AppraisalId || oTF.AppraisalId;
                        var aElements = oViewModel.getProperty(
                          "/formData/" + sAppid + "/BodyElements"
                        );
                        var aCatChild = [];
                        var aFreChild = [];
                        if (oTC) {
                          aCatChild =
                            _.filter(aElements, {
                              Parent: oTC.RowIid,
                            }) || [];
                        }
                        if (oTF) {
                          aFreChild =
                            _.filter(aElements, {
                              Parent: oTF.RowIid,
                            }) || [];
                        }

                        var sChild = aCatChild.length + aFreChild.length;

                        if (sChild > 0) {
                          return sTitle + " (" + sChild + ")";
                        } else {
                          return sTitle;
                        }
                      } catch (oEx) {
                        return sTitle;
                      }
                    },
                  },
                  visible: {
                    parts: [
                      {
                        path: "i18n>trainingPlan",
                      },
                      {
                        path: sCompPath + "/TrainingFromCatalog",
                      },
                      {
                        path: sCompPath + "/TrainingFreeSelection",
                      },
                    ],
                    formatter: function (aTFC, aTFS) {
                      try {
                        return (
                          aTFC.Availability !== "H" || aTFS.Availability !== "H"
                        );
                      } catch (oEx) {
                        return false;
                      }
                    },
                  },
                }),
                new sap.m.SegmentedButtonItem({
                  key: "{" + sCompPath + "/SectionId}DA",
                  text: {
                    parts: [
                      {
                        path: "i18n>activityPlan",
                      },
                      {
                        path: sCompPath + "/ActivityPlan",
                      },
                    ],
                    formatter: function (sTitle, oAP) {
                      try {
                        var aElements = oViewModel.getProperty(
                          "/formData/" + oAP.AppraisalId + "/BodyElements"
                        );
                        var aChildren =
                          _.filter(aElements, {
                            Parent: oAP.RowIid,
                          }) || [];

                        if (aChildren.length > 0) {
                          return sTitle + " (" + aChildren.length + ")";
                        } else {
                          return sTitle;
                        }
                      } catch (oEx) {
                        return sTitle;
                      }
                    },
                  },
                }),
              ],
            });

            oTBL3.addContent(oSBL3);
            oVBL3.addItem(oTBL3);

            if (oComp.BehavioralIndicators.length > 0) {
              var oVBBI = new sap.m.VBox({
                height: "100%",
                visible:
                  "{= ${" +
                  sCompPath +
                  "/SelectedSegment} === ${" +
                  sCompPath +
                  "/SectionId}.concat('BI')}",
                items: [
                  new sap.m.OverflowToolbar({
                    content: [
                      new sap.m.Text({
                        text: "{i18n>behavioralIndicators}",
                      }),
                    ],
                  }),
                  new sap.m.List().bindAggregation("items", {
                    path: sCompPath + "/BehavioralIndicators",

                    templateShareable: true,
                    template: new sap.m.StandardListItem({
                      title: "{formDetailsModel>Name}",
                    }),
                  }),
                ],
              });

              oVBL3.addItem(oVBBI);
            }

            var oVBEP = new sap.m.VBox({
              height: "100%",
              visible:
                "{= ${" +
                sCompPath +
                "/SelectedSegment} === ${" +
                sCompPath +
                "/SectionId}.concat('EP')}",
            });

            // if (oComp.TrainingFromCatalog || oComp.TrainingFreeSelection) {
            that._addDevPlanTrainingSection(oVBEP, oComp);
            oVBL3.addItem(oVBEP);
            // }

            if (oComp.ActivityPlan) {
              var oVBDA = new sap.m.VBox({
                height: "100%",
                visible:
                  "{= ${" +
                  sCompPath +
                  "/SelectedSegment} === ${" +
                  sCompPath +
                  "/SectionId}.concat('DA')}",
              });

              oVBL3.addItem(oVBDA);
              that._addDevPlanActivitySectionNew(oVBDA, oComp);
            }

            var oSTCL2 = new SmodTabContent({
              sectionId:
                "{" +
                sCompPath +
                "/SectionId}-{" +
                sCompPath +
                "/CompetencyId}",
              content: oVBL3,
            });
            oSTL2.addTabContent(oSTCL2);
          });
        });

        oDpSection.addContent(oST);
      },
      _activityItemSelected: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var oItem = oEvent.getSource();
        var oItemData = oItem.data();
        var oElem = oViewModel.getProperty(
          "/bodyElements/" + oItemData.AppraisalId + "/" + oItemData.RowIid
        );
        if (oElem) {
          this._handleAddFreeFormElement({
            oElem: oElem,
            sObj: false,
            ReferenceType: oItemData.ReferenceType,
            ReferenceId: oItemData.ReferenceId,
          });
        }
      },
      _addDevPlanActivitySectionNew: function (oContainer, oComp) {
        var oCurrentElement = null;
        var oViewModel = this.getModel("formDetailsModel");
        var oAP = oComp.ActivityPlan;
        var aBodyElements = oViewModel.getProperty(
          "/formData/" + oComp.AppraisalId + "/BodyElements"
        );
        var sDPPath = "/formData/" + oComp.AppraisalId + "/DevPlanActivities";
        var aDevPlanActivites = oViewModel.getProperty(sDPPath);
        var sElementEditable =
          "{= ${formDetailsModel>/bodyElements/" +
          oComp.AppraisalId +
          "/" +
          oComp.RowIid +
          "/Availability} === 'X' ? true : false }";
        var that = this;

        var oMenu = new sap.m.Menu();
        var oMI = new sap.m.MenuItem({
          text: "{formDetailsModel>Stext}",
          key: "{formDetailsModel>Otype}-{formDetailsModel>Objid}",
          press: that._activityItemSelected.bind(that),
          tooltip: "{formDetailsModel>Stext}:\n{formDetailsModel>Description}",
        });

        /*Set custom data for event handler*/
        oMI.data("AppraisalId", oAP.AppraisalId);
        oMI.data("RowIid", oAP.RowIid);
        var oOtype = new sap.ui.core.CustomData({
          key: "ReferenceType",
          value: "{formDetailsModel>Otype}",
        });
        var oObjid = new sap.ui.core.CustomData({
          key: "ReferenceId",
          value: "{formDetailsModel>Objid}",
        });

        var oDesc = new sap.ui.core.CustomData({
          key: "Description",
          value: "{formDetailsModel>Description}",
        });
        oMI.addCustomData(oOtype);
        oMI.addCustomData(oObjid);
        oMI.addCustomData(oDesc);

        // oMI.addEventDelegate({
        // 	onmouseover: function () {
        // 		// Open popover here
        // 		var oTip = new sap.m.Popover({
        // 			content: [
        // 				new sap.m.Text({
        // 					text: "Deneme"
        // 				})
        // 			],
        // 			title: "Başlık"
        // 		});

        // 		oTip.openBy(oMI);
        // 	}
        // }, this);

        oMenu.bindAggregation("items", {
          path:
            "formDetailsModel>/formData/" +
            oAP.AppraisalId +
            "/DevPlanActivities",
          template: oMI,
        });
        var oMB = new sap.m.MenuButton({
          text: "{i18n>newActivity}",
          icon: "sap-icon://add",
          type: "Accept",
          menu: oMenu,
          visible: {
            path:
              "formDetailsModel>/formParameters/" +
              oComp.AppraisalId +
              "/UX_DP_BUTTON_VISIBLE",
            formatter: function (sValue) {
              if (sValue === "X") {
                return true;
              } else {
                return false;
              }
            },
          },
        }).addStyleClass("sapUiTinyMarginBegin");
        var oOT = new sap.m.OverflowToolbar({
          content: [
            new sap.m.Text({
              text: "{i18n>activityPlan}",
            }),
            oMB,
          ],
        });

        /*Add toolbar*/
        oContainer.addItem(oOT);

        /*Add content*/

        var oActTab = new sap.m.IconTabBar({
          expandable: false,
          expanded: true,
          stretchContentHeight: true,
          applyContentPadding: false,
          visible: {
            parts: [
              {
                path:
                  "formDetailsModel>/bodyElements/" +
                  oAP.AppraisalId +
                  "/" +
                  oAP.RowIid +
                  "/AppraisalId",
              },
              {
                path:
                  "formDetailsModel>/bodyElements/" +
                  oAP.AppraisalId +
                  "/" +
                  oAP.RowIid +
                  "/RowIid",
              },
            ],
            formatter: function (sAppraisalId, sRowIid) {
              try {
                var aElements = oViewModel.getProperty(
                  "/formData/" + sAppraisalId + "/BodyElements"
                );
                var aChildren =
                  _.filter(aElements, {
                    Parent: sRowIid,
                  }) || [];
                return aChildren.length > 0;
              } catch (oEx) {
                return false;
              }
            },
          },
        }).addStyleClass("hapTransparentIconTab");

        // oActTab.bindAggregation("items", {
        // 	path: "formDetailsModel>/formData/" + oAP.AppraisalId + "/DevPlanActivities",
        // 	template: oActFil
        // });
        $.each(aDevPlanActivites, function (sInd, oDPA) {
          var oActFil = new sap.m.IconTabFilter({
            text: {
              parts: [
                {
                  path: "formDetailsModel>" + sDPPath + "/" + sInd + "/Stext",
                },
                {
                  path:
                    "formDetailsModel>/bodyElements/" +
                    oAP.AppraisalId +
                    "/" +
                    oAP.RowIid +
                    "/AppraisalId",
                },
                {
                  path:
                    "formDetailsModel>/bodyElements/" +
                    oAP.AppraisalId +
                    "/" +
                    oAP.RowIid +
                    "/RowIid",
                },
                {
                  path: "formDetailsModel>" + sDPPath + "/" + sInd + "/Otype",
                },
                {
                  path: "formDetailsModel>" + sDPPath + "/" + sInd + "/Objid",
                },
              ],
              formatter: function (
                sText,
                sAppraisalId,
                sRowIid,
                sOtype,
                sObjid
              ) {
                try {
                  var aElements = oViewModel.getProperty(
                    "/formData/" + sAppraisalId + "/BodyElements"
                  );
                  var aChildren =
                    _.filter(aElements, {
                      Parent: sRowIid,
                      ForeignType: sOtype,
                      ForeignId: sObjid,
                    }) || [];

                  return sText + " (" + aChildren.length + ")";
                } catch (oEx) {
                  return "";
                }
              },
            },
            key:
              "{path:'formDetailsModel>" +
              sDPPath +
              "/" +
              sInd +
              "/Otype'} - {path:'formDetailsModel>" +
              sDPPath +
              "/" +
              sInd +
              "/Objid'}",
            visible: {
              parts: [
                {
                  path:
                    "formDetailsModel>/bodyElements/" +
                    oAP.AppraisalId +
                    "/" +
                    oAP.RowIid +
                    "/AppraisalId",
                },
                {
                  path:
                    "formDetailsModel>/bodyElements/" +
                    oAP.AppraisalId +
                    "/" +
                    oAP.RowIid +
                    "/RowIid",
                },
                {
                  path: "formDetailsModel>" + sDPPath + "/" + sInd + "/Otype",
                },
                {
                  path: "formDetailsModel>" + sDPPath + "/" + sInd + "/Objid",
                },
              ],
              formatter: function (sAppraisalId, sRowIid, sOtype, sObjid) {
                try {
                  var aElements = oViewModel.getProperty(
                    "/formData/" + sAppraisalId + "/BodyElements"
                  );
                  var aChildren =
                    _.filter(aElements, {
                      Parent: sRowIid,
                      ForeignType: sOtype,
                      ForeignId: sObjid,
                    }) || [];
                  return aChildren.length > 0;
                } catch (oEx) {
                  return false;
                }
              },
            },
            //, count: {
            // 	parts: [{
            // 		path: "formDetailsModel>/bodyElements/" + oAP.AppraisalId + "/" + oAP.RowIid + "/RowIid"
            // 	}, {
            // 		path: "formDetailsModel>" + sDPPath + "/" + sInd + "/Otype"
            // 	}, {
            // 		path: "formDetailsModel>" + sDPPath + "/" + sInd + "/Objid"
            // 	}],
            // 	formatter: function (sRowIid, sOtype, sObjid) {
            // 		var aChildren = _.filter(aBodyElements, {
            // 			"Parent": sRowIid,
            // 			"ForeignType": sOtype,
            // 			"ForeignId": sObjid
            // 		}) || [];
            // 		return aChildren.length;
            // 	}
            // }
          });
          var oRef = {
            ReferenceType: oDPA.Otype,
            ReferenceId: oDPA.Objid,
          };
          that._addUIElement(oAP, "DevPlanActivityFilter", null, oActFil, oRef);

          var oVLC = new sap.ui.layout.VerticalLayout({
            width: "100%",
          }).addStyleClass("sapUiNoContentPadding");

          that._addUIElement(oAP, "VerticalLayout", null, oVLC, oRef);

          oActFil.addContent(oVLC);

          /*Add children*/
          var aChildActivities = _.filter(aBodyElements, {
            Parent: oAP.RowIid,
            ForeignType: oDPA.Otype,
            ForeignId: oDPA.Objid,
          });
          $.each(aChildActivities, function (sInd2, oChildActivity) {
            that._addRowNew(oVLC, oChildActivity, false, false);
          });
          oActTab.addItem(oActFil);
        });

        // var oMS = new sap.m.MessageStrip({
        // 		text: "{i18n>noActivityPlanExist}",
        // 		type: "Information",
        // 		showIcon: true,
        // 		visible: {
        // 			parts: [{
        // 				path: "formDetailsModel>/bodyElements/" + oAP.AppraisalId + "/" + oAP.RowIid + "/AppraisalId"
        // 			}, {
        // 				path: "formDetailsModel>/bodyElements/" + oAP.AppraisalId + "/" + oAP.RowIid + "/RowIid"
        // 			}],
        // 			formatter: function (sAppraisalId, sRowIid) {
        // 				try {
        // 					var aElements = oViewModel.getProperty("/formData/" + sAppraisalId + "/BodyElements");
        // 					var aChildren = _.filter(aElements, {
        // 						"Parent": sRowIid
        // 					}) || [];
        // 					return !aChildren.length > 0;
        // 				} catch (oEx) {
        // 					return true;
        // 				}
        // 			}
        // 		}
        // 	})
        // 	.addStyleClass("sapUiTinyMargin");

        oContainer.addItem(oActTab);
        //oContainer.addItem(oMS);
      },
      _addDevPlanTrainingSection: function (oContainer, oComp) {
        var oCurrentElement = null;

        var oOT = new sap.m.OverflowToolbar({
          content: [
            new sap.m.Text({
              text: "{i18n>trainingPlan}",
            }),
          ],
        });

        oContainer.addItem(oOT);

        if (oComp.TrainingFromCatalog) {
          oCurrentElement = _.clone(oComp.TrainingFromCatalog);
          var oVLC = new sap.ui.layout.VerticalLayout({
            width: "100%",
          }).addStyleClass("sapUiNoContentPadding");

          this._addUIElement(oCurrentElement, "VerticalLayout", null, oVLC);

          oContainer.addItem(oVLC);

          this._addRowNew(oVLC, oCurrentElement, false, false);
        }

        if (oComp.TrainingFreeSelection) {
          oCurrentElement = _.clone(oComp.TrainingFreeSelection);
          var oVLF = new sap.ui.layout.VerticalLayout({
            width: "100%",
          }).addStyleClass("sapUiNoContentPadding");

          this._addUIElement(oCurrentElement, "VerticalLayout", null, oVLF);

          oContainer.addItem(oVLF);

          this._addRowNew(oVLF, oCurrentElement, false, false);
        }
      },
      _addResultSubSectionNew: function (oSection) {
        var oSubSection = new sap.uxap.ObjectPageSubSection({
          title: oSection.getTitle(),
          titleUppercase: false,
        }).addStyleClass("sapUiNoContentPadding");

        var oVL = new sap.ui.layout.VerticalLayout({
          width: "100%",
        }).addStyleClass("sapUiNoContentPadding");

        oSubSection.addBlock(oVL);

        //Add subsection to section
        oSection.addSubSection(oSubSection);
      },
      _getItemsCount: function (sTitle, aArray) {
        if (aArray instanceof Array) {
          if (aArray.length) {
            return sTitle + " (" + aArray.length + ")";
          } else {
            return sTitle;
          }
        } else {
          var sCount = 0;
          for (var sProps in aArray) {
            if (sProps instanceof Array) {
              sCount = sCount + sProps.length;
            }
          }
          if (sCount) {
            return sTitle + " (" + sCount + ")";
          } else {
            return sTitle;
          }
        }
      },
      _addResultSubSection: function (oSection, oBodyElement) {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyElements = oViewModel.getProperty(
          "/bodyElements/" + oBodyElement.AppraisalId
        );
        var oFormParameters = oViewModel.getProperty(
          "/formParameters/" + oBodyElement.AppraisalId
        );
        var oSubSection = new sap.uxap.ObjectPageSubSection({
          title: oSection.getTitle(),
          titleUppercase: false,
        }).addStyleClass("sapUiNoContentPadding");

        this._addUIElement(oBodyElement, "SubSection", null, oSubSection);

        // Add main grid
        var oGrid = new sap.ui.layout.Grid({
          defaultSpan: "XL4 L4 M6 S12",
        });
        this._addUIElement(oBodyElement, "ResultSectionGrid", null, oGrid);

        oSubSection.addBlock(oGrid);

        var _addQualificationResults = function (
          oParent,
          sParent,
          sList,
          sHeaderDesign
        ) {
          if (sList) {
            var oList = new sap.m.List();
            oParent.addAggregation("list", oList);
          }
          $.each(oBodyElements, function (sIndex, oElement) {
            if (oElement.Parent === sParent) {
              if (!sList) {
                var oHIP = new HapIndicatorPanel({
                  headerText: oElement.Name,
                });

                oHIP.setHeaderDesign(sHeaderDesign);
                _addQualificationResults(oHIP, oElement.RowIid, true);
                oParent.addHapPanel(oHIP);
              } else {
                var oListItem = new sap.m.StandardListItem({
                  title: oElement.Name,
                });
                oList.addItem(oListItem);
              }
            }
          });
        };

        var sRowStrengths = oFormParameters["FORM_VB_DP_STRENGTHS"].substr(
          0,
          8
        );
        var sRowWeakness = oFormParameters["FORM_VB_DP_WEAKNESS"].substr(0, 8);
        var sRowOppurts = oFormParameters["FORM_VB_DP_OPPURTS"].substr(0, 8);

        $.each(oBodyElements, function (sIndex, oElement) {
          if (oElement.Parent === oBodyElement.RowIid) {
            var sHeaderDesign = "None";
            var oHIP = new HapIndicatorPanel({
              headerText: oElement.Name,
              headerAlign: "Center",
              headerDescription: oElement.Description,
            });

            if (oElement.ElementId === sRowStrengths) {
              sHeaderDesign = "Positive";
            } else if (oElement.ElementId === sRowOppurts) {
              sHeaderDesign = "Emphasized";
            } else if (oElement.ElementId === sRowWeakness) {
              sHeaderDesign = "Negative";
            }
            oHIP.setHeaderDesign(sHeaderDesign);
            _addQualificationResults(
              oHIP,
              oElement.RowIid,
              false,
              sHeaderDesign
            );
            oGrid.addContent(oHIP);
          }
        });

        //Add subsection to section
        oSection.addSubSection(oSubSection);
      },

      /**
       * Add subsections according to the body elements
       * @function
       * @private
       */
      _addSubSections: function (oSection, sAppraisalId, oCurrentElement) {
        var oSubSection = new sap.uxap.ObjectPageSubSection({
          title: oSection.getTitle(),
          titleUppercase: false,
        }).addStyleClass("sapUiNoContentPadding");

        this._addUIElement(oCurrentElement, "SubSection", null, oSubSection);

        //Add vertical layout

        var oVL = new sap.ui.layout.VerticalLayout({
          width: "100%",
        }).addStyleClass("sapUiNoContentPadding");

        this._addUIElement(oCurrentElement, "VerticalLayout", null, oVL);

        oSubSection.addBlock(oVL);

        this._addRowNew(oVL, oCurrentElement, false, true);
        //Add subsection to section
        oSection.addSubSection(oSubSection);
      },
      /**
       * Add rows - new design
       * @function
       * @private
       */
      _addSimpleRow: function (oParent, oElem) {
        // <ObjectHeader
        // 	binding="{/ProductCollection/0}"
        // 	title="{Name}"
        // 	condensed="true"
        // 	number="{
        // 		parts:[{path:'Price'},{path:'CurrencyCode'}],
        // 		type: 'sap.ui.model.type.Currency',
        // 		formatOptions: {showMeasure: false}
        // 	}"
        // 	numberUnit="{CurrencyCode}" >
        // 	<attributes>
        // 		<ObjectAttribute text="{WeightMeasure} {WeightUnit} {Width} x {Depth} x {Height} {DimUnit}" />
        // 	</attributes>
        // </ObjectHeader>
        var oPanelHeader = null;
        var sNameElement = "";
        var that = this;
        var sElementEditable =
          "{= ${formDetailsModel>/bodyElements/" +
          oElem.AppraisalId +
          "/" +
          oElem.RowIid +
          "/Availability} === 'X' ? true : false }";

        if (!oElem.FreeInput) {
          sNameElement = "NameString";
          oPanelHeader = new sap.m.Text({
            text: {
              path:
                "formDetailsModel>/bodyElements/" +
                oElem.AppraisalId +
                "/" +
                oElem.RowIid +
                "/NameString",
            },
          });
        } else {
          sNameElement = "Name";
          oPanelHeader = new sap.m.Input({
            value: {
              path:
                "formDetailsModel>/bodyElements/" +
                oElem.AppraisalId +
                "/" +
                oElem.RowIid +
                "/Name",
            },
            width: "300px",
            length: 40,
            editable: sElementEditable,
            layoutData: new sap.m.OverflowToolbarLayoutData({
              moveToOverflow: false,
            }),
          });
        }

        var oRowIid = new sap.ui.core.CustomData({
          key: "elementRowIid",
          value: oElem.RowIid,
        });
        var oAppraisalId = new sap.ui.core.CustomData({
          key: "appraisalId",
          value: oElem.AppraisalId,
        });
        var oElementName = new sap.ui.core.CustomData({
          key: "elementName",
        });
        oElementName.bindProperty(
          "value",
          "formDetailsModel>/bodyElements/" +
            oElem.AppraisalId +
            "/" +
            oElem.RowIid +
            "/" +
            sNameElement
        );

        var oOT = new sap.m.Table({
          showSeparators: "None",
        }).addStyleClass("hapSimpleRow sapUiTinyMarginBottom");
        oOT.addColumn(new sap.m.Column());
        var oOH = new sap.m.ColumnListItem();
        oOT.addItem(oOH);
        oOH.addCell(oPanelHeader);

        if (oElem.DeletionVisible) {
          oOT.addColumn(
            new sap.m.Column({
              hAlign: "End",
            })
          );
          var oRemoveButton = new sap.m.Button({
            icon: "sap-icon://delete",
            type: "Reject",
            press: that._handleDeleteFormElement.bind(that),
            enabled: sElementEditable,
            layoutData: new sap.m.OverflowToolbarLayoutData({
              moveToOverflow: false,
            }),
          });
          oRemoveButton.addCustomData(oRowIid);
          oRemoveButton.addCustomData(oElementName);
          oRemoveButton.addCustomData(oAppraisalId);
          this._addUIElement(oElem, "RowDeleteButton", null, oRemoveButton);
          oOH.addCell(oRemoveButton);
        }

        oParent.addContent(oOT);

        this._addUIElement(oElem, "RowPanel", null, oOT);
        this._addUIElement(oElem, "RowPanelHeader", null, oPanelHeader);
      },
      _addRowNew: function (oParent, oCurrentElement, sChild, sFirst) {
        var sExist = false;
        var oThis = this;
        var oRowPanel = null;
        var oCellsNoteAvailable = null;
        var sRowIid = oCurrentElement.RowIid;
        var sAppraisalId = oCurrentElement.AppraisalId;
        var oViewModel = this.getModel("formDetailsModel");
        var oFormParameters = oViewModel.getProperty(
          "/formParameters/" + sAppraisalId
        );
        var oBodyElements = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );
        var aBodyCells = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyCells"
        );
        var sSimpleRow = false;
        oRowPanel = _.find(oThis._aFormUIElements, {
          AppraisalId: sAppraisalId,
          RowIid: sRowIid,
          ColumnIid: null,
          UIType: "RowPanel",
        });

        if (oCurrentElement.Availability !== "H") {
          if (oRowPanel) {
            sExist = true;
          }

          oCellsNoteAvailable = _.find(aBodyCells, function (cell) {
            return (
              cell.AppraisalId === sAppraisalId &&
              cell.RowIid === sRowIid &&
              cell.CellNoteAvailability !== "H"
            );
          });

          if (
            oCurrentElement.Child === "0000" &&
            oCurrentElement.UsedColumns === "00" &&
            !oCurrentElement.EnhancementVisible &&
            !oCellsNoteAvailable &&
            oCurrentElement.ElementType === "VC"
          ) {
            sSimpleRow = true;
          }

          if (
            oCurrentElement.ElementId !==
            oFormParameters["UX_NO_PANEL_HTML_CONTENT"]
          ) {
            if (!sExist) {
              //Add element it self
              if (oCurrentElement === undefined) {
                return;
              }

              if (sSimpleRow) {
                this._addSimpleRow(oParent, oCurrentElement);
              } else {
                /*4-P,4-R,6*/
                /*oThis._sEduColumn*/
                oRowPanel = new sap.m.Panel({
                  width: "100%",
                  expandable: true,
                  expandAnimation: false,
                  expanded: {
                    parts: [
                      {
                        path:
                          "formDetailsModel>/formData/" +
                          sAppraisalId +
                          "/HeaderStatus",
                      },
                      {
                        path:
                          "formDetailsModel>/bodyCells/" +
                          sAppraisalId +
                          "/" +
                          sRowIid,
                      },
                      {
                        path:
                          "formDetailsModel>/bodyElements/" +
                          sAppraisalId +
                          "/" +
                          sRowIid,
                      },
                    ],
                    formatter: function (
                      oHeaderStatus,
                      aBodyCells,
                      oBodyElement
                    ) {
                      try {
                        var aCellsNoteAvailable = _.filter(
                          aBodyCells,
                          function (oBodyCell) {
                            if (oBodyCell.CellNoteAvailability !== "H") {
                              return true;
                            } else {
                              return false;
                            }
                          }
                        );

                        if (
                          aCellsNoteAvailable.length === 0 &&
                          oBodyElement.UsedColumns === "00" &&
                          oBodyElement.Child === "0000" &&
                          oBodyElement.ForeignType !== "Q"
                        ) {
                          return false;
                        } else {
                          return true;
                        }
                      } catch (oErr) {
                        return true;
                      }
                    },
                  },

                  backgroundDesign: "Transparent",
                }).addStyleClass("hapRowPanel");

                oRowPanel.addStyleClass(
                  "hapRowPanelLevel" + oCurrentElement.ApLevel
                );

                if (sFirst) {
                  oRowPanel.addStyleClass("hapRowPanelFirst");
                }

                this._addUIElement(
                  oCurrentElement,
                  "RowPanel",
                  null,
                  oRowPanel
                );

                //Generate Header
                this._addRowHeader(oRowPanel, oCurrentElement);

                //Create a form
                var oForm = new sap.ui.layout.form.Form({
                  editable: true,
                  layout: new sap.ui.layout.form.ResponsiveGridLayout({
                    labelSpanXL: 12,
                    labelSpanL: 12,
                    labelSpanM: 12,
                    labelSpanS: 12,
                    adjustLabelSpan: false,
                    emptySpanXL: 0,
                    emptySpanL: 0,
                    emptySpanM: 0,
                    emptySpanS: 0,
                    columnsXL: 6,
                    columnsL: 6,
                    columnsM: 4,
                    singleContainerFullSize: true,
                  }),
                });

                var oGrid = new sap.ui.layout.Grid({
                  defaultSpan: "L12 M12 S12",
                }).addStyleClass("hapRowGrid");

                this._addUIElement(
                  oCurrentElement,
                  "RowPanelGrid",
                  null,
                  oGrid
                );
                this._addUIElement(
                  oCurrentElement,
                  "RowPanelForm",
                  null,
                  oForm
                );

                if (
                  oCurrentElement.Description &&
                  oCurrentElement.Description !== oCurrentElement.Name &&
                  oCurrentElement.ApLevel !== "01" &&
                  oCurrentElement.ApLevel !== "02"
                ) {
                  var oDesc = new HapMessageStrip({
                    messageType: "Warning",
                    htmlContent:
                      "{formDetailsModel>/bodyElements/" +
                      sAppraisalId +
                      "/" +
                      sRowIid +
                      "/Description}",
                    visible:
                      "{formDetailsModel>/bodyElements/" +
                      sAppraisalId +
                      "/" +
                      sRowIid +
                      "/DescriptionVisible}",
                  });

                  oDesc.addStyleClass(
                    "hapElementDescriptionLevel" + oCurrentElement.ApLevel
                  );
                  oDesc.setLayoutData(
                    new sap.ui.layout.GridData({
                      span: "L12 M12 S12",
                    })
                  );
                  this._addUIElement(
                    oCurrentElement,
                    "RowDescription",
                    null,
                    oDesc
                  );
                  oGrid.addContent(oDesc);
                }

                this._addCellsNew(oForm, sAppraisalId, sRowIid);

                //Add form to the grid
                oGrid.addContent(oForm);

                //Add grid to Row Panel
                oRowPanel.addContent(oGrid);
                oRowPanel.addContent(oForm);

                //Add grid to the parent
                oParent.addContent(oRowPanel);
              }
            }
          } else {
            var oHTML = new sap.ui.core.HTML();
            oHTML.setContent(oCurrentElement.Description);
            oParent.addContent(oHTML);
          }
        }

        // Add children and brothers
        if (
          oCurrentElement.Child !== "0000" &&
          oCurrentElement.Child !== sRowIid
        ) {
          if (oBodyElements[oCurrentElement.Child].Parent === sRowIid) {
            var oChildElement = oBodyElements[oCurrentElement.Child];
            this._addRowNew(oRowPanel, oChildElement, true, false);
          }
        }

        if (
          sChild &&
          oCurrentElement.Brother !== "0000" &&
          oCurrentElement.Brother !== sRowIid &&
          oCurrentElement.Brother !== sChild
        ) {
          var oBrotherElement = oBodyElements[oCurrentElement.Brother];
          this._addRowNew(oParent, oBrotherElement, true, false);
        }
      },

      /**
       * Add row toolbar
       * @function
       * @private
       */
      _addRowHeader: function (oParent, oElem) {
        var oThis = this;
        var sParamVal;
        var sNameElement = "";
        var oPanelToolbar = new sap.m.OverflowToolbar();
        var oViewModel = this.getModel("formDetailsModel");
        var oFormParameters = oViewModel.getProperty(
          "/formParameters/" + oElem.AppraisalId
        );
        var sElementEditable =
          "{= ${formDetailsModel>/bodyElements/" +
          oElem.AppraisalId +
          "/" +
          oElem.RowIid +
          "/Availability} === 'X' ? true : false }";
        var sAttachVisible =
          "{formDetailsModel>/bodyElements/" +
          oElem.AppraisalId +
          "/" +
          oElem.RowIid +
          "/AttachmentVisible}";
        var oPanelHeader = null;
        var oNewButton = null;
        var aNewButtons = [];
        var aFormParam = oViewModel.getProperty(
          "/developmentPlan/formData/FormParameters"
        );
        var aBodyElements = oViewModel.getProperty(
          "/developmentPlan/formData/BodyElements"
        );
        var sTCPar = oFormParameters["FORM_VB_DP_REF_TCAT"];
        var sTFPar = oFormParameters["FORM_VB_DP_REF_TFRE"];

        this._addUIElement(oElem, "RowPanelToolbar", null, oPanelToolbar);

        if (!oElem.FreeInput) {
          sNameElement = "NameString";
          oPanelHeader = new sap.m.Text({
            text: {
              path:
                "formDetailsModel>/bodyElements/" +
                oElem.AppraisalId +
                "/" +
                oElem.RowIid +
                "/NameString",
            },
          });
        } else {
          sNameElement = "Name";
          oPanelHeader = new sap.m.Input({
            value: {
              path:
                "formDetailsModel>/bodyElements/" +
                oElem.AppraisalId +
                "/" +
                oElem.RowIid +
                "/Name",
            },
            width: "300px",
            length: 40,
            editable: sElementEditable,
            layoutData: new sap.m.OverflowToolbarLayoutData({
              moveToOverflow: false,
            }),
          });
        }

        oPanelHeader.addStyleClass("hapElementNameLevel" + oElem.ApLevel);
        oPanelHeader.addStyleClass("sapUiTinyMarginEnd");

        this._addUIElement(oElem, "RowPanelHeader", null, oPanelHeader);

        //var oSpacer = new sap.m.ToolbarSpacer();

        var oRowIid = new sap.ui.core.CustomData({
          key: "elementRowIid",
          value: oElem.RowIid,
        });
        var oAppraisalId = new sap.ui.core.CustomData({
          key: "appraisalId",
          value: oElem.AppraisalId,
        });
        var oElementName = new sap.ui.core.CustomData({
          key: "elementName",
        });
        oElementName.bindProperty(
          "value",
          "formDetailsModel>/bodyElements/" +
            oElem.AppraisalId +
            "/" +
            oElem.RowIid +
            "/" +
            sNameElement
        );

        oPanelToolbar.addContent(oPanelHeader);
        //oPanelToolbar.addContent(oSpacer);

        //Müdür formlarında sadece "Yeni Hedef" olacak
        //Bölüm hedefleri zaten otomatik olarak bireysel hedeflere gelecek
        oNewButton = new sap.m.Button({
          text: "Yeni Hedef",
          icon: "sap-icon://goal",
          press: jQuery.proxy(oThis._handleAddFreeFormElement, oThis, {
            oElem: oElem,
            sObj: false,
          }),
          layoutData: new sap.m.OverflowToolbarLayoutData({
            moveToOverflow: false,
          }),
        });
        aNewButtons.push(oNewButton);
        if (!oFormParameters["UX_APPRAISAL_FORM_MANAGER"]) {
          oNewButton = null;
          oNewButton = new sap.m.Button({
            text: "Bölüm Hedeflerinden",
            icon: "sap-icon://target-group",
            press: jQuery.proxy(oThis._handleAddFreeFormElement, oThis, {
              oElem: oElem,
              sObj: true,
            }),
            layoutData: new sap.m.OverflowToolbarLayoutData({
              moveToOverflow: false,
            }),
          });
          aNewButtons.push(oNewButton);
        }

        sParamVal = oFormParameters["FORM_VB_ROW_INDIVIDUAL_GOALS"];

        if (oElem.EnhancementVisible) {
          if (oElem.ElementId !== sParamVal) {
            var oAddButton = new sap.m.Button({
              icon: "sap-icon://add",
              type: "Accept",
              press: oThis._handleAddFormElement.bind(oThis),
              enabled: sElementEditable,
              layoutData: new sap.m.OverflowToolbarLayoutData({
                moveToOverflow: false,
              }),
            });
            oAddButton.addCustomData(oRowIid);
            oAddButton.addCustomData(oElementName);
            oAddButton.addCustomData(oAppraisalId);

            if (oElem.ElementId === sTCPar || oElem.ElementId === sTFPar) {
              oAddButton.bindProperty("text", {
                path: "i18n>labelAddTraining",
              });
            } else {
              oAddButton.bindProperty("text", {
                path: "i18n>labelAddElement",
              });
            }

            oPanelToolbar.addContent(oAddButton);
            this._addUIElement(oElem, "RowAddButton", null, oAddButton);
          } else {
            var oObjectButton = new sap.m.Button({
              text: "{i18n>labelAddElement}",
              icon: "sap-icon://add",
              enabled: sElementEditable,
              type: "Accept",
              press: function (oEvent) {
                var oActionSheet = new sap.m.ActionSheet({
                  showCancelButton: false,
                  placement: "Bottom",
                  buttons: aNewButtons,
                });

                oActionSheet.openBy(oObjectButton);
              },
              layoutData: new sap.m.OverflowToolbarLayoutData({
                moveToOverflow: false,
              }),
            });

            oPanelToolbar.addContent(oObjectButton);
            this._addUIElement(oElem, "RowMenuButton", null, oObjectButton);
          }
        }

        sParamVal = oFormParameters["FORM_VB_DP_TRAINING"];

        if (oElem.ElementId === sParamVal) {
          var oTrainingButton = new sap.m.Button({
            icon: "sap-icon://e-learning",
            type: "Reject",
            text: "Eğitim tarihçesi",
            press: oThis._showDevTrainings.bind(oThis),
          }).addStyleClass("hapButtonGreen");
          oPanelToolbar.addContent(oTrainingButton);
        }
        /*Survey button*/
        if (oElem.FormExist) {
          var sFormEnabled =
            "{= ${formDetailsModel>/bodyElements/" +
            oElem.AppraisalId +
            "/" +
            oElem.RowIid +
            "/FormExist} && ${formDetailsModel>/bodyCells/" +
            oElem.AppraisalId +
            "/" +
            oElem.RowIid +
            "/" +
            oElem.FormColumnIid +
            "/ValueTxt} === '1' }";

          var oRowIid4 = new sap.ui.core.CustomData({
            key: "elementRowIid",
            value: oElem.RowIid,
          });
          var oFormId4 = new sap.ui.core.CustomData({
            key: "elementFormId",
            value: oElem.FormId,
          });
          var oElementName4 = new sap.ui.core.CustomData({
            key: "elementName",
          });
          oElementName4.bindProperty(
            "value",
            "formDetailsModel>/bodyElements/" +
              oElem.AppraisalId +
              "/" +
              oElem.RowIid +
              "/Name"
          );
          var oSurveyButton = new sap.m.Button({
            icon: "sap-icon://survey",
            type: "Accept",
            press: oThis._handleOpenSurvey.bind(oThis),
            enabled: sFormEnabled,
          });
          oSurveyButton.addCustomData(oRowIid4);
          oSurveyButton.addCustomData(oFormId4);
          oSurveyButton.addCustomData(oElementName4);
          oSurveyButton.addCustomData(oAppraisalId);

          oPanelToolbar.addContent(oSurveyButton);
          this._addUIElement(oElem, "RowSurveyButton", null, oSurveyButton);
        }

        /*Attachment button*/
        if (oElem.AttachmentVisible) {
          var oRowIid2 = new sap.ui.core.CustomData({
            key: "elementRowIid",
            value: oElem.RowIid,
          });
          var oElementName2 = new sap.ui.core.CustomData({
            key: "elementName",
          });
          oElementName2.bindProperty(
            "value",
            "formDetailsModel>/bodyElements/" +
              oElem.AppraisalId +
              "/" +
              oElem.RowIid +
              "/Name"
          );
          var oAttButton = new sap.m.Button({
            icon: "sap-icon://add-document",
            text: "{i18n>addAttachmentFile}",
            press: jQuery.proxy(oThis._handleAddAttachment, oThis, {
              appraisalId: oAppraisalId,
              rowIid: oRowIid,
              elementName: oElementName,
            }),
            enabled: sElementEditable,
            visible: sAttachVisible,
          });
          oAttButton.addCustomData(oRowIid2);
          oAttButton.addCustomData(oElementName2);
          oAttButton.addCustomData(oAppraisalId);
          this._addUIElement(oElem, "RowAttButton", null, oAttButton);
          oPanelToolbar.addContent(oAttButton);
        }

        var oRowIid3 = new sap.ui.core.CustomData({
          key: "elementRowIid",
          value: oElem.RowIid,
        });
        var oElementName3 = new sap.ui.core.CustomData({
          key: "elementName",
        });
        oElementName3.bindProperty(
          "value",
          "formDetailsModel>/bodyElements/" +
            oElem.AppraisalId +
            "/" +
            oElem.RowIid +
            "/Name"
        );
        var oAttListButton = new sap.m.Button({
          icon: "sap-icon://attachment",
          type: "Reject",
          text: {
            parts: [
              {
                path: "i18n>attachmentList",
              },
              {
                path:
                  "formDetailsModel>/attachmentCollection/" +
                  oElem.AppraisalId +
                  "/" +
                  oElem.RowIid +
                  "/attachmentList",
              },
            ],
            formatter: function (sText, aAttList) {
              try {
                if (aAttList) {
                  if (aAttList.length > 0) {
                    return sText + " (" + aAttList.length + ")";
                  } else {
                    return sText;
                  }
                } else {
                  return sText;
                }
              } catch (oErr) {
                return sText;
              }
            },
          },
          press: oThis._handleListAttachment.bind(oThis),
          visible: {
            path:
              "formDetailsModel>/attachmentCollection/" +
              oElem.AppraisalId +
              "/" +
              oElem.RowIid +
              "/attachmentList",
            formatter: function (aAttList) {
              try {
                if (aAttList) {
                  if (aAttList.length > 0) {
                    return true;
                  } else {
                    return false;
                  }
                } else {
                  return false;
                }
              } catch (oErr) {
                return false;
              }
            },
          },
        });
        oAttListButton.addCustomData(oRowIid3);
        oAttListButton.addCustomData(oElementName3);
        oAttListButton.data("appraisalId", oElem.AppraisalId);

        this._addUIElement(oElem, "RowAttListButton", null, oAttListButton);
        oPanelToolbar.addContent(oAttListButton);

        /*Attachment button*/

        if (oElem.DeletionVisible) {
          var oRemoveButton = new sap.m.Button({
            icon: "sap-icon://delete",
            type: "Reject",
            press: oThis._handleDeleteFormElement.bind(oThis),
            enabled: sElementEditable,
            layoutData: new sap.m.OverflowToolbarLayoutData({
              moveToOverflow: false,
            }),
          });
          oRemoveButton.addCustomData(oRowIid);
          oRemoveButton.addCustomData(oElementName);
          oRemoveButton.addCustomData(oAppraisalId);
          this._addUIElement(oElem, "RowDeleteButton", null, oRemoveButton);
          oPanelToolbar.addContent(oRemoveButton);
        }

        oParent.setHeaderToolbar(oPanelToolbar);
      },

      /**
       * Add cells according to the doc tab
       * @function
       * @private
       */
      _addCellsNew: function (oParent, sAppraisalId, sRowIid) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCells = oViewModel.getProperty("/bodyCells/" + sAppraisalId);
        var aBodyCells = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyCells"
        );
        var aBodyColumns = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyColumns"
        );
        var sObjTeamColumnIid =
          this._getColumnIid(sAppraisalId, "ZTTJ") ||
          this._getColumnIid(sAppraisalId, "ZT00");

        //bu satırda bölüm hedefi var mı?
        var oObjTeam = _.find(aBodyCells, {
          RowIid: sRowIid,
          ColumnIid: sObjTeamColumnIid,
        });

        $.each(aBodyColumns, function (sIndex, oColumn) {
          if (oBodyCells[sRowIid].hasOwnProperty(oColumn.ColumnIid)) {
            var oCell = oBodyCells[sRowIid][oColumn.ColumnIid];
            if (
              (oCell.CellValueAvailability !== "H" &&
                oCell.CellValueAvailability !== "K") ||
              oCell.CellNoteAvailability !== "H"
            ) {
              var oFC = new sap.ui.layout.form.FormContainer();
              var oFE = null;
              if (
                oCell.CellValueAvailability !== "H" &&
                oCell.CellValueAvailability !== "K"
              ) {
                oFE = new sap.ui.layout.form.FormElement({
                  label:
                    "{path:'formDetailsModel>/bodyCells/" +
                    sAppraisalId +
                    "/" +
                    oCell.RowIid +
                    "/" +
                    oCell.ColumnIid +
                    "/Caption'}",
                });
              } else if (oCell.CellNoteAvailability !== "H") {
                var sCaptionNoteVisible =
                  "{= ${formDetailsModel>/bodyCells/" +
                  oCell.AppraisalId +
                  "/" +
                  oCell.RowIid +
                  "/" +
                  oCell.ColumnIid +
                  "/CaptionNote} === '' ? false : true }";
                var oNL = new sap.m.Label({
                  text: oCell.CaptionNote,
                  visible: sCaptionNoteVisible,
                  required: {
                    parts: [
                      {
                        path:
                          "formDetailsModel>/bodyCells/" +
                          oCell.AppraisalId +
                          "/" +
                          oCell.RowIid +
                          "/" +
                          oCell.ColumnIid +
                          "/CellInputNote5022",
                      },
                      {
                        path:
                          "formDetailsModel>/bodyCells/" +
                          oCell.AppraisalId +
                          "/" +
                          oCell.RowIid +
                          "/" +
                          oCell.ColumnIid +
                          "/CellNoteAvailability",
                      },
                    ],
                    formatter: function (
                      sCellInputNote,
                      sCellNoteAvailability
                    ) {
                      if (
                        sCellInputNote === "M" &&
                        sCellNoteAvailability === "X"
                      ) {
                        return true;
                      } else {
                        return false;
                      }
                    },
                  },
                });
                oFE = new sap.ui.layout.form.FormElement({
                  /*	label: "{path:'formDetailsModel>/bodyCells/" + sAppraisalId + "/" + oCell.RowIid + "/" + oCell.ColumnIid +
										"/CaptionNote'}"*/
                  label: oNL,
                });
              }
              oFC.addFormElement(oFE);
              oParent.addFormContainer(oFC);

              //Add cell content
              oThis._addCellNew(oFE, oCell);
              if (
                oCell.ColumnIid ===
                  oThis._getColumnIid(oCell.AppraisalId, "OBJ0") ||
                oCell.ColumnIid === sObjTeamColumnIid
              ) {
                if (!_.isEmpty(oObjTeam)) {
                  //eğer bölüm hedefi varsa bu 2 sütunu tek satırda göster
                  oFC.setLayoutData(
                    new sap.ui.layout.GridData({
                      span: "XL6 L6 M6 S12",
                    })
                  );
                } else {
                  //Müdür formunda bölüm hedefi sütunu olmayacak
                  //sadece _sObjColumn u tüm satıha yay :)
                  oFC.setLayoutData(
                    new sap.ui.layout.GridData({
                      span: "XL12 L12 M12 S12",
                    })
                  );
                }
              } else if (
                oCell.ColumnIid ===
                oThis._getColumnIid(oCell.AppraisalId, "ZTTC")
              ) {
                oFC.setLayoutData(
                  new sap.ui.layout.GridData({
                    span: "XL3 L3 M8 S12",
                  })
                );
              } else {
                oFC.setLayoutData(
                  new sap.ui.layout.GridData({
                    span: "XL2 L2 M8 S12",
                  })
                );
              }
            }
          }
        });
      },

      _addCellNew: function (oParent, oCell) {
        var oThis = this;
        var oEl = null;
        var oFB = new sap.m.FlexBox({
          direction: "Column",
          width: "100%",
        });
        var sRbMultiColumn = false;
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyElements = oViewModel.getProperty(
          "/bodyElements/" + oCell.AppraisalId
        );
        var aBodyElements = oViewModel.getProperty(
          "/formData/" + oCell.AppraisalId + "/BodyElements"
        );
        var oFormParameters = oViewModel.getProperty(
          "/formParameters/" + oCell.AppraisalId
        );

        if (oCell.RowIid !== "0000" && oCell.ColumnIid !== "0000") {
          if (
            oCell.CellValueAvailability !== "H" &&
            oCell.CellValueAvailability !== "K"
          ) {
            switch (oCell.ValueType) {
              case "N":
                switch (oCell.LayoutType) {
                  case "M":
                    /*Multi input*/
                    oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    oEl = this._addTextAreaObjective(oCell);
                    break;
                  default:
                    oEl = this._addInputField(oCell, "ValueNum");
                }
                break;

              case "D":
                oEl = this._addDateField(oCell);
                break;

              case "S":
                /*String*/
                switch (oCell.LayoutType) {
                  case "S":
                    /*String*/
                    oEl = this._addInputField(oCell, "ValueString");
                    break;
                  case "R":
                    /*Radiobutton*/
                    var aCurrentElement = _.filter(oBodyElements, [
                      "RowIid",
                      oCell.RowIid,
                    ]);
                    var aParentElement = _.filter(oBodyElements, [
                      "RowIid",
                      aCurrentElement[0].Parent,
                    ]);
                    var sVbRowMultiCol =
                      oFormParameters["FORM_VB_ROW_PARENT_RADIO_MULTI_COL"];
                    if (aParentElement.length > 0 && sVbRowMultiCol) {
                      if (
                        sVbRowMultiCol.indexOf(aParentElement[0].ElementId) !==
                        -1
                      ) {
                        sRbMultiColumn = true;
                      }
                    }
                    oEl = this._addRadioButton(oCell, sRbMultiColumn);
                    break;
                  case "L":
                    /*Listbox*/
                    oEl = this._addListBox(oCell);
                    break;
                  case "C":
                    oEl = this._addCheckBox(oCell);
                    break;
                  case "T":
                    oEl = this._addCheckBox(oCell);
                    break;
                  case "M":
                    /*Multi input*/
                    oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    oEl = this._addTextAreaObjective(oCell);
                    break;
                }
                break;
            }
            oThis._addUIElement(oCell, "CellValue", oCell.ColumnIid, oEl);
            //oEl.addStyleClass("hapCellElement");
            if (oCell.LayoutType === "R") {
              oEl.setLayoutData(
                new sap.ui.layout.GridData({
                  span: "XL12 L12 M12 S12",
                })
              );
            }

            //Değerlendirme sütununda "i" icon tooltip
            var oBodyElement = _.find(aBodyElements, ["RowIid", oCell.RowIid]);
            if (
              oCell.ColumnIid ===
                oThis._getColumnIid(oCell.AppraisalId, "FAPP") &&
              oCell.CellValueAvailability === "X" &&
              oBodyElement.ForeignType !== "Q" &&
              oBodyElement.ForeignType !== "ZD"
            ) {
              //grid in overflow:hidden çözümü için
              oParent.getParent().getParent().addStyleClass("hapTooltipParent");
              var oTFB = new sap.m.FlexBox({
                direction: "Row",
                width: "100%",
              });
              oTFB.addItem(oEl);
              var oHTML = new sap.ui.core.HTML({
                content: "<span class='hapTooltipIcon'>&nbsp;</span>",
              });
              oTFB.addItem(oHTML);
              oHTML.attachBrowserEvent("click", function (e) {
                $(e.target)
                  .parent()
                  .next()
                  .children()
                  .css("visibility", "visible");
              });
              oHTML.attachBrowserEvent("mouseleave", function (e) {
                $(e.target)
                  .parent()
                  .next()
                  .children()
                  .css("visibility", "hidden");
              });
              oTFB.addItem(
                new sap.ui.core.HTML({
                  content:
                    "<span class='hapTooltipText'>Lütfen 5’li skalada bir değer giriniz. Gireceğiniz değer tam ya da ondalıklı olabilir</span>",
                })
              );
              oFB.addItem(oTFB);
            } else {
              oFB.addItem(oEl);
            }

            //oParent.addField(oEl);
          }

          if (
            oCell.CellNoteAvailability !== "H" &&
            oCell.LayoutType !== "M" &&
            oCell.LayoutType !== "J"
          ) {
            //Note label
            var sCellNoteEditablePath =
              "formDetailsModel>/bodyCells/" +
              oCell.AppraisalId +
              "/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/CellNoteAvailability";

            // var sCaptionNoteVisible = "{= ${formDetailsModel>/bodyCells/" + oCell.AppraisalId + "/" + oCell.RowIid + "/" + oCell.ColumnIid +
            // 	"/CaptionNote} === '' ? false : true }";

            // var oCNL = new sap.m.Label({
            // 	text: oCell.CaptionNote + ":",
            // 	visible: sCaptionNoteVisible,
            // 	required: true
            // });
            //oCNL.addStyleClass("hapElementCaption");
            //oThis._addUIElement(oCell, "CellNoteCaption", oCell.ColumnIid, oCNL);
            //oFBC.addItem(oCNL);

            var sRow = 5;
            if (
              oCell.ColumnIid === oThis._getColumnIid(oCell.AppraisalId, "OBJ0")
            ) {
              sRow = 3;
            }

            var oTA = new sap.m.TextArea({
              value:
                "{formDetailsModel>/bodyCells/" +
                oCell.AppraisalId +
                "/" +
                oCell.RowIid +
                "/" +
                oCell.ColumnIid +
                "/NoteString}",
              rows: sRow, //"{= parseInt(${formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid + "/NoteLines})}",
              width: "100%",
              editable: {
                path: sCellNoteEditablePath,
                formatter: function (sCellNoteAvailability) {
                  if (
                    sCellNoteAvailability === "X" ||
                    sCellNoteAvailability === "A"
                  ) {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
            }); //addStyleClass("hapTextArea");
            oThis._addUIElement(oCell, "CellNote", oCell.ColumnIid, oTA);
            //oTA.addStyleClass("hapCellElement");
            //oParent.addField(oTA);
            oFB.addItem(oTA);
          }
          oParent.addField(oFB);
        }
      }, //_addCellNew

      _addNewElementFreeFormCells: function (
        oParent,
        sAppraisalId,
        sNewRowIid,
        oEnhanceData
      ) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyElements = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );
        var oBodyCells = oViewModel.getProperty("/bodyCells/" + sAppraisalId);
        var aBodyElements = oEnhanceData.BodyElements.results;
        var aBodyCells = oEnhanceData.BodyCells.results;
        var aBodyColumns = oEnhanceData.BodyColumns.results;
        var oElem = _.find(aBodyElements, ["RowIid", sNewRowIid]);
        var oFiCell = _.find(aBodyCells, {
          RowIid: sNewRowIid,
          ColumnIid: oThis._getColumnIid(sAppraisalId, "OBJ0"),
        });
        var aNewCells = _.filter(aBodyCells, ["RowIid", sNewRowIid]);

        //first free input with its label
        var oFC = new sap.ui.layout.form.FormContainer();
        var oFE = null;

        if (oElem.FreeInput) {
          var sPlaceHolder = _.clone(
            oViewModel.getProperty(
              "/bodyCells/" +
                sAppraisalId +
                "/" +
                sNewRowIid +
                "/" +
                oThis._getColumnIid(sAppraisalId, "OBJ0") +
                "/Caption"
            )
          );

          oViewModel.setProperty(
            "/bodyElements/" + sAppraisalId + "/" + sNewRowIid + "/Name",
            ""
          );

          oFE = new sap.ui.layout.form.FormElement({
            label: oFiCell.Caption,
          });

          var oFI = new sap.m.Input({
            placeholder: '"' + sPlaceHolder + '" giriniz...',
            value:
              "{formDetailsModel>/bodyElements/" +
              sAppraisalId +
              "/" +
              sNewRowIid +
              "/Name}",
            maxLength: 80,
          });
          oFI.setLayoutData(
            new sap.ui.layout.GridData({
              span: "XL4 L4 M8 S12",
            })
          );
          oFE.addField(oFI);
          oFC.addFormElement(oFE);
          oParent.addFormContainer(oFC);
        }

        //now add cell
        $.each(aNewCells, function (sIndex, oCell) {
          var oColumn = _.find(aBodyColumns, ["ColumnIid", oCell.ColumnIid]);
          if (oColumn) {
            if (
              (oCell.CellValueAvailability !== "H" &&
                oCell.CellValueAvailability !== "K") ||
              oCell.CellNoteAvailability !== "H"
            ) {
              oThis._addNewElementFreeFormCell(oParent, sAppraisalId, oCell);
            }
          }
        });
      }, //_addNewElementFreeFormCells

      _addNewElementFreeFormCell: function (oParent, sAppraisalId, oCell) {
        var oThis = this;
        var sObjTeamColumnIid =
          this._getColumnIid(sAppraisalId, "ZTTJ") ||
          this._getColumnIid(sAppraisalId, "ZT00");

        if (
          oCell.RowIid !== "0000" &&
          oCell.ColumnIid !== "0000" &&
          oCell.ColumnIid !== sObjTeamColumnIid
        ) {
          //Column label
          var oFC = new sap.ui.layout.form.FormContainer();
          var oFE = null;

          if (
            oCell.CellValueAvailability !== "H" &&
            oCell.CellValueAvailability !== "K"
          ) {
            oFE = new sap.ui.layout.form.FormElement({
              label: oCell.Caption,
            });
            oFC.addFormElement(oFE);
            oParent.addFormContainer(oFC);

            switch (oCell.ValueType) {
              case "N":
                switch (oCell.LayoutType) {
                  case "M":
                    /*Multi input*/
                    var oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    var oEl = this._addTextAreaObjective(oCell);
                    break;
                  default:
                    var oEl = this._addInputField(oCell, "ValueNum");
                }
                break;
              case "D":
                var oEl = this._addDateField(oCell);
                break;
              case "S":
                /*String*/
                switch (oCell.LayoutType) {
                  case "S":
                    /*String*/
                    var oEl = this._addInputField(oCell, "ValueString");
                    break;
                  case "R":
                    /*Radiobutton*/
                    var oEl = this._addRadioButton(oCell, false);
                    break;
                  case "L":
                    /*Listbox*/
                    var oEl = this._addListBox(oCell);
                    break;
                  case "C":
                    var oEl = this._addCheckBox(oCell);
                    break;
                  case "T":
                    var oEl = this._addInputField(oCell, "ValueNum");
                    break;
                  case "M":
                    /*Multi input*/
                    var oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    var oEl = this._addTextAreaObjective(oCell);
                    break;
                }
                break;
            }
            oThis._addUIElement(oCell, "CellValue", oCell.ColumnIid, oEl);
            //oEl.addStyleClass("hapCellElement");
            oEl.setLayoutData(
              new sap.ui.layout.GridData({
                span: "XL4 L4 M8 S12",
              })
            );
            //oParent.addContent(oEl);
            oFE.addField(oEl);
          }

          if (
            oCell.CellNoteAvailability !== "H" &&
            oCell.LayoutType !== "M" &&
            oCell.LayoutType !== "J"
          ) {
            var sCellNoteEditablePath =
              "formDetailsModel>/bodyCells/" +
              oCell.AppraisalId +
              "/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/CellNoteAvailability";

            //Note label
            oFE = null;
            oFE = new sap.ui.layout.form.FormElement({
              label: oCell.CaptionNote,
            });
            oFC.addFormElement(oFE);
            oParent.addFormContainer(oFC);

            var oTA = new sap.m.TextArea({
              value:
                "{formDetailsModel>/bodyCells/" +
                oCell.AppraisalId +
                "/" +
                oCell.RowIid +
                "/" +
                oCell.ColumnIid +
                "/NoteString}",
              cols: 50,
              rows: 5,
              editable: {
                path: sCellNoteEditablePath,
                formatter: function (sCellNoteAvailability) {
                  if (
                    sCellNoteAvailability === "X" ||
                    sCellNoteAvailability === "A"
                  ) {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
            });
            oTA.setLayoutData(
              new sap.ui.layout.GridData({
                span: "XL4 L4 M8 S12",
              })
            );
            oThis._addUIElement(oCell, "CellNote", oCell.ColumnIid, oTA);
            //oParent.addContent(oTA);
            oFE.addField(oTA);
          }
        }
      }, //_addNewElementFreeFormCellNew

      _addInputField: function (oCell, sBindingField) {
        var sCell =
          "formDetailsModel>/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid;
        var sCellPath = sCell + "/";
        var sEditablePath = sCell + "/CellValueAvailability";
        var sColumnIid = sCell + "/ColumnIid";
        var oThis = this;
        var oIF = new sap.m.Input({
          value: {
            path:
              "formDetailsModel>/bodyCells/" +
              oCell.AppraisalId +
              "/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/" +
              sBindingField,
          },
          textAlign: "Left",
          submit: this._onInputFieldValueChange,
          editable: {
            parts: [
              {
                path: sEditablePath,
              },
              {
                path: sCellPath,
              },
            ],
            formatter: oThis._getCellEditable.bind(oThis),
          },
          width: {
            path: sColumnIid,
            formatter: function (sColIid) {
              if (sColIid === oThis._getColumnIid(oCell.AppraisalId, "FWGT")) {
                return "50px";
              } else {
                return "100%";
              }
            },
          },
        }); //.addStyleClass("hapInputField");

        return oIF;
      },
      _addDateField: function (oCell) {
        var sCell =
          "formDetailsModel>/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid;
        var sCellPath = sCell + "/";
        var sEditablePath = sCell + "/CellValueAvailability";
        var oThis = this;

        var oDF = new sap.m.DatePicker({
          value: {
            path:
              "formDetailsModel>/bodyCells/" +
              oCell.AppraisalId +
              "/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/ValueDate",
            type: "sap.ui.model.type.Date",
            formatOptions: {
              UTC: true,
              pattern: "dd.MM.yyyy",
            },
          },
          valueFormat: "yyyy-MM-dd",
          displayFormat: "dd.MM.yyyy",
          editable: {
            parts: [
              {
                path: sEditablePath,
              },
              {
                path: sCellPath,
              },
            ],
            formatter: oThis._getCellEditable.bind(oThis),
          },
          placeholder: "Tarih seçiniz",
        }); //.addStyleClass("hapDateField");
        return oDF;
      },

      _getCellEditable: function (sCellValueAvailability, oCell) {
        try {
          var oViewModel = this.getModel("formDetailsModel");
          var oBodyCells = oViewModel.getProperty(
            "/bodyCells/" + oCell.AppraisalId + "/" + oCell.RowIid
          );
          var sEduSel = true;
          var sEduColumnIid = this._getColumnIid(oCell.AppraisalId, "ZSEC");
          if (
            oCell.ColumnIid !== sEduColumnIid &&
            oBodyCells.hasOwnProperty(sEduColumnIid)
          ) {
            sEduSel = false;
            var oEduCell = oBodyCells[sEduColumnIid];
            if (
              oEduCell.ValueNum === "1" ||
              oEduCell.ValueNum == 1 ||
              oEduCell.ValueNum === "0001"
            ) {
              sEduSel = true;
            }
          }

          if (
            (sCellValueAvailability === "X" ||
              sCellValueAvailability === "R") &&
            sEduSel
          ) {
            return true;
          } else {
            return false;
          }
        } catch (oEx) {
          return false;
        }
      },

      _addCheckBox: function (oCell) {
        var oThis = this;
        var sCell =
          "formDetailsModel>/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid;
        var sChkBox = sCell + "/ChkboxValueText";
        var sCellValue =
          "/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/";
        var sEditablePath = sCell + "/CellValueAvailability";
        var sCellPath = sCell + "/";
        var sStateBinding =
          "{= ${formDetailsModel>/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ValueString} === '0001' ? true : false }";

        var oCB = new sap.m.Switch({
          state: sStateBinding,
          enabled: {
            parts: [
              {
                path: sEditablePath,
              },
              {
                path: sCellPath,
              },
            ],
            formatter: oThis._getCellEditable.bind(oThis),
          },
          // formatter: function(sCellValueAvailability) {
          // 	if (sCellValueAvailability === "X" || sCellValueAvailability === "R") {
          // 		return true;
          // 	} else {
          // 		return false;
          // 	}
          // }
          //},
          type: "AcceptReject",
          change: oThis._onSwitchValueChanged.bind(oThis),
        }).addStyleClass("hapCheckBox");

        if (
          oCell.ColumnIid === oThis._getColumnIid(oCell.AppraisalId, "ZTT7")
        ) {
          oCB.attachBrowserEvent("mouseover", function () {
            jQuery.sap.delayedCall(500, oThis, oThis._openValDescInfo, [this]);
          });

          oCB.attachBrowserEvent("mouseout", function () {
            oThis._closeValDescInfo(this);
          });
        }

        //Binding reference for value set
        oCB.data("bindingReference", sCellValue);
        oCB.data("elementRowIid", oCell.RowIid);
        oCB.data("elementColumnIid", oCell.ColumnIid);
        oCB.data("appraisalId", oCell.AppraisalId);

        return oCB;
      },
      _openValDescInfo: function (oSource) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");
        var sRowIid = oSource.data("elementRowIid");
        var sColumnIid = oSource.data("elementColumnIid");
        var sAppraisalId = oSource.data("appraisalId");
        var aCellValues = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyCellValues"
        );
        var aValueDesc = [];

        if (
          sRowIid === this._currentRowIid &&
          sColumnIid === this._currentColumnIid
        ) {
          return;
        }

        this._currentRowIid = sRowIid;
        this._currentColumnIid = sColumnIid;

        $.each(aCellValues, function (sKey, oCellValue) {
          if (
            oCellValue.RowIid === sRowIid &&
            oCellValue.ColumnIid === sColumnIid
          ) {
            aValueDesc.push(oCellValue);
          }
        });

        oViewModel.setProperty("/currentCellValueDescription", aValueDesc);

        if (aValueDesc.length > 0) {
          if (!oThis._oValDescPopover) {
            oThis._oValDescPopover = sap.ui.xmlfragment(
              "hcm.ux.hapv3.fragment.ValueDescription",
              this
            );
            // connect dialog to view (models, lifecycle)
            oThis.getView().addDependent(oThis._oValDescPopover);
          } else {
            oThis._oValDescPopover.close();
          }
          oThis._oValDescPopover.openBy(oSource);
        }
      },
      _closeValDescInfo: function (oSource) {
        if (this._oValDescPopover) {
          this._currentRowIid = "0000";
          this._currentColumnIid = "0000";
          this._oValDescPopover.close();
        }
      },
      _addRadioButton: function (oCell, sCol) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");

        var oFormParameters = oViewModel.getProperty(
          "/formParameters/" + oCell.AppraisalId
        );

        var sCell =
          "formDetailsModel>/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid;
        var sCellValue =
          "/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ValueString";

        var sEditablePath = sCell + "/CellValueAvailability";
        var sCellValueString = sCell + "/ValueString";
        var sCellValuesPath =
          "/bodyCellValues/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValues";

        var aCellValues = oViewModel.getProperty(sCellValuesPath);
        var sColumns = 1;
        var sWidth;
        if (sCol) {
          sColumns = aCellValues.length;
          sWidth = oFormParameters["UX_RADIO_MULTI_COL_WIDTH"];
        }
        /*First create the radio button group*/
        var oRBG = new sap.m.RadioButtonGroup({
          selectedKey: "-1",
          columns: sColumns,
          editable: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
          valueState: {
            path: sCellValueString,
            formatter: function (sCellValue) {
              if (
                sCellValue !== "0000" &&
                sCellValue !== null &&
                sCellValue !== undefined &&
                sCellValue !== ""
              ) {
                return sap.ui.core.ValueState.Success;
              } else {
                return sap.ui.core.ValueState.Error;
              }
            },
          },
          select: oThis._onRadioButtonSelected.bind(oThis),
        }).addStyleClass("hapRadioButtonGroup");

        var sCellValuePath = "formDetailsModel>" + sCellValue;

        var sTooltip = "{" + sCellValuePath + "}";
        var sSelectedClause =
          "{= ${formDetailsModel>ValueIid} === ${" +
          sCellValuePath +
          "}? true : false" +
          "}";

        /*Template radio button*/
        var oRB = new sap.m.RadioButton({
          selected: sSelectedClause,
          text: "{path:'formDetailsModel>Description', templateShareable:false}",
          width: sWidth,
          //select: oThis._onRadioButtonValueSelected.bind(oThis)
        }).addStyleClass("hapRadioButtonText");

        /*Add custom data 1 for binding*/
        oRB.data("bindingReference", sCellValue);

        /*Add custom data 2 for binding*/
        var oBindingValue = new sap.ui.core.CustomData({
          key: "bindingValue",
          value: "{formDetailsModel>ValueIid}",
          //value: "{formDetailsModel>ValueIid}"
        });
        oRB.addCustomData(oBindingValue);

        /*Attach template to RBG*/
        oRBG.bindAggregation("buttons", {
          path: "formDetailsModel>" + sCellValuesPath,
          templateShareable: false,
          template: oRB,
        });
        return oRBG;
      },
      _onMultiInputSelected: function (oEvent) {
        var oSource = oEvent.getSource();
        var oViewModel = this.getModel("formDetailsModel");
        var sCellValuePath = oSource.data("bindingReference");
        var sRowIid = oSource.data("elementRowIid");
        var sColumnIid = oSource.data("elementColumnIid");
        var aValue = [];
        var sCellValue = "";

        var oSelectedItems = oSource.getSelectedItems();

        $.each(oSelectedItems, function (i, oItem) {
          aValue.push({
            Objid: oItem.getKey(),
            Stext: oItem.getText(),
          });
        });
        if (aValue.length > 0) {
          sCellValue = JSON.stringify(aValue);
        }

        oViewModel.setProperty(sCellValuePath, sCellValue);
      },
      _addMultiInput: function (oCell) {
        var sEditablePath =
          "formDetailsModel>/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValueAvailability";
        var sCellValuePath =
          "/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/NoteString";
        var oViewModel = this.getModel("formDetailsModel");
        var sCellValue = oViewModel.getProperty(sCellValuePath);
        var aSel = [];
        var oThis = this;

        if (
          sCellValue !== "" &&
          sCellValue !== null &&
          sCellValue !== undefined
        ) {
          try {
            var oToken = JSON.parse(sCellValue);
            $.each(oToken, function (i, oComp) {
              aSel.push(oComp.Objid);
            });
          } catch (oErr) {
            jQuery.sap.log.error(oErr);
          }
        }

        var oMC = new sap.m.MultiComboBox({
          selectionChange: oThis._onMultiInputSelected.bind(oThis),
          enabled: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
        }).addStyleClass("hapMultiComboBox");

        var oItem = new sap.ui.core.Item({
          key: "{formDetailsModel>Objid}",
          text: "{formDetailsModel>Stext}",
        });

        /*Attach template to RBG*/
        oMC.bindAggregation("items", {
          path:
            "formDetailsModel>/formData/" + oCell.AppraisalId + "/Competencies",
          template: oItem,
        });

        oMC.data("bindingReference", sCellValuePath);
        oMC.data("elementRowIid", oCell.RowIid);
        oMC.data("elementColumnIid", oCell.ColumnIid);
        oMC.data("appraisalId", oCell.AppraisalId);

        if (aSel.length > 0) {
          oMC.setSelectedKeys(aSel);
        }
        return oMC;
      },

      _addTextAreaObjective: function (oCell) {
        var sCellValuePath =
          "formDetailsModel>/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/NoteString";
        var oViewModel = this.getModel("formDetailsModel");

        var oTAObj = new sap.m.TextArea({
          value: {
            path: sCellValuePath,
            formatter: function (sValue) {
              var sObjectiveText;
              var oObjectives = oViewModel.getProperty(
                "/formData/" + oCell.AppraisalId + "/Objectives"
              );
              $.each(oObjectives, function (i, oObjective) {
                if (oObjective.Objid === sValue) {
                  sObjectiveText = oObjective.Description;
                  return false;
                }
              });
              return sObjectiveText;
            },
          },
          width: "100%",
          rows: 3,
          editable: false,
        }); //.addStyleClass("hapTextArea");

        return oTAObj;
      },

      _addListBox: function (oCell) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");
        var sEditablePath =
          "formDetailsModel>/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValueAvailability";
        var sColumnIid =
          "formDetailsModel>/bodyCells/" +
          oCell.AppraisalId +
          "/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ColumnIid";

        var oLB = new sap.m.Select({
          selectedKey:
            "{formDetailsModel>/bodyCells/" +
            oCell.AppraisalId +
            "/" +
            oCell.RowIid +
            "/" +
            oCell.ColumnIid +
            "/ValueString}",
          autoAdjustWidth: false,
          enabled: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
          change: function (oEvent) {
            var sRowId = oEvent.getSource().data("RowIid");
            var sColumnId = oEvent.getSource().data("ColumnIid");
            var aBodyCells = oViewModel.getProperty(
              "/formData/" + oCell.AppraisalId + "/BodyCells"
            );
            var oLine = _.find(aBodyCells, {
              RowIid: sRowId,
              ColumnIid: sColumnId,
            });
            oLine.ValueNum = "0";
            oLine.ValueText = "";
            oLine.ValueTxt = "";
            oViewModel.setProperty(
              "/formData" + oCell.AppraisalId + "/BodyCells",
              aBodyCells
            );
          },
          width: "100%",
        }); //.addStyleClass("hapListBox");

        //Listbox change event ile formData->BodyCells içinde value_num, value_text gibi alanları temizlemek için
        // row ve column id leri custom data da tut
        var oRowIid = new sap.ui.core.CustomData({
          key: "RowIid",
          value: oCell.RowIid,
          writeToDom: true,
        });
        var oAppraisalIid = new sap.ui.core.CustomData({
          key: "AppraisalId",
          value: oCell.AppraisalId,
          writeToDom: true,
        });
        oLB.addCustomData(oRowIid);
        oLB.addCustomData(oAppraisalIid);

        var oColumnIid = new sap.ui.core.CustomData({
          key: "ColumnIid",
          value: oCell.ColumnIid,
          writeToDom: true,
        });
        oLB.addCustomData(oColumnIid);

        var oItem = new sap.ui.core.Item({
          key: "{formDetailsModel>ValueIid}",
          text: "{formDetailsModel>ValueText}",
        });

        /*Attach template to RBG*/
        oLB.bindAggregation("items", {
          path:
            "formDetailsModel>/bodyCellValues/" +
            oCell.AppraisalId +
            "/" +
            oCell.RowIid +
            "/" +
            oCell.ColumnIid +
            "/CellValues",
          template: oItem,
        });
        return oLB;
      },

      _adjustButtonsNew: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var sDevPlanAppraisalId = oViewModel.getProperty("/devPlanAppraisalId");
        var aHapButtons = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/Buttons"
        );
        var aFooterButtons = [];
        var aIntros = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/Intros"
        );
        var oThis = this;

        if (aIntros && aIntros.length > 0) {
          aFooterButtons.push({
            Id: "SHOW_INTRO",
            Text: "Yardım",
            Availability: "",
            StatusRelevant: false,
          });
        }

        $.each(aHapButtons, function (sIndex, oHapButton) {
          var oHapButtonLocal = oThis._cloneObject(oHapButton);
          oHapButtonLocal.TargetSection = null;
          oHapButtonLocal.AppraisalId = sAppraisalId;
          aFooterButtons.push(oHapButtonLocal);
        });

        if (sDevPlanAppraisalId === sAppraisalId) {
          aFooterButtons.push({
            Id: "START_DEV_PLAN",
            Text: "Gelişim Planlaması",
            Availability: "",
            StatusRelevant: false,
          });
        }

        oViewModel.setProperty(
          "/footerButtons/" + sAppraisalId,
          aFooterButtons
        );
      },
      _onInputFieldValueChange: function (oEvent) {},
      _onSwitchValueChanged: function (oEvent) {
        var oSource = oEvent.getSource();
        var oViewModel = this.getModel("formDetailsModel");
        var sRowIid = oSource.data("elementRowIid");
        var sAppraisalId = oSource.data("appraisalId");
        var sColumnIid = oSource.data("elementColumnIid");
        var sSurveyExists = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId + "/" + sRowIid + "/FormExist"
        );
        var sState = oEvent.getParameter("state");
        var sSurveyColumn = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId + "/" + sRowIid + "/FormColumnIid"
        );
        var oThis = this;
        var sFormId = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId + "/" + sRowIid + "/FormId"
        );

        var sBindingReference = oSource.data("bindingReference");
        var sEduColumnIid = this._getColumnIid(sAppraisalId, "ZSEC");

        if (!sState && sSurveyExists && sSurveyColumn === sColumnIid) {
          this._handleResetSurvey(sRowIid, sFormId, sBindingReference);
        }

        /* Bireysel gelişim seçilmiş daha önce seçilmemiş olmalı*/
        if (sState && sColumnIid === sEduColumnIid) {
          var sCont = this._checkTrainingSelection(
            sAppraisalId,
            sRowIid,
            sBindingReference
          );

          if (!sCont) {
            return;
          }
        }

        /* Seçim geri alındı */
        if (!sState && sColumnIid === sEduColumnIid) {
          //var aFormUIElements = oViewModel.getProperty("/formUIElements");
          $.each(oThis._aFormUIElements, function (sIndex, oFormUIElement) {
            if (
              oFormUIElement.ColumnIid !== null &&
              oFormUIElement.RowIid === sRowIid &&
              oFormUIElement.ColumnIid !== sEduColumnIid &&
              oFormUIElement.UIType === "CellValue"
            ) {
              try {
                var sValuePath =
                  oFormUIElement.UIElement.data("bindingReference");

                oViewModel.setProperty(sValuePath + "ValueString", "0000");
                oViewModel.setProperty(sValuePath + "ValueNum", "0");
                oViewModel.setProperty(sValuePath + "ValueTxt", "0");
                oViewModel.setProperty(sValuePath + "ValueNnv", "");
              } catch (oErr) {
                jQuery.sap.log.error(oErr);
              }
            }
          });
        }

        oViewModel.setProperty(
          sBindingReference + "ValueString",
          sState ? "0001" : "0000"
        );
        oViewModel.setProperty(
          sBindingReference + "ValueNum",
          sState ? "1" : "0"
        );
        oViewModel.setProperty(
          sBindingReference + "ValueTxt",
          sState ? "1" : "0"
        );

        /*Update bindings to reflect changes*/
        oViewModel.refresh(true);

        if (sState && sSurveyExists && sSurveyColumn === sColumnIid) {
          this._handleCallSurvey(sAppraisalId, sRowIid, sFormId, false);
        }
      },

      _checkTrainingSelection: function (
        sAppraisalId,
        sRowIid,
        sBindingReference
      ) {
        var oViewModel = this.getModel("formDetailsModel");
        //var aUIElements = oViewModel.getProperty("/formUIElements");
        var aBodyCells = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyCells"
        );
        var oThis = this;
        var sCount = 0;
        var sEduColumnIid = this._getColumnIid(sAppraisalId, "ZSEC");

        var _getUIElement = function () {
          for (var i = 0; i < oThis._aFormUIElements.length; i++) {
            if (
              oThis._aFormUIElements[i].RowIid === sRowIid &&
              oThis._aFormUIElements[i].ColumnIid === sEduColumnIid &&
              oThis._aFormUIElements[i].UIType === "CellValue"
            ) {
              return oThis._aFormUIElements[i].UIElement;
            }
          }
        };

        $.each(aBodyCells, function (sIndex, oCell) {
          if (oCell.RowIid !== sRowIid && oCell.ColumnIid === sEduColumnIid) {
            if (
              oCell.ValueNum === "1" ||
              oCell.ValueNum == 1 ||
              oCell.ValueNum === "0001"
            ) {
              sCount++;
            }
          }
        });

        if (sCount >= 1) {
          MessageBox.warning(
            this.getResourceBundle().getText("maxSelectionsReached", [1])
          );
          oViewModel.setProperty(sBindingReference + "ValueString", "0000");
          oViewModel.setProperty(sBindingReference + "ValueNum", "0");
          oViewModel.setProperty(sBindingReference + "ValueTxt", "0");
          var oUIElement = _getUIElement();
          if (typeof oUIElement.setState === "function") {
            oUIElement.setState(false);
          }
          return false;
        } else {
          return true;
        }
      },
      _handleResetSurvey: function (sRowIid, sFormId, sBindingReference) {
        var oViewModel = this.getModel("formDetailsModel");
        var sSurveyPath = "/elementSurveys/" + sRowIid + "/" + sFormId;
        var oElementSurvey = oViewModel.getProperty(sSurveyPath);
        var sSurveyName = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/FormName"
        );

        var oVL = new sap.ui.layout.VerticalLayout();
        oVL.addStyleClass("hapSurveyLayout");
        var oThis = this;

        var _doResetSurvey = function (oEvent) {
          $.each(oElementSurvey, function (i, oSurvey) {
            oSurvey.Question.Anstx = "";
            oSurvey.Question.Ansid = "0000";
          });

          oViewModel.setProperty(sSurveyPath, oElementSurvey);
          oThis.confirmDialog.close();
          MessageToast.show(oThis.getResourceBundle().getText("surveyIsReset"));
        };

        var _cancelResetSurvey = function (oEvent) {
          oViewModel.setProperty(sBindingReference + "ValueString", "0001");
          oViewModel.setProperty(sBindingReference + "ValueNum", "1");
          oViewModel.setProperty(sBindingReference + "ValueTxt", "1");
          MessageToast.show(
            oThis.getResourceBundle().getText("surveyResetCancelled")
          );
          oThis.confirmDialog.close();
        };

        this._generateConfirmDialog(
          "surveyResetConfirm",
          "surveyResetQuestion",
          [sSurveyName],
          "surveyDoReset",
          "Accept",
          "sap-icon://open-command-field",
          _doResetSurvey,
          "Warning",
          "surveyCancelReset",
          "Reject",
          "sap-icon://reset",
          _cancelResetSurvey
        );
      },
      _handleCallSurvey: function (
        sAppraisalId,
        sRowIid,
        sFormId,
        sCloseButtonVisible
      ) {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty(
          "/surveyCloseButtonVisible",
          sCloseButtonVisible
        );
        // create dialog lazily
        if (!this._oSurveyDialog) {
          // create dialog via fragment factory
          this._oSurveyDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.ElementSurvey",
            this
          );
          this._oSurveyDialog.setEscapeHandler(this.onEscapeDialog);
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oSurveyDialog);
        }

        this._generateSurvey(sAppraisalId, sRowIid, sFormId);
        this._oSurveyDialog.data("appraisalId", sAppraisalId);
        this._oSurveyDialog.data("elementRowIid", sRowIid);
        this._oSurveyDialog.data("elementFormId", sFormId);

        this._oSurveyDialog.open();
      },
      onEscapeDialog: function (oPromise) {
        oPromise.reject();
      },
      _generateSurvey: function (sAppraisalId, sRowIid, sFormId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oElem = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId + "/" + sRowIid
        );
        var oElementSurvey = oViewModel.getProperty(
          "/elementSurveys/" + sAppraisalId + "/" + sRowIid + "/" + sFormId
        );
        var sSurveyPath =
          "/elementSurveys/" + sAppraisalId + "/" + sRowIid + "/" + sFormId;
        var oVL = new sap.ui.layout.VerticalLayout().addStyleClass(
          "hapSurveyLayout"
        );
        var aUIElements = [];
        var sValueAvailability =
          "${formDetailsModel>/bodyCells/" +
          sAppraisalId +
          "/" +
          oElem.RowIid +
          "/" +
          oElem.FormColumnIid +
          "/CellValueAvailability}";
        var sElementsEnabled =
          "{formDetailsModel>/bodyElements/" +
          sAppraisalId +
          "/" +
          oElem.RowIid +
          "/FormEditable}";

        oViewModel.setProperty("/surveyUIElements", []);

        var _radioButtonSelected = function (oEvent) {
          var oSource = oEvent.getSource();
          var sQpath = oSource.data("Qpath");
          var sAnsid = oSource.data("Ansid");
          var sAnstx = oSource.data("Anstx");
          oViewModel.setProperty(sQpath + "/Ansid", sAnsid);
          oViewModel.setProperty(sQpath + "/Anstx", sAnstx);
          var oQuestion = oViewModel.getProperty(
            sSurveyPath + "/" + oSource.data("Queid")
          );

          for (var i = 0; i < oQuestion.Answers.length; i++) {
            if (
              oQuestion.Answers[i].Ansid !== sAnsid &&
              oQuestion.Answers[i].Qusid !== "000"
            ) {
              var sAnstxPath =
                sSurveyPath +
                "/" +
                oQuestion.Answers[i].Qusid +
                "/Question/Anstx";
              oViewModel.setProperty(sAnstxPath, "");
            }
          }
        };

        /*Objects are not sorted*/
        var aQuepr = [];
        $.each(oElementSurvey, function (sIndex, oSurveyLine) {
          //If primary question
          if (oSurveyLine.Question.Quepr) {
            aQuepr.push(oSurveyLine.Question.Queid);
          }
        });

        /*Questions are sorted*/
        aQuepr.sort();

        /*Generate survey using primary questions*/
        var sQuein = 0;
        $.each(aQuepr, function (sIndex, sQueid) {
          var oSurveyLine = oElementSurvey[sQueid];
          sQuein++;

          var sQuePath =
            sSurveyPath + "/" + oSurveyLine.Question.Queid + "/Question";
          var oQueMainVL = new sap.ui.layout.VerticalLayout({
            width: "100%",
          }).addStyleClass("hapSurveyQuestionMainLayout");

          oVL.addContent(oQueMainVL);

          var oQueVL = new sap.ui.layout.VerticalLayout().addStyleClass(
            "hapSurveyQuestionLayout"
          );
          oQueMainVL.addContent(oQueVL);

          var oQueText = new sap.m.Text({
            text: sQuein + " - " + oSurveyLine.Question.Quetx,
          }).addStyleClass("hapSurveyQuestionText");
          oQueVL.addContent(oQueText);

          var oAnsVL = new sap.ui.layout.VerticalLayout().addStyleClass(
            "hapSurveyAnswerLayout"
          );
          if (oSurveyLine.Answers.length > 0) {
            $.each(oSurveyLine.Answers, function (sIndex, oAnswer) {
              var oAnsRBVL = new sap.ui.layout.VerticalLayout();
              var oAnsRB = new sap.m.RadioButton({
                groupName:
                  "group_" + sRowIid + "_" + oSurveyLine.Question.Queid,
                text: oAnswer.Anstx,
                select: _radioButtonSelected,
                selected:
                  "{= ${formDetailsModel>" +
                  sQuePath +
                  "/Ansid} === '" +
                  oAnswer.Ansid +
                  "' ? true : false}",
                enabled: sElementsEnabled,
              });

              aUIElements.push({
                Queid: sQueid,
                ElementType: "RadioButtonAnsid",
                UIElement: oAnsRB,
              });

              /*Set custom data*/
              oAnsRB.data("AppraisalId", sAppraisalId);
              oAnsRB.data("Rowid", sRowIid);
              oAnsRB.data("Queid", oSurveyLine.Question.Queid);
              oAnsRB.data("Ansid", oAnswer.Ansid);
              oAnsRB.data("Anstx", oAnswer.Anstx);
              oAnsRB.data("Qusid", null);
              oAnsRB.data("Qpath", sQuePath);
              oAnsRB.data("Qusvl", null);

              oAnsRBVL.addContent(oAnsRB);
              oAnsVL.addContent(oAnsRBVL);
              if (oElementSurvey.hasOwnProperty(oAnswer.Qusid)) {
                oAnsRB.data("Qusid", oAnswer.Qusid);
                var o2ndQue = oElementSurvey[oAnswer.Qusid];
                var sVLId = "id2ndQueMainVL_" + sRowIid + "_" + oAnswer.Queid;
                var o2ndQueMainVL = new sap.ui.layout.VerticalLayout(sVLId, {
                  visible:
                    "{= ${formDetailsModel>" +
                    sQuePath +
                    "/Ansid} === '" +
                    oAnswer.Ansid +
                    "' ? true : false}",
                }).addStyleClass("hapSurvey2ndQuestionMainLayout");
                if (oSurveyLine.Question.Ansid !== oAnswer.Ansid) {
                  o2ndQueMainVL.setVisible(false);
                }
                var o2ndQueVL = new sap.ui.layout.VerticalLayout();
                var o2ndQueText = new sap.m.Text({
                  text: o2ndQue.Question.Quetx,
                }).addStyleClass("hapSurveyQuestionText");
                o2ndQueVL.addContent(o2ndQueText);
                o2ndQueMainVL.addContent(o2ndQueVL);

                var o2ndAnsVL = new sap.ui.layout.VerticalLayout({
                  width: "100%",
                });

                var oAnsTA = new sap.m.TextArea({
                  value:
                    "{formDetailsModel>" +
                    sSurveyPath +
                    "/" +
                    oAnswer.Qusid +
                    "/Question/Anstx}",
                  width: "95%",
                  editable: sElementsEnabled,
                });

                aUIElements.push({
                  Queid: oAnswer.Qusid,
                  ElementType: "TextAreaAnstx",
                  UIElement: oAnsTA,
                });

                o2ndAnsVL.addContent(oAnsTA);
                o2ndQueMainVL.addContent(o2ndAnsVL);
                oAnsVL.addContent(o2ndQueMainVL);
              }
            });
          } else {
            var oAnsTA = new sap.m.TextArea({
              value:
                "{formDetailsModel>" +
                sSurveyPath +
                "/" +
                oSurveyLine.Question.Queid +
                "/Question/Anstx}",
              width: "100%",
              editable: sElementsEnabled,
            });
            aUIElements.push({
              Queid: oSurveyLine.Question.Queid,
              ElementType: "TextAreaAnstx",
              UIElement: oAnsTA,
            });
            oAnsVL.addContent(oAnsTA);
          }
          oQueMainVL.addContent(oAnsVL);
        });

        oViewModel.setProperty("/surveyUIElements", aUIElements);

        this._oSurveyDialog.setTitle(
          oViewModel.getProperty(
            "/bodyElements/" + sAppraisalId + "/" + sRowIid + "/Name"
          ) +
            " - " +
            oViewModel.getProperty(
              "/bodyElements/" + sAppraisalId + "/" + sRowIid + "/FormName"
            )
        );

        this._oSurveyDialog.addContent(oVL);
      },
      onSurveyClose: function () {
        this._oSurveyDialog.close();
        this._oSurveyDialog.destroyContent();
      },
      onSurveyFinished: function () {
        var sAppraisalId = this._oSurveyDialog.data("appraisalId");
        var sRowIid = this._oSurveyDialog.data("elementRowIid");
        var sFormId = this._oSurveyDialog.data("elementFormId");

        var sSurveyIncompleted = this._checkSurveyHasFinished(
          sAppraisalId,
          sRowIid,
          sFormId
        );
        if (sSurveyIncompleted) {
          MessageBox.warning(
            this.getResourceBundle().getText("allQuestionsMustBeFilled")
          );
          return false;
        }
        this._oSurveyDialog.close();
        this._oSurveyDialog.destroyContent();
      },
      _checkSurveyHasFinished: function (sAppraisalId, sRowIid, sFormId) {
        var oViewModel = this.getModel("formDetailsModel");
        var sSurveyPath =
          "/elementSurveys/" + sAppraisalId + "/" + sRowIid + "/" + sFormId;
        var oElementSurvey = oViewModel.getProperty(sSurveyPath);
        var sSurveyIncompleted = false;
        var aSurveyUIElements = oViewModel.getProperty("/surveyUIElements");
        var sEditable = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId + "/" + sRowIid + "/FormEditable"
        );
        var oThis = this;

        if (!sEditable) {
          /*If survey is not editable DO NOT CHECK completeness*/
          return false;
        }

        var _setMessageState = function (sQueid, sElementType, sError) {
          var sMessageType = sError ? "Error" : "Success";
          var sMessageText = sError
            ? oThis.getResourceBundle().getText("fillSurveyFields")
            : "";
          for (var i = 0; i < aSurveyUIElements.length; i++) {
            var oLine = aSurveyUIElements[i];
            if (oLine.Queid === sQueid && oLine.ElementType === sElementType) {
              oLine.UIElement.setValueState(sMessageType);
              if (typeof oLine.UIElement.setValueStateText === "function") {
                oLine.UIElement.setValueStateText(sMessageText);
              }
            }
          }
        };

        $.each(oElementSurvey, function (sIndex, oSurveyLine) {
          if (oSurveyLine.Question.Quepr) {
            var sQuePath =
              sSurveyPath + "/" + oSurveyLine.Question.Queid + "/Question";
            if (oSurveyLine.Answers.length > 0) {
              if (
                oSurveyLine.Question.Ansid === "" ||
                oSurveyLine.Question.Ansid === "0000"
              ) {
                sSurveyIncompleted = true;
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "RadioButtonAnsid",
                  true
                );
              } else {
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "RadioButtonAnsid",
                  false
                );
                $.each(oSurveyLine.Answers, function (i, oAnswer) {
                  if (
                    oSurveyLine.Question.Ansid === oAnswer.Ansid &&
                    oAnswer.Qusid !== "000"
                  ) {
                    if (oElementSurvey[oAnswer.Qusid].Question.Anstx === "") {
                      sSurveyIncompleted = true;
                      _setMessageState(oAnswer.Qusid, "TextAreaAnstx", true);
                    } else {
                      _setMessageState(oAnswer.Qusid, "TextAreaAnstx", false);
                    }
                    return false;
                  }
                });
              }
            } else {
              if (oSurveyLine.Question.Anstx === "") {
                sSurveyIncompleted = true;
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "TextAreaAnstx",
                  true
                );
              } else {
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "TextAreaAnstx",
                  false
                );
              }
            }
          }
        });

        return sSurveyIncompleted;
      },
      _onRadioButtonValueSelected: function (oEvent) {
        var oSource = oEvent.getSource();
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty(
          oSource.data("bindingReference"),
          oSource.data("bindingValue")
        );
      },

      //yukarıdaki yöntem ile selectedvalue doğru alınamadığı için aşağıdaki gibi rbgroup a select event yazıldı
      _onRadioButtonSelected: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var idx = oEvent.getParameter("selectedIndex");
        oViewModel.setProperty(
          oEvent.getSource().getButtons()[idx].data("bindingReference"),
          oEvent.getSource().getButtons()[idx].data("bindingValue")
        );
      },
      _formBodyElementsObject: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var sPath = "/formData/" + sAppraisalId + "/BodyElements";
        var aBodyElements = oViewModel.getProperty(sPath);
        var oBodyElements = {};

        $.each(aBodyElements, function (sIndex, oElement) {
          var oBodyElement = {};

          oBodyElement[oElement.RowIid] = oElement;
          if (typeof Object.assign === "function") {
            Object.assign(oBodyElements, oBodyElement);
          } else {
            $.extend(oBodyElements, oBodyElement);
          }
        });

        oViewModel.setProperty("/bodyElements/" + sAppraisalId, oBodyElements);
      },
      _getColumnIid: function (sAppraisalId, sColumnId) {
        var oViewModel = this.getModel("formDetailsModel");
        var sPath = "/formData/" + sAppraisalId + "/BodyColumns";
        var aBodyColumns = oViewModel.getProperty(sPath);

        var oBodyColumn = _.find(aBodyColumns, ["ColumnId", sColumnId]);

        if (oBodyColumn) {
          return oBodyColumn.ColumnIid;
        } else {
          return null;
        }
      },
      _formBodyColumnsObject: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var sPath = "/formData/" + sAppraisalId + "/BodyColumns";
        var aBodyColumns = oViewModel.getProperty(sPath);
        var oBodyColumns = {};
        var oThis = this;

        $.each(aBodyColumns, function (sIndex, oColumn) {
          var oBodyColumn = {};

          oBodyColumn[oColumn.ColumnIid] = oColumn;
          if (typeof Object.assign === "function") {
            Object.assign(oBodyColumns, oBodyColumn);
          } else {
            $.extend(oBodyColumns, oBodyColumn);
          }
        });

        oViewModel.setProperty("/bodyColumns/" + sAppraisalId, oBodyColumns);
      },

      _formBodyCellsObject: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyElements"
        );
        var aBodyCells = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyCells"
        );
        var aBodyCellValues = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyCellValues"
        );
        var oBodyCells = {};
        var oBodyCellValues = {};

        $.each(aBodyElements, function (sIndex, oElement) {
          oBodyCells[oElement.RowIid] = {};
          oBodyCellValues[oElement.RowIid] = {};
        });

        $.each(aBodyCells, function (sIndex, oCell) {
          oBodyCells[oCell.RowIid][oCell.ColumnIid] = oCell;
          oBodyCellValues[oCell.RowIid][oCell.ColumnIid] = {};
          oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues = [];
          $.each(aBodyCellValues, function (sValin, oCellValue) {
            if (
              oCellValue.RowIid === oCell.RowIid &&
              oCellValue.ColumnIid === oCell.ColumnIid
            ) {
              oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues.push(
                oCellValue
              );
            }
          });
        });

        oViewModel.setProperty("/bodyCells/" + sAppraisalId, oBodyCells);
        oViewModel.setProperty(
          "/bodyCellValues/" + sAppraisalId,
          oBodyCellValues
        );
      },

      _cloneComparisonObjects: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCells = oViewModel.getProperty("/bodyCells/" + sAppraisalId);
        var oBodyCellsCopy = {};
        var oBodyElements = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );
        var oBodyElementsCopy = {};

        oBodyCellsCopy = this._cloneObject(oBodyCells);
        oBodyElementsCopy = this._cloneObject(oBodyElements);

        oViewModel.setProperty(
          "/bodyCellsCopy/" + sAppraisalId,
          oBodyCellsCopy
        );
        oViewModel.setProperty(
          "/bodyElementsCopy/" + sAppraisalId,
          oBodyElementsCopy
        );
      },
      _compareClonedObjects: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCells = oViewModel.getProperty("/bodyCells/" + sAppraisalId);
        var oBodyCellsCopy = oViewModel.getProperty(
          "/bodyCellsCopy/" + sAppraisalId
        );
        var oBodyElements = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );
        var oBodyElementsCopy = oViewModel.getProperty(
          "/bodyElementsCopy/" + sAppraisalId
        );

        return (
          this._compareObjects(oBodyCells, oBodyCellsCopy) &&
          this._compareObjects(oBodyElements, oBodyElementsCopy)
        );
      },
      _cloneObject: function (oSource) {
        var oTarget = $.extend(true, {}, oSource);
        return oTarget;
      },
      _compareObjects: function (o1, o2) {
        if (o1 && o2) {
          for (var p in o1) {
            if (o1.hasOwnProperty(p) && o2.hasOwnProperty(p)) {
              if (JSON.stringify(o1[p]) !== JSON.stringify(o2[p])) {
                return false;
              }
            } else {
              return false;
            }
          }
        }

        return true;
      },
      _formElementSurveysObject: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var aFormQuestions = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/FormQuestions"
        );
        var aFormAnswers = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/FormAnswers"
        );
        var oElementSurveys = {};

        $.each(aFormQuestions, function (sIndex, oFormQuestion) {
          if (!oElementSurveys.hasOwnProperty(oFormQuestion.RowIid)) {
            oElementSurveys[oFormQuestion.RowIid] = {};
          }

          if (
            !oElementSurveys[oFormQuestion.RowIid].hasOwnProperty(
              oFormQuestion.Frmid
            )
          ) {
            oElementSurveys[oFormQuestion.RowIid][oFormQuestion.Frmid] = {};
          }

          oElementSurveys[oFormQuestion.RowIid][oFormQuestion.Frmid][
            oFormQuestion.Queid
          ] = {
            Question: oFormQuestion,
            Answers: [],
          };
          var sAnswersCollected = false;
          for (var i = 0; i < aFormAnswers.length; i++) {
            var oAnswer = aFormAnswers[i];

            if (
              !(
                oAnswer.RowIid === oFormQuestion.RowIid &&
                oAnswer.Queid === oFormQuestion.Queid &&
                oAnswer.Frmid === oFormQuestion.Frmid
              ) &&
              sAnswersCollected
            ) {
              break;
            }

            if (
              oAnswer.RowIid === oFormQuestion.RowIid &&
              oAnswer.Queid === oFormQuestion.Queid &&
              oAnswer.Frmid === oFormQuestion.Frmid
            ) {
              oElementSurveys[oFormQuestion.RowIid][oFormQuestion.Frmid][
                oFormQuestion.Queid
              ].Answers.push(oAnswer);
              sAnswersCollected = true;
            }
          }
        });

        oViewModel.setProperty(
          "/elementSurveys/" + sAppraisalId,
          oElementSurveys
        );
      },

      _formParametersObject: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var aParams = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/FormParameters"
        );
        var oParams = {};

        $.each(aParams, function (sIndex, oParam) {
          oParams[oParam.Param] = oParam.Value;
        });
        oViewModel.setProperty("/formParameters/" + sAppraisalId, oParams);
      },

      _convertUIData: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCellsTarget = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyCells"
        );
        var oBodyElementsTarget = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyElements"
        );
        var oBodyCellsSource = oViewModel.getProperty(
          "/bodyCells/" + sAppraisalId
        );
        var oBodyElementsSource = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );

        /*Update cell content*/
        for (var i = 0; i < oBodyCellsTarget.length; i++) {
          if (oBodyCellsSource.hasOwnProperty(oBodyCellsTarget[i].RowIid)) {
            if (
              oBodyCellsSource[oBodyCellsTarget[i].RowIid].hasOwnProperty(
                oBodyCellsTarget[i].ColumnIid
              )
            ) {
              oBodyCellsTarget[i] =
                oBodyCellsSource[oBodyCellsTarget[i].RowIid][
                  oBodyCellsTarget[i].ColumnIid
                ];
            } else {
              jQuery.sap.log.error("Hata 2" + oBodyCellsTarget[i]);
            }
          } else {
            jQuery.sap.log.error("Hata 1" + oBodyCellsTarget[i]);
          }
        }

        /*Update elements content*/
        for (var j = 0; j < oBodyElementsTarget.length; j++) {
          if (
            oBodyElementsSource.hasOwnProperty(oBodyElementsTarget[j].RowIid)
          ) {
            if (oBodyElementsSource[oBodyElementsTarget[j].RowIid].FreeInput) {
              oBodyElementsSource[oBodyElementsTarget[j].RowIid].NameString =
                oBodyElementsSource[oBodyElementsTarget[j].RowIid].Name;
            }
            oBodyElementsTarget[j] =
              oBodyElementsSource[oBodyElementsTarget[j].RowIid];
          }
        }

        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyCells",
          oBodyCellsTarget
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyElements",
          oBodyElementsTarget
        );
      },
      _synchronizeUIAfterUpdate: function (sAppraisalId, oData, sUpdateButton) {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCellsSource = oData.BodyCells.results;
        var oBodyCellValuesSource = oData.BodyCellValues.results;
        var oBodyElementsSource = oData.BodyElements.results;
        var oHeaderStatus = oData.HeaderStatus;

        var oResultTable;

        if (oData.ResultTable !== null) {
          oResultTable = oData.ResultTable.results;
        }

        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyCells",
          oBodyCellsSource
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyCellValues",
          oBodyCellValuesSource
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyElements",
          oBodyElementsSource
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/ResultTable",
          oResultTable
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/HeaderStatus",
          oHeaderStatus
        );

        if (sUpdateButton) {
          var oBodyButtons = oData.Buttons.results;
          oViewModel.setProperty(
            "/formData/" + sAppraisalId + "/Buttons",
            oBodyButtons
          );
        }

        /*Adjust buttons again*/
        this._adjustButtonsNew(sAppraisalId);

        var oBodyCellsTarget = oViewModel.getProperty(
          "/bodyCells/" + sAppraisalId
        );
        var oBodyCellValuesTarget = oViewModel.getProperty(
          "/bodyCellValues/" + sAppraisalId
        );

        /*Update cell content*/
        for (var i = 0; i < oBodyCellsSource.length; i++) {
          oBodyCellsTarget[oBodyCellsSource[i].RowIid][
            oBodyCellsSource[i].ColumnIid
          ] = oBodyCellsSource[i];
        }

        oViewModel.setProperty("/bodyCells/" + sAppraisalId, oBodyCellsTarget);
        oViewModel.setProperty(
          "/bodyCellValues/" + sAppraisalId,
          oBodyCellValuesTarget
        );

        var oBodyElementsTarget = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );

        /*Update elements content*/
        for (var j = 0; j < oBodyElementsSource.length; j++) {
          oBodyElementsTarget[oBodyElementsSource[j].RowIid] =
            oBodyElementsSource[j];
        }

        oViewModel.setProperty(
          "/bodyElements/" + sAppraisalId,
          oBodyElementsTarget
        );

        this._prepareSideBarData(sAppraisalId);

        this.hasChanges = false;

        oViewModel.refresh(true);
      },

      _resetSections: function () {
        if (this._oPageLayout) {
          $.each(this._oPageLayout.getSections(), function (i, oCurSection) {
            oCurSection.destroySubSections();
          });

          this._oPageLayout.destroySections();
        }
      },
      /**
       * Handle form actions
       * @event handler
       * @private
       */
      _startDevPlan: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");

        var oIconTab = _.find(this._aFormUIElements, {
          AppraisalId: sAppraisalId,
          RowIid: "0001",
          ColumnIid: null,
          UIType: "DevPlanIconTab",
        });
        var oIconTabFilter = _.find(this._aFormUIElements, {
          AppraisalId: sAppraisalId,
          RowIid: "0001",
          ColumnIid: null,
          UIType: "DevPlanIconTabFilter",
        });

        if (oIconTab && oIconTabFilter) {
          oIconTab.UIElement.setSelectedKey("DP_PLAN_TAB");
          oViewModel.setProperty(
            "/developmentPlan/selectedFilterKey",
            "DP_PLAN_TAB"
          );
        }
      },
      _handleActionButtonPressed: function (oEvent) {
        var oButton = oEvent.getSource();
        var sAppraisalId = oButton.data("AppraisalId");
        switch (oButton.data("ButtonId")) {
          case "SAVE":
            this._handleSaveDocument(sAppraisalId);
            break;
          case "CANCEL":
            this._handleCancelDocument();
            break;
          case "PRINT":
            this._handlePrintDocument(sAppraisalId);
            break;
          case "START_DEV_PLAN":
            this._startDevPlan(sAppraisalId);
            break;
          case "SHOW_INTRO":
            this._showShepherdIntro();
            break;
          default:
            this._handleButtonAction(sAppraisalId, oButton);
        }
        //MessageToast.show("Button pressed! Button:" + oEvent.getSource().data("ButtonId") + oEvent.getSource().data("StatusRelevant"));
      },
      _handleCancelDocument: function () {
        this._doNavBack(false);
      },
      _handleSaveDocument: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/formProp/" + sAppraisalId);
        var oThis = this;
        var sHasErrors = false;

        this._convertUIData(sAppraisalId);

        this._cloneComparisonObjects(sAppraisalId);

        var oOperation = {
          AppraisalId: sAppraisalId,
          PartApId: "0000",
          Operation: "SAVE",
          RowIid: null,
          ButtonId: null,
          BodyElements: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyElements"
          ),
          BodyCells: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyCells"
          ),
          BodyCellValues: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyCellValues"
          ),
          HeaderStatus: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/HeaderStatus"
          ),
          FormQuestions: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FormQuestions"
          ),
          ResultTable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ResultTable"
          ),
          Return: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/Return"
          ),
        };

        this._removeAllMessages();

        this._openBusyFragment("formSaved", []);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Return messages */
            sHasErrors = oThis._processReturnMessagesNew(
              oData.Return.results,
              true
            );

            /* Synchronize UI */
            oThis._synchronizeUIAfterUpdate(sAppraisalId, oData, false);

            /* Close busy indicator*/
            oThis._closeBusyFragment();
          },
          error: function (oError) {
            oThis._closeBusyFragment();
            //MessageBox.error(oThis.getResourceBundle().getText("formSaveError"));
            var M = JSON.parse(oError.responseText).error.message.value;
            MessageBox.error(M);
          },
          async: true,
        });
      },
      _handleDeleteFormElement: function (oEvent) {
        var oThis = this;
        var sRowIid = oEvent.getSource().data("elementRowIid");
        var sElementName = oEvent.getSource().data("elementName");
        var sAppraisalId = oEvent.getSource().data("appraisalId");

        var _callRowDelete = function () {
          oThis.confirmDialog.close();
          oThis._doDeleteFormElement(sAppraisalId, sRowIid, false);
        };
        this._generateConfirmDialog(
          "elementDeletionConfirm",
          "elementDeletionQuestion",
          [sElementName],
          "elementDelete",
          "Reject",
          "sap-icon://delete",
          _callRowDelete,
          "Warning"
        );
      },
      _deleteRowUI: function (sAppraisalId, sRowIid) {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyElements"
        );
        var oBodyElements = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );
        var aBodyCells = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyCells"
        );
        var oBodyCells = oViewModel.getProperty("/bodyCells/" + sAppraisalId);
        var oThis = this;

        if (oBodyElements.hasOwnProperty(sRowIid)) {
          delete oBodyElements[sRowIid];
        }
        if (oBodyCells.hasOwnProperty(sRowIid)) {
          delete oBodyCells[sRowIid];
        }

        var aRowElements = _.filter(oThis._aFormUIElements, {
          AppraisalId: sAppraisalId,
          RowIid: sRowIid,
        });

        $.each(aRowElements, function (sIndex, oRowElement) {
          try {
            if (typeof oRowElement.UIElement.destroyContent === "function") {
              oRowElement.UIElement.destroyContent();
            }
          } catch (err) {
            jQuery.sap.log.error(
              sRowIid + " satırının içeriği silinirken hata"
            );
          }
          try {
            if (typeof oRowElement.UIElement.destroy === "function") {
              oRowElement.UIElement.destroy();
            }
          } catch (err) {
            jQuery.sap.log.error(sRowIid + " satırı silinirken hata");
          }
        });

        _.remove(oThis._aFormUIElements, {
          AppraisalId: sAppraisalId,
          RowIid: sRowIid,
        });

        _.remove(aBodyElements, {
          AppraisalId: sAppraisalId,
          RowIid: sRowIid,
        });

        _.remove(aBodyCells, {
          AppraisalId: sAppraisalId,
          RowIid: sRowIid,
        });

        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyElements",
          aBodyElements
        );
        oViewModel.setProperty("/bodyElements/" + sAppraisalId, oBodyElements);
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyCells",
          aBodyCells
        );
        oViewModel.setProperty("/bodyCells/" + sAppraisalId, oBodyCells);
      },
      _removeAllMessages: function () {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/formMessages", []);
      },
      _processReturnMessagesNew: function (aReturn, sShowMessages) {
        var sHasErrors = false;

        this._removeAllMessages();

        $.each(aReturn, function (sIndex, oReturn) {
          switch (oReturn.Type) {
            case "S":
              MessageBox.show(oReturn.Message, {
                icon: MessageBox.Icon.SUCCESS,
                title: "Bilgi",
                actions: [MessageBox.Action.CLOSE],
              });
              break;
            case "W":
              MessageBox.warning(oReturn.Message);
              break;
            case "I":
              MessageBox.information(oReturn.Message);
              break;
            case "E":
            case "A":
              sHasErrors = true;
              sShowMessages = true;
              MessageBox.error(oReturn.Message);
              break;
          }
          return false; //only one popup message
        });

        return sHasErrors;
      },

      _processReturnMessages: function (aReturn, sShowMessages) {
        var oThis = this;
        var sHasErrors = false;

        $.each(aReturn, function (sIndex, oReturn) {
          var sMessageType = sap.ui.core.MessageType.None;

          switch (oReturn.Type) {
            case "S":
              sMessageType = sap.ui.core.MessageType.Success;
              break;
            case "W":
              sMessageType = sap.ui.core.MessageType.Warning;
              break;
            case "I":
              sMessageType = sap.ui.core.MessageType.Information;
              break;
            case "E":
            case "A":
              sMessageType = sap.ui.core.MessageType.Error;
              sHasErrors = true;
              sShowMessages = true;
              break;
          }
          if (sShowMessages || oReturn.Type === "E") {
            oThis._oMessageManager.addMessages(
              new sap.ui.core.message.Message({
                message: oReturn.Message,
                type: sMessageType,
                processor: oThis._oMessageProcessor,
              })
            );
          }
        });
        if (aReturn.length > 0 && sShowMessages) {
          oThis.onMessagesButtonPress(null);
        }

        return sHasErrors;
      },
      _doDeleteFormElement: function (sAppraisalId, sRowIid, sNoMsg) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var oThis = this;
        var sHasErrors = false;

        this._convertUIData(sAppraisalId);

        var oOperation = {
          AppraisalId: sAppraisalId,
          PartApId: "0000",
          Operation: "DELETE",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyElements"
          ),
          BodyCells: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyCells"
          ),
          BodyCellValues: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyCellValues"
          ),
          ResultTable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ResultTable"
          ),
          Return: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/Return"
          ),
        };

        this._removeAllMessages();

        this._openBusyFragment();
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Return messages */
            sHasErrors = oThis._processReturnMessagesNew(
              oData.Return.results,
              false
            );

            if (!sHasErrors && !sNoMsg) {
              MessageToast.show(
                oThis.getResourceBundle().getText("elementDeleteSuccessful")
              );
            }

            oThis._deleteRowUI(sAppraisalId, sRowIid);

            // /* Synchronize UI */
            oThis._synchronizeUIAfterUpdate(sAppraisalId, oData, false);

            /* Close busy indicator*/
            oThis._closeBusyFragment();
          },
          error: function (oError) {
            oThis._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },
      _handleListAttachment: function (oEvent) {
        var oButton = oEvent.getSource();
        var sAppraisalId = oButton.data("appraisalId");
        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");
        var oThis = this;
        var sDelVisible =
          "{=  ( ${formDetailsModel>LastUser} === ${formDetailsModel>Uname}) && ( ${formDetailsModel>/bodyElements/" +
          sAppraisalId +
          "/" +
          oButton.data("elementRowIid") +
          "/AttachmentVisible} === true ) ? true : false }";

        var oColumnListItem = new sap.m.ColumnListItem();
        var oUrlPath =
          oModel.sServiceUrl +
          "/AttachmentSet(AppraisalId=guid'" +
          sAppraisalId +
          "',RowIid='" +
          oButton.data("elementRowIid") +
          "',Id='" +
          "{formDetailsModel>Id}" +
          "')/$value";
        var oLink = new sap.m.Link({
          target: "_blank",
          text: "{formDetailsModel>Name}" + "." + "{formDetailsModel>Type}",
          href: oUrlPath,
          tooltip: oUrlPath,
        });
        var oDelButton = new sap.m.Button({
          icon: "sap-icon://delete",
          type: "Reject",
          press: oThis._handleDeleteAttachment.bind(oThis),
          enabled: sDelVisible,
        });

        var oRowId = new sap.ui.core.CustomData({
          key: "elementRowIid",
        });
        oRowId.bindProperty("value", "formDetailsModel>RowIid");
        var oAppraisalId = new sap.ui.core.CustomData({
          key: "appraisalId",
        });
        oAppraisalId.bindProperty("value", "formDetailsModel>AppraisalId");
        var oAttachmentId = new sap.ui.core.CustomData({
          key: "attachmentId",
        });
        oAttachmentId.bindProperty("value", "formDetailsModel>Id");

        var oAttachmentName = new sap.ui.core.CustomData({
          key: "attachmentName",
        });
        oAttachmentName.bindProperty("value", "formDetailsModel>Name");

        var oAttachmentType = new sap.ui.core.CustomData({
          key: "attachmentType",
        });
        oAttachmentType.bindProperty("value", "formDetailsModel>Type");

        oDelButton.addCustomData(oRowId);
        oDelButton.addCustomData(oAppraisalId);
        oDelButton.addCustomData(oAttachmentId);
        oDelButton.addCustomData(oAttachmentName);
        oDelButton.addCustomData(oAttachmentType);

        oColumnListItem.addCell(oLink);
        oColumnListItem.addCell(oDelButton);

        // create dialog lazily
        if (!this._oListAttachmentDialog) {
          // create dialog via fragment factory
          this._oListAttachmentDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.AttachmentList",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oListAttachmentDialog);
        }

        sap.ui
          .getCore()
          .byId("idAttachmentList")
          .bindItems({
            path:
              "formDetailsModel>/attachmentCollection/" +
              oButton.data("appraisalId") +
              "/" +
              oButton.data("elementRowIid") +
              "/attachmentList",
            template: oColumnListItem,
          });
        this._oListAttachmentDialog.openBy(oButton);
      },
      onCloseAttachmentPopover: function () {
        this._oListAttachmentDialog.close();
      },
      _handleAddAttachment: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty(
          "/currentAppraisalId",
          oEvent.appraisalId.getValue()
        );
        oViewModel.setProperty("/currentRowIid", oEvent.rowIid.getValue());

        this._openUploadAttachmentDialog();
      },
      _handleDeleteAttachment: function (oEvent) {
        var oThis = this;
        var oButton = oEvent.getSource();
        var sRowIid = oButton.data("elementRowIid");
        var sAppraisalId = oButton.data("appraisalId");
        var sAttachmentId = oButton.data("attachmentId");
        var sAttachmentName =
          oButton.data("attachmentName") + "." + oButton.data("attachmentType");
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var sPath =
          "/AttachmentSet(" +
          "AppraisalId=guid'" +
          sAppraisalId +
          "'," +
          "RowIid='" +
          sRowIid +
          "'," +
          "Id='" +
          sAttachmentId +
          "')";

        oThis._oListAttachmentDialog.close();

        var _callAttachmentDelete = function () {
          oThis.confirmDialog.close();
          oThis._openBusyFragment("attachmentBeingDeleted");
          oModel.remove(sPath, {
            success: function (oData, oResponse) {
              oThis._refreshAttachmentList(sAppraisalId);
              oThis._closeBusyFragment();
              MessageToast.show(
                oThis.getResourceBundle().getText("attachmentDeleteSuccess")
              );
            },
            error: function (oError) {
              oThis._closeBusyFragment();
              MessageToast.show(
                oThis.getResourceBundle().getText("attachmentDeleteError")
              );
            },
          });
        };
        this._generateConfirmDialog(
          "attachmentDeletionConfirm",
          "attachmentDeletionQuestion",
          [sAttachmentName],
          "elementDelete",
          "Reject",
          "sap-icon://delete",
          _callAttachmentDelete,
          "Warning"
        );
      },
      _handleOpenSurvey: function (oEvent) {
        var sAppraisalId = oEvent.getSource().data("appraisalId");
        var sRowIid = oEvent.getSource().data("elementRowIid");
        var sFormId = oEvent.getSource().data("elementFormId");
        var oCurrentForm =
          this.getModel("formDetailsModel").getProperty("/currentForm");
        if (oCurrentForm.RoleId === "MA") {
          this._handleCallSurvey(sAppraisalId, sRowIid, sFormId, true);
        } else {
          this._handleCallSurvey(sAppraisalId, sRowIid, sFormId, false);
        }
      },

      _handleOpenInfoPopover: function (oEvent) {},

      _checkMaxChildren: function (sAppraisalId, sRowIid) {
        var oCheck = this._getChildrenCount(sAppraisalId, sRowIid);
        if (oCheck.Max > 0) {
          return oCheck.Cur < oCheck.Max ? 0 : oCheck.Max;
        } else {
          return 0;
        }
      },

      _getChildrenCount: function (sAppraisalId, sRowIid) {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );
        var sMaxChildren = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId + "/" + sRowIid + "/MaxChildCount"
        );
        var sChildrenCount = 0;

        $.each(aBodyElements, function (sIndex, oBodyElement) {
          if (oBodyElement.Parent === sRowIid) {
            sChildrenCount++;
          }
        });

        return {
          Max: sMaxChildren,
          Cur: sChildrenCount,
        };
      },

      _handleAddFormElement: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var oThis = this;
        var sHasErrors = false;
        var sRowIid = oEvent.getSource().data("elementRowIid");
        var sAppraisalId = oEvent.getSource().data("appraisalId");
        var sElementName = oEvent.getSource().data("elementName");
        var sMaxChildren = this._checkMaxChildren(sAppraisalId, sRowIid);

        if (sMaxChildren > 0) {
          MessageBox.warning(
            this.getResourceBundle().getText("newElementMaxChildrenReached", [
              sMaxChildren,
              sElementName,
            ]),
            {
              title: this.getResourceBundle().getText(
                "newElementAdditionError"
              ),
            }
          );
          return;
        }

        this._convertUIData(sAppraisalId);

        var oOperation = {
          AppraisalId: sAppraisalId,
          PartApId: "0000",
          Operation: "ENHANCE",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyElements"
          ),
          BodyCells: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyCells"
          ),
          BodyColumns: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyColumns"
          ),
          ResultTable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ResultTable"
          ),
          Return: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/Return"
          ),
          ReturnOp: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ReturnOp"
          ),
          FeBodyElementsAdd: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeBodyElementsAdd"
          ),
          FeAlreadyChosen: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeAlreadyChosen"
          ),
          FeFlatAvailable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeFlatAvailable"
          ),
          FeSelectableOtype: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeSelectableOtype"
          ),
          FeStrucAvailable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeStrucAvailable"
          ),
          FormAnswers: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FormAnswers"
          ),
          FormQuestions: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FormQuestions"
          ),
        };

        this._removeAllMessages();

        this._openBusyFragment("newElementInformation", [sElementName]);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            oThis._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = oThis._processReturnMessagesNew(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!sHasErrors) {
              if (oData.ReturnOp.UiDeferred === "X") {
                /*Add from tree or list*/
                oThis._buildCatalogForSelection(oData, sAppraisalId, sRowIid);
              } else {
                /*Free enhancement*/
                oThis._enhanceDocument(
                  oData,
                  sAppraisalId,
                  sRowIid,
                  false,
                  sElementName,
                  false
                );
              }
            }
          },
          error: function (oError) {
            oThis._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },

      _handleAddFreeFormElement: function (oParam) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var oThis = this;
        var oElem = oParam.oElem;
        var sObj = oParam.sObj;
        var oRef = {
          ReferenceType: oParam.ReferenceType || null,
          ReferenceId: oParam.ReferenceId || null,
        };

        var sRowIid = oElem.RowIid;
        var sAppraisalId = oElem.AppraisalId;
        var sElementName = oElem.Name;

        var sHasErrors = false;
        var sMaxChildren = this._checkMaxChildren(sAppraisalId, sRowIid);

        if (sMaxChildren > 0) {
          MessageBox.warning(
            this.getResourceBundle().getText("newElementMaxChildrenReached", [
              sMaxChildren,
              sElementName,
            ]),
            {
              title: this.getResourceBundle().getText(
                "newElementAdditionError"
              ),
            }
          );
          return;
        }

        this._convertUIData(sAppraisalId);

        var oOperation = {
          AppraisalId: sAppraisalId,
          PartApId: "0000",
          Operation: "ENHANCE",
          RowIid: sRowIid,
          ButtonId: null,
          FeReferenceType: oRef.ReferenceType,
          FeReferenceId: oRef.ReferenceId,
          BodyElements: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyElements"
          ),
          BodyCells: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyCells"
          ),
          BodyColumns: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyColumns"
          ),
          BodyCellValues: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyCellValues"
          ),
          ResultTable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ResultTable"
          ),
          Return: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/Return"
          ),
          ReturnOp: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ReturnOp"
          ),
          FeBodyElementsAdd: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeBodyElementsAdd"
          ),
          FeAlreadyChosen: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeAlreadyChosen"
          ),
          FeFlatAvailable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeFlatAvailable"
          ),
          FeSelectableOtype: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeSelectableOtype"
          ),
          FeStrucAvailable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeStrucAvailable"
          ),
          FormAnswers: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FormAnswers"
          ),
          FormQuestions: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FormQuestions"
          ),
        };

        this._removeAllMessages();

        this._openBusyFragment("newElementInformation", [sElementName]);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            oThis._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = oThis._processReturnMessagesNew(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!sHasErrors) {
              if (
                oData.ReturnOp.UiDeferred === "X" &&
                oRef.ReferenceId === null
              ) {
                /*Add from tree or list*/
                oThis._buildCatalogForSelection(oData, sAppraisalId, sRowIid);
              } else {
                /*Free enhancement*/
                oThis._enhanceDocument(
                  oData,
                  sAppraisalId,
                  sRowIid,
                  false,
                  sElementName,
                  sObj,
                  oRef
                );
              }
            }
          },
          error: function (oError) {
            oThis._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },
      _enhanceDocumentFromCatalog: function (aSelectedObjects) {
        var oViewModel = this.getModel("formDetailsModel");
        var oEnhanceModel = this.getModel("enhanceModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/formProp");
        var oThis = this;
        var sHasErrors = false;
        var sRowIid = oEnhanceModel.getProperty("/RowIid");
        var sAppraisalId = oEnhanceModel.getProperty("/AppraisalId");
        var oCheck = this._getChildrenCount(sAppraisalId, sRowIid);
        var aElementsAdd = [];
        var sSpace = null;

        if (oCheck.Max > 0) {
          sSpace = oCheck.Max - oCheck.Cur;
        }

        if (aSelectedObjects.length > 0 && sSpace !== null) {
          if (aSelectedObjects.length > sSpace) {
            MessageBox.warning(
              this.getResourceBundle().getText("maxChildSelectionReached", [
                sSpace,
                aSelectedObjects.length,
              ])
            );
            return;
          }
        }

        this._oAddNewElementCatalogDialog.close();

        $.each(aSelectedObjects, function (sIndex, oSelectedObject) {
          aElementsAdd.push({
            AppraisalId: sAppraisalId,
            NewElementType: oSelectedObject.Otype,
            NewElementId: oSelectedObject.Objid,
          });
        });

        this._convertUIData(sAppraisalId);

        var oOperation = {
          AppraisalId: sAppraisalId,
          PartApId: "0000",
          Operation: "ENHANCEADD",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyElements"
          ),
          BodyCells: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyCells"
          ),
          ResultTable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ResultTable"
          ),
          Return: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/Return"
          ),
          ReturnOp: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ReturnOp"
          ),
          FeBodyElementsAdd: aElementsAdd,
          FeAlreadyChosen: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeAlreadyChosen"
          ),
          FeFlatAvailable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeFlatAvailable"
          ),
          FeSelectableOtype: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeSelectableOtype"
          ),
          FeStrucAvailable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FeStrucAvailable"
          ),
          FormAnswers: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FormAnswers"
          ),
          FormQuestions: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FormQuestions"
          ),
        };

        this._removeAllMessages();

        this._openBusyFragment("newElementIsAdded");
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            oThis._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = oThis._processReturnMessagesNew(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!sHasErrors) {
              oThis._enhanceDocument(
                oData,
                sAppraisalId,
                sRowIid,
                true,
                null,
                false
              );
            }
          },
          error: function (oError) {
            oThis._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },
      _buildCatalogForSelection: function (oData, sAppraisalId, sRowIid) {
        var oEnhanceModel = this.getModel("enhanceModel");
        var aStruc = [];
        var aChosen = [];
        if (!oEnhanceModel) {
          oEnhanceModel = new JSONModel();
          this.setModel(oEnhanceModel, "enhanceModel");
        }
        try {
          aChosen = oData.FeAlreadyChosen.results;
        } catch (oErr) {
          aChosen = [];
        }
        var _returnChildren = function (sOtype, sObjid) {
          var aChildren = [];

          for (var i = 0; i < aStruc.length; i++) {
            if (
              aStruc[i].PupOtype === sOtype &&
              aStruc[i].PupObjid === sObjid
            ) {
              var oChild = {};
              oChild.Stext = aStruc[i].Stext;
              oChild.Description1 = aStruc[i].P10020001;
              oChild.Description2 = aStruc[i].P10020003;
              oChild.Otype = aStruc[i].Otype;
              oChild.Objid = aStruc[i].Objid;
              oChild.PupOtype = sOtype;
              oChild.PupObjid = sObjid;
              oChild.Selectable = false;
              oChild.Selected = false;
              oChild.AlreadySelected = false;
              if (aStruc[i].Vcount === 0) {
                oChild.Selectable = true;
              }
              var sChildFound = false;
              sChildFound = aChosen.some(function (oChosen) {
                return (
                  oChosen.Otype === oChild.Otype &&
                  oChosen.Sobid === oChild.Objid
                );
              });
              if (sChildFound) {
                oChild.AlreadySelected = true;
              }
              oChild.Children = _returnChildren(oChild.Otype, oChild.Objid);
              aChildren.push(oChild);
            } // if (aStruc[i].PupOtype ...
          } //	for (var i = 0; ...
          return aChildren;
        };

        var _returnRoots = function () {
          var oHierarchy = {
            Hierarchy: {
              Children: [],
            },
          };
          for (var i = 0; i < aStruc.length; i++) {
            if (aStruc[i].Level === 1 && aStruc[i].PupObjid === "00000000") {
              var oRoot = {};
              oRoot.Stext = aStruc[i].Stext;
              oRoot.Description1 = null;
              oRoot.Description2 = null;
              oRoot.Otype = aStruc[i].Otype;
              oRoot.Objid = aStruc[i].Objid;
              oRoot.Selectable = false;
              oRoot.AlreadySelected = false;
              oRoot.Children = _returnChildren(oRoot.Otype, oRoot.Objid);
              oHierarchy.Hierarchy.Children.push(oRoot);
            }
          }
          return oHierarchy;
        };

        /*Initiate tree data*/
        oEnhanceModel.setData({});
        if (oData.FeStrucAvailable !== null) {
          try {
            aStruc = oData.FeStrucAvailable.results;
            oEnhanceModel.setData(_returnRoots());
            oEnhanceModel.setProperty("/RowIid", sRowIid);
            oEnhanceModel.setProperty("/AppraisalId", sAppraisalId);
            this._openAddNewElementCatalogDialog();
          } catch (oErr) {
            jQuery.sap.log.error(oErr);
          }
        }
      },
      _enhanceDocument: function (
        oData,
        sAppraisalId,
        sRowIid,
        sFromCatalog,
        sParentName,
        sObj,
        oRef
      ) {
        var oViewModel = this.getModel("formDetailsModel");
        //var aRowUIElements = oViewModel.getProperty("/formUIElements");
        var aBodyElements = oData.BodyElements.hasOwnProperty("results")
          ? oData.BodyElements.results
          : [];
        var aBodyCells = oData.BodyCells.hasOwnProperty("results")
          ? oData.BodyCells.results
          : [];
        var aBodyCellValues = oData.BodyCellValues.hasOwnProperty("results")
          ? oData.BodyCellValues.results
          : [];
        var aFormQuestions = [];
        var aFormAnswers = [];
        var oBodyElements = oViewModel.getProperty(
          "/bodyElements/" + sAppraisalId
        );
        var oBodyCells = oViewModel.getProperty("/bodyCells/" + sAppraisalId);
        var oBodyCellValues = oViewModel.getProperty(
          "/bodyCellValues/" + sAppraisalId
        );
        var oElementSurveys = oViewModel.getProperty(
          "/elementSurveys/" + sAppraisalId
        );
        var oFormQuestions = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/FormQuestions"
        );
        var oFormAnswers = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/FormAnswers"
        );
        var oCurrentRowPanel = null;
        var sChildRowIid = null;
        var sNewRowIid = null;
        var oThis = this;

        //->Serkan
        //eklemeden vazgeçilirse eklenmemiş yapıyı geri almak için oluşturuldu
        var aBodyCellsClone = _.clone(
          oViewModel.getProperty("/formData/" + sAppraisalId + "/BodyCells")
        );
        var aBodyCellValuesClone = _.clone(
          oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyCellValues"
          )
        );
        var aBodyElementsClone = _.clone(
          oViewModel.getProperty("/formData/" + sAppraisalId + "/BodyElements")
        );

        oViewModel.setProperty("/beforeAddFreeFormData/" + sAppraisalId, {});
        oViewModel.setProperty(
          "/beforeAddFreeFormData/" + sAppraisalId + "/aBodyCells",
          aBodyCellsClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/" + sAppraisalId + "/aBodyCellValues",
          aBodyCellValuesClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/" + sAppraisalId + "/aBodyElements",
          aBodyElementsClone
        );

        var oBodyCellsClone = _.clone(oBodyCells);
        var oBodyCellValuesClone = _.clone(oBodyCellValues);
        var oBodyElementsClone = _.clone(oBodyElements);
        oViewModel.setProperty(
          "/beforeAddFreeFormData/" + sAppraisalId + "/oBodyCells",
          oBodyCellsClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/" + sAppraisalId + "/oBodyCellValues",
          oBodyCellValuesClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/" + sAppraisalId + "/oBodyElements",
          oBodyElementsClone
        );
        //<- Serkan

        if (oData.FormQuestions !== null) {
          aFormQuestions = oData.FormQuestions.hasOwnProperty("results")
            ? oData.FormQuestions.results
            : [];
          aFormAnswers = oData.FormAnswers.hasOwnProperty("results")
            ? oData.FormAnswers.results
            : [];
        }

        $.each(aBodyElements, function (sIndex, oElement) {
          if (oElement.RowIid === sRowIid) {
            sChildRowIid = oElement.Child;
          }
          if (!oBodyElements.hasOwnProperty(oElement.RowIid)) {
            /*Set New Elements Row Id */
            sNewRowIid = oElement.RowIid;
            oViewModel.setProperty(
              "/newElement/AppraisalId",
              oElement.AppraisalId
            );
            oViewModel.setProperty("/newElement/RowIid", oElement.RowIid);
            oViewModel.setProperty("/newElement/PlaceHolder", oElement.Name);
            oViewModel.setProperty("/newElement/ParentName", sParentName);

            var oNewElement = {};
            oNewElement[oElement.RowIid] = oElement;
            if (typeof Object.assign === "function") {
              Object.assign(oBodyElements, oNewElement);
            } else {
              $.extend(oBodyElements, oNewElement);
            }

            oBodyCells[oElement.RowIid] = {};
            oBodyCellValues[oElement.RowIid] = {};
          } else {
            oBodyElements[oElement.RowIid] = oElement;
          }
        });

        $.each(aBodyCells, function (sIndex, oCell) {
          if (!oBodyCells[oCell.RowIid].hasOwnProperty([oCell.ColumnIid])) {
            oBodyCells[oCell.RowIid][oCell.ColumnIid] = oCell;
            oBodyCellValues[oCell.RowIid][oCell.ColumnIid] = {};
            oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues = [];
            $.each(oData.BodyCellValues.results, function (sValin, oCellValue) {
              if (
                oCellValue.RowIid === oCell.RowIid &&
                oCellValue.ColumnIid === oCell.ColumnIid
              ) {
                oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues.push(
                  oCellValue
                );
              }
            });
          } else {
            oBodyCells[oCell.RowIid][oCell.ColumnIid] = oCell;
          }
        });

        $.each(aFormQuestions, function (sIndex, oQuestion) {
          if (!oElementSurveys.hasOwnProperty(oQuestion.RowIid)) {
            oFormQuestions.push(oQuestion);
          }
        });

        $.each(aFormAnswers, function (sIndex, oAnswer) {
          if (!oElementSurveys.hasOwnProperty(oAnswer.RowIid)) {
            oFormAnswers.push(oAnswer);
          }
        });

        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyElements",
          aBodyElements
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyCells",
          aBodyCells
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyCellValues",
          aBodyCellValues
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/FormQuestions",
          oFormQuestions
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/FormAnswers",
          oFormAnswers
        );
        oViewModel.setProperty("/bodyElements/" + sAppraisalId, oBodyElements);
        oViewModel.setProperty("/bodyCells/" + sAppraisalId, oBodyCells);
        oViewModel.setProperty(
          "/bodyCellValues/" + sAppraisalId,
          oBodyCellValues
        );

        /*Re-produce surveys*/
        oThis._formElementSurveysObject(sAppraisalId);

        var _doEnhance = function () {
          var oCurrentRow = null;

          if (oRef) {
            oCurrentRow = _.find(oThis._aFormUIElements, {
              AppraisalId: sAppraisalId,
              RowIid: sRowIid,
              ColumnIid: null,
              UIType: "VerticalLayout",
              ReferenceType: oRef.ReferenceType,
              ReferenceId: oRef.ReferenceId,
            });
          } else {
            oCurrentRow = _.find(oThis._aFormUIElements, {
              AppraisalId: sAppraisalId,
              RowIid: sRowIid,
              ColumnIid: null,
              UIType: "RowPanel",
            });
          }

          oCurrentRowPanel = oCurrentRow ? oCurrentRow.UIElement : null;

          if (
            oCurrentRowPanel !== null &&
            sNewRowIid !== null &&
            sNewRowIid !== "0000"
          ) {
            // var oNewElement = {
            // 	"AppraisalId": sAppraisalId,
            // 	"RowIid": sNewRowIid
            // };
            var oNewElement = _.cloneDeep(oBodyElements[sNewRowIid]);
            oThis._addRowNew(oCurrentRowPanel, oNewElement, true, false);

            //var aFormUIElements = oViewModel.getProperty("/formUIElements");
            var oNewInput = _.find(oThis._aFormUIElements, {
              AppraisalId: sAppraisalId,
              RowIid: sNewRowIid,
              ColumnIid: null,
              UIType: "RowPanelHeader",
            });
            if (oNewInput.UIElement) {
              oNewInput.UIElement.addEventDelegate({
                onAfterRendering: function () {
                  oNewInput.UIElement.focus();
                },
              });
            }
            oViewModel.refresh(true);
          }
        };

        this._addElementCallBack = null;

        if (!sObj) {
          if (!sFromCatalog) {
            this._addElementCallBack = _doEnhance;
            this._openAddNewElementFreeFormDialog(
              sAppraisalId,
              sNewRowIid,
              oData
            );
          } else {
            _doEnhance();
          }
        } else {
          this._addElementCallBack = _doEnhance;
          this._openAddNewElementObjectiveDialog(sAppraisalId);
        }
      }, //_enhanceDocument
      _doChangeFormStatus: function (sAppraisalId, sButtonId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var oThis = this;
        var sHasErrors = false;

        oThis._convertUIData(sAppraisalId);

        var oOperation = {
          AppraisalId: sAppraisalId,
          PartApId: "0000",
          Operation: "STAT_CHNG",
          RowIid: null,
          StatusNote: oViewModel.getProperty("/statusChangeNote"),
          ButtonId: sButtonId,
          BodyElements: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyElements"
          ),
          ResultTable: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ResultTable"
          ),
          BodyCells: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/BodyCells"
          ),
          BodyCellValues: oViewModel.getProperty(
            "/formData" + sAppraisalId + "//BodyCellValues"
          ),
          HeaderStatus: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/HeaderStatus"
          ),
          Return: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/Return"
          ),
          ReturnOp: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/ReturnOp"
          ),
          Buttons: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/Buttons"
          ),
          FormQuestions: oViewModel.getProperty(
            "/formData/" + sAppraisalId + "/FormQuestions"
          ),
        };

        this._removeAllMessages();

        this._openBusyFragment("formStatusChange");
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            oThis._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = oThis._processReturnMessagesNew(
                  oData.Return.results,
                  true
                );
              }
            }

            if (!sHasErrors) {
              /* Synchronize UI */
              oThis._synchronizeUIAfterUpdate(sAppraisalId, oData, true);
              oThis.getUIHelper().setFormListUpdated(false);
              MessageToast.show(
                oThis.getResourceBundle().getText("formStatusChangeSuccessful")
              );
              if (oData.ReturnOp.DocumentLeave === "X") {
                oThis._doNavBack(true);
              } else if (oData.ReturnOp.DocumentLeave === "1") {
                /*Do nothing*/
              }
            }
          },
          error: function (oError) {
            oThis._closeBusyFragment();
            MessageBox.error(
              oThis.getResourceBundle().getText("formStatusChangeError")
            );
          },
          async: true,
        });
      },
      _handleButtonAction: function (sAppraisalId, oButton) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");
        var aButton = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/Buttons"
        );
        var sButtonId = oButton.data("ButtonId");
        var sStatusNoteAvailability = oButton.data("StatusNoteAvailability");
        var oButtonData = _.find(aButton, ["Id", sButtonId]);

        var sFormId = oButtonData.FormId;
        var sRowIid = oButtonData.FormRowIid;

        var _doCallSurvey = function () {
          oThis._handleCallSurvey(sAppraisalId, sRowIid, sFormId, true);
        };

        var _doChangeStatus = function () {
          oThis._handleChangeStatus(sAppraisalId, sButtonId);
        };

        /* Check if survey has to be filled */
        if (sFormId !== "" && sFormId !== null) {
          var sSurveyIncompleted = this._checkSurveyHasFinished(
            sRowIid,
            sFormId
          );
          if (sSurveyIncompleted) {
            this._generateConfirmDialog(
              "surveyNotice",
              "surveyShouldBeFilled",
              [],
              "fillSurvey",
              "Accept",
              "sap-icon://survey",
              _doCallSurvey,
              "Warning",
              "continueWithoutFilling",
              "Reject",
              "sap-icon://process",
              _doChangeStatus
            );

            return false;
          } else {
            this._handleChangeStatus(sAppraisalId, sButtonId);
          }
        } else if (
          oButtonData.FbColumnIid !== "0000" &&
          oButtonData.FbRowIid !== "0000"
        ) {
          oThis._getFeedBack(
            sAppraisalId,
            oButtonData.FbColumnIid,
            oButtonData.FbRowIid,
            oButtonData.FbQuestionText,
            sButtonId
          );
          return false;
        } else {
          /* Check if feedback should be taken*/
          if (sStatusNoteAvailability === "") {
            this._handleChangeStatus(sAppraisalId, sButtonId);
          } else {
            this._handleChangeStatusWithNote(sAppraisalId, oButton);
          }
        }
      },
      _handleChangeStatusWithNote: function (sAppraisalId, oButton) {
        var oThis = this;
        var sButtonId = oButton.data("ButtonId");
        var sStatusNoteAvailability = oButton.data("StatusNoteAvailability");
        var sButtonText = oButton.getText();

        var oViewModel = this.getModel("formDetailsModel");

        oViewModel.setProperty("/statusChangeNote", "");

        var oStatusChangeNoteDialog = new sap.m.Dialog({
          title: "{i18n>STATUS_CHANGE_NOTE_TITLE}",
          contentWidth: "500px",
          type: "Message",
          state: "Warning",
          content: [
            new sap.m.FlexBox({
              width: "500px",
              justifyContent: "Center",
              items: [
                new sap.m.TextArea({
                  value: "{formDetailsModel>/statusChangeNote}",
                  placeholder: "{i18n>STATUS_CHANGE_NOTE_PLACEHOLDER}",
                  width: "95%",
                  rows: 5,
                }),
              ],
            }),
          ],
          beginButton: new sap.m.Button({
            text: sButtonText,
            type: "Accept",
            press: function () {
              var sNote = "";
              try {
                sNote = oViewModel.getProperty("/statusChangeNote").trim();
              } catch (oEx) {
                sNote = "";
              }
              if (sStatusNoteAvailability === "M" && sNote === "") {
                MessageToast.show(
                  oThis
                    .getResourceBundle()
                    .getText("STATUS_CHANGE_NOTE_MANDATORY")
                );
                return;
              }
              oStatusChangeNoteDialog.close();
              oThis._doChangeFormStatus(sAppraisalId, sButtonId);
            },
          }),
          endButton: new sap.m.Button({
            text: "{i18n>labelCancel}",
            press: function () {
              oStatusChangeNoteDialog.close();
            },
          }),
          afterClose: function () {
            oStatusChangeNoteDialog.destroy();
          },
        });

        this.getView().addDependent(oStatusChangeNoteDialog);

        oStatusChangeNoteDialog.open();
      },
      _handleChangeStatus: function (sAppraisalId, sButtonId) {
        var oThis = this;

        var _doChangeStatus = function () {
          oThis.confirmDialog.close();
          oThis._doChangeFormStatus(sAppraisalId, sButtonId);
        };

        this._generateConfirmDialog(
          "formStatusChangeConfirm",
          "formStatusChangeQuestion",
          [],
          "doFormStatusChange",
          "Accept",
          "sap-icon://accept",
          _doChangeStatus,
          "Warning"
        );
      },
      _getFeedBack: function (
        sAppraisalId,
        sColumnIid,
        sRowIid,
        sQuestionText,
        sButtonId
      ) {
        var sSelectedClause =
          "{= ${formDetailsModel>/bodyCells/" +
          sAppraisalId +
          "/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueString} === '0000' ? -1 : ${formDetailsModel>/bodyCells/" +
          sAppraisalId +
          "/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueString} === '0001' ? 0 : ${formDetailsModel>/bodyCells/" +
          sAppraisalId +
          "/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueString} === '0000' ? 1 : -1 }";
        var sNoClause =
          "{= ${formDetailsModel>/bodyCells/" +
          sAppraisalId +
          "/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueNum} !== '1' ? true : false }";

        var sCellValueNum =
          "/bodyCells/" +
          sAppraisalId +
          "/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueNum";
        var sCellValueString =
          "/bodyCells/" +
          sAppraisalId +
          "/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueString";

        var oThis = this;

        var oFeedBackDialog = new sap.m.Dialog({
          title: sQuestionText,
          contentWidth: "550px",
          type: "Message",
          state: "Warning",
          content: [
            new sap.m.FlexBox({
              alignItems: "Stretch",
              justifyContent: "Center",
              items: [
                new sap.m.RadioButtonGroup({
                  selectedIndex: -1,
                  columns: 2,
                  buttons: [
                    new sap.m.RadioButton({
                      width: "150px",
                      text: "Evet",
                      select: oThis._onRadioButtonValueSelected.bind(oThis),
                    })
                      .data("bindingReference", sCellValueString)
                      .data("bindingValue", "0001"),
                    new sap.m.RadioButton({
                      width: "150px",
                      text: "Hayır",
                      select: oThis._onRadioButtonValueSelected.bind(oThis),
                    })
                      .data("bindingReference", sCellValueString)
                      .data("bindingValue", "0002"),
                  ],
                }),
              ],
            }),
          ],
          beginButton: new sap.m.Button({
            text: "Onayla",
            type: "Accept",
            press: function () {
              oFeedBackDialog.close();
              oThis._handleChangeStatus(sAppraisalId, sButtonId);
            },
          }),
          endButton: new sap.m.Button({
            text: "İptal",
            press: function () {
              oFeedBackDialog.close();
            },
          }),
          afterClose: function () {
            oFeedBackDialog.destroy();
          },
        });

        oFeedBackDialog.open();
      },

      _handlePrintDocument: function (sAppraisalId) {
        /*To be coded later on*/
      },
      _openAddNewElementFreeDialog: function () {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/newElement/Value", "");

        // create dialog lazily
        if (!this._oAddNewElementFreeDialog) {
          // create dialog via fragment factory
          this._oAddNewElementFreeDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.AddNewElementFree",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementFreeDialog);
        }

        this._oAddNewElementFreeDialog.open();
      },
      _openAddNewElementFreeFormDialog: function (
        sAppraisalId,
        sNewRowIid,
        oEnhanceData
      ) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/newElement/Value", "");

        // create dialog lazily
        if (!this._oAddNewElementFreeFormDialog) {
          // create dialog via fragment factory
          this._oAddNewElementFreeFormDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.AddNewElementFreeForm",
            this
          );
          //escape handler
          this._oAddNewElementFreeFormDialog.setEscapeHandler(function (o) {
            o.reject();
            oThis.onCloseAddElementFree();
          });
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementFreeFormDialog);
        }

        var oForm = sap.ui.getCore().byId("idNewElementFreeForm");
        try {
          oForm.destroyFormContainers();
          this._addNewElementFreeFormCells(
            oForm,
            sAppraisalId,
            sNewRowIid,
            oEnhanceData
          );
          this._oAddNewElementFreeFormDialog.open();
        } catch (oErr) {
          //console.log(oErr);
        }
      },
      _openAddNewElementObjectiveDialog: function (sAppraisalId) {
        var oThis = this;
        var oViewModel = this.getModel("formDetailsModel");
        var aObjectives = _.cloneDeep(
          oViewModel.getProperty("/formData/" + sAppraisalId + "/Objectives")
        );
        var oFormParameters = _.cloneDeep(
          oViewModel.getProperty("/formParameters/" + sAppraisalId)
        );
        oViewModel.setProperty("/newElement/Value", "");
        oViewModel.setProperty("/objectiveDialog", {
          AppraisalId: sAppraisalId,
          Objectives: aObjectives,
          FormParameters: oFormParameters,
        });

        // create dialog lazily
        if (!this._oAddNewElementObjectiveDialog) {
          // create dialog via fragment factory
          this._oAddNewElementObjectiveDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.AddNewElementObjective",
            this
          );
          //escape handler
          this._oAddNewElementObjectiveDialog.setEscapeHandler(function (o) {
            o.reject();
            oThis.onCloseAddElementObjective();
          });
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementObjectiveDialog);
        }
        this._oAddNewElementObjectiveDialog.open();
      },
      _openAddNewElementCatalogDialog: function () {
        // create dialog lazily
        if (!this._oAddNewElementCatalogDialog) {
          // create dialog via fragment factory
          this._oAddNewElementCatalogDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.AddNewElementCatalog",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementCatalogDialog);
        }

        this._oAddNewElementCatalogDialog.open();
      },

      onCloseAddElementCatalog: function () {
        this._oAddNewElementCatalogDialog.close();
        MessageToast.show(
          this.getResourceBundle().getText("addOperationCancelled")
        );
      },
      onApplyAddElementCatalog: function (oEvent) {
        var oEnhanceModel = this.getModel("enhanceModel");
        var oCatalog = oEnhanceModel.getProperty("/Hierarchy");
        var aSelectedObjects = [];

        var _returnSelected = function (oElement) {
          if (oElement.hasOwnProperty("Children")) {
            if (oElement.Children.length > 0) {
              $.each(oElement.Children, function (sIndex, oChild) {
                if (
                  oChild.hasOwnProperty("AlreadySelected") &&
                  oChild.hasOwnProperty("Selected")
                ) {
                  if (!oChild.AlreadySelected && oChild.Selected) {
                    var oSelectedObject = {
                      Otype: oChild.Otype,
                      Objid: oChild.Objid,
                    };
                    aSelectedObjects.push(oSelectedObject);
                  }
                }
                _returnSelected(oChild);
              });
            }
          }
        };

        _returnSelected(oCatalog);

        //MessageToast.show("Seçilen öğe:" + oSource.data("referenceObjectId") + "," + oSource.data("referenceObjectType"));
        if (aSelectedObjects.length > 0) {
          this._enhanceDocumentFromCatalog(aSelectedObjects);
        } else {
          this._oAddNewElementCatalogDialog.close();
          MessageToast.show(
            this.getResourceBundle().getText("noElementSelected")
          );
        }
      },
      onCloseAddElementFree: function () {
        this.onRestoreAddElement();
        this._oAddNewElementFreeFormDialog.close();

        MessageToast.show(
          this.getResourceBundle().getText("addOperationCancelled")
        );
      },
      onRestoreAddElement: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oNewElement = oViewModel.getProperty("/newElement");
        var sAppraisalId = oNewElement.AppraisalId;

        //-> Serkan
        var aBodyCellsClone = _.clone(
          oViewModel.getProperty(
            "/beforeAddFreeFormData/" + sAppraisalId + "/aBodyCells"
          )
        );
        var aBodyCellValuesClone = _.clone(
          oViewModel.getProperty(
            "/beforeAddFreeFormData/" + sAppraisalId + "/aBodyCellValues"
          )
        );
        var aBodyElementsClone = _.clone(
          oViewModel.getProperty(
            "/beforeAddFreeFormData/" + sAppraisalId + "/aBodyElements"
          )
        );

        var oBodyCellsClone = _.clone(
          oViewModel.getProperty(
            "/beforeAddFreeFormData/" + sAppraisalId + "/oBodyCells"
          )
        );
        var oBodyCellValuesClone = _.clone(
          oViewModel.getProperty(
            "/beforeAddFreeFormData/" + sAppraisalId + "/oBodyCellValues"
          )
        );
        var oBodyElementsClone = _.clone(
          oViewModel.getProperty(
            "/beforeAddFreeFormData/" + sAppraisalId + "/oBodyElements"
          )
        );

        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyElements",
          aBodyElementsClone
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyCells",
          aBodyCellsClone
        );
        oViewModel.setProperty(
          "/formData/" + sAppraisalId + "/BodyCellValues",
          aBodyCellValuesClone
        );

        oViewModel.setProperty(
          "/bodyElements/" + sAppraisalId,
          oBodyElementsClone
        );
        oViewModel.setProperty("/bodyCells/" + sAppraisalId, oBodyCellsClone);
        oViewModel.setProperty(
          "/bodyCellValues/" + sAppraisalId,
          oBodyCellValuesClone
        );
        //<- Serkan
      },
      onApplyAddElementFree: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oNewElement = oViewModel.getProperty("/newElement");
        var sAppraisalId = oNewElement.AppraisalId;
        var sTargetPath =
          "/bodyElements/" + sAppraisalId + "/" + oNewElement.RowIid + "/Name";
        oNewElement.Value = oViewModel.getProperty(sTargetPath);

        if (oNewElement.Value === "" || oNewElement.Value === null) {
          MessageBox.error("Tanım alanını doldurunuz");
          return;
        }

        if (typeof this._addElementCallBack === "function") {
          this._addElementCallBack.call();
        }

        oNewElement.Value = oViewModel.getProperty(sTargetPath);
        this._oAddNewElementFreeFormDialog.close();
        MessageToast.show(
          this.getResourceBundle().getText("newElementAdded", [
            oNewElement.Value,
          ])
        );
      },
      onCloseAddElementObjective: function () {
        this.onRestoreAddElement();
        this._oAddNewElementObjectiveDialog.close();
        MessageToast.show(
          this.getResourceBundle().getText("addOperationCancelled")
        );
      },
      onSelectObjective: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var sAppraisalId = oViewModel.getProperty(
          "/objectiveDialog/AppraisalId"
        );
        var aBodyCells = oViewModel.getProperty(
          "/formData/" + sAppraisalId + "/BodyCells"
        );
        var oFormParameters = oViewModel.getProperty(
          "/formParameters/" + sAppraisalId
        );
        var oNewElement = oViewModel.getProperty("/newElement");
        var sObjTeamColumnIid =
          this._getColumnIid(sAppraisalId, "ZTTJ") ||
          this._getColumnIid(sAppraisalId, "ZT00");

        try {
          var oObjective = oViewModel.getProperty(
            oEvent.getSource().getParent().getBindingContextPath()
          );

          var oObjTeam = _.find(aBodyCells, {
            ColumnIid: sObjTeamColumnIid,
            NoteString: oObjective.Objid,
          });
          if (!_.isEmpty(oObjTeam)) {
            MessageToast.show(
              this.getResourceBundle().getText("teamObjectiveExist")
            );
          }
          if (typeof this._addElementCallBack === "function") {
            this._addElementCallBack.call();
          }

          //team goal is set with OBJID that will be displayed as STEXT with the help of formatter
          oViewModel.setProperty(
            "/bodyCells/" +
              sAppraisalId +
              "/" +
              oNewElement.RowIid +
              "/" +
              sObjTeamColumnIid +
              "/NoteString",
            oObjective.Objid
          );

          if (!oFormParameters["OBJECTIVE_DONOT_INHERITE"]) {
            oViewModel.setProperty(
              "/bodyElements/" +
                sAppraisalId +
                "/" +
                oNewElement.RowIid +
                "/Name",
              oObjective.Stext
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                sAppraisalId +
                "/" +
                oNewElement.RowIid +
                "/" +
                this._getColumnIid(sAppraisalId, "OBJ0") +
                "/NoteString",
              oObjective.Description
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                sAppraisalId +
                "/" +
                oNewElement.RowIid +
                "/" +
                this._getColumnIid(sAppraisalId, "ZTK6") +
                "/ValueString",
              oObjective.Zzmeaning
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                sAppraisalId +
                "/" +
                oNewElement.RowIid +
                "/" +
                this._getColumnIid(sAppraisalId, "ZTK7") +
                "/ValueString",
              oObjective.Zzunit
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                sAppraisalId +
                "/" +
                oNewElement.RowIid +
                "/" +
                this._getColumnIid(sAppraisalId, "ZTTD") +
                "/ValueString",
              oObjective.ZzexpResult.replace(".", ",")
            );
          }
        } catch (oEx) {
          jQuery.sap.log.error(oEx);
        }

        this._oAddNewElementObjectiveDialog
          .getAggregation("content")[0]
          .getBinding("items")
          .filter([]);
        this._oAddNewElementObjectiveDialog.close();
      },
      onApplyAddElementObjective: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var sAppraisalId = oEvent.getSource().data("appraisalId");
        var oFormParameters = oViewModel.getProperty(
          "/formParameters/" + sAppraisalId
        );
        var oNewElement = oViewModel.getProperty("/newElement");
        var aContexts = oEvent.getParameter("selectedContexts");
        var sObjTeamColumnIid =
          this._getColumnIid(sAppraisalId, "ZTTJ") ||
          this._getColumnIid(sAppraisalId, "ZT00");

        if (aContexts) {
          if (aContexts.length > 1) {
            MessageBox.error(
              this.getResourceBundle().getText("maxObjectiveSelection")
            );
          } else {
            var oObjective = aContexts[0].getObject();

            if (typeof this._addElementCallBack === "function") {
              this._addElementCallBack.call();
            }

            //team goal is set with OBJID that will be displayed as STEXT with the help of formatter
            oViewModel.setProperty(
              "/bodyCells/" +
                sAppraisalId +
                "/" +
                oNewElement.RowIid +
                "/" +
                sObjTeamColumnIid +
                "/NoteString",
              oObjective.Objid
            );

            if (!oFormParameters["OBJECTIVE_DONOT_INHERITE"]) {
              oViewModel.setProperty(
                "/bodyElements/" +
                  sAppraisalId +
                  "/" +
                  oNewElement.RowIid +
                  "/Name",
                oObjective.Stext
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  sAppraisalId +
                  "/" +
                  oNewElement.RowIid +
                  "/" +
                  this._getColumnIid(sAppraisalId, "OBJ0") +
                  "/NoteString",
                oObjective.Description
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  sAppraisalId +
                  "/" +
                  oNewElement.RowIid +
                  "/" +
                  this._getColumnIid(sAppraisalId, "ZTK6") +
                  "/ValueString",
                oObjective.Zzmeaning
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  sAppraisalId +
                  "/" +
                  oNewElement.RowIid +
                  "/" +
                  this._getColumnIid(sAppraisalId, "ZTK7") +
                  "/ValueString",
                oObjective.Zzunit
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  sAppraisalId +
                  "/" +
                  oNewElement.RowIid +
                  "/" +
                  this._getColumnIid(sAppraisalId, "ZTTD") +
                  "/ValueNum",
                oObjective.ZzexpResult
              );
            }
          }
        }

        oEvent.getSource().getBinding("items").filter([]);
      },
      onSearchAddElementObjective: function (oEvent) {
        var sValue = oEvent.getParameter("query");
        var oFilter = new Filter(
          "Description",
          sap.ui.model.FilterOperator.Contains,
          sValue
        );
        var oBinding = oEvent
          .getSource()
          .getParent()
          .getParent()
          .getBinding("items");
        if (sValue !== null && sValue !== null && sValue !== undefined) {
          oBinding.filter([oFilter]);
        } else {
          oBinding.filter([]);
        }
      },
      _openUploadAttachmentDialog: function () {
        // create dialog lazily
        if (!this._oUploadAttachmentDialog) {
          // create dialog via fragment factory
          this._oUploadAttachmentDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.UploadAttachments",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oUploadAttachmentDialog);
        }

        var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");
        try {
          if (oFileUploader) {
            oFileUploader.clear();
          }
        } catch (oErr) {
          jQuery.sap.log.error("File uploader not loaded yet...");
        }

        this._oUploadAttachmentDialog.open();
      },

      onFileTypeMissmatch: function (oEvent) {
        var aFileTypes = oEvent.getSource().getFileType();
        jQuery.each(aFileTypes, function (key, value) {
          aFileTypes[key] = "*." + value;
        });
        var sSupportedFileTypes = aFileTypes.join(", ");
        MessageBox.warning(
          this.getResourceBundle().getText("fileTypeMismatch", [
            oEvent.getParameter("fileType"),
            sSupportedFileTypes,
          ])
        );
      },
      onAttachmentUploadPress: function (oEvent) {
        var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");

        if (!oFileUploader.getValue()) {
          MessageToast.show(
            this.getResourceBundle().getText("fileSelectionRequired")
          );
          return;
        }

        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");

        /*Destroy header parameters*/
        oFileUploader.destroyHeaderParameters();

        /*Set security token*/
        oModel.refreshSecurityToken();
        oFileUploader.addHeaderParameter(
          new sap.ui.unified.FileUploaderParameter({
            name: "x-csrf-token",
            value: oModel.getSecurityToken(),
          })
        );

        /*Set filename*/
        var sFileName = oFileUploader.getValue();
        sFileName = encodeURIComponent(sFileName);
        oFileUploader.addHeaderParameter(
          new sap.ui.unified.FileUploaderParameter({
            name: "content-disposition",
            value: "inline; filename='" + sFileName + "'",
          })
        );

        /*Set upload path*/
        var sPath =
          oModel.sServiceUrl +
          "/AttachOperationsSet(" +
          "AppraisalId=guid'" +
          oViewModel.getProperty("/currentAppraisalId") +
          "'," +
          "RowIid='" +
          oViewModel.getProperty("/currentRowIid") +
          "')/Attachment";

        oFileUploader.setUploadUrl(sPath);

        this._openBusyFragment("fileBeingUploaded");

        /*Upload file*/
        oFileUploader.upload();
      },

      onAttachmentUploadComplete: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var sAppraisalId = oViewModel.getProperty("/currentAppraisalId");
        this._closeBusyFragment();

        var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");
        oFileUploader.destroyHeaderParameters();
        oFileUploader.clear();

        var sStatus = oEvent.getParameter("status");
        var sResponse = oEvent.getParameter("response");

        if (sStatus == "201" || sStatus == "200") {
          MessageBox.success(
            this.getResourceBundle().getText("fileUploadSuccess")
          );
          this._oUploadAttachmentDialog.close();
        } else {
          MessageBox.error(
            this.getResourceBundle().getText("fileUploadError", [sResponse])
          );
        }

        this._refreshAttachmentList(sAppraisalId);
      },

      onAttachmentFileChange: function (oEvent) {
        MessageToast.show(
          this.getResourceBundle().getText("fileUploadWarning", [
            oEvent.getParameter("newValue"),
          ])
        );
      },

      onFileSizeExceed: function (oEvent) {
        MessageBox.error(
          this.getResourceBundle().getText("fileSizeExceeded", [
            oEvent.getSource().getMaximumFileSize(),
          ])
        );
      },

      onCloseUploadFormDialog: function () {
        MessageToast.show(
          this.getResourceBundle().getText("fileUploadCancelled")
        );
        this._oUploadAttachmentDialog.close();
      },

      onGetTrainingGroupHeader: function (oGroup) {
        return new sap.m.GroupHeaderListItem({
          title: oGroup.key,
          upperCase: false,
        });
      },

      _showDevTrainings: function (oEvent) {
        if (!this._oDevTrainingsDialog) {
          // create dialog via fragment factory
          this._oDevTrainingsDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.DevelopmentTrainings",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oDevTrainingsDialog);
        }

        var oList = sap.ui.getCore().byId("idDevTrainingsList");
        var oViewModel = this.getModel("formDetailsModel");
        var aFilter = [];

        aFilter.push(
          new Filter(
            "Pernr",
            FilterOperator.EQ,
            oViewModel.getProperty("/formData/HeaderAppraisee/0/Id")
          )
        );

        // filter binding
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilter);

        this._oDevTrainingsDialog.open();
      },

      onTrainingDialogClose: function () {
        var oList = sap.ui.getCore().byId("idDevTrainingsList");
        var oBinding = oList.getBinding("items");
        var aFilter = [];
        oBinding.filter(aFilter);

        this._oDevTrainingsDialog.close();
      },

      _openTrainingCatalogLink: function () {
        window.open(
          "https://webapps01.thy.com/intranets/kurumsal-operasyonel-cozumler/web10/TTASDocuments/Egitim_Katalogu.pdf",
          "_blank"
        );
      },
    });
  }
);
