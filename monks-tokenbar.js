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

export const MTB_MOVEMENT_TYPE = {
    FREE: 'free',
    NONE: 'none',
    COMBAT: 'combat'
}

export class MonksTokenBar {
    static tracker = false;
    static tokenbar = null;

    static init() {
	    log("initializing");
        // element statics
        //CONFIG.debug.hooks = true;

        MonksTokenBar.SOCKET = "module.monks-tokenbar";

        registerSettings();

        let oldTokenCanDrag = Token.prototype._canDrag;
        Token.prototype._canDrag = function (user, event) {
            return (MonksTokenBar.allowMovement(this) ? oldTokenCanDrag.call(this, user, event) : false);
        };
    }

    static ready() {
        MonksTokenBar.requestoptions = [];
        game.socket.on(MonksTokenBar.SOCKET, MonksTokenBar.onMessage);
        if (game.system.id == "pf2e") {
            MonksTokenBar.requestoptions.push({
                id: "ability", text: i18n("MonksTokenBar.Ability"), groups: CONFIG.PF2E.abilities
            });
            MonksTokenBar.requestoptions.push({
                id: "saving", text: i18n("MonksTokenBar.SavingThrow"), groups: CONFIG.PF2E.saves
            });
            MonksTokenBar.requestoptions.push({
                id: "skill", text: i18n("MonksTokenBar.Skill"), groups: CONFIG.PF2E.skills
            });
        } else if (game.system.id == "D35E") {
            MonksTokenBar.requestoptions.push({
                id: "ability", text: i18n("MonksTokenBar.Ability"), groups: CONFIG.PF2E.abilities
            });
            MonksTokenBar.requestoptions.push({
                id: "saving", text: i18n("MonksTokenBar.SavingThrow"), groups: CONFIG.PF2E.savingThrows
            });
            MonksTokenBar.requestoptions.push({
                id: "skill", text: i18n("MonksTokenBar.Skill"), groups: CONFIG.PF2E.skills
            });
        } else {
            MonksTokenBar.requestoptions.push({
                id:"ability", text: i18n("MonksTokenBar.Ability"), groups:CONFIG.DND5E.abilities
            });
            MonksTokenBar.requestoptions.push({
                id:"saving", text: i18n("MonksTokenBar.SavingThrow"), groups:CONFIG.DND5E.abilities
            });
            MonksTokenBar.requestoptions.push({
                id:"skill", text: i18n("MonksTokenBar.Skill"), groups:CONFIG.DND5E.skills
            });
            MonksTokenBar.requestoptions.push({
                id:"death", text: i18n("MonksTokenBar.DeathSavingThrow")
            });
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
                const revealDice = game.dice3d ? game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") : true;
                for (let response of data.response) {
                    let r = Roll.fromData(response.roll);
                    response.roll = r;
                }
                if(data.type == 'savingthrow')
                    SavingThrow.updateMessage(data.response, message, revealDice);
                else if (data.type == 'contestedroll')
                    ContestedRoll.updateContestedRoll(data.response, message, revealDice);
            } break;
            case 'finishroll': {
                let message = game.messages.get(data.msgid);
                if (data.type == 'savingthrow')
                    SavingThrow.finishRolling(data.response, message);
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

    static allowMovement(token) {
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

        if (!game.user.isGM && token != undefined) {
            let movement = token.getFlag("monks-tokenbar", "movement") || game.settings.get("monks-tokenbar", "movement") || MTB_MOVEMENT_TYPE.FREE;
            if (movement == MTB_MOVEMENT_TYPE.NONE ||
                (movement == MTB_MOVEMENT_TYPE.COMBAT && blockCombat(token.id))) {
                //prevent the token from moving
                if (!token.getFlag("monks-tokenbar", "notified") || false) {
                    ui.notifications.warn(movement == MTB_MOVEMENT_TYPE.COMBAT ? i18n("MonksTokenBar.CombatTurnMovementLimited") : i18n("MonksTokenBar.NormalMovementLimited"));
                    token.setFlag("monks-tokenbar", "notified", true);
                    setTimeout(function (token) {
                        log('unsetting notified', token);
                        token.unsetFlag("monks-tokenbar", "notified");
                    }, 30000, token);
                }
                return false;
            }
        }

        return true;
    }
}

Hooks.once('init', async function () {
    log('Initializing Combat Details');
    // Assign custom classes and constants here
    // Register custom module settings
    MonksTokenBar.init();
});

Hooks.on("deleteCombat", function (combat) {
    if (game.user.isGM && game.settings.get("monks-tokenbar", "show-xp-dialog") && game.world.system === "dnd5e" && !game.settings.get('dnd5e', 'disableExperienceTracking'))
        new AssignXPApp(combat).render(true);

    if (game.combats.combats.length == 0 && MonksTokenBar.tokenbar != undefined) {
        //set movement to free movement
        MonksTokenBar.tokenbar.changeGlobalMovement(MTB_MOVEMENT_TYPE.FREE);
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

Hooks.on('preUpdateToken', (scene, data, update, options, userId) => {
    if ((update.x != undefined || update.y != undefined) && !game.user.isGM) {
        let token = canvas.tokens.get(data._id);
        let allow = MonksTokenBar.allowMovement(token);
        if (!allow) {
            delete update.x;
            delete update.y;
        }
    }
});

Hooks.on('canvasReady', () => {
    MonksTokenBar.refresh();
});

Hooks.on("createToken", (token) => {
    MonksTokenBar.refresh();
});

Hooks.on("deleteToken", (token) => {
    MonksTokenBar.refresh();
});
