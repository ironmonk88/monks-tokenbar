import { registerSettings } from "./settings.js";
import { TokenBar } from "./apps/tokenbar.js";
import { AssignXP, AssignXPApp } from "./apps/assignxp.js";
import { SavingThrow } from "./apps/savingthrow.js";
import { ContestedRoll } from "./apps/contestedroll.js";

export let debug = (...args) => {
    if (debugEnabled > 1) console.log("DEBUG: monks-tokenbar | ", ...args);
};
export let log = (...args) => console.log("monks-tokenbar | ", ...args);
export let warn = (...args) => {
    if (debugEnabled > 0) console.warn("monks-tokenbar | ", ...args);
};
export let error = (...args) => console.error("monks-tokenbar | ", ...args);
export let i18n = key => {
    return game.i18n.localize(key);
};

export class MonksTokenBar {
    static tracker = false;
    static tokenbar = null;

    static init() {
	    log("initializing");
        // element statics
        CONFIG.debug.hooks = true;

        MonksTokenBar.SOCKET = "module.monks-tokenbar";

        registerSettings();
    }

    static ready() {
        game.socket.on(MonksTokenBar.SOCKET, MonksTokenBar.onMessage);
        if (game.system.id == "pf2e") {
            MonksTokenBar.abilities = CONFIG.PF2E.abilities;
            MonksTokenBar.skills = CONFIG.PF2E.skills;
            MonksTokenBar.saves = CONFIG.PF2E.saves;
        } else if (game.system.id == "D35E") {
            MonksTokenBar.abilities = CONFIG.D35E.abilities;
            MonksTokenBar.skills = CONFIG.D35E.skills;
            MonksTokenBar.saves = CONFIG.D35E.savingThrows;
        } else {
            MonksTokenBar.abilities = CONFIG.DND5E.abilities;
            MonksTokenBar.skills = CONFIG.DND5E.skills;
            MonksTokenBar.saves = CONFIG.DND5E.abilities;
        }

        if (game.user.isGM) {
            MonksTokenBar.tokenbar = new TokenBar();
            MonksTokenBar.tokenbar.getCurrentTokens();
            MonksTokenBar.tokenbar.render(true);
        }
    }

    static onMessage(data) {
        switch (data.msgtype) {
            case 'rollability': {
                let message = game.messages.get(data.msgid);
                const revealDice = game.dice3d ? game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") : false;
                if(data.type == 'savingthrow')
                    SavingThrow.updateSavingRoll(data.actorid, message, Roll.fromData(data.roll), !revealDice);
                else if (data.type == 'contestedroll')
                    ContestedRoll.updateContestedRoll(data.actorid, message, Roll.fromData(data.roll), !revealDice);
            } break;
            case 'finishroll': {
                let message = game.messages.get(data.msgid);
                if (data.type == 'savingthrow')
                    SavingThrow.finishRolling(data.actorid, message);
                else if (data.type == 'contestedroll')
                    ContestedRoll.finishRolling(data.actorid, message);
            } break;
            case 'assignxp': {
                let message = game.messages.get(data.msgid);
                AssignXP.onAssignXP(data.actorid, message);
            } break;
            case 'movementchange': {
                if (data.tokenid == undefined || canvas.tokens.get(data.tokenid)?.owner) {
                    ui.notifications.warn(data.msg);
                    log('movement change');
                }
            }
        }
    }

    static getDiceSound(hasMaestroSound = false) {
        const has3DDiceSound = game.dice3d ? game.settings.get("dice-so-nice", "settings").enabled : false;
        const playRollSounds = true; //game.settings.get("betterrolls5e", "playRollSounds")

        if (playRollSounds && !has3DDiceSound && !hasMaestroSound) {
            return CONFIG.sounds.dice;
        }

        return null;
    }

    static refresh() {
        if (game.user.isGM && MonksTokenBar.tokenbar != undefined) {
            MonksTokenBar.tokenbar.getCurrentTokens();
            MonksTokenBar.tokenbar.render(true);
        }
    }
}

Hooks.once('init', async function () {
    log('Initializing Combat Details');
    // Assign custom classes and constants here
    // Register custom module settings
    MonksTokenBar.init();
});

Hooks.on("deleteCombat", function (combat) {
    new AssignXPApp(combat).render(true);

    if (game.combats.combats.length == 0) {
        //set movement to free movement
        MonksTokenBar.tokenbar.changeGlobalMovement("free");
    }
});

Hooks.on("updateCombat", function (data, delta) {
    $(MonksTokenBar.tokenbar.tokens).each(function () {
        this.token.unsetFlag("monks-tokenbar", "nofified");
    });
});

Hooks.on("ready", MonksTokenBar.ready);

Hooks.on('canvasReady', () => {
    MonksTokenBar.refresh();
});

Hooks.on("createToken", (token) => {
    MonksTokenBar.refresh();
});

Hooks.on("deleteToken", (token) => {
    MonksTokenBar.refresh();
});
