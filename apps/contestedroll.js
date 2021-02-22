import { MonksTokenBar, log, i18n } from "../monks-tokenbar.js";

export class ContestedRollApp extends Application {
    constructor(item0, item1, options) {
        super(options);
        this.item0 = item0 || {token: null, request: null};
        this.item0.token = (this.item0.token || (canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled[0] : null));
        this.item0.request = (this.item0.request || 'ability:str');
        this.item1 = item1 || { token: null, request: null };
        this.item1.token = (this.item1.token || (game.user.targets.values()?.next()?.value || (canvas.tokens.controlled.length > 1 ? canvas.tokens.controlled[1] : null)));
        this.item1.request = (this.item1.request || 'ability:str');

        this.rollmode = options?.rollmode || (game.user.getFlag("monks-tokenbar", "lastmodeCR") || 'roll');
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "contestedroll",
            title: i18n("MonksTokenBar.ContestedRoll"),
            template: "./modules/monks-tokenbar/templates/contestedroll.html",
            width: 400,
            height: 250,
            popOut: true
        });
    }

    getData(options) {
        let opts = MonksTokenBar.requestoptions.filter(o => { return o.id != 'saving' && o.groups != undefined });

        return {
            item0: this.item0,
            item1: this.item1,
            rollmode: this.rollmode,
            options: opts
        };
    }

    removeToken(e) {
        let item = $(e.currentTarget).attr('data-type');
        this[item].token = null;
        this.render(true);
    }

    async request() {
        if (this.item0.token != undefined && this.item1.token != undefined) {
            let actors = [this.item0, this.item1].map((item, index) => {
                let parts = $('.contested-request[data-type="item' + index + '"]', this.element).val().split(':');
                let requesttype = (parts.length > 1 ? parts[0] : '');
                let request = (parts.length > 1 ? parts[1] : parts[0]);
                let requestname = $('.contested-request[data-type="item' + index + '"] option:selected', this.element).html() + " " + (requesttype == 'ability' ? i18n("MonksTokenBar.AbilityCheck") : (requesttype == 'saving' ? i18n("MonksTokenBar.SavingThrow") : i18n("MonksTokenBar.Check")));
                return {
                    id: item.token.actor.id,
                    tokenid: item.token.id,
                    requesttype: requesttype,
                    request: request,
                    requestname: requestname,
                    icon: (item.token.data.img.endsWith('webm') ? item.token.actor.data.img : item.token.data.img),
                    name: item.token.name,
                    passed: 'waiting'
                };
            });

            let rollmode = $('#contestedroll-rollmode', this.element).val();
            game.user.setFlag("monks-tokenbar", "lastmodeCR", rollmode);
            let modename = (rollmode == 'roll' ? i18n("MonksTokenBar.PublicRoll") : (rollmode == 'gmroll' ? i18n("MonksTokenBar.PrivateGMRoll") : (rollmode == 'blindroll' ? i18n("MonksTokenBar.BlindGMRoll") : i18n("MonksTokenBar.SelfRoll"))));
            let requestdata = {
                rollmode: rollmode,
                modename: modename,
                actors: actors
            };
            const html = await renderTemplate("./modules/monks-tokenbar/templates/contestedrollchatmsg.html", requestdata);

            log('create chat request');
            let chatData = {
                user: game.user._id,
                content: html
            };
            if (rollmode == 'selfroll')
                chatData.whisper = [game.user._id];
            else if (rollmode == 'blindroll') {
                chatData.whisper = [game.user._id];
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
            ChatMessage.create(chatData, {});
            this.close();
        } else
            ui.notifications.warn(i18n("MonksTokenBar.RequestActorMissing"));
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('.item-delete', html).click($.proxy(this.removeToken, this));

        $('.dialog-buttons.request', html).click($.proxy(this.request, this));

        $('.contested-request', html).change($.proxy(function (e) {
            this[e.target.dataset.type].request = $(e.currentTarget).val();
        }, this));
        $('#contestedroll-rollmode', html).change($.proxy(function (e) {
            this.rollmode = $(e.currentTarget).val();
        }, this));
    };
}

export class ContestedRoll {
    static async onRollAbility(actorid, message, fastForward = false, e) {
        let returnRoll = async function (roll) {
            log("Roll", roll, actor);
            let rollmode = message.getFlag('monks-tokenbar', 'rollmode');

            if (!game.user.isGM) {
                game.socket.emit(
                    MonksTokenBar.SOCKET,
                    {
                        msgtype: 'rollability',
                        type: 'contestedroll',
                        senderId: game.user._id,
                        response: [{ actorid: actorid, roll: roll }],
                        msgid: message.id
                    },
                    (resp) => { }
                );
            } else {
                const revealDice = game.dice3d ? game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") : true;
                await ContestedRoll.updateContestedRoll([{ actorid: actorid, roll: roll }], message, revealDice && !fastForward);
            }

            if (game.dice3d != undefined && !fastForward) {
                let whisper = (rollmode == 'roll' ? null : ChatMessage.getWhisperRecipients("GM").map(w => { return w.id }));
                if (rollmode == 'gmroll' && !game.user.isGM)
                    whisper.push(game.user._id);
                const sound = MonksTokenBar.getDiceSound();
                if (sound != undefined)
                    AudioHelper.play({ src: sound });
                game.dice3d.showForRoll(roll, game.user, true, whisper, (rollmode == 'blindroll' && !game.user.isGM)).then(() => {
                    ContestedRoll.finishRolling(actorid, message);
                });
            }
        }

        let actor = game.actors.get(actorid);

        if (actor != undefined) {
            let actors = message.getFlag('monks-tokenbar', 'actors');
            let msgactor = actors.find(a => { return a.id == actorid; });
            if (msgactor != undefined && msgactor.roll == undefined) {
                let request = msgactor.request;
                let requesttype = msgactor.requesttype;

                let roll = null;
                if (game.system.id == 'dnd5e') {
                    if (requesttype == 'ability')
                        roll = await actor.rollAbilityTest(request, { fastForward: fastForward, chatMessage: false });
                    else if (requesttype == 'saving')
                        roll = await actor.rollAbilitySave(request, { fastForward: fastForward, chatMessage: false });
                    else if (requesttype == 'skill')
                        roll = await actor.rollSkill(request, { fastForward: fastForward, chatMessage: false });
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
                    else if (requesttype == 'saving') {
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
                } else
                    ui.notifications.warn(actor.name + ' ' + i18n("MonksTokenBar.ActorNoRollFunction"));

                if (roll != undefined) {
                    returnRoll(roll);
                }
            }
        }
        return message;
    }

    static async finishRolling(actorid, message) {
        if (!game.user.isGM) {
            game.socket.emit(
                MonksTokenBar.SOCKET,
                {
                    msgtype: 'finishroll',
                    type: 'contestedroll',
                    senderId: game.user._id,
                    actorid: actorid,
                    msgid: message.id
                }
            );
        } else {
            let actors = duplicate(message.getFlag('monks-tokenbar', 'actors'));
            let msgactor = actors.find(a => { return a.id == actorid; });
            log('finishing roll', msgactor);
            msgactor.reveal = true;
            message.setFlag('monks-tokenbar', 'actors', actors);
        }
    }

    static async updateContestedRoll(responses, message, reveal = true) {
        let actorid = responses[0].actorid;
        let roll = responses[0].roll;

        let actors = duplicate(message.getFlag('monks-tokenbar', 'actors'));
        let msgactor = actors.find(a => { return a.id == actorid; });
        log('updating contested roll', msgactor, roll);

        msgactor.roll = roll.toJSON();
        msgactor.reveal = msgactor.reveal || reveal;//!fastForward;
        msgactor.total = roll.total;

        let tooltip = await roll.getTooltip();

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
        await message.setFlag('monks-tokenbar', 'actors', actors);
    }

    static async checkResult(actors) {
        if (actors[0].roll != undefined && actors[1].roll != undefined) {
            actors[0].passed = (actors[0].roll.total > actors[1].roll.total ? 'won' : (actors[0].roll.total < actors[1].roll.total ? 'failed' : 'tied'));
            actors[1].passed = (actors[0].roll.total < actors[1].roll.total ? 'won' : (actors[0].roll.total > actors[1].roll.total ? 'failed' : 'tied'));
        } else {
            actors[0].passed = 'waiting';
            actors[1].passed = 'waiting';
        }
    }

    static async setRollSuccess(actorid, message, success) {
        let actors = duplicate(message.getFlag('monks-tokenbar', 'actors'));
        actors[0].passed = actors[1].passed = 'failed';
        let msgactor = actors.find(a => { return a.id == actorid; });
        msgactor.passed = 'won';

        await message.setFlag('monks-tokenbar', 'actors', actors);
    }

    static async _onClickToken(tokenId, event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
        event.cancelBubble = true;
        event.returnValue = false;

        let token = canvas.tokens.get(tokenId);
        token.control({ releaseOthers: true });
        return canvas.animatePan({ x: token.x, y: token.y });
    }
}

Hooks.on('controlToken', (token, delta) => {
    if (game.user.isGM && delta === true && MonksTokenBar.tokenbar.contestedroll != undefined && MonksTokenBar.tokenbar.contestedroll._state != -1) {
        if (MonksTokenBar.tokenbar.contestedroll.item0.token == undefined)
            MonksTokenBar.tokenbar.contestedroll.item0.token = token;
        else if (MonksTokenBar.tokenbar.contestedroll.item1.token == undefined)
            MonksTokenBar.tokenbar.contestedroll.item1.token = token;
        MonksTokenBar.tokenbar.contestedroll.render(true);
    }
});

Hooks.on("renderContestedRollApp", (app, html) => {
    $('.contested-request[data-type="item0"]', html).val(app.item0.request);
    $('.contested-request[data-type="item1"]', html).val(app.item1.request);
    $('#contestedroll-rollmode', html).val(app.rollmode);
});

Hooks.on("renderChatMessage", (message, html, data) => {
    const svgCard = html.find(".monks-tokenbar.contested-roll");
    if (svgCard.length !== 0) {

        if (!game.user.isGM)
            html.find(".gm-only").remove();
        if (game.user.isGM)
            html.find(".player-only").remove();

        let dc = message.getFlag('monks-tokenbar', 'dc');
        let rollmode = message.getFlag('monks-tokenbar', 'rollmode');

        let actors = message.getFlag('monks-tokenbar', 'actors');
        let revealAll = (actors[0].reveal && actors[1].reveal);

        let items = $('.item', html);
        for (let i = 0; i < items.length; i++) {
            var item = items[i];
            let actorId = $(item).attr('data-item-id');
            let actorData = actors.find(a => { return a.id == actorId; });
            let actor = game.actors.get(actorId);

            $(item).toggle(game.user.isGM || rollmode == 'roll' || rollmode == 'gmroll' || (rollmode == 'blindroll' && actor.owner));

            if (game.user.isGM || actor.owner)
                $('.item-image', item).on('click', $.proxy(ContestedRoll._onClickToken, this, actorData.tokenid))
            $('.item-roll', item).toggle(actorData.roll == undefined && (game.user.isGM || (actor.owner && rollmode != 'selfroll'))).click($.proxy(ContestedRoll.onRollAbility, this, actorId, message, false));
            $('.dice-total', item).toggle(actorData.roll != undefined && (game.user.isGM || rollmode == 'roll' || (actor.owner && rollmode != 'selfroll')));

            
            if (actorData.roll != undefined) {
                let roll = Roll.fromData(actorData.roll);
                let showroll = game.user.isGM || rollmode == 'roll' || (rollmode == 'gmroll' && actor.owner);
                $('.dice-result', item).toggle(showroll || (rollmode == 'blindroll' && actor.owner));
                if (!actorData.reveal || (rollmode == 'blindroll' && !game.user.isGM))
                    $('.dice-result', item).html(!actorData.reveal ? '...' : '-');
                if (!actorData.reveal && game.user.isGM)
                    $('.dice-result', item).on('click', $.proxy(ContestedRoll.finishRolling, ContestedRoll, actorId, message));
                //if (showroll && !actorData.rolling && $('.dice-tooltip', item).is(':empty')) {
                //    let tooltip = await roll.getTooltip();
                //    $('.dice-tooltip', item).empty().append(tooltip);
                //}
                if(game.user.isGM)
                    $('.roll-result', item).click($.proxy(ContestedRoll.setRollSuccess, this, actorId, message, true));

                $('.roll-result', item).toggleClass('result-passed selected', actorData.passed == 'won' && revealAll)
                $('.roll-result i', item)
                    .toggleClass('fa-check', actorData.passed == 'won' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                    .toggleClass('fa-times', actorData.passed == 'failed' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                    .toggleClass('fa-minus', actorData.passed == 'tied' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                    .toggleClass('fa-ellipsis-h', (actorData.passed == 'waiting' || !revealAll) && actorData.roll != undefined && (game.user.isGM || rollmode != 'blindroll'));
            }

            //if there hasn't been a roll, then show the button if this is the GM or if this token is controlled by the current user

            //if this is the GM, and there's a roll, show the pass/fail buttons
            //highlight a button if the token hasn't had a result selected
            //toggle the button, if a result has been selected

            //if this is not the GM, and the results should be shown, and a result has been selected, then show the result
        };
    }
});