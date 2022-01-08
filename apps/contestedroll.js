import { MonksTokenBar, log, i18n, setting } from "../monks-tokenbar.js";

export class ContestedRollApp extends Application {
    constructor(entries, options = {}) {
        super(options);
        this.opts = options;

        this.rollmode = options?.rollmode || (game.user.getFlag("monks-tokenbar", "lastmodeCR") || 'roll');
        this.requestoptions = (options.requestoptions || MonksTokenBar.system.contestedoptions);
        this.hidenpcname = (options?.hidenpcname != undefined ? options?.hidenpcname : null) || (game.user.getFlag("monks-tokenbar", "lastmodeHideNPCName") != undefined ? game.user.getFlag("monks-tokenbar", "lastmodeHideNPCName") : null) || false;
        this.flavor = options.flavor;

        let available = canvas.tokens.controlled;
        if (game.user.targets.values()?.next()?.value)
            available.splice(Math.min(available.length, 2) - 1, 0, game.user.targets.values()?.next()?.value);

        this.entries = $.extend([{ token: null, request: MonksTokenBar.system.defaultContested() }, { token: null, request: MonksTokenBar.system.defaultContested() }], entries);

        this.entries = this.entries.map(e => {
            if (e.token == undefined)
                e.token = available.shift();
            if (e.request) {
                for (let opt of this.requestoptions) {
                    let byname = Object.entries(opt.groups).find(([k, v]) => {
                        return i18n(v).toLowerCase() == e.request.toLowerCase()
                    });
                    if (byname) {
                        e.request = opt.id + ':' + byname[0];
                        break;
                    }
                }
            }
            return e;
        });

        /*
        this.item0 = item0 || {token: null, request: null};
        this.item0.token = (this.item0.token || (canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled[0] : null));
        this.item0.request = (this.item0.request || MonksTokenBar.system.defaultContested());
        this.item1 = item1 || { token: null, request: null };
        this.item1.token = (this.item1.token || (game.user.targets.values()?.next()?.value || (canvas.tokens.controlled.length > 1 ? canvas.tokens.controlled[1] : null)));
        this.item1.request = (this.item1.request || MonksTokenBar.system.defaultContested());
        */
    }

    static get defaultOptions() {
       // let top = ($('#tokenbar').position()?.top || $('#hotbar').position()?.top || 300) - 260;
        return mergeObject(super.defaultOptions, {
            id: "contestedroll",
            title: i18n("MonksTokenBar.ContestedRoll"),
            template: "./modules/monks-tokenbar/templates/contestedroll.html",
            width: 450,
            //top: top,
            popOut: true
        });
    }

    getData(options) {
        return {
            entries: this.entries,
            rollmode: this.rollmode,
            options: this.requestoptions,
            hidenpcname: this.hidenpcname,
            flavor: this.flavor,
        };
    }

    removeToken(e) {
        const idx = parseInt($(e.currentTarget).attr('data-index'));
        this.entries[idx].token = null;
        this.render(true);
    }

    async request(roll) {
        let msg = null;
        if (this.entries[0].token != undefined && this.entries[1].token != undefined) {
            let msgEntries = this.entries.map((item, index) => {
                if (index > 1)
                    return null;

                let parts = item.request.split(':'); //$('.request-roll[data-type="item' + index + '"]', this.element).val().split(':');
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
                    passed: 'waiting',
                    keys: item.keys,
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
                tokens: msgEntries,
                canGrab: MonksTokenBar.system.canGrab, //['dnd5e', 'sw5e'].includes(game.system.id),
                options: this.opts,
                what: 'contestedroll',
            };
            const html = await renderTemplate("./modules/monks-tokenbar/templates/contestedrollchatmsg.html", requestdata);

            delete requestdata.tokens;
            delete requestdata.canGrab;
            for (let i = 0; i < msgEntries.length; i++)
                requestdata["token" + msgEntries[i].id] = msgEntries[i];

            let requestedPlayers = [game.user.id];
            for (let i = 0; i < 2; i++) {
                let token = this.entries[i].token;
                if (token.actor != undefined) {
                    for (var key in token.actor.data.permission) {
                        if (key != 'default' && token.actor.data.permission[key] >= CONST.ENTITY_PERMISSIONS.OWNER) {
                            if (requestedPlayers.find(t => t == key) == undefined)
                                requestedPlayers.push(key);
                        }
                    }
                }
            }

            log('create chat request');
            let chatData = {
                user: game.user.id,
                content: html,
                flavor: flavor,
            };
            if (rollmode == 'selfroll')
                chatData.whisper = [game.user.id];
            else if (rollmode == 'blindroll')
                chatData.whisper = requestedPlayers;

            //chatData.flags["monks-tokenbar"] = {"testmsg":"testing"};
            setProperty(chatData, "flags.monks-tokenbar", requestdata);
            msg = await ChatMessage.create(chatData, {});
            msg.mtb_callback = this.opts.callback;
            if (setting('request-roll-sound-file') != '' && rollmode != 'selfroll' && roll !== false)
                MonksTokenBar.playSound(setting('request-roll-sound-file'), requestedPlayers);
            this.close();

            if (this['active-tiles'])
                msg.setFlag('monks-tokenbar', 'active-tiles', this['active-tiles']);

            if (roll === true)
                ContestedRoll.onRollAll('all', msg, this.opts);
            else {
                let ids = this.entries.filter(e => e.fastForward).map(e => e.id);
                if (ids.length > 0)
                    ContestedRoll.onRollAbility(ids, msg, true, this.opts);
            }
        } else
            ui.notifications.warn(i18n("MonksTokenBar.RequestActorMissing"));

        return msg;
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('.item-delete', html).click($.proxy(this.removeToken, this));

        $('.dialog-button.request', html).click($.proxy(this.request, this));
        $('.dialog-button.request-roll', html).click($.proxy(this.request, this, true));

        $('#monks-tokenbar-flavor', html).blur($.proxy(function (e) {
            this.flavor = $(e.currentTarget).val();
        }, this));

        $('#contestedroll-hidenpc', html).change($.proxy(function (e) {
            this.hidenpcname = $(e.currentTarget).is(':checked');
        }, this));

        $('.request-roll', html).change($.proxy(function (e) {
            this.entries[e.target.dataset.index].request = $(e.currentTarget).val();
        }, this));
        $('#contestedroll-rollmode', html).change($.proxy(function (e) {
            this.rollmode = $(e.currentTarget).val();
        }, this));
    };
}

export class ContestedRoll {
    /*
     *         if (!game.user.isGM) {
            MonksTokenBar.emit('rollability', { type: 'contestedroll', senderId: game.user.id, response: [{ actorid: actorid, roll: roll }], msgid: message.id });
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

            let whisper = (rollmode == 'roll' ? null : ChatMessage.getWhisperRecipients("GM").map(w => { return w.id }));
            if (rollmode == 'gmroll' && !game.user.isGM)
                whisper.push(game.user.id);

            if (game.dice3d != undefined && roll instanceof Roll && game.system.id != 'swade') { // && !fastForward) {
                finishroll = game.dice3d.showForRoll(roll, game.user, true, whisper, (rollmode == 'blindroll' && !game.user.isGM)).then(() => {
                    return { id: id, reveal: true, userid: game.userId };
                });
            }
            const sound = MonksTokenBar.getDiceSound();
            if (sound != undefined)
                MonksTokenBar.playSound(sound, (rollmode == 'roll' || rollmode == 'gmroll' ? 'all' : whisper));

            return { id: id, roll: roll, finish: finishroll };
        }
    }

    static async _rollAbility(data, request, requesttype, rollmode, ffwd, e) {
        //let actor = game.actors.get(data.actorid);
        let tokenOrActor = await fromUuid(data.uuid)
        let actor = tokenOrActor?.actor ? tokenOrActor.actor : tokenOrActor;
        let fastForward = ffwd || (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey);

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
    }

    static async onRollAbility(ids, message, fastForward = false, evt) {
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
                let actor = tokenOrActor?.actor ? tokenOrActor.actor : tokenOrActor;
                if (actor != undefined) {
                    //roll the dice, using standard details from actor
                    let keys = msgtoken.keys || {};
                    let e = Object.assign({}, evt);
                    e.ctrlKey = evt.ctrlKey;
                    e.altKey = evt.altKey;
                    e.shiftKey = evt.shiftKey;
                    e.metaKey = evt.metaKey;

                    for (let [k, v] of Object.entries(keys))
                        e[k] = evt[k] || v;
                    MonksTokenBar.system.parseKeys(e, keys);

                    promises.push(ContestedRoll._rollAbility({ id: id, uuid: msgtoken.uuid }, msgtoken.request, msgtoken.requesttype, rollmode, fastForward, keys, evt));
                }
            }
        };

        Promise.all(promises).then(response => {
            log('roll all finished', response);
            if (!game.user.isGM) {
                let responses = response.map(r => { return { id: r.id, roll: r.roll }; });
                MonksTokenBar.emit('rollability',
                    {
                        type: 'contestedroll',
                        msgid: message.id,
                        response: responses
                    }
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
                    $('.item[data-item-id="' + update.id + '"] .item-row .roll-controls .dice-total', content).remove();
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
                MonksTokenBar.emit('finishroll',
                    {
                        type: 'contestedroll',
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
            for (let entry of contestedroll.entries) {
                if (entry.token == undefined) {
                    entry.token = token;
                    break;
                }
            }
            contestedroll.render(true);
        }
    }
});

Hooks.on("renderContestedRollApp", (app, html) => {
    for (let i = 0; i < 2; i++) {
        $(`.request-roll[data-index="${i}"]`, html).val(app.entries[i].request);
    }
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
                let actor = tokenOrActor?.actor ? tokenOrActor.actor : tokenOrActor;

                $(item).toggle(game.user.isGM || rollmode == 'roll' || rollmode == 'gmroll' || (rollmode == 'blindroll' && actor.isOwner));

                if (game.user.isGM || actor?.isOwner)
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

                    $('.roll-result', item).toggleClass('result-passed selected', msgtoken.passed == 'won' && revealAll && (game.user.isGM || rollmode == 'roll'));
                    let resultClass = 'fa-ellipsis-h';
                    if (revealAll) {
                        if ((msgtoken.passed == 'won' || msgtoken.passed == 'failed') && (game.user.isGM || rollmode == 'roll')) {
                            resultClass = (msgtoken.passed == 'won' ? 'fa-check' : 'fa-times');
                        } else
                            resultClass = (rollmode != 'blindroll' ? 'fa-minus' : '');
                    }
                    $('.roll-result i', item).attr('class', `fas ${resultClass}`);
                        /*
                        .toggleClass('fa-check', msgtoken.passed == 'won' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                        .toggleClass('fa-times', msgtoken.passed == 'failed' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                        .toggleClass('fa-minus', msgtoken.passed == 'tied' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                        .toggleClass('fa-ellipsis-h', (msgtoken.passed == 'waiting' || !revealAll) && msgtoken.roll != undefined && (game.user.isGM || rollmode != 'blindroll'));
                        */
                }
            }

            $('.select-all', html).on('click', $.proxy(MonksTokenBar.selectActors, MonksTokenBar, message, (ti) => {
                return ti;
            }));
            $('.select-saved', html).on('click', $.proxy(MonksTokenBar.selectActors, MonksTokenBar, message, ti => ti?.passed === "won"));
            $('.select-failed', html).on('click', $.proxy(MonksTokenBar.selectActors, MonksTokenBar, message, ti => ti?.passed === "failed"));

            $('.grab-message', html).off('click.grabbing').on('click.grabbing', MonksTokenBar.setGrabMessage.bind(MonksTokenBar, message));

            //if there hasn't been a roll, then show the button if this is the GM or if this token is controlled by the current user

            //if this is the GM, and there's a roll, show the pass/fail buttons
            //highlight a button if the token hasn't had a result selected
            //toggle the button, if a result has been selected

            //if this is not the GM, and the results should be shown, and a result has been selected, then show the result
        };
    }
});