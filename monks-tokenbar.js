import { registerSettings, divideXpOptions } from "./settings.js";
import { TokenBar } from "./apps/tokenbar.js";
import { AssignXP, AssignXPApp } from "./apps/assignxp.js";
import { SavingThrow, SavingThrowApp } from "./apps/savingthrow.js";
import { ContestedRoll, ContestedRollApp } from "./apps/contestedroll.js";
import { LootablesApp } from "./apps/lootables.js";
import { MonksTokenBarAPI } from "./monks-tokenbar-api.js";

import { BaseRolls } from "./systems/base-rolls.js";
import { DS4Rolls } from "./systems/ds4-rolls.js";
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
import { CoC7Rolls } from "./systems/coc7-rolls.js";

export let debug = (...args) => {
    if (MonksTokenBar.debugEnabled > 1) console.log("DEBUG: monks-tokenbar | ", ...args);
};
export let log = (...args) => console.log("monks-tokenbar | ", ...args);
export let warn = (...args) => {
    if (MonksTokenBar.debugEnabled > 0) console.warn("monks-tokenbar | ", ...args);
};
export let error = (...args) => console.error("monks-tokenbar | ", ...args);
export let i18n = key => {
    return game.i18n.localize(key);
};
export let setting = key => {
    return game.settings.get("monks-tokenbar", key);
};

export let makeid = () => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export const MTB_MOVEMENT_TYPE = {
    FREE: 'free',
    NONE: 'none',
    COMBAT: 'combat'
}

/*
export let manageTokenControl = (token, isShiftPressed) => {
    if (!token) return;

    const options = { releaseOthers: !isShiftPressed };
    const testControl = token._controlled && isShiftPressed;
    testControl ? token.release(options) : token.control(options);
}*/

export class MonksTokenBar {
    static tracker = false;
    static tokenbar = null;

    static debugEnabled = 0;

    static init() {
        log("initializing");
        // element statics
        //CONFIG.debug.hooks = true;

        MonksTokenBar.SOCKET = "module.monks-tokenbar";

        game.keybindings.register('monks-tokenbar', 'request-roll', {
            name: 'MonksTokenBar.RequestRoll',
            editable: [{ key: 'KeyR', modifiers: [KeyboardManager.MODIFIER_KEYS?.ALT] }],
            restricted: true,
            onDown: (data) => {
                new SavingThrowApp().render(true);
            },
        });

        game.keybindings.register('monks-tokenbar', 'request-roll-gm', {
            name: 'MonksTokenBar.RequestRollGM',
            editable: [{ key: 'KeyR', modifiers: [KeyboardManager.MODIFIER_KEYS?.ALT, KeyboardManager.MODIFIER_KEYS?.SHIFT] }],
            restricted: true,
            onDown: (data) => {
                new SavingThrowApp(null, {rollmode: "selfroll"}).render(true);
            },
        });

        registerSettings();

        /*
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
        }*/

        let canDrag = function (wrapped, ...args) {
            let result = wrapped(...args);
            return (MonksTokenBar.allowMovement(this.document, false) ? result : false);
        }

        if (game.modules.get("lib-wrapper")?.active) {
            libWrapper.register("monks-tokenbar", "Token.prototype._canDrag", canDrag, "WRAPPER");
        } else {
            const oldCanDrag = Token.prototype._canDrag;
            Token.prototype._canDrag = function (event) {
                return canDrag.call(this, oldCanDrag.bind(this), ...arguments);
            }
        }

        let sceneView = async function (wrapped, ...args) {
            if (MonksTokenBar.tokenbar) {
                MonksTokenBar.tokenbar.tokens = [];
                MonksTokenBar.tokenbar.refresh();
            }
            return await wrapped(...args);
        }

        if (game.modules.get("lib-wrapper")?.active) {
            libWrapper.register("monks-tokenbar", "Scene.prototype.view", sceneView, "WRAPPER");
        } else {
            const oldSceneView = Scene.prototype.view;
            Scene.prototype.view = function (event) {
                return sceneView.call(this, oldSceneView.bind(this), ...arguments);
            }
        }

        if (setting('token-size') != 50) {
            let innerHTML = `
#tokenbar .token {
    flex: 0 0 ${setting('token-size')}px;
    width: ${setting('token-size')};
}
`;
            let style = document.createElement("style");
            style.id = "monkstokenbar-css-changes";

            style.innerHTML = innerHTML;
            if (innerHTML != '')
                document.querySelector("head").appendChild(style);
        }
    }

    static getTokenEntries(tokens) {
        if (typeof tokens == 'string')
            tokens = tokens.split(',').map(function (item) { return item.trim(); });

        let findToken = function (t) {
            if (typeof t == 'string') {
                t = canvas.tokens.placeables.find(p => p.name == t || p.id == t) || game.actors.find(p => p.name == t || p.id == t);
            } else if (!(t instanceof Token || t instanceof Actor))
                t = null;

            return t;
        }

        tokens = (tokens || []).map(t => {
            if (typeof t == 'string' && t.startsWith('{') && t.endsWith('}'))
                t = JSON.parse(t);

            t = {
                token: findToken(typeof t == 'object' && t.token && t.constructor.name == 'Object' ? t.token : t),
                keys: { ctrlKey: t.ctrlKey, shiftKey: t.shiftKey, altKey: t.altKey, advantage: t.advantage, disadvantage: t.disadvantage },
                request: t.request,
                fastForward: t.fastForward
            };

            Object.defineProperty(t, 'id', {
                get: function () {
                    return this.token.id;
                }
            });

            return (!!t.token || !!t.request ? t: null);
        }).filter(c => !!c);

        return tokens;
    }

    static async chatCardAction(event) {
        if (!setting('capture-savingthrows'))
            return;

        let _getChatCardActor = async function (card) {
            // Case 1 - a synthetic actor from a Token
            if (card.dataset.tokenId) {
                const token = await fromUuid(card.dataset.tokenId);
                if (!token) return null;
                return token.actor;
            }

            // Case 2 - use Actor ID directory
            const actorId = card.dataset.actorId;
            return game.actors.get(actorId) || null;
        }

        let _getChatCardTargets = function (card) {
            let targets = canvas.tokens.controlled.filter(t => !!t.actor);
            if (!targets.length && game.user.character) targets = targets.concat(game.user.character.getActiveTokens());
            if (!targets.length) ui.notifications.warn(game.i18n.localize("DND5E.ActionWarningNoToken"));
            return targets;
        }

        // Extract card data
        const button = event.currentTarget;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;

        if (action === 'save') {
            if (!(game.user.isGM || message.isAuthor)) return;

            const actor = await _getChatCardActor(card);
            if (!actor) return;

            const storedData = message.getFlag("dnd5e", "itemData");
            const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);

            const targets = _getChatCardTargets(card);
            const entries = MonksTokenBar.getTokenEntries(targets);
            if (entries.length) {
                let savingthrow = new SavingThrowApp(entries, { request: 'save:' + button.dataset.ability, dc: item.system.save.dc });
                savingthrow.requestRoll();

                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
        }
    }

    static get stats() {
        let stats = setting('stats');
        return stats.default ? MonksTokenBar.system.defaultStats : stats;
    }

    static ready() {
        game.socket.on(MonksTokenBar.SOCKET, MonksTokenBar.onMessage);

        game.settings.settings.get("monks-tokenbar.stats").default = MonksTokenBar.system.defaultStats;

        if ((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar")) {
            MonksTokenBar.tokenbar = new TokenBar();
            MonksTokenBar.tokenbar.refresh();
        }

        if (game.user.isGM && setting('loot-sheet') != 'none' && game.modules.get(setting('loot-sheet'))?.active) {
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

    static playSound(sound, users) {
        AudioHelper.play({ src: sound }, (users == 'all' ? true : false));
        if (users != 'all' && (users.length > 1 || users[0] != game.user.id))
            MonksTokenBar.emit('playSound', { sound: sound, users: users });
    }

    static emit(action, args = {}) {
        args.action = action;
        args.senderId = game.user.id;
        game.socket.emit(MonksTokenBar.SOCKET, args, (resp) => { });
    }

    static onMessage(data) {
        switch (data.action) {
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
                if (data.tokenid == undefined || canvas.tokens.get(data.tokenid)?.isOwner) {
                    ui.notifications.warn(data.msg);
                    if (MonksTokenBar.tokenbar != undefined) {
                        MonksTokenBar.tokenbar.render(true);
                    }
                }
            } break;
            case 'refreshsheet': {
                if (game.user.id != data.senderId) {
                    let actor = canvas.tokens.get(data.tokenid)?.actor;
                    if (actor) {
                        actor._sheet = null;
                    }
                }
            } break;
            case 'playSound': {
                if (data.users.includes(game.user.id)) {
                    console.log('Playing sound', data.sound);
                    AudioHelper.play({ src: data.sound }, false);
                }
            } break;
            case 'renderLootable': {
                let entity = fromUuid(data.entityid).then(entity => {
                    if (game.modules.get('monks-enhanced-journal')?.active && setting('loot-sheet') == 'monks-enhanced-journal') {
                        if (!game.MonksEnhancedJournal.openJournalEntry(entity))
                            entity.sheet.render(true);
                    } else
                        entity.sheet.render(true);
                })
            }
        }
    }

    static manageTokenControl(tokens, options) {
        let { shiftKey, force } = options;

        //if !shift then release all currently selected
        if (!shiftKey || force)
            canvas.tokens.releaseAll();

        if (!tokens) return;
        tokens = (tokens instanceof Array ? tokens : [tokens]);

        //select all token for control
        const controlOptions = { releaseOthers: !shiftKey && !force };
        tokens.forEach(token => (token._controlled && shiftKey && tokens.length == 1 ? token.release(controlOptions) : token.control(controlOptions)));

        //document.getSelection().removeAllRanges();

        return !shiftKey;
    }

    static isMovement(movement) {
        return movement != undefined && MTB_MOVEMENT_TYPE[movement.toUpperCase()] != undefined;
    }

    static getDiceSound() {
        const has3DDiceSound = game.modules.get("dice-so-nice")?.active;
        return (!has3DDiceSound ? CONFIG.sounds.dice : null);
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
                await tokenbar.tokens[i].token.setFlag("monks-tokenbar", "movement", null);
                tokenbar.tokens[i].token.unsetFlag("monks-tokenbar", "notified");
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
            if (token instanceof Token)
                token = token.document;
            let oldMove = token.getFlag("monks-tokenbar", "movement");
            if (newMove != oldMove) {
                await token.setFlag("monks-tokenbar", "movement", newMove);
                await token.unsetFlag("monks-tokenbar", "notified");

                let dispMove = token.getFlag("monks-tokenbar", "movement") || game.settings.get("monks-tokenbar", "movement") || MTB_MOVEMENT_TYPE.FREE;
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

    static async changeTokenPanning(tokens) {
        if (tokens == undefined)
            return;

        tokens = tokens instanceof Array ? tokens : [tokens];

        log('Changing token panning', tokens);

        for (let token of tokens) {
            let oldPanning = token.getFlag("monks-tokenbar", "nopanning");
            await token.setFlag("monks-tokenbar", "nopanning", !oldPanning);
        }
    }

    static displayNotification(movement, token) {
        if (game.settings.get("monks-tokenbar", "notify-on-change")) {
            let msg = (token != undefined ? token.name + ": " : "") + i18n("MonksTokenBar.MovementChanged") + (movement == MTB_MOVEMENT_TYPE.FREE ? i18n("MonksTokenBar.FreeMovement") : (movement == MTB_MOVEMENT_TYPE.NONE ? i18n("MonksTokenBar.NoMovement") : i18n("MonksTokenBar.CombatTurn")));
            ui.notifications.warn(msg);
            log('display notification');
            MonksTokenBar.emit('movementchange',
                {
                    msg: msg,
                    tokenid: token?.id
                }
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
                    let curPermission = entry.actor?.ownership ?? {};
                    let tokPermission = token.actor?.ownership ?? {};
                    let ownedUsers = Object.keys(curPermission).filter(k => curPermission[k] === 3);
                    allowNpc = ownedUsers.some(u => tokPermission[u] === 3 && !game.users.get(u).isGM)
                        && curCombat.turns.every(t => { return t.tokenId !== token.id; });
                }

                log('Checking movement', entry.name, token.name, entry, token.id, token, allowNpc);
                return !(entry.tokenId == token.id || allowNpc || (setting("allow-after-movement") && curCombat.previous.tokenId == token.id));
            }

            return true;
        }

        if (!game.user.isGM && token != undefined) {
            let movement = token.getFlag("monks-tokenbar", "movement") || game.settings.get("monks-tokenbar", "movement") || MTB_MOVEMENT_TYPE.FREE;
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

                if (setting("loot-sheet") != 'none' && game.modules.get(setting("loot-sheet"))?.active) {
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

    static getNameList(list) {
        list = list.filter(g => g.groups);
        for (let attr of list) {
            attr.groups = duplicate(attr.groups);
            for (let [k, v] of Object.entries(attr.groups)) {
                attr.groups[k] = v?.label || v;
            }
        }

        return list;
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
        if (!MonksTokenBar.system.canGrab)
            return;

        if (MonksTokenBar.grabmessage != undefined) {
            $('#chat-log .chat-message[data-message-id="' + MonksTokenBar.grabmessage.id + '"]').removeClass('grabbing');
        }

        if (MonksTokenBar.grabmessage == message)
            MonksTokenBar.grabmessage = null;
        else {
            MonksTokenBar.grabmessage = message;
            if (message != undefined)
                $('#chat-log .chat-message[data-message-id="' + MonksTokenBar.grabmessage.id + '"]').addClass('grabbing');
        }

        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
        event.cancelBubble = true;
        event.returnValue = false;
    }

    static selectActors(message, filter, event) {
        let tokens = Object.entries(message.flags['monks-tokenbar'])
            .map(([k, v]) => { return (k.startsWith('token') ? v : null) })
            .filter(filter)
            .map(t => { return canvas.tokens.get(t?.id); })
            .filter(t => t);

        MonksTokenBar.manageTokenControl(tokens, { shiftKey: event?.originalEvent?.shiftKey, force: true });

        if (event) {
            if (event.stopPropagation) event.stopPropagation();
            if (event.preventDefault) event.preventDefault();
            event.cancelBubble = true;
            event.returnValue = false;
        }
    }

    static onClickMessage(message, html) {
        if (MonksTokenBar.grabmessage != undefined) {
            //make sure this message matches the grab message
            if (message.rolls.length) {
                let tokenId = message.speaker.token;
                let msgtoken = MonksTokenBar.grabmessage.getFlag('monks-tokenbar', 'token' + tokenId);

                if (msgtoken != undefined) {
                    if (MonksTokenBar.grabmessage.getFlag('monks-tokenbar', 'what') == 'contestedroll')
                        ContestedRoll.updateMessage([{ id: tokenId, roll: message.rolls[0] }], MonksTokenBar.grabmessage);
                    else
                        SavingThrow.updateMessage([{ id: tokenId, roll: message.rolls[0] }], MonksTokenBar.grabmessage);
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

    static getLootSheetOptions(lootType) {
        let lootsheetoptions = { 'none': 'Do not convert' };
        if (game.modules.get("lootsheetnpc5e")?.active)
            lootsheetoptions['lootsheetnpc5e'] = "Loot Sheet NPC 5e";
        if (game.modules.get("merchantsheetnpc")?.active)
            lootsheetoptions['merchantsheetnpc'] = "Merchant Sheet NPC";
        if (game.modules.get("item-piles")?.active)
            lootsheetoptions['item-piles'] = "Item Piles";
        if (game.modules.get("monks-enhanced-journal")?.active && game.modules.get("monks-enhanced-journal").version > "1.0.39" && lootType !='convert')
            lootsheetoptions['monks-enhanced-journal'] = "Monk's Enhanced Journal";

        return lootsheetoptions;
    }

    static refreshDirectory(data) {
        ui[data.name]?.render();
    }

    static async lootEntryListing(ctrl, html, collection = game.journal, uuid) {
        async function selectItem(event) {
            event.preventDefault();
            event.stopPropagation();
            let id = event.currentTarget.dataset.uuid;
            $(`[name="monks-enhanced-journal.loot-entity"]`, html).val(id);

            let name = await getEntityName(id);

            $('.journal-select-text', ctrl.next()).html(name);
            $('.journal-list.open').removeClass('open');
            $(event.currentTarget).addClass('selected').siblings('.selected').removeClass('selected');
        }

        async function getEntityName(id) {
            let entity = null;
            try {
                entity = (id ? await fromUuid(id) : null);
            } catch { }

            if (entity instanceof JournalEntryPage || entity instanceof Actor)
                return "Adding to " + entity.name;
            else if (entity instanceof JournalEntry)
                return "Adding new loot page to " + entity.name;
            else if (entity instanceof Folder)
                return (game.journal.documentName == "JournalEntry" ? "Creating new Journal Entry within " + entity.name + " folder" : "Creating within " + entity.name + " folder");
            else
                return "Creating in the root folder";
        }

        function getEntries(folderID, contents) {
            let result = [$('<li>').addClass('journal-item create-item').attr('data-uuid', folderID).html($('<div>').addClass('journal-title').toggleClass('selected', uuid == undefined).html("-- create entry here --")).click(selectItem.bind())];
            return result.concat((contents || [])
                .filter(c => {
                    return c instanceof JournalEntry && c.pages.size == 1 && getProperty(c.pages.contents[0], "flags.monks-enhanced-journal.type") == "loot"
                })
                .sort((a, b) => { return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0; })
                .map(e => {
                    return $('<li>').addClass('journal-item flexrow').toggleClass('selected', uuid == e.uuid).attr('data-uuid', e.uuid).html($('<div>').addClass('journal-title').html(e.name)).click(selectItem.bind())
                }));
        }

        function createFolder(folder, icon = "fa-folder-open") {
            return $('<li>').addClass('journal-item folder flexcol collapse').append($('<div>').addClass('journal-title').append($("<i>").addClass(`fas ${icon}`)).append(folder.name)).append(
                $('<ul>')
                    .addClass('subfolder')
                    .append(getFolders(folder?.children?.map(c => c.folder)))
                    .append(getEntries(folder.uuid, folder.documents || folder.contents)))
                .click(function (event) { event.preventDefault(); event.stopPropagation(); $(this).toggleClass('collapse'); });
        }

        function getFolders(folders) {
            return (folders || []).sort((a, b) => { return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0; }).map(f => {
                return createFolder(f);
            });
        }

        let list = $('<ul>')
            .addClass('journal-list')
            .append($('<li>').addClass('journal-item convert-item').attr('data-uuid', 'convert').toggle(collection.name == "Actors").html($('<div>').addClass('journal-title').toggleClass('selected', uuid == 'convert').html("-- convert tokens --")).click(selectItem.bind()))
            .append(getFolders(collection.directory.folders.filter(f => f.folder == null)))
            .append(getEntries(null, collection.contents.filter(j => j.folder == null)));

        $(html).click(function () { list.removeClass('open') });

        let name = await getEntityName(uuid);

        return $('<div>')
            .addClass('journal-select')
            .attr('tabindex', '0')
            .append($('<div>').addClass('flexrow').css({ font: ctrl.css('font') }).append($('<span>').addClass("journal-select-text").html(name)).append($('<i>').addClass('fas fa-chevron-down')))
            .append(list)
            .click(function (evt) { $('.journal-list', html).removeClass('open'); list.toggleClass('open'); evt.preventDefault(); evt.stopPropagation(); });
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
                this.token.unsetFlag("monks-tokenbar", "nofified");
            });
        }

        if (delta.round === 1 && combat.turn === 0 && combat.started === true && setting("change-to-combat")) {
            MonksTokenBar.changeGlobalMovement(MTB_MOVEMENT_TYPE.COMBAT);
        }
    }
});

Hooks.on("setup", () => {
    MonksTokenBar.system = new BaseRolls();
    switch (game.system.id.toLowerCase()) {
        case 'dnd5e':
            MonksTokenBar.system = new DnD5eRolls(); break;
        case 'sw5e':
            MonksTokenBar.system = new SW5eRolls(); break;
        case 'd35e':
            MonksTokenBar.system = new D35eRolls(); break;
        case 'dnd4ebeta':
        case 'dnd4e':
            MonksTokenBar.system = new DnD4eRolls(); break;
        case 'ds4':
            MonksTokenBar.system = new DS4Rolls(); break;
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
        case 'coc7':
            MonksTokenBar.system = new CoC7Rolls(); break;
    }

    MonksTokenBar.system.constructor.activateHooks();
});

Hooks.on("ready", MonksTokenBar.ready);

Hooks.on('preUpdateToken', (document, update, options, userId) => {
    if ((update.x != undefined || update.y != undefined) && !game.user.isGM) {
        let allow = MonksTokenBar.allowMovement(document);
        if (!allow) {
            delete update.x;
            delete update.y;
        }
    }
});

Hooks.on("getSceneControlButtons", (controls) => {
    if (game.user.isGM && setting('show-lootable-menu') && setting('loot-sheet') != 'none' && MonksTokenBar.getLootSheetOptions()[setting('loot-sheet')] != undefined) {
        let tokenControls = controls.find(control => control.name === "token")
        tokenControls.tools.push({
            name: "togglelootable",
            title: "MonksTokenBar.Lootables",
            icon: "fas fa-dolly-flatbed",
            onClick: () => {
                if (setting('loot-sheet') == 'none') {
                    ui.notifications.warn('No lootsheet selected');
                    return;
                }
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

    $('[name="monks-tokenbar.loot-sheet"]', html).on('change', async () => {
        let sheet = $('[name="monks-tokenbar.loot-sheet"]', html).val();

        let hasLootable = sheet != 'none' && MonksTokenBar.getLootSheetOptions()[sheet] != undefined;
        $('[name="monks-tokenbar.loot-entity"]', html).closest('.form-group').toggle(hasLootable);
        $('[name="monks-tokenbar.open-loot"]', html).closest('.form-group').toggle(hasLootable);
        $('[name="monks-tokenbar.show-lootable-menu"]', html).closest('.form-group').toggle(hasLootable);

        let entityid = setting('loot-entity');
        let ctrl = $('[name="monks-tokenbar.loot-entity"]', html);
        if (ctrl.next().hasClass("journal-select"))
            ctrl.next().remove();
        let list = await MonksTokenBar.lootEntryListing(ctrl, html, (sheet == "monks-enhanced-journal" ? game.journal : game.actors), entityid);
        list.insertAfter(ctrl);
        ctrl.hide();
    }).change();

    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenbar.TokenbarSettings")).insertBefore($('[name="monks-tokenbar.allow-player"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenbar.IconSettings")).insertBefore($('[name="monks-tokenbar.token-size"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenbar.MovementSettings")).insertBefore($('[name="monks-tokenbar.notify-on-change"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenbar.AfterCombatSettings")).insertBefore($('[name="monks-tokenbar.send-levelup-whisper"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenbar.RequestRollSettings")).insertBefore($('[name="monks-tokenbar.allow-roll"]').parents('div.form-group:first'));
});

Hooks.on("renderCombatTracker", (app, html, data) => {
    if (setting("show-on-tracker") && game.user.isGM) {
        $('.combatant', html).each(function () {
            let id = this.dataset.combatantId;
            let combatant = app.viewed.combatants.find(c => c.id == id);
            if (combatant && combatant.hasPlayerOwner && combatant.token) {
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
        //(app.object.actor != undefined && app.object.actor?.hasPlayerOwner && (game.user.isGM || app.object.actor?.isOwner) && (app.object.actor?.type != 'npc' || app.object.document.disposition == 1));
        let group = $('<div>')
            .addClass('form-group')
            .append($('<label>').html('Show on Tokenbar'))
            .append($('<select>').attr('name', 'flags.monks-tokenbar.include')
                .append($('<option>').attr('value', 'default').html('Default').prop('selected', include == 'default'))
                .append($('<option>').attr('value', 'include').html('Include').prop('selected', include == 'include'))
                .append($('<option>').attr('value', 'exclude').html('Exclude').prop('selected', include == 'exclude')));

        $('div[data-tab="character"]', html).append(group);

        app.setPosition();
    }
});

Hooks.on("renderChatMessage", (message, html, data) => {
    $('.item-card button[data-action="save"]', html).click(MonksTokenBar.chatCardAction.bind(message));

    if (message.rolls.length != undefined && message.isRoll) {
        //check grab this roll
        if (MonksTokenBar.system.canGrab)
            $(html).on('click', $.proxy(MonksTokenBar.onClickMessage, MonksTokenBar, message, html));
    }
});

Hooks.on("setupTileActions", (app) => {
    app.registerTileGroup('monks-tokenbar', "Monk's Token Bar");
    app.registerTileAction('monks-tokenbar', 'setmovement', {
        name: 'Change Movement Mode',
        stop: true,
        ctrls: [
            {
                id: "global",
                name: "Change Global Movement",
                type: "checkbox",
                onClick: (app) => {
                    app.checkConditional();
                    app.setPosition({ height: 'auto' });
                },
                defvalue: true
            },
            {
                id: "entity",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                options: { showToken: true, showWithin: true, showPlayers: true, showPrevious: true },
                restrict: (entity) => { return (entity instanceof Token); },
                conditional: (app) => {
                    return !$('input[name="data.global"]', app.element).prop('checked');
                }
            },
            {
                id: "movement",
                name: "Allow Movement",
                list: "movement",
                type: "list"
            }
        ],
        group: 'monks-tokenbar',
        values: {
            'movement': {
                "none": 'MonksTokenBar.NoMovement',
                "free": 'MonksTokenBar.FreeMovement',
                "combat": 'MonksTokenBar.CombatTurn'
            }
        },
        fn: async (args = {}) => {
            const { action } = args;

            if (!!action.data.global)
                MonksTokenBar.changeGlobalMovement(action.data.movement);
            else {
                let entities = await game.MonksActiveTiles.getEntities(args);
                MonksTokenBar.changeTokenMovement((typeof action.data.movement == 'boolean' ? (action.data.movement ? MTB_MOVEMENT_TYPE.FREE : MTB_MOVEMENT_TYPE.NONE) : action.data.movement), entities);
                return { tokens: entities };
            }
        },
        content: async (trigger, action) => {
            let entityName = (!!action.data.global ? 'Everyone' : await game.MonksActiveTiles.entityName(action.data?.entity));
            return `<span class="action-style">${trigger.name}</span> of <span class="entity-style">${entityName}</span> to <span class="details-style">"${i18n(trigger.values.movement[action.data?.movement])}"</span>`;
        }
    });

    app.registerTileAction('monks-tokenbar', 'requestroll', {
        name: 'Request Roll',
        ctrls: [
            {
                id: "entity",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                options: { showTile: false, showToken: true, showWithin: true, showPlayers: true, showPrevious: true },
                restrict: (entity) => { return (entity instanceof Token); }
            },
            {
                id: "request",
                name: "Request",
                list: () => { return MonksTokenBar.getNameList(MonksTokenBar.system._requestoptions); },
                type: "list",
                required: true
            },
            {
                id: "dc",
                name: "DC",
                type: "number"
            },
            {
                id: "flavor",
                name: "Flavor Text",
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
                id: "usetokens",
                name: "Continue with",
                list: "usetokens",
                type: "list"
            },
            {
                id: "continue",
                name: "Continue if",
                list: "continue",
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
            'usetokens': {
                "all": "All Tokens",
                "fail": "Tokens that Fail",
                "succeed": "Tokens that Succeed"
            },
            'continue': {
                "always": "Always",
                "failed": "Any Failed",
                "passed": "Any Passed",
                "allfail": "All Failed",
                "allpass": "All Passed"
            }
        },
        group: 'monks-tokenbar',
        fn: async (args = {}) => {
            const { action, tile } = args;
            let entities = await game.MonksActiveTiles.getEntities(args);

            //if (entities.length == 0)
            //    return;

            entities = entities.map(e => e.object);

            let savingthrow = new SavingThrowApp(MonksTokenBar.getTokenEntries(entities), { rollmode: action.data.rollmode, request: action.data.request, dc: action.data.dc, flavor: action.data.flavor });
            savingthrow['active-tiles'] = { id: args._id, tile: args.tile.uuid, action: action };
            if (action.data.silent === true) {
                let msg = await savingthrow.requestRoll();
                if (action.data.fastforward === true) {
                    //need to delay slightly so the original action has time to save a state properly.
                    window.setTimeout(function () {
                        SavingThrow.onRollAll('all', msg);
                    }, 100);
                }
            }
            else
                savingthrow.render(true);

            //if we got here then we need to pause before continuing and wait until the request has been fulfilled
            return { pause: true };
        },
        content: async (trigger, action) => {
            let parts = action.data?.request.split(':');
            let requesttype = (parts.length > 1 ? parts[0] : '');
            let request = (parts.length > 1 ? parts[1] : parts[0]);
            let name = MonksTokenBar.getRequestName(MonksTokenBar.system.requestoptions, requesttype, request);
            let entityName = await game.MonksActiveTiles.entityName(action.data?.entity);
            return `<span class="action-style">${name}</span>${(action.data?.dc ? ', <span class="details-style">"DC' + action.data?.dc + '"</span>' : '')} for <span class="entity-style">${entityName}</span> ${(action.data?.usetokens != 'all' || action.data?.continue != 'always' ? ", Continue " + (action.data?.continue != 'always' ? ' if ' + trigger.values.continue[action.data?.continue] : '') + (action.data?.usetokens != 'all' ? ' with ' + trigger.values.usetokens[action.data?.usetokens] : '') : '')}`;
        }
    });

    app.registerTileAction('monks-tokenbar', 'requestcontested', {
        name: 'Request Contested Roll',
        ctrls: [
            {
                id: "entity1",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                required: true,
                options: { showTile: false, showToken: true, showWithin: true, showPlayers: true, showPrevious: true },
                restrict: (entity) => { return (entity instanceof Token); },
                defaultType: 'tokens',
                placeholder: "Please select a token"
            },
            {
                id: "request1",
                name: "Request",
                list: () => { return MonksTokenBar.getNameList(MonksTokenBar.system.contestedoptions); },
                type: "list",
                required: true
            },
            {
                id: "entity2",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                required: true,
                options: { showTile: false, showToken: true, showWithin: true, showPlayers: true },
                restrict: (entity) => { return (entity instanceof Token); },
                defaultType: 'tokens',
                placeholder: "Please select a token"
            },
            {
                id: "request2",
                name: "Request",
                list: () => { return MonksTokenBar.getNameList(MonksTokenBar.system.contestedoptions); },
                type: "list",
                required: true
            },
            {
                id: "flavor",
                name: "Flavor Text",
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
                id: "usetokens",
                name: "Continue with",
                list: "usetokens",
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
            'usetokens': {
                "all": "All Tokens",
                "fail": "Tokens that Fail",
                "succeed": "Tokens that Succeed"
            },
        },
        group: 'monks-tokenbar',
        fn: async (args = {}) => {
            const { action, tile } = args;
            let entities1 = await game.MonksActiveTiles.getEntities(args, "tokens", action.data.entity1);
            let entities2 = await game.MonksActiveTiles.getEntities(args, "tokens", action.data.entity2);

            //if (entities1.length == 0 || entities2.length == 0)
            //    return;

            let entity1 = entities1[0].object;
            let entity2 = entities2[0].object;
            if (entity1.id == entity2.id && entities2.length > 1)
                entity2 = entities2[1].object;

            if (entity1.id == entity2.id)
                return;

            let request1 = mergeObject((MonksTokenBar.getTokenEntries([entity1])[0] || {}), { request: action.data.request1 });
            let request2 = mergeObject((MonksTokenBar.getTokenEntries([entity2])[0] || {}), { request: action.data.request2 });

            let contested = new ContestedRollApp(
                [request1, request2],
                { rollmode: action.data.rollmode, request: action.data.request, flavor: action.data.flavor });
            contested['active-tiles'] = { id: args._id, tile: args.tile.uuid, action: action };
            if (action.data.silent === true) {
                let msg = await contested.requestRoll();
                if (action.data.fastforward === true) {
                    //need to delay slightly so the original action has time to save a state properly.
                    window.setTimeout(function () {
                        ContestedRoll.onRollAll('all', msg);
                    }, 100);
                }
            }
            else
                contested.render(true);

            //if we got here then we need to pause before continuing and wait until the request has been fulfilled
            return { pause: true };
        },
        content: async (trigger, action) => {
            let parts = action.data?.request1.split(':');
            let requesttype = (parts.length > 1 ? parts[0] : '');
            let request = (parts.length > 1 ? parts[1] : parts[0]);
            let name1 = MonksTokenBar.getRequestName(MonksTokenBar.system.requestoptions, requesttype, request);
            parts = action.data?.request2.split(':');
            requesttype = (parts.length > 1 ? parts[0] : '');
            request = (parts.length > 1 ? parts[1] : parts[0]);
            let name2 = MonksTokenBar.getRequestName(MonksTokenBar.system.requestoptions, requesttype, request);

            let entityName1 = await game.MonksActiveTiles.entityName(action.data?.entity1);
            let entityName2 = await game.MonksActiveTiles.entityName(action.data?.entity2);
            return `<span class="action-style">Contested Roll</span> <span class="entity-style">${entityName1}</span> <span class="details-style">"${name1}"</span> vs. <span class="entity-style">${entityName2}</span> <span class="details-style">"${name2}"</span> ${(action.data?.usetokens != 'all' ? ", Continue with " + trigger.values.usetokens[action.data?.usetokens] : '')}`;
        }
    });

    app.registerTileAction('monks-tokenbar', 'filterrequest', {
        name: 'Redirect Request Results',
        group: 'logic',
        ctrls: [
            {
                id: "passed",
                name: "Passed Tokens Goto",
                type: "text"
            },
            {
                id: "failed",
                name: "Failed Tokens Goto",
                type: "text"
            },
            {
                id: "resume",
                name: "Continue to Landing",
                type: "text"
            },
        ],
        group: 'filters',
        fn: async (args = {}) => {
            const { action, value } = args;

            let goto = [];
            if (action.data.failed) {
                let data = { tokens: await Promise.all((value.tokenresults || []).filter(r => !r.passed).map(async (t) => { return await fromUuid(t.uuid); })), tag: action.data.failed };
                if (data.tokens.length)
                    goto.push(data);
            }

            if (action.data.passed) {
                let data = { tokens: await Promise.all((value.tokenresults || []).filter(r => r.passed).map(async (t) => { return await fromUuid(t.uuid); })), tag: action.data.passed };
                if (data.tokens.length)
                    goto.push(data);
            }

            if (action.data.resume)
                goto.push({ tokens: value.tokens, tag: action.data.resume });

            return { goto: goto };
        },
        content: async (trigger, action) => {
            return `<span class="logic-style">${trigger.name}</span>${(action.data.passed ? ', Passed goto <span class="tag-style">' + action.data.passed + '</span>' : '')}${(action.data.failed ? ', Failed goto <span class="tag-style">' + action.data.failed + '</span>' : '')}${(action.data.resume ? ', Resume at <span class="tag-style">' + action.data.resume + '</span>' : '')}`;
        }
    });

    app.registerTileAction('monks-tokenbar', 'assignxp', {
        name: 'Assign XP',
        ctrls: [
            {
                id: "entity",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                options: { showTile: false, showToken: true, showWithin: true, showPlayers: true, showPrevious: true },
                restrict: (entity) => { return (entity instanceof Token); }
            },
            {
                id: "xp",
                name: "XP",
                required: true,
                type: "number"
            },
            {
                id: "reason",
                name: "Reason",
                type: "text"
            },
            {
                id: "dividexp",
                name: "Divide XP",
                list: () => {
                    return divideXpOptions
                },
                type: "list"
            }
        ],
        group: 'monks-tokenbar',
        fn: async (args = {}) => {
            const { action, tile } = args;
            let entities = await game.MonksActiveTiles.getEntities(args);

            if (entities.length == 0)
                return;

            entities = entities.map(e => e.object);

            let assignxp = new AssignXPApp(entities, { xp: action.data.xp, reason: action.data.reason, dividexp: action.data.dividexp});
            if (action.data.silent === true)
                assignxp.assign();
            else
                assignxp.render(true);

        },
        content: async (trigger, action) => {
            let entityName = await game.MonksActiveTiles.entityName(action.data?.entity);
            return `<span class="action-style">${trigger.name}</span> <span class="details-style">"${action.data?.xp}XP"</span> to <span class="entity-style">${entityName}</span>`;
        }
    });
});
