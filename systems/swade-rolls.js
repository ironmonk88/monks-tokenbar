import { BaseRolls } from "./base-rolls.js"
import { i18n, log, setting } from "../monks-tokenbar.js"

export class SwadeRolls extends BaseRolls {
    constructor() {
        super();

        let attributes = {};
        for (let [k, v] of Object.entries(this.config.attributes))
            attributes[k] = v.long;

        this._requestoptions = [
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: attributes }
        ].concat(this._requestoptions);

        this._defaultSetting = mergeObject(this._defaultSetting, {
            stat1: "stats.toughness.value"//,
            //stat2: "skills.per.mod"
        });
    }

    get _supportedSystem() {
        return true;
    }

    get showXP() {
        return false;
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            log(message);
        });
    }

    /*defaultRequest(app) {
        let allPlayers = (app.tokens.filter(t => t.actor?.hasPlayerOwner).length == app.tokens.length);
        return (allPlayers ? 'skill:per' : null);
    }*/

    /*
    defaultContested() {
        return 'ability:str';
    }*/

    roll({ id, actor, request, requesttype, fastForward = false }, callback, e) {
        let rollfn = null;
        let opts = { event: e, chatMessage: false };
        if (requesttype == 'ability') {
            rollfn = actor.rollAttribute;
        }
        else if (requesttype == 'skill') {
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
            "data.details.xp.value": actor.data.data.details.xp.value + msgactor.xp
        });

        if (setting("send-levelup-whisper") && actor.data.data.details.xp.value >= actor.data.data.details.xp.max) {
            ChatMessage.create({
                user: game.user.id,
                content: i18n("MonksTokenBar.Levelup"),
                whisper: ChatMessage.getWhisperRecipients(actor.data.name)
            }).then(() => { });
        }
    }*/
}