sap.ui.define(["sap/ui/test/Opa5","hcm/ux/hapv3/test/integration/pages/Common"],function(t,e){"use strict";t.createPageObjects({onTheBrowser:{baseClass:e,actions:{iPressOnTheBackwardsButton:function(){return this.waitFor({success:function(){t.getWindow().history.back()}})},iPressOnTheForwardsButton:function(){return this.waitFor({success:function(){t.getWindow().history.forward()}})},iChangeTheHashToSomethingInvalid:function(){return this.waitFor({success:function(){t.getHashChanger().setHash("/somethingInvalid")}})},iChangeTheHashToTheRememberedItem:function(){return this.waitFor({success:function(){var e=this.getContext().currentItem.id;t.getHashChanger().setHash("/DocumentListSet/"+e)}})},iRestartTheAppWithTheRememberedItem:function(t){var e;this.waitFor({success:function(){e=this.getContext().currentItem.id;this.iTeardownMyAppFrame()}});return this.waitFor({success:function(){t.hash="/DocumentListSet/"+encodeURIComponent(e);this.iStartMyApp(t)}})}},assertions:{}}})});
//# sourceMappingURL=Browser.js.map