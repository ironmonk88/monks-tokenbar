import { BaseRolls } from "./base-rolls.js"
import { i18n, log, setting, error } from "../monks-tokenbar.js"

export class PF2eRolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "attribute", text: i18n("MonksTokenBar.Attribute"), groups: { perception: CONFIG.PF2E.attributes.perception } },
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: this.config.saves },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.skillList }
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
        let allPlayers = (app.entries.filter(t => t.token?.actor?.hasPlayerOwner).length == app.entries.length);
        return (allPlayers ? { type: 'attribute', key: 'perception' } : null);
    }

    defaultContested() {
        return 'ability:str';
    }

    getXP(actor) {
        return actor?.system.details.xp;
    }

    get useDegrees() {
        return true;
    }

    rollSuccess(roll, dc) {
        let total = roll.total;
        let success = (total >= dc) ? 1 : 0;
        if (total >= dc + 10) success++;
        if (total <= dc - 10) success--;

        const diceResult = roll.terms[0]?.results?.find(r => r.active)?.result;
        if (diceResult === 1) success--;
        if (diceResult === 20) success++;

        if (success > 0)
            return (success > 1 ? "success" : true);
        else
            return (success < 0 ? "failed" : false);
    }

    roll({ id, actor, request, rollMode, fastForward = false }, callback, e) {
        let rollfn = null;
        let opts = request.key;
        if (request.type == 'attribute') {
            rollfn = function (event, attributeName) {
                const attribute = actor.system.attributes[attributeName];
                if (!attribute)
                    return;
                const parts = ["@mod", "@itemBonus"],
                    configAttributes = CONFIG.PF2E.attributes;
                const flavor = `${game.i18n.localize(configAttributes[attributeName])} Check`;

                return game.pf2e.Dice.d20Roll({
                    event,
                    rollMode,
                    parts,
                    data: {
                        mod: attribute.value
                    },
                    title: flavor,
                    speaker: ChatMessage.getSpeaker({
                        actor: actor
                    }),
                    rollType: 'ignore',
                    shipDialog: fastForward
                });
            }
        }
        else if (request.type == 'ability') {
            rollfn = function (event, abilityName) {
                const bonus = actor.system.abilities[abilityName].mod,
                    title = game.i18n.localize(`PF2E.AbilityCheck.${abilityName}`),
                    data = { bonus },
                    speaker = ChatMessage.getSpeaker({
                        actor: actor
                    });
                return game.pf2e.Dice.d20Roll({
                    event,
                    rollMode,
                    parts: ["@bonus"],
                    data: data,
                    title: title,
                    speaker: speaker,
                    rollType: 'ignore',
                    shipDialog: fastForward
                });
            }
        }
        else if (request.type == 'save') {
            rollfn = function (event, saveName) {
                const save = actor.system.saves[saveName],
                    flavor = `${game.i18n.localize(CONFIG.PF2E.saves[saveName])} Save Check`;
                return game.pf2e.Dice.d20Roll({
                    event,
                    rollMode,
                    parts: ["@mod", "@itemBonus"],
                    data: {
                        mod: save.value
                    },
                    title: flavor,
                    speaker: ChatMessage.getSpeaker({
                        actor: actor
                    }),
                    rollType: 'ignore',
                    shipDialog: fastForward
                })
            }
        }
        else if (request.type == 'skill') {
            if (actor.skills[request.key]?.roll) {
                opts = actor.getRollOptions(["all", "skill-check", request.key]);
                rollfn = actor.skills[request.key].check.roll;
                actor = actor.skills[request.key].check;
            } else
                rollfn = actor.rollSkill;
        }

        if (rollfn != undefined) {
            try {
                if (request.type != 'skill')
                    return rollfn.call(actor, e, opts).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
                else {
                    return new Promise(function (resolve, reject) {
                        rollfn.call(actor, { event: e, options: opts, extraRollOptions: ["ignore"], callback: function (roll) { resolve(callback(roll)); } });
                    }).catch((err) => { error(err); return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
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
            "system.details.xp.value": parseInt(actor.system.details.xp.value) + parseInt(msgactor.xp)
        });

        if (setting("send-levelup-whisper") && actor.system.details.xp.value >= actor.system.details.xp.max) {
            ChatMessage.create({
                user: game.user.id,
                content: i18n("MonksTokenBar.Levelup"),
                whisper: ChatMessage.getWhisperRecipients(actor.name)
            }).then(() => { });
        }
    }
}