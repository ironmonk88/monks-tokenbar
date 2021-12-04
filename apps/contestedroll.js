import { MonksTokenBar, log, i18n, setting } from "../monks-tokenbar.js";

export class ContestedRollApp extends Application {
    constructor(item0, item1, options = {}) {
        super(options);
        this.opts = options;

        this.item0 = item0 || {token: null, request: null};
        this.item0.token = (this.item0.token || (canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled[0] : null));
        this.item0.request = (this.item0.request || MonksTokenBar.system.defaultContested());
        this.item1 = item1 || { token: null, request: null };
        this.item1.token = (this.item1.token || (game.user.targets.values()?.next()?.value || (canvas.tokens.controlled.length > 1 ? canvas.tokens.controlled[1] : null)));
        this.item1.request = (this.item1.request || MonksTokenBar.system.defaultContested());

        this.rollmode = options?.rollmode || (game.user.getFlag("monks-tokenbar", "lastmodeCR") || 'roll');
        this.requestoptions = (options.requestoptions || MonksTokenBar.system.contestedoptions);
        this.hidenpcname = (options?.hidenpcname != undefined ? options?.hidenpcname : null) || (game.user.getFlag("monks-tokenbar", "lastmodeHideNPCName") != undefined ? game.user.getFlag("monks-tokenbar", "lastmodeHideNPCName") : null) || false;
        this.flavor = options.flavor;
    }

    static get defaultOptions() {
        let top = ($('#tokenbar').position()?.top || $('#hotbar').position()?.top || 300) - 260;
        return mergeObject(super.defaultOptions, {
            id: "contestedroll",
            title: i18n("MonksTokenBar.ContestedRoll"),
            template: "./modules/monks-tokenbar/templates/contestedroll.html",
            width: 450,
            height: 280,
            top: top,
            popOut: true
        });
    }

    getData(options) {
        return {
            item0: this.item0,
            item1: this.item1,
            rollmode: this.rollmode,
            options: this.requestoptions,
            hidenpcname: this.hidenpcname
        };
    }

    removeToken(e) {
        let item = $(e.currentTarget).attr('data-type');
        this[item].token = null;
        this.render(true);
    }

    async request() {
        let msg = null;
        if (this.item0.token != undefined && this.item1.token != undefined) {
            let tokens = [this.item0, this.item1].map((item, index) => {
                let parts = this['item' + index].request.split(':'); //$('.request-roll[data-type="item' + index + '"]', this.element).val().split(':');
                let requesttype = (parts.length > 1 ? parts[0] : '');
                let request = (parts.length > 1 ? parts[1] : parts[0]);
                let requestname = MonksTokenBar.getRequestName(this.requestoptions, requesttype, request);
                //let requestname = $('.request-roll[data-type="item' + index + '"] option:selected', this.element).html() + " " + (requesttype == 'ability' ? i18n("MonksTokenBar.AbilityCheck") : (requesttype == 'save' ? i18n("MonksTokenBar.SavingThrow") : i18n("MonksTokenBar.Check")));
                return {
                    id: item.token.id,
                    uuid: item.token.document.uuid,
                    actorid: item.token.actor.id,
                    requesttype: requesttype,
                    request: request,
                    requestname: requestname,
                    icon: (VideoHelper.hasVideoExtension(item.token.data.img) ? item.token.actor.data.img : item.token.data.img),
                    name: item.token.name,
                    showname: item.token.actor.hasPlayerOwner || this.hidenpcname !== true,
                    showtoken: item.token.actor.hasPlayerOwner || item.token.data.hidden !== true,
                    npc: item.token.actor.hasPlayerOwner,
                    passed: 'waiting'
                };
            });
            
            let flavor = this.flavor;
            let rollmode = this.rollmode; //$('#contestedroll-rollmode', this.element).val();
            game.user.setFlag("monks-tokenbar", "lastmodeCR", rollmode);
            game.user.setFlag("monks-tokenbar", "lastmodeHideNPCName", this.hidenpcname);
            let modename = (rollmode == 'roll' ? i18n("MonksTokenBar.PublicRoll") : (rollmode == 'gmroll' ? i18n("MonksTokenBar.PrivateGMRoll") : (rollmode == 'blindroll' ? i18n("MonksTokenBar.BlindGMRoll") : i18n("MonksTokenBar.SelfRoll"))));
            let requestdata = {
                rollmode: rollmode,
                modename: modename,
                tokens: tokens,
                canGrab: ['dnd5e', 'sw5e'].includes(game.system.id),
                options: this.opts
            };
            const html = await renderTemplate("./modules/monks-tokenbar/templates/contestedrollchatmsg.html", requestdata);

            delete requestdata.tokens;
            delete requestdata.canGrab;
            for (let i = 0; i < tokens.length; i++)
                requestdata["token" + tokens[i].id] = tokens[i];
            //requestdata.tokens = tokens.map(t => t.id);

            log('create chat request');
            let chatData = {
                user: game.user.id,
                content: html,
                flavor: flavor
            };
            if (rollmode == 'selfroll')
                chatData.whisper = [game.user.id];
            else if (rollmode == 'blindroll') {
                chatData.whisper = [game.user.id];
                for (let item of [this.item0, this.item1]) {
                    if (item.token.actor != undefined) {
                        for (var key in item.token.actor.data.permission) {
                            if (key != 'default' && item.token.actor.data.permission[key] >= CONST.ENTITY_PERMISSIONS.OWNER) {
                                if (chatData.whisper.find(t => t == key) == undefined)
                                    chatData.whisper.push(key);
                            }
                        }
                    }
                }
            }
            //chatData.flags["monks-tokenbar"] = {"testmsg":"testing"};
            setProperty(chatData, "flags.monks-tokenbar", requestdata);
            msg = await ChatMessage.create(chatData, {});
            if (setting('request-roll-sound-file') != '' && rollmode != 'selfroll')
                AudioHelper.play({ src: setting('request-roll-sound-file') }, true);
            this.close();
            return msg;
        } else
            ui.notifications.warn(i18n("MonksTokenBar.RequestActorMissing"));
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('.item-delete', html).click($.proxy(this.removeToken, this));

        $('.dialog-buttons.request', html).click($.proxy(this.request, this));

        $('#contestedroll-hidenpc', html).change($.proxy(function (e) {
            this.hidenpcname = $(e.currentTarget).is(':checked');
        }, this));

        $('.request-roll', html).change($.proxy(function (e) {
            this[e.target.dataset.type].request = $(e.currentTarget).val();
        }, this));
        $('#contestedroll-rollmode', html).change($.proxy(function (e) {
            this.rollmode = $(e.currentTarget).val();
        }, this));
    };
}

export class ContestedRoll {
    /*
     *         if (!game.user.isGM) {
            game.socket.emit(
                MonksTokenBar.SOCKET,
                {
                    msgtype: 'rollability',
                    type: 'contestedroll',
                    senderId: game.user.id,
                    response: [{ actorid: actorid, roll: roll }],
                    msgid: message.id
                },
                (resp) => { }
            );
        } else {
            const revealDice = game.dice3d ? game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") : true;
            await ContestedRoll.updateContestedRoll([{ actorid: actorid, roll: roll }], message, revealDice && !fastForward);
        }*/
    static async rollDice(dice) {
        let r = new Roll(dice);
        r.evaluate();
        return r;
    }

    static async returnRoll (id, roll, actor, rollmode) {
        log("Roll", roll, actor);

        if (roll != undefined) {
            let finishroll;
            if (game.dice3d != undefined && roll instanceof Roll) { // && !fastForward) {
                let whisper = (rollmode == 'roll' ? null : ChatMessage.getWhisperRecipients("GM").map(w => { return w.id }));
                if (rollmode == 'gmroll' && !game.user.isGM)
                    whisper.push(game.user.id);

                finishroll = game.dice3d.showForRoll(roll, game.user, true, whisper, (rollmode == 'blindroll' && !game.user.isGM)).then(() => {
                    return { id: id, reveal: true, userid: game.userId };
                });
            }
            const sound = MonksTokenBar.getDiceSound();
            if (sound != undefined)
                AudioHelper.play({ src: sound });

            return { id: id, roll: roll, finish: finishroll };
        }
    }

    static async _rollAbility(data, request, requesttype, rollmode, ffwd, e) {
        //let actor = game.actors.get(data.actorid);
        let tokenOrActor = await fromUuid(data.uuid)
        let actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

        let fastForward = ffwd || (e && (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey));       

        if (actor != undefined) {
            if (requesttype == 'dice') {
                //roll the dice
                return ContestedRoll.rollDice(request).then((roll) => { return returnRoll(roll); });
            } else {
                if (MonksTokenBar.system._supportedSystem) { //game.system.id == 'dnd5e' || game.system.id == 'sw5e' || game.system.id == 'pf1' || game.system.id == 'pf2e' || game.system.id == 'tormenta20' || game.system.id == 'ose' || game.system.id == 'sfrpg') {
                    return MonksTokenBar.system.roll({ id: data.id, actor: actor, request: request, requesttype: requesttype, fastForward: fastForward }, function (roll) {
                        return ContestedRoll.returnRoll(data.id, roll, actor, rollmode);
                    }, e);
                } else
                    ui.notifications.warn(i18n("MonksTokenBar.UnknownSystem"));
            }
        }

            /*let actors = message.getFlag('monks-tokenbar', 'actors');
            let msgactor = actors.find(a => { return a.id == actorid; });
            if (msgactor != undefined && msgactor.roll == undefined) {
                let request = msgactor.request;
                let requesttype = msgactor.requesttype;

                let roll = null;
                if (game.system.id == 'dnd5e' || game.system.id == 'sw5e') {
                    let options = { fastForward: fastForward, chatMessage: false, event: e };
                    if (requesttype == 'ability')
                        roll = await actor.rollAbilityTest(request, options);
                    else if (requesttype == 'save')
                        roll = await actor.rollAbilitySave(request, options);
                    else if (requesttype == 'skill')
                        roll = await actor.rollSkill(request, options);
                }else if (game.system.id == 'tormenta20') {
                    let opts = request;
                    if (requesttype == 'ability') {
                        roll = await actor.rollAtributo(actor, opts, e);
                    }
                    else if (requesttype == 'save' || requesttype == 'skill') {
                        opts = {
                            actor: actor,
                            type: "perícia",
                            data: actor.data.data.pericias[opts],
                            name: actor.data.data.pericias[opts].label,
                            id: opts
                        };
                        roll = actor.rollPericia(actor, opts, e);
                    }
                } else if (game.system.id == 'pf2e') {
                    let rollfn = null;
                    let opts = request;
                    if (requesttype == 'attribute') {
                        if (actor.data.data.attributes[request]?.roll) {
                            opts = actor.getRollOptions(["all", request]);
                            rollfn = actor.data.data.attributes[request].roll;
                        } else
                            rollfn = actor.rollAttribute;
                    }
                    else if (requesttype == 'ability') {
                        rollfn = function (event, abilityName) {
                            const skl = this.data.data.abilities[abilityName],
                                flavor = `${CONFIG.PF2E.abilities[abilityName]} Check`;
                            return DicePF2e.d20Roll({
                                event: event,
                                parts: ["@mod"],
                                data: {
                                    mod: skl.mod
                                },
                                title: flavor,
                                speaker: ChatMessage.getSpeaker({
                                    actor: this
                                }),
                                rollType: 'ignore'
                            });
                        }
                    }
                    else if (requesttype == 'save') {
                        if (actor.data.data.saves[request]?.roll) {
                            opts = actor.getRollOptions(["all", "saving-throw", request]);
                            rollfn = actor.data.data.saves[request].roll;
                        } else
                            rollfn = actor.rollSave;
                    }
                    else if (requesttype == 'skill') {
                        if (actor.data.data.skills[request]?.roll) {
                            opts = actor.getRollOptions(["all", "skill-check", request]);
                            rollfn = actor.data.data.skills[request].roll;
                        } else
                            rollfn = actor.rollSkill;
                    }

                    if (rollfn != undefined) {
                        if (requesttype == 'ability')
                            roll = await rollfn.call(actor, e, opts);
                        else {
                            opts.push("ignore");
                            rollfn.call(actor, e, opts, returnRoll);
                        }
                    } else
                        ui.notifications.warn(actor.name + i18n("MonksTokenBar.ActorNoRollFunction"));
                }
                else if (game.system.id == 'ose') {
                    let rollfn = null;
                    let options = { fastForward: fastForward, chatMessage: false, event: e };
                    if (requesttype == 'scores') {
                        rollfn = actor.rollCheck;
                    } else if (requesttype == 'save') {
                        rollfn = actor.rollSave;
                    }
                    if (rollfn != undefined) {
                        rollfn.call(actor, request, options).then((roll) => { return returnRoll(roll); });
                    }
                    else ui.notifications.warn(actor.name + ' ' + i18n("MonksTokenBar.ActorNoRollFunction"));
                } else
                    ui.notifications.warn(actor.name + ' ' + i18n("MonksTokenBar.ActorNoRollFunction"));

                if (roll != undefined) {
                    returnRoll(roll);
                }
            }
        }
        return message;*/

    }

    static async onRollAbility(ids, message, fastForward = false, e) {
        if (ids == undefined) return;
        if (!$.isArray(ids))
            ids = [ids];

        let flags = message.data.flags['monks-tokenbar'];
        let rollmode = message.getFlag('monks-tokenbar', 'rollmode');

        let promises = [];
        for (let id of ids) {
            let msgtoken = flags["token" + id];
            if (msgtoken != undefined && msgtoken.roll == undefined) {
                //let actor = game.actors.get(msgtoken.actorid);
                let tokenOrActor = await fromUuid(msgtoken.uuid);
                let actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
                
                if (actor != undefined) {
                    //roll the dice, using standard details from actor
                    promises.push(ContestedRoll._rollAbility({ id: id, uuid: msgtoken.uuid }, msgtoken.request, msgtoken.requesttype, rollmode, fastForward, e));
                }
            }
        };

        Promise.all(promises).then(response => {
            log('roll all finished', response);
            if (!game.user.isGM) {
                let responses = response.map(r => { return { id: r.id, roll: r.roll }; });
                game.socket.emit(
                    MonksTokenBar.SOCKET,
                    {
                        msgtype: 'rollability',
                        type: 'contestedroll',
                        senderId: game.user.id,
                        msgid: message.id,
                        response: responses
                    },
                    (resp) => { }
                );

                let promises = response.filter(r => r.finish != undefined).map(r => { return r.finish; });
                if (promises.length) {
                    Promise.all(promises).then(response => {
                        ContestedRoll.finishRolling(response, message);
                    });
                }
            } else {
                const revealDice = game.dice3d ? game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") : true;
                ContestedRoll.updateMessage(response, message, revealDice);
            }
        });

    }

    static async updateMessage(updates, message, reveal = true) {
        if (updates == undefined) return;

        let content = $(message.data.content);

        let flags = {};
        let promises = [];

        for (let update of updates) {
            if (update != undefined) {
                let msgtoken = duplicate(message.getFlag('monks-tokenbar', 'token' + update.id));
                log('updating actor', msgtoken, update.roll);

                if (update.roll) {
                    let tooltip = '';
                    if (update.roll instanceof Roll) {
                        msgtoken.roll = update.roll.toJSON();
                        msgtoken.total = update.roll.total;
                        msgtoken.reveal = update.reveal || reveal;
                        tooltip = await update.roll.getTooltip();

                        Hooks.callAll('tokenBarUpdateRoll', this, message, update.id, msgtoken.roll);
                    }

                    $('.item[data-item-id="' + update.id + '"] .dice-roll .dice-tooltip', content).remove();
                    $(tooltip).hide().insertAfter($('.item[data-item-id="' + update.id + '"] .item-row', content));
                    $('.item[data-item-id="' + update.id + '"] .item-row .item-roll', content).remove();
                    $('.item[data-item-id="' + update.id + '"] .item-row .roll-controls', content).append(
                        `<div class="dice-total flexrow noselect" style="display:none;">
                        <div class= "dice-result noselect">${msgtoken.total}</div >
                        <a class="item-control roll-result" title="${i18n("MonksTokenBar.RollResult")}" data-control="rollResult">
                            <i class="fas"></i>
                        </a>
                    </div >`);
                    flags["token" + update.id] = msgtoken;
                } else if (update.error === true) {
                    ui.notifications.warn(msgtoken.name + ' ' + update.msg);

                    $('.item[data-item-id="' + update.id + '"] .item-row .item-roll', content).remove();
                    $('.item[data-item-id="' + update.id + '"] .item-row .roll-controls .dice-total', content).remove();
                    $('.item[data-item-id="' + update.id + '"] .item-row .roll-controls', content).append(
                        `<div class="dice-total flexrow noselect"><div class="dice-result noselect">Error!</div ></div >`);
                    msgtoken.reveal = true;
                    msgtoken.error = true;
                    flags["token" + update.id] = msgtoken;
                }

                if (update.finish != undefined)
                    promises.push(update.finish);
            }
        }

        message.update({ content: content[0].outerHTML, flags: { 'monks-tokenbar': flags } }).then(() => {
            ContestedRoll.checkResult(message);
        });

        if (promises.length) {
            Promise.all(promises).then(response => {
                log('rolls revealed', response);
                ContestedRoll.finishRolling(response, message);
            });
        }

        /*
        let actorid = responses[0].actorid;
        let roll = responses[0].roll;

        let actors = duplicate(message.getFlag('monks-tokenbar', 'actors'));
        let msgactor = actors.find(a => { return a.id == actorid; });
        log('updating contested roll', msgactor, roll);

        msgactor.roll = roll.toJSON();
        msgactor.reveal = msgactor.reveal || reveal;//!fastForward;
        msgactor.total = roll.total;

        let tooltip = await roll.getTooltip();

        Hooks.callAll('tokenBarUpdateRoll', this, message, actorid, roll);

        ContestedRoll.checkResult(actors);

        let content = $(message.data.content);
        $(tooltip).insertAfter($('.item[data-item-id="' + actorid + '"] .item-row', content));
        $('.item[data-item-id="' + actorid + '"] .item-row .item-roll', content).remove();
        $('.item[data-item-id="' + actorid + '"] .item-row .roll-controls', content).append(
            `<div class="dice-total flexrow" style="display:none;">
                <div class= "dice-result">${msgactor.total}</div >
                <a class="item-control roll-result" title="${i18n("MonksTokenBar.RollResult")}" data-control="rollResult">
                    <i class="fas"></i>
                </a>
            </div >`);

        message.update({ content: content[0].outerHTML });
        await message.setFlag('monks-tokenbar', 'actors', actors);*/
    }

    static async finishRolling(updates, message) {
        if (updates.length == 0) return;

        if (!game.user.isGM) {
            let response = updates.filter(r => { return r.userid == game.userId; });
            if (response.length) {
                game.socket.emit(
                    MonksTokenBar.SOCKET,
                    {
                        msgtype: 'finishroll',
                        type: 'contestedroll',
                        senderId: game.user.id,
                        response: response,
                        msgid: message.id
                    }
                );
            }
        } else {
            let flags = {};
            for (let update of updates) {
                let msgtoken = duplicate(message.getFlag('monks-tokenbar', 'token' + update.id));
                msgtoken.reveal = true;
                flags["token" + update.id] = msgtoken;
                log("Finish Rolling", msgtoken);
            }
            message.update({ flags: { 'monks-tokenbar': flags } });
        }
    }

    static getTokens(message) {
        let tokens = [];
        for (let [k, v] of Object.entries(message.data.flags['monks-tokenbar'])) {
            if (k.startsWith('token')) tokens.push(v);
        }
        return tokens;
    }

    static async checkResult(message) {
        //check to see that all tokens have been rolled
        let flags = {};
        let tokens = ContestedRoll.getTokens(message);

        let allRolled = (tokens[0].roll != undefined && tokens[1].roll != undefined);
        for (let i = 0; i < 2; i++) {
            let j = (i + 1) % 2;
            let passed = (!allRolled ? 'waiting' : (tokens[i].roll.total > tokens[j].roll.total ? 'won' : (tokens[i].roll.total < tokens[j].roll.total ? 'failed' : 'tied')));
            if (tokens[i].passed != passed) {
                let msgtoken = duplicate(tokens[i]);
                msgtoken.passed = passed;
                flags['token' + msgtoken.id] = msgtoken;
            }
        }

        if(Object.values(flags).length > 0)
            message.update({ flags: { 'monks-tokenbar': flags } });

        /*
        if (tokens[0].roll != undefined && tokens[1].roll != undefined) {
            tokens[0].passed = (tokens[0].roll.total > tokens[1].roll.total ? 'won' : (tokens[0].roll.total < tokens[1].roll.total ? 'failed' : 'tied'));
            tokens[1].passed = (tokens[0].roll.total < tokens[1].roll.total ? 'won' : (tokens[0].roll.total > tokens[1].roll.total ? 'failed' : 'tied'));
        } else {
            tokens[0].passed = 'waiting';
            tokens[1].passed = 'waiting';
        }*/
    }

    static checkReveal(actors) {
        let hidden = actors.find(a => { return a.reveal !== true; });
        return (hidden == undefined);
    }

    static async setRollSuccess(tokenid, message, success) {
        let flags = {};
        let tokens = ContestedRoll.getTokens(message);
        for (let i = 0; i < 2; i++) {
            let passed = (tokens[i].id == tokenid ? 'won' : 'failed');
            if(tokens[i].passed != passed) {
                let msgtoken = duplicate(tokens[i]);
                msgtoken.passed = passed;
                flags['token' + msgtoken.id] = msgtoken;
            }
        }

        if (Object.values(flags).length > 0)
            message.update({ flags: { 'monks-tokenbar': flags } });
    }

    static async onRollAll(tokentype, message, e) {
        if (game.user.isGM) {
            let flags = message.data.flags['monks-tokenbar'];
            let tokens = Object.keys(flags)
                .filter(key => key.startsWith('token'))
                .map(key => flags[key]);

            let ids = tokens.map(a => a.id);

            return ContestedRoll.onRollAbility(ids, message, true, e);
        }
    }

    static async _onClickToken(tokenId, event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
        event.cancelBubble = true;
        event.returnValue = false;

        let token = canvas.tokens.get(tokenId);
        let animate = MonksTokenBar.manageTokenControl(token, { shiftKey: event?.originalEvent?.shiftKey });

        return (animate ? canvas.animatePan({ x: token.x, y: token.y }) : true);
    }
}

Hooks.on('controlToken', (token, delta) => {
    if (MonksTokenBar && MonksTokenBar.system) {
        let contestedroll = MonksTokenBar.system.contestedroll;
        if (game.user.isGM && delta === true && contestedroll != undefined && contestedroll._state != -1) {
            if (contestedroll.item0.token == undefined)
                contestedroll.item0.token = token;
            else if (contestedroll.item1.token == undefined)
                contestedroll.item1.token = token;
            contestedroll.render(true);
        }
    }
});

Hooks.on("renderContestedRollApp", (app, html) => {
    $('.request-roll[data-type="item0"]', html).val(app.item0.request);
    $('.request-roll[data-type="item1"]', html).val(app.item1.request);
    $('#contestedroll-rollmode', html).val(app.rollmode);
});

Hooks.on("renderChatMessage", async (message, html, data) => {
    const svgCard = html.find(".monks-tokenbar.contested-roll");
    if (svgCard.length !== 0) {

        if (!game.user.isGM)
            html.find(".gm-only").remove();
        if (game.user.isGM)
            html.find(".player-only").remove();

        //let dc = message.getFlag('monks-tokenbar', 'dc');
        let rollmode = message.getFlag('monks-tokenbar', 'rollmode');
        let revealAll = ContestedRoll.checkReveal(ContestedRoll.getTokens(message));

        let items = $('.item', html);
        for (let i = 0; i < items.length; i++) {
            var item = items[i];
            let tokenId = $(item).attr('data-item-id');
            let msgtoken = message.getFlag('monks-tokenbar', 'token' + tokenId); //actors.find(a => { return a.id == actorId; });
            if (msgtoken) {
                //let actor = game.actors.get(msgtoken.actorid);
                let tokenOrActor = await fromUuid(msgtoken.uuid);
                let actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

                $(item).toggle(game.user.isGM || rollmode == 'roll' || rollmode == 'gmroll' || (rollmode == 'blindroll' && actor.isOwner));

                if (game.user.isGM || actor.isOwner)
                    $('.item-image', item).on('click', $.proxy(ContestedRoll._onClickToken, this, msgtoken.id))
                $('.item-roll', item).toggle(msgtoken.roll == undefined && (game.user.isGM || (actor.isOwner && rollmode != 'selfroll'))).click($.proxy(ContestedRoll.onRollAbility, this, msgtoken.id, message, false));
                $('.dice-total', item).toggle(msgtoken.error === true || (msgtoken.roll != undefined && (game.user.isGM || rollmode == 'roll' || (actor.isOwner && rollmode != 'selfroll'))));

                if (msgtoken.roll != undefined && msgtoken.roll.class.includes("Roll")) {
                    //let roll = Roll.fromData(msgtoken.roll);
                    let showroll = game.user.isGM || rollmode == 'roll' || (rollmode == 'gmroll' && actor.isOwner);
                    $('.dice-result', item).toggle(showroll || (rollmode == 'blindroll' && actor.isOwner));
                    if (!msgtoken.reveal || (rollmode == 'blindroll' && !game.user.isGM))
                        $('.dice-result', item).html(!msgtoken.reveal ? '...' : '-');
                    if (!msgtoken.reveal && game.user.isGM)
                        $('.dice-result', item).on('click', $.proxy(ContestedRoll.finishRolling, ContestedRoll, [msgtoken.id], message));
                    //if (showroll && !msgtoken.rolling && $('.dice-tooltip', item).is(':empty')) {
                    //    let tooltip = await roll.getTooltip();
                    //    $('.dice-tooltip', item).empty().append(tooltip);
                    //}
                    if (game.user.isGM)
                        $('.roll-result', item).click($.proxy(ContestedRoll.setRollSuccess, this, msgtoken.id, message, true));

                    $('.roll-result', item).toggleClass('result-passed selected', msgtoken.passed == 'won' && revealAll)
                    $('.roll-result i', item)
                        .toggleClass('fa-check', msgtoken.passed == 'won' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                        .toggleClass('fa-times', msgtoken.passed == 'failed' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                        .toggleClass('fa-minus', msgtoken.passed == 'tied' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                        .toggleClass('fa-ellipsis-h', (msgtoken.passed == 'waiting' || !revealAll) && msgtoken.roll != undefined && (game.user.isGM || rollmode != 'blindroll'));
                }
            }

            $('.select-all', html).on('click', $.proxy(MonksTokenBar.selectActors, MonksTokenBar, message, (ti) => {
                return ti;
            }));
            $('.select-saved', html).on('click', $.proxy(MonksTokenBar.selectActors, MonksTokenBar, message, ti => ti?.passed === "won"));
            $('.select-failed', html).on('click', $.proxy(MonksTokenBar.selectActors, MonksTokenBar, message, ti => ti?.passed === "failed"));

            //if there hasn't been a roll, then show the button if this is the GM or if this token is controlled by the current user

            //if this is the GM, and there's a roll, show the pass/fail buttons
            //highlight a button if the token hasn't had a result selected
            //toggle the button, if a result has been selected

            //if this is not the GM, and the results should be shown, and a result has been selected, then show the result
        };
    }
});
