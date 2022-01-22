import { BaseRolls } from "./base-rolls.js"
import { i18n, log, setting } from "../monks-tokenbar.js"

export class PF2eRolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "attribute", text: i18n("MonksTokenBar.Attribute"), groups: { perception: CONFIG.PF2E.attributes.perception } },
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: this.config.saves },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.skills }
        ].concat(this._requestoptions);

        /*
        this._defaultSetting = mergeObject(this._defaultSetting, {
            stat2: "attributes.perception.value + 10"
        });*/
    }

    get _supportedSystem() {
        return true;
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            let ctx = message.getFlag('pf2e', 'context');
            if (ctx != undefined && (ctx.options?.includes("ignore") || ctx.type == 'ignore'))
                return false;
            else
                return true;
        });
    }

    get defaultStats() {
        return [{ stat: "attributes.ac.value", icon: "fa-shield-alt" }, { stat: "attributes.perception.value + 10", icon: "fa-eye" }];
    }

    defaultRequest(app) {
        let allPlayers = (app.entries.filter(t => t.actor?.hasPlayerOwner).length == app.entries.length);
        return (allPlayers ? 'attribute:perception' : null);
    }

    defaultContested() {
        return 'ability:str';
    }

    getXP(actor) {
        return actor.data.data.details.xp;
    }

    roll({ id, actor, request, requesttype, fastForward = false }, callback, e) {
        let rollfn = null;
        let opts = request;
        if (requesttype == 'attribute') {
            rollfn = function (event, attributeName) {
                const attribute = actor.data.data.attributes[attributeName];
                if (!attribute)
                    return;
                const parts = ["@mod", "@itemBonus"],
                    configAttributes = CONFIG.PF2E.attributes;
                const flavor = `${game.i18n.localize(configAttributes[attributeName])} Check`;

                return game.pf2e.Dice.d20Roll({
                    event,
                    parts,
                    data: {
                        mod: attribute.value
                    },
                    title: flavor,
                    speaker: ChatMessage.getSpeaker({
                        actor: actor
                    }),
                    rollType: 'ignore'
                });
            }
        }
        else if (requesttype == 'ability') {
            rollfn = function (event, abilityName) {
                const bonus = actor.data.data.abilities[abilityName].mod,
                    title = game.i18n.localize(`PF2E.AbilityCheck.${abilityName}`),
                    data = { bonus },
                    speaker = ChatMessage.getSpeaker({
                        actor: actor
                    });
                return game.pf2e.Dice.d20Roll({
                    event,
                    parts: ["@bonus"],
                    data: data,
                    title: title,
                    speaker: speaker,
                    rollType: 'ignore'
                });
            }
        }
        else if (requesttype == 'save') {
            rollfn = function (event, saveName) {
                const save = actor.data.data.saves[saveName],
                    flavor = `${game.i18n.localize(CONFIG.PF2E.saves[saveName])} Save Check`;
                return game.pf2e.Dice.d20Roll({
                    event,
                    parts: ["@mod", "@itemBonus"],
                    data: {
                        mod: save.value
                    },
                    title: flavor,
                    speaker: ChatMessage.getSpeaker({
                        actor: actor
                    }),
                    rollType: 'ignore'
                })
            }
        }
        else if (requesttype == 'skill') {
            if (actor.data.data?.skills[request]?.roll) {
                opts = actor.getRollOptions(["all", "skill-check", request]);
                rollfn = actor.data.data.skills[request].roll;
            } else
                rollfn = actor.rollSkill;
        }

        if (rollfn != undefined) {
            try {
                if (requesttype != 'skill')
                    return rollfn.call(actor, e, opts).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
                else {
                    opts.push("ignore");
                    return new Promise(function (resolve, reject) {
                        rollfn.call(actor, { event: e, options: opts, callback: function (roll) { resolve(callback(roll)); } });
                    }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
                }
            } catch(err)
            {
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
            }
        } else
            return { id: id, error: true, msg: actor.name + i18n("MonksTokenBar.ActorNoRollFunction") };
    }

    async assignXP(msgactor) {
        let actor = game.actors.get(msgactor.id);
        await actor.update({
            "data.details.xp.value": parseInt(actor.data.data.details.xp.value) + parseInt(msgactor.xp)
        });

        if (setting("send-levelup-whisper") && actor.data.data.details.xp.value >= actor.data.data.details.xp.max) {
            ChatMessage.create({
                user: game.user.id,
                content: i18n("MonksTokenBar.Levelup"),
                whisper: ChatMessage.getWhisperRecipients(actor.data.name)
            }).then(() => { });
        }
    }
}