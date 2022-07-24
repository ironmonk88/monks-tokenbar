import { BaseRolls } from "./base-rolls.js"
import { i18n, log, setting } from "../monks-tokenbar.js"

export class SwadeRolls extends BaseRolls {
    constructor() {
        super();

        let attributes = {};
        for (let [k, v] of Object.entries(this.config.attributes))
            attributes[k] = v.long;

        this._requestoptions = [
            { id: "ability", text: i18n("MonksTokenBar.Attribute"), groups: attributes }
        ].concat(this._requestoptions);

        /*
        this._defaultSetting = mergeObject(this._defaultSetting, {
            stat1: "stats.toughness.value"//,
            //stat2: "skills.per.mod"
        });*/
    }

    get _supportedSystem() {
        return true;
    }

    get showXP() {
        return false;
    }

    get showRoll() {
        return false;
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            log(message);
        });
    }

    get defaultStats() {
        return [{ stat: "stats.toughness.value", icon: "fa-shield-alt" }];
    }

    /*defaultRequest(app) {
        let allPlayers = (app.tokens.filter(t => t.actor?.hasPlayerOwner).length == app.tokens.length);
        return (allPlayers ? 'skill:per' : null);
    }*/

    /*
    defaultContested() {
        return 'ability:str';
    }*/

    dynamicRequest(entries) {
        let skills = {};
        //get the first token's tools
        for (let item of entries[0].token.actor.items) {
            if (item.type == 'skill') {
                skills[item.name] = item.name;
            }
        }
        //see if the other tokens have these tools
        if (Object.keys(skills).length > 0) {
            for (let i = 1; i < entries.length; i++) {
                for (let [k, v] of Object.entries(skills)) {
                    let skill = entries[i].token.actor.items.find(t => {
                        return t.type == 'skill' && t.name == k;
                    });
                    if (skill == undefined)
                        delete skills[k];
                }
            }
        }

        if (Object.keys(skills).length == 0)
            return;

        return [{ id: 'skill', text: 'Skills', groups: skills }];
    }

    roll({ id, actor, request, rollMode, requesttype, fastForward = false }, callback, e) {
        let rollfn = null;
        let opts = { rollMode: rollMode, event: e, chatMessage: false };
        if (requesttype == 'ability') {
            rollfn = actor.rollAttribute;
        }
        else if (requesttype == 'skill') {
            let item = actor.items.find(i => i.name == request && i.type == 'skill');
            request = item.id;
            rollfn = actor.rollSkill;
        } else {
            if (request == 'init') {
                rollfn = actor.rollInitiative;
                options.messageOptions = { flags: { 'monks-tokenbar': { ignore: true } } };
                request = { createCombatants: false, rerollInitiative: true, initiativeOptions: options };
            }
        }

        if (rollfn != undefined) {
            try {
                if (fastForward) {
                    opts.suppressChat = true;
                    return new Promise(function (resolve, reject) {
                        resolve(rollfn.call(actor, { event: e, options: opts }));
                    }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
                } else {
                    return rollfn.call(actor, request, opts)
                        .then((roll) => { return callback(roll); })
                        .catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
                }
            } catch (err) {
                log('Error:', err);
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
            }
        } else
            return { id: id, error: true, msg: actor.name + i18n("MonksTokenBar.ActorNoRollFunction") };
    }

    /*
    async assignXP(msgactor) {
        let actor = game.actors.get(msgactor.id);
        await actor.update({
            "system.details.xp.value": actor.system.details.xp.value + msgactor.xp
        });

        if (setting("send-levelup-whisper") && actor.system.details.xp.value >= actor.system.details.xp.max) {
            ChatMessage.create({
                user: game.user.id,
                content: i18n("MonksTokenBar.Levelup"),
                whisper: ChatMessage.getWhisperRecipients(actor.name)
            }).then(() => { });
        }
    }*/
}