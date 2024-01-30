sap.ui.define([],
	function() {
		var oCurrentForm = null;
		var oActiveBusyDialog = null;
		var oListViewModel = null;
		var sFormListUpdated = false;
		var sShowHint = true;
		return {
			setCurrentForm: function(a) {
				oCurrentForm = a;
			},
			getCurrentForm: function() {
				return oCurrentForm;
			},
			setActiveBusyDialog: function(d) {
				oActiveBusyDialog = d;
			},
			getActiveBusyDialog: function() {
				return oActiveBusyDialog;
			},
			setListViewModel: function(m) {
				oListViewModel = m;
			},
			getListViewModel: function() {
				return oListViewModel;
			},
			setListViewBusy: function(sVal) {
				try {
					oListViewModel.setProperty("/viewBusy", sVal);
				} catch (oErr) {
					jQuery.sap.log.error(oErr);
				}
			},
			setFormListUpdated: function(sUpdated) {
				sFormListUpdated = sUpdated;
			},
			getFormListUpdated: function() {
				return sFormListUpdated;
			},
			setShowHint: function(sShow) {
				sShowHint = sShow;
			},
			getShowHint: function() {
				return sShowHint;
			}
		};
	}
);