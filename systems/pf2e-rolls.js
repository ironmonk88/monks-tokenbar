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
        let allPlayers = (app.tokens.filter(t => t.actor?.hasPlayerOwner).length == app.tokens.length);
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
                return game.pf2e.Dice.d20Roll({
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
                rollfn = actor.data.data?.saves[request].roll;
            } else
                rollfn = actor.rollSave;
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
                if (requesttype == 'ability')
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
            "data.details.xp.value": actor.data.data.details.xp.value + msgactor.xp
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