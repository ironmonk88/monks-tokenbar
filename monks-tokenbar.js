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

        let oldTokenCanDrag = Token.prototype._canDrag;
        Token.prototype._canDrag = function (user, event) {
            let blockCombat = function (tokenId) {
                //combat movement is only acceptable if the token is the current token.
                //or the previous token
                //let allowPrevMove = game.settings.get("combatdetails", "allow-previous-move");
                let curCombat = game.combats.active;

                if (curCombat && curCombat.started) {
                    let entry = curCombat.combatant;
                    // prev combatant
                    /*
                    let prevturn = (curCombat.turn || 0) - 1;
                    if (prevturn == -1) prevturn = (curCombat.turns.length - 1);
                    let preventry = curCombat.turns[prevturn];

                    //find the next one that hasn't been defeated
                    while (preventry.defeated && preventry != curCombat.turn) {
                        prevturn--;
                        if (prevturn == -1) prevturn = (curCombat.turns.length - 1);
                        preventry = curCombat.turns[prevturn];
                    }*/

                    return !(entry.tokenId == tokenId); // || preventry.tokenId == tokenId);
                }

                return true;
            }

            let movement = this.getFlag("monks-tokenbar", "movement") || game.settings.get("monks-tokenbar", "movement") || "free";

            if (!game.user.isGM) {
                if (movement == "none" ||
                    (movement == "combat" && blockCombat(this.id))) {
                    //prevent the token from moving
                    if (!this.getFlag("monks-tokenbar", "notified") || false) {
                        ui.notifications.warn(movement == "combat" ? "Movement is set to combat turn, it's currently not your turn" : "Movement is currently locked");
                        this.setFlag("monks-tokenbar", "notified", true);
                        setTimeout(function (token) {
                            log('unsetting notified', token);
                            token.unsetFlag("monks-tokenbar", "notified");
                        }, 30000, this);
                    }
                    return false;
                }
            }

            return oldTokenCanDrag.call(this, user, event);
        }
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
    if (game.settings.get("monks-tokenbar", "show-xp-dialog") && game.world.system === "dnd5e")
        new AssignXPApp(combat).render(true);

    if (game.combats.combats.length == 0 && MonksTokenBar.tokenbar != undefined) {
        //set movement to free movement
        MonksTokenBar.tokenbar.changeGlobalMovement("free");
    }
});

Hooks.on("updateCombat", function (data, delta) {
    if (MonksTokenBar.tokenbar != undefined) {
        $(MonksTokenBar.tokenbar.tokens).each(function () {
            this.token.unsetFlag("monks-tokenbar", "nofified");
        });
    }
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
