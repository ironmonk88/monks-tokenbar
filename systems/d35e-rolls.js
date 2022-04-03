import { BaseRolls } from "./base-rolls.js"
import { i18n, log, setting } from "../monks-tokenbar.js"

export class D35eRolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "misc", text: '', groups: { init: i18n("MonksTokenBar.Initiative") } },
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: this.config.savingThrows },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.skills }
        ].concat(this._requestoptions);
        /*
        this._defaultSetting = mergeObject(this._defaultSetting, {
            stat1: "attributes.ac.normal.total",
            stat2: "skills.spt.value"
        });*/
    }

    get _supportedSystem() {
        return true;
    }

    get showXP() {
        return !game.settings.get('D35E', 'disableExperienceTracking');
    }

    getXP(actor) {
        return actor.data.data.details.xp;
    }

    get defaultStats() {
        return [{ stat: "attributes.ac.normal.total", icon: "fa-shield-alt" }, {stat:"skills.spt.value", icon: "fa-eye"}];
    }

    defaultRequest(app) {
        let allPlayers = (app.entries.filter(t => t.token.actor?.hasPlayerOwner).length == app.entries.length);
        return (allPlayers ? 'skill:spt' : null);
    }

    defaultContested() {
        return 'ability:str';
    }

    roll({ id, actor, request, rollMode, requesttype, fastForward = false }, callback, e) {
        let rollfn = null;
        let options = { rollMode: rollMode, fastForward: fastForward, chatMessage: false, fromMars5eChatCard: true, event: e };
        let context = actor;
        if (requesttype == 'ability') {
            rollfn = actor.rollAbilityTest;
        }
        else if (requesttype == 'save') {
            rollfn = actor.rollSavingThrow;
        }
        else if (requesttype == 'skill') {
            rollfn = actor.rollSkill;
        } else {
            if (request == 'init') {
                rollfn = actor.rollInitiative;
                request = { createCombatants: false, rerollInitiative: game.user.isGM };
            }
        }

        if (rollfn != undefined) {
            try {
                if (requesttype == 'save')
                    return rollfn.call(context, request, null, null, options).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
                else
                    return rollfn.call(context, request, options).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
            } catch{
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
            }
        } else
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
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