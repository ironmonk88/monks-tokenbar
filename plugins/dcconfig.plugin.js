import { MonksTokenBar, log, i18n, setting } from "../monks-tokenbar.js"

let DCConfigPlugin = {
    init : function(editor, url) {
        
        /* Add a button that opens a window */
        editor.ui.registry.addButton('dcconfig', {
            tooltip: i18n("MonksTokenBar.RequestRollConfig"),
            icon: "non-breaking",
            onAction: function () {
                /* Open window */
                DCConfigPlugin.openDialog(editor);
            }
        });
        /* Adds a menu item, which can then be included in any menu via the menu/menubar configuration */
        editor.ui.registry.addMenuItem('dcconfig', {
            text: i18n("MonksTokenBar.RequestRollConfig"),
            onAction: function () {
                /* Open window */
                DCConfigPlugin.openDialog(editor);
            }
        });
        /* Return the metadata for the help plugin */
        return {
            getMetadata: function () {
                return {
                    name: 'DC Config plugin',
                    url: ''
                };
            }
        };
    },

    openDialog: function (editor) {
        return editor.windowManager.open({
            title: i18n("MonksTokenBar.RequestRollConfig"),
            body: {
                type: 'panel',
                items: [
                    {
                        type: 'input',
                        name: 'request',
                        label: i18n("MonksTokenBar.Request")
                    },
                    {
                        type: 'input',
                        name: 'dc',
                        inputMode: 'number',
                        label: i18n("MonksTokenBar.DC")
                    },
                    {
                        type: 'checkbox',
                        name: 'silent',
                        label: i18n("MonksTokenBar.Silent")
                    },
                    {
                        type: 'checkbox',
                        name: 'fastForward',
                        label: i18n("MonksTokenBar.FastForward")
                    },
                    {
                        type: 'selectbox',
                        name: 'rollmode',
                        label: i18n("MonksTokenBar.RollMode"),
                        items: [
                            { value: 'roll', text: i18n("MonksTokenBar.PublicRoll") },
                            { value: 'gmroll', text: i18n("MonksTokenBar.PublicHiddenRoll") },
                            { value: 'blindroll', text: i18n("MonksTokenBar.PrivateHiddenRoll") },
                            { value: 'selfroll', text: i18n("MonksTokenBar.GMOnlyRoll") }
                        ]
                    },
                    {
                        type: 'input',
                        name: 'flavor',
                        label: i18n("MonksTokenBar.FlavorText")
                    }
                ]
            },
            buttons: [
                {
                    type: 'cancel',
                    text: i18n("MonksTokenBar.Close")
                },
                {
                    type: 'submit',
                    text: i18n("MonksTokenBar.Save"),
                    primary: true
                }
            ],
            onSubmit: function (api) {
                var data = api.getData();
                editor.insertContent(`@Request[${data.request}${data.dc ? " dc:" + data.dc : ""}${data.silent ? " silent" : ""}${data.fastForward ? " fastForward" : ""} rollmode:${data.rollmode}]${data.flavor ? "{" + data.flavor + "}" : ""}`);
                
                api.close();
            }
        });
    }
}

export let dcconfiginit = DCConfigPlugin.init;