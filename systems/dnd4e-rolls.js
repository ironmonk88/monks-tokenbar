import { BaseRolls } from "./base-rolls.js"
import { i18n, log, setting } from "../monks-tokenbar.js"

export class DnD4eRolls extends BaseRolls {
    constructor() {
        super();

        let savingThrow = duplicate(this.config.def);
        delete savingThrow.ac;

        this._requestoptions = [
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: savingThrow },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.skills }
        ].concat(this._requestoptions);

        this._defaultSetting = mergeObject(this._defaultSetting, {
            stat1: "defences.ac.value",
            stat2: "skills.prc.total"
        });
    }

    get _supportedSystem() {
        return true;
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            log(message);
            /*if (message?.flags?.pf2e?.context != undefined && (message.flags.pf2e.context?.options?.includes("ignore") || message.flags.pf2e.context.type == 'ignore'))
                return false;
            else
                return true;*/
        });
    }

    get showXP() {
        return !game.settings.get('dnd4eBeta', 'disableExperienceTracking');
    }

    defaultRequest(app) {
        let allPlayers = (app.tokens.filter(t => t.actor?.hasPlayerOwner).length == app.tokens.length);
        return (allPlayers ? 'skill:prc' : null);
    }

    defaultContested() {
        return 'ability:str';
    }

    roll({id, actor, request, requesttype, fastForward = false }, callback, e) {
        let rollfn = null;
        let options = { fastForward: fastForward, chatMessage: false, fromMars5eChatCard: true, event: e };
        let context = actor;
        if (requesttype == 'ability') {
            rollfn = actor.rollAbility
        }
        else if (requesttype == 'save') {
            rollfn = actor.rollDef;
        }
        else if (requesttype == 'skill') {
            rollfn = actor.rollSkill;
        }

        if (rollfn != undefined) {
            try {
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
            "data.details.exp": actor.data.data.details.exp + msgactor.xp
        });
    }
}