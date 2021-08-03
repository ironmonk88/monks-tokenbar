import { registerSettings } from "./settings.js";
import { TokenBar } from "./apps/tokenbar.js";
import { AssignXP, AssignXPApp } from "./apps/assignxp.js";
import { SavingThrow, SavingThrowApp } from "./apps/savingthrow.js";
import { ContestedRoll } from "./apps/contestedroll.js";
import { LootablesApp } from "./apps/lootables.js";
import { MonksTokenBarAPI } from "./monks-tokenbar-api.js";

import { BaseRolls } from "./systems/base-rolls.js";
import { DnD5eRolls } from "./systems/dnd5e-rolls.js";
import { DnD4eRolls } from "./systems/dnd4e-rolls.js";
import { D35eRolls } from "./systems/d35e-rolls.js";
import { PF1Rolls } from "./systems/pf1-rolls.js";
import { PF2eRolls } from "./systems/pf2e-rolls.js";
import { Tormenta20Rolls } from "./systems/tormenta20-rolls.js";
import { OSERolls } from "./systems/ose-rolls.js";
import { SFRPGRolls } from "./systems/sfrpg-rolls.js";
import { SwadeRolls } from "./systems/swade-rolls.js";
import { SW5eRolls } from "./systems/sw5e-rolls.js";

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
export let setting = key => {
    return game.settings.get("monks-tokenbar", key);
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

        if (setting('stats') == undefined) {
            //check and see if the user has selected something other than the default
            if (setting('stat1-icon') != undefined || setting('stat1-resource') != undefined || setting('stat2-icon') != undefined || setting('stat2-resource') != undefined) {
                let oldstats = {};
                if (setting('stat1-resource') != undefined)
                    oldstats[setting('stat1-resource')] = setting('stat1-icon');
                if (setting('stat2-resource') != undefined)
                    oldstats[setting('stat2-resource')] = setting('stat2-icon');
                game.settings.set('monks-tokenbar', 'stats', oldstats);
            }
        }

        /*
        let oldTokenCanDrag = Token.prototype._canDrag;
        Token.prototype._canDrag = function (user, event) {
            return (MonksTokenBar.allowMovement(this, false) ? oldTokenCanDrag.call(this, user, event) : false);
        };
        */

        let canDrag = function (wrapped, ...args) {
            let result = wrapped(...args);
            return (MonksTokenBar.allowMovement(this, false) ? result : false);
        }

        if (game.modules.get("lib-wrapper")?.active) {
            libWrapper.register("monks-tokenbar", "Token.prototype._canDrag", canDrag, "WRAPPER");
        } else {
            const oldCanDrag = Token.prototype._canDrag;
            Token.prototype._canDrag = function (event) {
                return canDrag.call(this, oldCanDrag.bind(this), ...arguments);
            }
        }

        /*
        let oldView = Scene.prototype.view;
        Scene.prototype.view = async function () {
            if (MonksTokenBar.tokenbar) {
                $('#token-action-bar').addClass('closed');
            }
            return oldView.call(this);
        }*/
    }

    static get stats() {

        return setting('stats') || MonksTokenBar.system.defaultStats;
    }

    static ready() {
        game.socket.on(MonksTokenBar.SOCKET, MonksTokenBar.onMessage);

        MonksTokenBar.system = new BaseRolls();
        switch (game.system.id) {
            case 'dnd5e':
                MonksTokenBar.system = new DnD5eRolls(); break;
            case 'sw5e':
                MonksTokenBar.system = new SW5eRolls(); break;
            case 'D35E':
                MonksTokenBar.system = new D35eRolls(); break;
            case 'dnd4eBeta':
                MonksTokenBar.system = new DnD4eRolls(); break;
            case 'pf1':
                MonksTokenBar.system = new PF1Rolls(); break;
            case 'pf2e':
                MonksTokenBar.system = new PF2eRolls(); break;
            case 'tormenta20':
                MonksTokenBar.system = new Tormenta20Rolls(); break;
            case 'sfrpg':
                MonksTokenBar.system = new SFRPGRolls(); break;
            case 'ose':
                MonksTokenBar.system = new OSERolls(); break;
            case 'swade':
                MonksTokenBar.system = new SwadeRolls(); break;
        }

        MonksTokenBar.system.constructor.activateHooks();

        game.settings.settings.get("monks-tokenbar.stats").default = MonksTokenBar.system.defaultStats;

        if (game.modules.get("monks-active-tiles")?.active) {
            game.MonksActiveTiles.triggerActions['setmovement'] = {
                name: 'Set Movement',
                stop: true,
                ctrls: [
                    {
                        id: "entity",
                        name: "Select Entity",
                        type: "select",
                        subtype: "entity",
                        options: { showTile: false, showToken: true, showWithin: true, showPlayers: true },
                        restrict: (entity) => { return (entity instanceof Token); }
                    },
                    {
                        id: "movement",
                        name: "Allow Movement",
                        list: "movement",
                        type: "list"
                    }
                ],
                values: {
                    'movement': {
                        "none": 'MonksTokenBar.NoMovement',
                        "free": 'MonksTokenBar.FreeMovement',
                        //"combat": 'MonksTokenBar.CombatTurn'
                    }
                },
                fn: async (tile, token, action) => {
                    let entity;
                    if (action.data.entity.id == 'token')
                        entity = token.object;
                    else if (action.data.entity.id == 'players') {
                        entity = canvas.tokens.placeables.filter(t => {
                            return t.actor != undefined && t.actor?.hasPlayerOwner && t.actor?.data.type != 'npc';
                        });
                    } else if (action.data.entity.id == 'within') {
                        entity = canvas.tokens.placeables.filter(t => {
                            let offsetW = t.w / 2;
                            let offsetH = t.h / 2;
                            return tile.object.hitArea.contains((t.x + offsetW) - tile.data.x, (t.y + offsetH) - tile.data.y);
                        });
                    } else {
                        entity = await fromUuid(action.data.entity.id);
                        entity = entity?.object;
                    }

                    MonksTokenBar.changeTokenMovement((typeof action.data.movement == 'boolean' ? (action.data.movement ? MTB_MOVEMENT_TYPE.FREE : MTB_MOVEMENT_TYPE.NONE) : action.data.movement), entity);
                },
                content: (trigger, action) => {

                    return trigger.name + ' of ' + action.data.entity.name + ' to ' + i18n(trigger.values.movement[action.data?.movement]);
                }
            };
            game.MonksActiveTiles.triggerActions['requestroll'] = {
                name: 'Request Roll',
                ctrls: [
                    {
                        id: "entity",
                        name: "Select Entity",
                        type: "select",
                        subtype: "entity",
                        options: { showTile: false, showToken: true, showWithin: true, showPlayers: true },
                        restrict: (entity) => { return (entity instanceof Token); }
                    },
                    {
                        id: "request",
                        name: "Request",
                        list: () => { return MonksTokenBar.system._requestoptions; },
                        type: "list"
                    },
                    {
                        id: "dc",
                        name: "DC",
                        type: "text"
                    },
                    {
                        id: "rollmode",
                        name: "Roll Mode",
                        list: "rollmode",
                        type: "list"
                    },
                    {
                        id: "silent",
                        name: "Bypass Dialog",
                        type: "checkbox"
                    },
                    {
                        id: "fastforward",
                        name: "Auto Roll",
                        type: "checkbox"
                    },
                    {
                        id: "checkdc",
                        name: "Stop remaining actions",
                        list: "stop",
                        type: "list"
                    }
                ],
                values: {
                    'rollmode': {
                        "roll": i18n('MonksTokenBar.PublicRoll'),
                        "gmroll": i18n('MonksTokenBar.PrivateGMRoll'),
                        "blindroll": i18n('MonksTokenBar.BlindGMRoll'),
                        "selfroll": i18n('MonksTokenBar.SelfRoll')
                    },
                    'stop': {
                        "none": "Never",
                        "fail": "on Fail",
                        "success": "on Success"
                    }
                },
                fn: async (tile, token, action) => {
                    let entity;
                    if (!action.data.entity.id)
                        return;

                    if (action.data.entity.id == 'token')
                        entity = token.object;
                    else if (action.data.entity.id == 'players') {
                        entity = canvas.tokens.placeables.filter(t => {
                            return t.actor != undefined && t.actor?.hasPlayerOwner && t.actor?.data.type != 'npc';
                        });
                    } else if (action.data.entity.id == 'within') {
                        entity = canvas.tokens.placeables.filter(t => {
                            let offsetW = t.w / 2;
                            let offsetH = t.h / 2;
                            return tile.object.hitArea.contains((t.x + offsetW) - tile.data.x, (t.y + offsetH) - tile.data.y);
                        });
                    } else {
                        entity = await fromUuid(action.data.entity.id);
                        entity = entity?.object;
                    }

                    if (!entity)
                        entity = [];

                    let savingthrow = new SavingThrowApp(entity, { rollmode: action.data.rollmode, request: action.data.request, dc: action.data.dc });
                    if (action.data.silent === true) {
                        let msg = await savingthrow.requestRoll();
                        if (action.data.fastforward === true) {
                            let result = await SavingThrow.onRollAll('all', msg);
                            return (action.data.checkdc == 'success' ? !result : (action.data.checkdc == 'fail' ? result : null));
                        }
                    }
                    else
                        savingthrow.render(true);
                },
                content: (trigger, action) => {
                    let parts = action.data?.request.split(':');
                    let requesttype = (parts.length > 1 ? parts[0] : '');
                    let request = (parts.length > 1 ? parts[1] : parts[0]);
                    let name = MonksTokenBar.getRequestName(MonksTokenBar.system.requestoptions, requesttype, request);
                    return name + (action.data?.dc ? ', DC' + action.data?.dc : '') + (action.data?.checkdc == 'fail' ? ", stop on fail" : (action.data?.checkdc == 'success' ? ", stop on success" : ''));
                }
            };
        }

        if ((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar")) {
            MonksTokenBar.tokenbar = new TokenBar();
            MonksTokenBar.tokenbar.refresh();
        }

        if (game.user.isGM && setting('assign-loot') && game.modules.get("lootsheetnpc5e")?.active) {
            let npcObject = (CONFIG.Actor.sheetClasses.npc || CONFIG.Actor.sheetClasses.minion);
            if (npcObject != undefined) {
                let npcSheetNames = Object.values(npcObject)
                    .map((sheetClass) => sheetClass.cls)
                    .map((sheet) => sheet.name);

                npcSheetNames.forEach((sheetName) => {
                    Hooks.on("render" + sheetName, (app, html, data) => {
                        // only for GMs or the owner of this npc
                        if (app?.token?.actor?.getFlag('monks-tokenbar', 'converted') && app.element.find(".revert-lootable").length == 0) {
                            const link = $('<a class="revert-lootable"><i class="fas fa-backward"></i>Revert Lootable</a>');
                            link.on("click", () => LootablesApp.revertLootable(app));
                            app.element.find(".window-title").after(link);
                        }
                    });
                });
            }
        }
    }

    static onMessage(data) {
        switch (data.msgtype) {
            case 'rollability': {
                if (game.user.isGM) {
                    let message = game.messages.get(data.msgid);
                    const revealDice = game.dice3d ? game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") : true;
                    for (let response of data.response) {
                        let r = Roll.fromData(response.roll);
                        response.roll = r;
                    }
                    if (data.type == 'savingthrow')
                        SavingThrow.updateMessage(data.response, message, revealDice);
                    else if (data.type == 'contestedroll')
                        ContestedRoll.updateMessage(data.response, message, revealDice);
                }
            } break;
            case 'finishroll': {
                if (game.user.isGM) {
                    let message = game.messages.get(data.msgid);
                    if (data.type == 'savingthrow')
                        SavingThrow.finishRolling(data.response, message);
                    else if (data.type == 'contestedroll')
                        ContestedRoll.finishRolling(data.response, message);
                }
            } break;
            case 'assignxp': {
                let message = game.messages.get(data.msgid);
                AssignXP.onAssignXP(data.actorid, message);
            } break;
            case 'assigndeathst': {
                let message = game.messages.get(data.msgid);
                SavingThrow.onAssignDeathST(data.tokenid, message);
            } break;
            case 'movementchange': {
                if (data.tokenid == undefined || canvas.tokens.get(data.tokenid)?.owner) {
                    ui.notifications.warn(data.msg);
                    log('movement change');
                    if (MonksTokenBar.tokenbar != undefined) {
                        MonksTokenBar.tokenbar.render(true);
                    }
                }
            }
        }
    }

    static isMovement(movement) {
        return movement != undefined && MTB_MOVEMENT_TYPE[movement.toUpperCase()] != undefined;
    }

    static getDiceSound(hasMaestroSound = false) {
        const has3DDiceSound = game.dice3d ? game.settings.get("dice-so-nice", "settings").enabled : false;
        const playRollSounds = true; //game.settings.get("betterrolls5e", "playRollSounds")

        if (playRollSounds && !has3DDiceSound && !hasMaestroSound) {
            return CONFIG.sounds.dice;
        }

        return null;
    }

    static async changeGlobalMovement(movement) {
        if (movement == MTB_MOVEMENT_TYPE.COMBAT && (game.combat == undefined || !game.combat.started))
            return;

        log('Changing global movement', movement);
        await game.settings.set("monks-tokenbar", "movement", movement);
        //clear all the tokens individual movement settings
        if (MonksTokenBar.tokenbar != undefined) {
            let tokenbar = MonksTokenBar.tokenbar;
            for (let i = 0; i < tokenbar.tokens.length; i++) {
                await tokenbar.tokens[i].token.document.setFlag("monks-tokenbar", "movement", null);
                tokenbar.tokens[i].token.document.unsetFlag("monks-tokenbar", "notified");
            };
            tokenbar.render(true);
        }

        MonksTokenBar.displayNotification(movement);
    }

    static async changeTokenMovement(movement, tokens) {
        if (tokens == undefined)
            return;

        if (!MonksTokenBar.isMovement(movement))
            return;

        tokens = tokens instanceof Array ? tokens : [tokens];

        log('Changing token movement', tokens);

        let newMove = (game.settings.get("monks-tokenbar", "movement") != movement ? movement : null);
        for (let token of tokens) {
            let oldMove = token.document.getFlag("monks-tokenbar", "movement");
            if (newMove != oldMove) {
                await token.document.setFlag("monks-tokenbar", "movement", newMove);
                await token.document.unsetFlag("monks-tokenbar", "notified");

                let dispMove = token.document.getFlag("monks-tokenbar", "movement") || game.settings.get("monks-tokenbar", "movement") || MTB_MOVEMENT_TYPE.FREE;
                MonksTokenBar.displayNotification(dispMove, token);

                /*if (MonksTokenBar.tokenbar != undefined) {
                    let tkn = MonksTokenBar.tokenbar.tokens.find(t => { return t.id == token.id });
                    if (tkn != undefined)
                        tkn.movement = newMove;
                } */
            }
        }

        //if (MonksTokenBar.tokenbar != undefined)
        //    MonksTokenBar.tokenbar.render(true);
    }

    static displayNotification(movement, token) {
        if (game.settings.get("monks-tokenbar", "notify-on-change")) {
            let msg = (token != undefined ? token.name + ": " : "") + i18n("MonksTokenBar.MovementChanged") + (movement == MTB_MOVEMENT_TYPE.FREE ? i18n("MonksTokenBar.FreeMovement") : (movement == MTB_MOVEMENT_TYPE.NONE ? i18n("MonksTokenBar.NoMovement") : i18n("MonksTokenBar.CombatTurn")));
            ui.notifications.warn(msg);
            log('display notification');
            game.socket.emit(
                MonksTokenBar.SOCKET,
                {
                    msgtype: 'movementchange',
                    senderId: game.user.id,
                    msg: msg,
                    tokenid: token?.id
                },
                (resp) => { }
            );
        }
    }

    static allowMovement(token, notify = true) {
        let blockCombat = function (token) {
            //combat movement is only acceptable if the token is the current token.
            //or the previous token
            //let allowPrevMove = game.settings.get("combatdetails", "allow-previous-move");

            let curCombat = game.combats.active;
            if (setting('debug'))
                log('checking on combat ', curCombat, (curCombat && curCombat.started));

            if (curCombat && curCombat.started) {
                let entry = curCombat.combatant;
                let allowNpc = false;
                if (game.settings.get("monks-tokenbar", "free-npc-combat")) {
                    let curPermission = entry.actor?.data.permission ?? {};
                    let tokPermission = token.actor?.data.permission ?? {};
                    let ownedUsers = Object.keys(curPermission).filter(k => curPermission[k] === 3);
                    allowNpc = ownedUsers.some(u => tokPermission[u] === 3 && !game.users.get(u).isGM)
                        && curCombat.turns.every(t => { return t._token.id !== token.id; });
                }

                log('Checking movement', entry.name, token.name, entry, token.id, token, allowNpc);
                return !(entry._token.id == token.id || allowNpc || (setting("allow-after-movement") && curCombat.previous.tokenId == token.id));
            }

            return true;
        }

        if (!game.user.isGM && token != undefined) {
            let movement = token.document.getFlag("monks-tokenbar", "movement") || game.settings.get("monks-tokenbar", "movement") || MTB_MOVEMENT_TYPE.FREE;
            if (setting('debug'))
                log('movement ', movement, token);
            if (movement == MTB_MOVEMENT_TYPE.NONE ||
                (movement == MTB_MOVEMENT_TYPE.COMBAT && blockCombat(token))) {
                //prevent the token from moving
                if (setting('debug'))
                    log('blocking movement');
                if (notify && (!token.getFlag("monks-tokenbar", "notified") || false)) {
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

    static async onDeleteCombat(combat) {
        if (game.user.isGM) {
            if (combat.started == true) {
                let axpa;
                if (game.settings.get("monks-tokenbar", "show-xp-dialog") && MonksTokenBar.system.showXP) {
                    axpa = new AssignXPApp(combat);
                    await axpa.render(true);
                }
                /*
                if (game.settings.get("monks-tokenbar", "show-xp-dialog") && (game.system.id !== "sw5e" || (game.system.id === "sw5e" && !game.settings.get('sw5e', 'disableExperienceTracking')))) {
                    axpa = new AssignXPApp(combat);
                    await axpa.render(true);
                }*/

                if (setting("assign-loot") && game.modules.get("lootsheetnpc5e")?.active) {
                    let lapp = new LootablesApp(combat);
                    await lapp.render(true);

                    if (axpa != undefined) {
                        setTimeout(function () {
                            $(axpa.element).addClass('dual');
                            $(lapp.element).addClass('dual');
                            /*
                            axpa.position.left += 204;
                            axpa.render();
                            lapp.position.left -= 204;
                            lapp.render();*/
                        }, 200);
                    }
                }
            }

            if (game.combats.combats.length == 0) {
                //set movement to free movement
                let movement = setting("movement-after-combat");
                if (movement != 'ignore')
                    MonksTokenBar.changeGlobalMovement(movement);
            }
        }
    }

    static getRequestName(requestoptions, requesttype, request) {
        let name = '';
        switch (requesttype) {
            case 'ability': name = i18n("MonksTokenBar.AbilityCheck"); break;
            case 'save': name = i18n("MonksTokenBar.SavingThrow"); break;
            case 'dice': name = i18n("MonksTokenBar.Roll"); break;
            default:
                name = (request != 'death' && request != 'init' ? i18n("MonksTokenBar.Check") : "");
        }
        let rt = requestoptions.find(o => {
            return o.id == (requesttype || request);
        });
        let req = (rt?.groups && rt?.groups[request]);
        let flavor = i18n(req || rt?.text);
        switch (game.i18n.lang) {
            case "pt-BR":
            case "es":
                name = name + ": " + flavor;
                break;
            case "en":
            default:
                name = flavor + " " + name;
        }
        return name;
    }

    static setGrabMessage(message, event) {
        if (MonksTokenBar.grabmessage != undefined) {
            $('#chat-log .chat-message[data-message-id="' + MonksTokenBar.grabmessage.id + '"]').removeClass('grabbing');
        }

        if (MonksTokenBar.grabmessage == message)
            MonksTokenBar.grabmessage = null;
        else {
            MonksTokenBar.grabmessage = message;
            if(message != undefined)
                $('#chat-log .chat-message[data-message-id="' + MonksTokenBar.grabmessage.id + '"]').addClass('grabbing');
        }

        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
        event.cancelBubble = true;
        event.returnValue = false;
    }

    static onClickMessage(message, html) {
        if (MonksTokenBar.grabmessage != undefined) {
            //make sure this message matches the grab message
            let roll = {};
            if (game.system.id == 'pf2e') {
                let [abilityId, type] = message.data.flags.pf2e.context.type.split('-');
                roll = { type: (type == 'check' ? 'attribute': type), abilityId: abilityId };
            } else
                roll = message.getFlag(game.system.id, 'roll');
            if (roll && MonksTokenBar.grabmessage.getFlag('monks-tokenbar', 'requesttype') == roll.type &&
                MonksTokenBar.grabmessage.getFlag('monks-tokenbar', 'request') == (roll.skillId || roll.abilityId)) {
                let tokenId = message.data.speaker.token;
                let msgtoken = MonksTokenBar.grabmessage.getFlag('monks-tokenbar', 'token' + tokenId);

                if (msgtoken != undefined) {
                    let r = Roll.fromJSON(message.data.roll);
                    SavingThrow.updateMessage([{ id: tokenId, roll: r }], MonksTokenBar.grabmessage);
                    if (setting('delete-after-grab'))
                        message.delete();
                    MonksTokenBar.grabmessage = null;
                }
            }
        }
    }

    static toggleMovement(combatant, event) {
        event.preventDefault();
        event.stopPropagation();

        let movement = (combatant.token.getFlag('monks-tokenbar', 'movement') == MTB_MOVEMENT_TYPE.FREE ? MTB_MOVEMENT_TYPE.COMBAT : MTB_MOVEMENT_TYPE.FREE);
        this.changeTokenMovement(movement, combatant.token.object);
        $(event.currentTarget).toggleClass('active', movement);
    }
}

Hooks.once('init', async function () {
    log('Initializing Combat Details');
    // Assign custom classes and constants here
    // Register custom module settings
    MonksTokenBar.init();
    MonksTokenBarAPI.init();

    //$('body').on('click', $.proxy(MonksTokenBar.setGrabMessage, MonksTokenBar, null));
});

Hooks.on("deleteCombat", MonksTokenBar.onDeleteCombat);

Hooks.on("updateCombat", function (combat, delta) {
    if (game.user.isGM) {
        if (MonksTokenBar.tokenbar) {
            $(MonksTokenBar.tokenbar.tokens).each(function () {
                this.token.document.unsetFlag("monks-tokenbar", "nofified");
            });
        }

        if (delta.round === 1 && combat.turn === 0 && combat.started === true && setting("change-to-combat")) {
            MonksTokenBar.changeGlobalMovement(MTB_MOVEMENT_TYPE.COMBAT);
        }
    }
});

Hooks.on("ready", MonksTokenBar.ready);

Hooks.on('preUpdateToken', (document, update, options, userId) => {
    if ((update.x != undefined || update.y != undefined) && !game.user.isGM) {
        let token = document.object;
        let allow = MonksTokenBar.allowMovement(token);
        if (!allow) {
            delete update.x;
            delete update.y;
        }
    }
});

Hooks.on("getSceneControlButtons", (controls) => {
    if (game.user.isGM && setting('show-lootable-menu') && game.modules.get("lootsheetnpc5e")?.active) {
        let tokenControls = controls.find(control => control.name === "token")
        tokenControls.tools.push({
            name: "togglelootable",
            title: "MonksTokenBar.Lootables",
            icon: "fas fa-dolly-flatbed",
            onClick: () => {
                new LootablesApp().render(true);
            },
            toggle: false,
            button: true
        });
    }
});

Hooks.on("renderSettingsConfig", (app, html, data) => {
    let btn = $('<button>')
        .addClass('file-picker')
        .attr('type', 'button')
        .attr('data-type', "imagevideo")
        .attr('data-target', "img")
        .attr('title', "Browse Files")
        .attr('tabindex', "-1")
        .html('<i class="fas fa-file-import fa-fw"></i>')
        .click(function (event) {
            const fp = new FilePicker({
                type: "audio",
                current: $(event.currentTarget).prev().val(),
                callback: path => {
                    $(event.currentTarget).prev().val(path);
                }
            });
            return fp.browse();
        });

    btn.clone(true).insertAfter($('input[name="monks-tokenbar.request-roll-sound-file"]', html));
});

Hooks.on("renderCombatTracker", (app, html, data) => {
    if (setting("show-on-tracker") && game.user.isGM) {
        $('.combatant', html).each(function () {
            let id = this.dataset.combatantId;
            let combatant = app.viewed.combatants.find(c => c.id == id);
            if (combatant && combatant.hasPlayerOwner) {
                $($('<a>')
                    .addClass('combatant-control')
                    .toggleClass('active', combatant.token.getFlag('monks-tokenbar', 'movement') == MTB_MOVEMENT_TYPE.FREE)
                    .attr('title', 'Allow Movement')
                    .attr('data-control', 'toggleMovement')
                    .html('<i class="fas fa-running"></i>')
                    .click(MonksTokenBar.toggleMovement.bind(MonksTokenBar, combatant))
                ).insertBefore($('.token-effects', this));
            }
        })

    }
});

Hooks.on("renderTokenConfig", (app, html, data) => {
    if (game.user.isGM) {
        let include = app.token.getFlag('monks-tokenbar', 'include') || 'default';
        include = (include === true ? 'include' : (include === false ? 'exclude' : include || 'default'));
            //(app.object.actor != undefined && app.object.actor?.hasPlayerOwner && (game.user.isGM || app.object.actor?.isOwner) && (app.object.actor?.data.type != 'npc' || app.object.data.disposition == 1));
        $('<div>')
            .addClass('form-group')
            .append($('<label>').html('Show on Tokenbar'))
            .append($('<select>').attr('name', 'flags.monks-tokenbar.include')
                .append($('<option>').attr('value', 'default').html('Default').prop('selected', include == 'default'))
                .append($('<option>').attr('value', 'include').html('Include').prop('selected', include == 'include'))
                .append($('<option>').attr('value', 'exclude').html('Exclude').prop('selected', include == 'exclude')))
            .insertAfter($('[name="disposition"]', html).parent());

        app.setPosition();
    }
});
