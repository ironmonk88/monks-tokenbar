import { MonksTokenBar, log } from "../monks-tokenbar.js";

export class ContestedRollApp extends Application {
    constructor(options) {
        super(options);
        this.token = canvas.tokens.controlled[0];
        this.countertoken = game.user.targets.values()?.next()?.value;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "contestedroll",
            title: "Contested Roll",
            template: "./modules/monks-tokenbar/templates/contestedroll.html",
            width: 400,
            height: 250,
            popOut: true
        });
    }

    getData(options) {
        return {
            token: this.token,
            countertoken: this.countertoken,
            abilities: MonksTokenBar.abilities,
            skills: MonksTokenBar.skills,
            saves: MonksTokenBar.saves
        };
    }

    addToken(e) {
        if (canvas.tokens.controlled.length > 0) {
            let item = $(e.currentTarget).attr('data-type');
            this[item] = canvas.tokens.controlled[0];
            this.render(true);
        }
    }

    removeToken(e) {
        let item = $(e.currentTarget).attr('data-type');
        this[item] = null;
        this.render(true);
    }

    async request() {
        if (this.token != undefined && this.countertoken != undefined) {
            let addActor = function (token, type) {
                let attrtype = $('.contested-roll[data-type="' + type + '"] option:selected', this.element).attr('attr');
                let attr = $('.contested-roll[data-type="' + type + '"]', this.element).val();
                let attrname = $('.contested-roll[data-type="' + type + '"] option:selected', this.element).html() + " " + (attrtype == 'ability' ? "Ability Check" : (attrtype == 'saving' ? "Saving Throw" : "Check"));
                return {
                    id: token.actor.id,
                    tokenid: token.id,
                    attrtype: attrtype,
                    attr: attr,
                    attrname: attrname,
                    icon: token.data.img,
                    name: token.name,
                    passed: 'waiting'
                };
            }

            let mode = $('#contestedroll-rollmode', this.element).val();
            let modename = (mode == 'roll' ? 'Public Roll' : (mode == 'gmroll' ? 'Private GM Roll' : (mode == 'blindroll' ? 'Blind GM Roll' : 'Self Roll')));
            let requestdata = {
                mode: mode,
                modename: modename,
                actors: [addActor.call(this, this.token, 'token'), addActor.call(this, this.countertoken, 'countertoken')]
            };
            const html = await renderTemplate("./modules/monks-tokenbar/templates/contestedrollchatmsg.html", requestdata);

            log('create chat request');
            let chatData = {
                user: game.user._id,
                content: html
            };
            if (requestdata.mode == 'selfroll')
                chatData.whisper = [game.user._id];
            else if (requestdata.mode == 'blindroll') {
                chatData.whisper = [game.user._id];
                let token = this.token;
                if (token.actor != undefined) {
                    for (var key in token.actor.data.permission) {
                        if (key != 'default' && token.actor.data.permission[key] >= CONST.ENTITY_PERMISSIONS.OWNER) {
                            if (chatData.whisper.find(t => t == key) == undefined)
                                chatData.whisper.push(key);
                        }
                    }
                }
                token = this.countertoken;
                if (token.actor != undefined) {
                    for (var key in token.actor.data.permission) {
                        if (key != 'default' && token.actor.data.permission[key] >= CONST.ENTITY_PERMISSIONS.OWNER) {
                            if (chatData.whisper.find(t => t == key) == undefined)
                                chatData.whisper.push(key);
                        }
                    }
                }
            }
            //chatData.flags["monks-tokenbar"] = {"testmsg":"testing"};
            setProperty(chatData, "flags.monks-tokenbar", requestdata);
            ChatMessage.create(chatData, {});
            this.close();
        } else
            ui.notifications.warn("Cannot send request if either actor is missing");
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('.item-add', html).click($.proxy(this.addToken, this));
        $('.item-delete', html).click($.proxy(this.removeToken, this));

        $('.dialog-buttons.request', html).click($.proxy(this.request, this));
    };
}

export class ContestedRoll {
    static async onRollAbility(actorid, message, fastForward = false, e) {
        let actor = game.actors.get(actorid);

        if (actor != undefined) {
            let actors = message.getFlag('monks-tokenbar', 'actors');
            let msgactor = actors.find(a => { return a.id == actorid; });
            if (msgactor != undefined && msgactor.roll == undefined) {
                let attribute = msgactor.attr;
                let attrtype = msgactor.attrtype;

                let roll = null;
                if (attrtype == 'ability')
                    roll = await actor.rollAbilityTest(attribute, { fastForward: fastForward, chatMessage: false });
                else if (attrtype == 'saving')
                    roll = await actor.rollAbilitySave(attribute, { fastForward: fastForward, chatMessage: false });
                else if (attrtype == 'skill')
                    roll = await actor.rollSkill(attribute, { fastForward: fastForward, chatMessage: false });

                if (roll != undefined) {
                    let mode = message.getFlag('monks-tokenbar', 'mode');

                    if (!game.user.isGM) {
                        game.socket.emit(
                            MonksTokenBar.SOCKET,
                            {
                                msgtype: 'rollability',
                                type: 'contestedroll',
                                senderId: game.user._id,
                                actorid: actorid,
                                msgid: message.id,
                                roll: roll
                            },
                            (resp) => { }
                        );
                    } else {
                        const revealDice = game.dice3d ? game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") : false;
                        await ContestedRoll.updateContestedRoll(actorid, message, roll, !revealDice && !fastForward);
                    }

                    log('rolling ability', msgactor, roll);

                    if (game.dice3d != undefined && !fastForward) {
                        let whisper = (mode == 'roll' ? null : ChatMessage.getWhisperRecipients("GM").map(w => { return w.id }));
                        if (mode == 'gmroll' && !game.user.isGM)
                            whisper.push(game.user._id);
                        const sound = MonksTokenBar.getDiceSound();
                        if (sound != undefined)
                            AudioHelper.play({ src: sound });
                        game.dice3d.showForRoll(roll, game.user, true, whisper, (mode == 'blindroll' && !game.user.isGM)).then(() => {
                            const revealDice = game.dice3d ? game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") : false;
                            if (!revealDice)
                                ContestedRoll.finishRolling(actorid, message);
                        });
                    }
                }

                log("Roll", roll, actor);
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
            msgactor.rolling = false;
            message.setFlag('monks-tokenbar', 'actors', actors);
        }
    }

    static async updateContestedRoll(actorid, message, roll, rolling = false) {
        let actors = duplicate(message.getFlag('monks-tokenbar', 'actors'));
        let msgactor = actors.find(a => { return a.id == actorid; });
        log('updating contested roll', msgactor, roll);

        msgactor.roll = roll.toJSON();
        msgactor.rolling = msgactor.rolling || rolling;//!fastForward;
        msgactor.total = roll.total;

        let tooltip = await roll.getTooltip();

        ContestedRoll.checkResult(actors);

        let content = $(message.data.content);
        $(tooltip).insertAfter($('.item[data-item-id="' + actorid + '"] .item-row', content));
        $('.item[data-item-id="' + actorid + '"] .item-row .item-roll', content).remove();
        $('.item[data-item-id="' + actorid + '"] .item-row .roll-controls', content).append(
            `<div class="dice-total flexrow" style="display:none;">
                <div class= "dice-result">${msgactor.total}</div >
                <a class="item-control roll-result" title="Roll Result" data-control="rollResult">
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

    static async onRollAll(message) {
        if (game.user.isGM) {
            let actors = message.getFlag('monks-tokenbar', 'actors');
            for (let i = 0; i < actors.length; i++) {
                let msgactor = actors[i];
                if (msgactor.roll == undefined) {
                    let actor = game.actors.get(msgactor.id);
                    if (actor != undefined) {
                        //roll the dice, using standard details from actor
                        await ContestedRoll.onRollAbility(msgactor.id, message, true);
                    }
                }
            };
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
        if (MonksTokenBar.tokenbar.contestedroll.token == undefined)
            MonksTokenBar.tokenbar.contestedroll.token = token;
        else if (MonksTokenBar.tokenbar.contestedroll.countertoken == undefined)
            MonksTokenBar.tokenbar.contestedroll.countertoken = token;
        MonksTokenBar.tokenbar.contestedroll.render(true);
    }
});

Hooks.on("renderChatMessage", (message, html, data) => {
    const svgCard = html.find(".monks-tokenbar-message.contested-roll");
    if (svgCard.length !== 0) {

        if (!game.user.isGM)
            html.find(".gm-only").remove();
        if (game.user.isGM)
            html.find(".player-only").remove();

        let dc = message.getFlag('monks-tokenbar', 'dc');
        let mode = message.getFlag('monks-tokenbar', 'mode');

        $('.roll-all', html).click($.proxy(ContestedRoll.onRollAll, ContestedRoll, message));

        let actors = message.getFlag('monks-tokenbar', 'actors');
        let actorRolling = (actors[0].rolling || actors[1].rolling);

        let items = $('.item', html);
        for (let i = 0; i < items.length; i++) {
            var item = items[i];
            let actorId = $(item).attr('data-item-id');
            let actorData = actors.find(a => { return a.id == actorId; });
            let actor = game.actors.get(actorId);

            $(item).toggle(game.user.isGM || mode == 'roll' || mode == 'gmroll' || (mode == 'blindroll' && actor.owner));

            if (game.user.isGM || actor.owner)
                $('.item-image', item).on('click', $.proxy(ContestedRoll._onClickToken, this, actorData.tokenid))
            $('.item-roll', item).toggle(actorData.roll == undefined && (game.user.isGM || (actor.owner && mode != 'selfroll'))).click($.proxy(ContestedRoll.onRollAbility, this, actorId, message, false));
            $('.dice-total', item).toggle(actorData.roll != undefined && (game.user.isGM || mode == 'roll' || (actor.owner && mode != 'selfroll')));

            
            if (actorData.roll != undefined) {
                let roll = Roll.fromData(actorData.roll);
                let showroll = game.user.isGM || mode == 'roll' || (mode == 'gmroll' && actor.owner);
                $('.dice-result', item).toggle(showroll || (mode == 'blindroll' && actor.owner));
                if (actorData.rolling || (mode == 'blindroll' && !game.user.isGM))
                    $('.dice-result', item).html(actorData.rolling ? '...' : '-');
                if (actorData.rolling && game.user.isGM)
                    $('.dice-result', item).on('click', $.proxy(ContestedRoll.finishRolling, ContestedRoll, actorId, message));
                //if (showroll && !actorData.rolling && $('.dice-tooltip', item).is(':empty')) {
                //    let tooltip = await roll.getTooltip();
                //    $('.dice-tooltip', item).empty().append(tooltip);
                //}
                if(game.user.isGM)
                    $('.roll-result', item).click($.proxy(ContestedRoll.setRollSuccess, this, actorId, message, true));

                $('.roll-result', item).toggleClass('result-passed selected', actorData.passed == 'won' && !actorRolling)
                $('.roll-result i', item)
                    .toggleClass('fa-check', actorData.passed == 'won' && !actorRolling && (game.user.isGM || mode != 'blindroll'))
                    //.toggleClass('fa-check', actorData.passed == 'failed')
                    .toggleClass('fa-minus', actorData.passed == 'tied' && !actorRolling && (game.user.isGM || mode != 'blindroll'))
                    .toggleClass('fa-ellipsis-h', (actorData.passed == 'waiting' || actorRolling) && actorData.roll != undefined && (game.user.isGM || mode != 'blindroll'));
            }

            //if there hasn't been a roll, then show the button if this is the GM or if this token is controlled by the current user

            //if this is the GM, and there's a roll, show the pass/fail buttons
            //highlight a button if the token hasn't had a result selected
            //toggle the button, if a result has been selected

            //if this is not the GM, and the results should be shown, and a result has been selected, then show the result
        };
    }
});