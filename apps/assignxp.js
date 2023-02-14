import {i18n, log, MonksTokenBar, setting} from "../monks-tokenbar.js";
import { divideXpOptions } from "../settings.js";

export class AssignXPApp extends Application {
    constructor(entity, options = {}) {
        super(options);

        this.xp = options?.xp || 0;
        this.reason = options?.reason;
        this.dividexp = options?.dividexp ? options?.dividexp : setting("divide-xp");
        this.divideXpOptions = divideXpOptions

        if (game.system.id == 'pf2e')
            this.xpchart = [10, 15, 20, 30, 40, 60, 80, 120, 160];

        if (entity != undefined && entity instanceof Combat) {
            this.actors = [];
            var apl = { count: 0, levels: 0 };

            //get the actors
            let monsters = [];
            for (let combatant of entity.combatants) {
                if (combatant.token?.disposition == 1 && combatant.token?.actorLink && combatant.actor && combatant.actor.hasPlayerOwner) {
                    let actor = (combatant.actor.isPolymorphed ? game.actors.find(a => a.id == combatant.actor.getFlag(game.system.id, 'originalActor')) : combatant.actor);
                    this.actors.push({
                        actor: actor,
                        xp: 0
                    });

                    apl.count = apl.count + 1;
                    apl.levels = apl.levels + MonksTokenBar.system.getLevel(actor);
                } else
                    monsters.push(combatant);
            };
            var calcAPL = apl.count > 0 ? Math.round(apl.levels / apl.count) : 0;

            //get the monster xp
            let combatxp = 0;
            for (let combatant of monsters) {
                if (combatant.token?.disposition != 1 && combatant.actor && !combatant.actor.hasPlayerOwner) {
                    if (game.system.id == 'pf2e') {
                        let monstLevel = parseInt(MonksTokenBar.system.getLevel(combatant?.actor));
                        let monstXP = this.xpchart[Math.clamped(4 + (monstLevel - calcAPL), 0, this.xpchart.length - 1)];
                        combatxp += monstXP;
                    }else
                        combatxp += (MonksTokenBar.system.getXP(combatant.actor)?.value || 0);
                }
            };

            // For Pathfinder 2e, if the party is bigger or smaller than 4, then we need to adjust the XP reward
            if (game.system.id == 'pf2e')
                combatxp = Math.floor(combatxp * 4 / (apl.count || 4));

            //xp += (combatant?.actor.system.details?.xp?.value || MonksLittleDetails.xpchart[Math.clamped(parseInt(combatant?.actor.system.details?.level?.value), 0, MonksLittleDetails.xpchart.length - 1)] || 0);
            this.xp = this.xp || combatxp;
            this.reason = this.reason || i18n("MonksTokenBar.CombatExperience");

            this.combat = duplicate(this.actors);
        } else {
            if (entity != undefined && !$.isArray(entity))
                entity = [entity];
            this.actors = (entity || (canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled : canvas.tokens.placeables))
                .map(t => {
                    if (!t.actor)
                        return null;
                    return (t.actor.hasPlayerOwner && (t.actor.type == 'character' || t.actor?.type == 'Player Character') ? t.actor : null)
                })
                .filter((a, index, self) => {
                    if (!a)
                        return false;
                    return self.findIndex((i) => { return i?.id == a.id }) === index;
                })
                .map(actor => {
                    actor = (actor.isPolymorphed ? game.actors.find(a => a.id == actor.getFlag(game.system.id, 'originalActor')) : actor);
                    return {
                        actor: actor,
                        xp: 0
                    };
                });
        }

        this.changeXP();
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "assignexperience",
            title: i18n("MonksTokenBar.AssignXP"),
            template: "./modules/monks-tokenbar/templates/assignxp.html",
            width: 400,
            height: 400,
            popOut: true,
            dragDrop: [{ dropSelector: ".dialog-content" }]
        });
    }

    getData(options) {
        return {
            actors: this.actors,
            hasCombat: !!this.combat,
            xp: this.xp,
            dividexp: this.dividexp,
            reason: this.reason,
            divideXpOptions: this.divideXpOptions
        };
    }

    changeXP(xp) {
        if(xp !== undefined)
            this.xp = xp;

        let sortedByLevel = this.actors.sort(function (a, b) {
            const aXP = MonksTokenBar.system.getXP(a.actor);
            const bXP = MonksTokenBar.system.getXP(b.actor);
            
            let value = (MonksTokenBar.system.getLevel(a.actor) + ((aXP?.value ?? 0) / (aXP?.max ?? 1))) - (MonksTokenBar.system.getLevel(b.actor) + ((bXP?.value ?? 0) / (bXP?.max ?? 1)));
            log(a.actor.name, b.actor.name, value);
            return value;
        });

        sortedByLevel.forEach(x => x.xp = 0);
        switch (this.dividexp) {
            case 'no-split':
                sortedByLevel.forEach(x => x.xp =  this.xp);
                break;
            case 'equal-split':
                sortedByLevel.forEach(x => x.xp = parseInt(this.xp / sortedByLevel.length));
                break;
            case 'robin-hood-split':
                // Take from the rich and give to the poor...
                distributeXp(sortedByLevel, parseInt(this.xp / sortedByLevel.length), 0.5, 1.5);
                break;
            case 'nottingham-split':
                // Take from the poor and give to the rich...
                distributeXp(sortedByLevel, parseInt(this.xp / sortedByLevel.length), 1.5, 0.5);
                break;
        }

        /**
         * Splits the xp among the actors according to the following algorithm: iterate from lowest, compare self with highest unprocessed, if same level just set xp, if different level use appropriate multiplier for poor/rich actor.
         * @param actors {Array}
         * @param charxp {number}
         * @param higherXpMultiplier {number}
         * @param lowerXpMultiplier {number}
         */
        function distributeXp(actors, charxp, higherXpMultiplier, lowerXpMultiplier) {
            const actors_reversed = actors.slice().reverse();
            for (let i = 0; i < actors.length / 2; i++) {
                let poor = actors[i];
                let rich = actors_reversed[i];
                if (MonksTokenBar.system.getLevel(poor.actor) !== MonksTokenBar.system.getLevel(rich.actor)) {
                    rich.xp += Math.ceil(charxp * higherXpMultiplier);
                    poor.xp += Math.floor(charxp * lowerXpMultiplier);
                } else if (poor !== rich) {
                    poor.xp += charxp;
                    rich.xp += charxp;
                } else {
                    poor.xp += charxp;
                }
            }
        }

    }

    addToken(tokens) {
        if (!$.isArray(tokens))
            tokens = [tokens];

        let failed = [];
        tokens = tokens.filter(t => {
            if (t.actor == undefined)
                return false;
            //don't add this token a second time
            if (this.actors.some(e => e.actor._id == t.actor._id))
                return false;

            return true;
        });

        if (failed.length > 0)
            ui.notifications.warn(i18n("MonksTokenBar.TokenNoActorAttrs"));

        if (tokens.length > 0)
            this.actors = this.actors.concat(tokens.map(t => {
                let actor = t.actor;
                actor = (actor.isPolymorphed ? game.actors.find(a => a.id == actor.getFlag(game.system.id, 'originalActor')) : actor);
                return { actor: actor, xp: 0 }
            }));

        this.changeXP();
        this.render(true);
    }

    removeActor(id) {
        let idx = this.actors.findIndex(a => a.actor._id === id);
        if (idx > -1) {
            this.actors.splice(idx, 1);
        }
        $(`li[data-item-id="${id}"]`, this.element).remove();
        this.changeXP();
        this.render(true);
    }

    activateListeners(html) {
        super.activateListeners(html);
        var that = this;

        $('.items-header .item-controls', html).click($.proxy(this.changeTokens, this));

        $('.item-list .item', html).each(function (elem) {
            $('.item-delete', this).click($.proxy(that.removeActor, that, this.dataset.itemId));
        });

        $('.dialog-button.assign', html).on("click", this.assign.bind(this));
        $('.dialog-button.auto-assign', html).on("click", this.autoassign.bind(this));

        $('#dividexp', html).change(function () {
            that.dividexp = $(this).find('option:selected').val();
            that.changeXP.call(that);
            that.render(true);
        });

        $('#assign-xp-value', html).blur(function () {
            that.xp = parseInt($(this).val() || '0');
            if (isNaN(that.xp))
                that.xp = 0;
            that.changeXP.call(that, that.xp);
            that.render(true);
        });

        $('.charxp', html).blur(this.adjustCharXP.bind(this));
    };

    adjustCharXP(event) {
        let id = $(event.currentTarget).closest(".item")[0].dataset["itemId"];
        let actor = this.actors.find(a => a.actor._id == id);
        if (actor)
            actor.xp = parseInt($(event.currentTarget).val())
        this.render(true);
    }

    changeTokens(e) {
        let type = e.target.dataset.type;
        switch (type) {
            case 'player':
                this.actors = this.actors.concat(game.users.filter(u => {
                    return !u.isGM && u.character && !this.actors.some(e => e.actor._id == u.character.id)
                }).map(u => {
                    let actor = u.character;
                    actor = (actor.isPolymorphed ? game.actors.find(a => a.id == actor.getFlag(game.system.id, 'originalActor')) : actor);
                    return {
                        actor: actor,
                        xp: 0
                    }
                }));
                this.changeXP();
                this.render(true);
                break;
            case 'combat':
                if (this.combat) {
                    this.actors = duplicate(this.combat);
                    this.changeXP();
                    this.render(true);
                }
                break;
            case 'last':
                if (AssignXP.lastTokens) {
                    this.actors = duplicate(AssignXP.lastTokens);
                    this.changeXP();
                    this.render(true);
                }
                break;
            case 'actor': //toggle the select actor button
                let tokens = canvas.tokens.controlled.filter(t => t.actor != undefined && t.document.isLinked);
                if (tokens.length == 0)
                    ui.notifications.error('No tokens are currently selected');
                else {
                    this.addToken(tokens);
                }
                break;
            case 'clear':
                this.actors = [];
                this.render(true);
                break;
        }
    }

    async _onDrop(event) {
        // Try to extract the data
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        }
        catch (err) {
            return false;
        }

        // Identify the drop target
        if (data.type == "Actor") {
            let actor = await fromUuid(data.uuid);
            actor = (actor.isPolymorphed ? game.actors.find(a => a.id == actor.getFlag(game.system.id, 'originalActor')) : actor);

            this.actors.push({
                actor: actor,
                xp: 0
            });
            this.changeXP();
            this.render(true);
        }
    }

    async assign() {
        let msg = null;
        let chatactors = this.actors
            .map(a => {
                return {
                    id: a.actor._id,
                    //actor: a.actor,
                    icon: a.actor.img,
                    name: a.actor.name,
                    xp: a.xp,
                    assigned: false
                }
            });

        if (chatactors.length > 0) {
            AssignXP.lastTokens = this.actors;

            let requestdata = {
                xp: this.xp,
                reason: $('#assign-xp-reason', this.element).val(),
                actors: chatactors
            };
            const html = await renderTemplate("./modules/monks-tokenbar/templates/assignxpchatmsg.html", requestdata);

            log('create chat request');
            let chatData = {
                user: game.user.id,
                content: html
            };

            setProperty(chatData, "flags.monks-tokenbar", requestdata);
            msg = await ChatMessage.create(chatData, {});
            this.close();
        } else
            ui.notifications.warn(i18n("MonksTokenBar.RequestNoneActorSelected"));

        return msg;
    }

    async autoassign() {
        let msg = await this.assign();
        if (msg) AssignXP.onAssignAllXP(msg);
        return msg;
    }
}

export class AssignXP {
    static lastTokens;
    static async onAssignXP(actorid, message, e) {
        if (game.user.isGM) {
            let actors = JSON.parse(JSON.stringify(message.getFlag('monks-tokenbar', 'actors')));
            let msgactor = actors.find(a => { return a.id === actorid; });

            if (!msgactor.assigned) {
                MonksTokenBar.system.assignXP(msgactor);
                msgactor.assigned = true;
            }
            await message.setFlag('monks-tokenbar', 'actors', actors);
        } else {
            $(e.target).hide();
            MonksTokenBar.emit('assignxp', { actorid: actorid, msgid: message.id });
        }
    }

    static async onAssignAllXP(message) {
        if (game.user.isGM) {
            let actors = message.getFlag('monks-tokenbar', 'actors');
            for (let i = 0; i < actors.length; i++) {
                let msgactor = actors[i];
                if (!msgactor.assigned) {
                    await AssignXP.onAssignXP(msgactor.id, message);
                }
            };
        }
    }
}

Hooks.on("renderChatMessage", (message, html, data) => {
    const assignCard = html.find(".monks-tokenbar.assignxp");
    if (assignCard.length !== 0) {
        if (!game.user.isGM)
            html.find(".gm-only").remove();
        if (game.user.isGM)
            html.find(".player-only").remove();

        $('.assign-all', html).click($.proxy(AssignXP.onAssignAllXP, AssignXP, message));

        let actors = message.getFlag('monks-tokenbar', 'actors');

        let items = $('.item', html);
        for (let i = 0; i < items.length; i++) {
            var item = items[i];
            let actorId = $(item).attr('data-item-id');
            let actorData = actors.find(a => { return a.id == actorId; });
            let actor = game.actors.get(actorId);

            let assign = !actorData.assigned && (game.user.isGM || actor.isOwner);
            $('.add-xp', item).toggle(assign).click($.proxy(AssignXP.onAssignXP, this, actorId, message));
        }
    }
});
