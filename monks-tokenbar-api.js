import { MonksTokenBar, log, i18n, setting, MTB_MOVEMENT_TYPE } from "./monks-tokenbar.js";
import { AssignXPApp } from "./apps/assignxp.js";
import { SavingThrowApp } from "./apps/savingthrow.js";
import { ContestedRollApp } from "./apps/contestedroll.js";
import { LootablesApp } from "./apps/lootables.js";

export class MonksTokenBarAPI {
    static init() {
        game.MonksTokenBar = MonksTokenBarAPI;
    }

    static TokenBar() {
        return MonksTokenBar.tokenbar;
    }

    static changeMovement(movement, tokens) {
        if (!game.user.isGM)
            return;
        if (!MonksTokenBar.isMovement(movement))
            return;

        if (typeof tokens == 'string')
            tokens = tokens.split(',').map(function (item) { return item.trim(); });

        let useTokens = tokens.map(t => {
            if (typeof t == 'string') {
                t = canvas.tokens.placeables.find(p => p.name == t || p.id == t);
            } else if (!(t instanceof Token))
                t = null;

            return t;
        }).filter(c => !!c);

        if (useTokens != undefined) {
            MonksTokenBar.changeTokenMovement(movement, useTokens);
        }else
            MonksTokenBar.changeGlobalMovement(movement);
    }

    static requestRoll(tokens, options = {}) {
        if (!game.user.isGM)
            return;

        options.rollmode = options.rollmode || 'roll';

        if (typeof tokens == 'string')
            tokens = tokens.split(',').map(function (item) { return item.trim(); });

        let useTokens = tokens.map(t => {
            if (typeof t == 'string') {
                t = canvas.tokens.placeables.find(p => p.name == t || p.id == t);
            } else if (!(t instanceof Token))
                t = null;

            return t;
        }).filter(c => !!c);

        let savingthrow = new SavingThrowApp(useTokens, options);
        if (options?.silent === true) {
            let msg = savingthrow.requestRoll();
            if (options.fastForward === true)
                SavingThrow.onRollAll('', msg);
        }
        else
            savingthrow.render(true);
    }

    static requestContestedRoll(request0, request1, options = {}) {
        if (!game.user.isGM)
            return;

        options.rollmode = options.rollmode || 'roll';

        let contestedroll = new ContestedRollApp(request0, request1, options);
        if (options?.silent === true)
            contestedroll.request();
        else
            contestedroll.render(true);
    }

    /*
    * Used to open a dialog to assign xp to tokens
    * pass in a token or an array of tokens, 
    *
    * */
    static assignXP(tokens, options = {}) {
        if (!game.user.isGM)
            return;
        let assignxp = new AssignXPApp(tokens, options);
        if (options?.silent === true)
            assignxp.assign();
        else
            assignxp.render(true);
    }

    /*
     * Used to open a dialog to convert tokens to lootable
     * pass in a token or an array of tokens
     * 
     * */
    static convertToLootable(tokens, options = {}) {
        if (!game.user.isGM)
            return;
        let lootables = new LootablesApp(tokens, options);

        if (options?.silent === true)
            lootables.convertToLootable();
        else
            lootables.render(true);
    }
}