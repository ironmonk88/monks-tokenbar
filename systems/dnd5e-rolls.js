import { BaseRolls } from "./base-rolls.js"
import { i18n } from "../monks-tokenbar.js"

export class DnD5eRolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "misc", text: '', groups: { init: i18n("MonksTokenBar.Initiative"), death: i18n("MonksTokenBar.DeathSavingThrow") } },
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: this.config.abilities },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.skills }
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return true;
    }

    get showXP() {
        return !game.settings.get('dnd5e', 'disableExperienceTracking');
    }

    defaultRequest(app) {
        let allPlayers = (app.tokens.filter(t => t.actor?.hasPlayerOwner).length == app.tokens.length);
        //if all the tokens have zero hp, then default to death saving throw
        let allZeroHP = app.tokens.filter(t => getProperty(t.actor, "data.data.attributes.hp.value") == 0).length;
        return (allZeroHP == app.tokens.length && allZeroHP != 0 ? 'misc:death' : null) || (allPlayers ? 'skill:prc' : null);
    }

    defaultContested() {
        return 'ability:str';
    }

    roll({id, actor, request, requesttype, fastForward = false }, callback, e) {
        let rollfn = null;
        let options = { fastForward: fastForward, chatMessage: false, fromMars5eChatCard: true, event: e };
        let context = actor;
        if (requesttype == 'ability') {
            rollfn = (actor.getFunction ? actor.getFunction("rollAbilityTest") : actor.rollAbilityTest);
        }
        else if (requesttype == 'save') {
            rollfn = actor.rollAbilitySave;
        }
        else if (requesttype == 'skill') {
            rollfn = actor.rollSkill;
        } else if (requesttype == 'tool') {
            let item = actor.items.find(i => { return i.getFlag("core", "sourceId") == request || i.id == request; });
            if (item != undefined) {
                context = item;
                request = options;
                rollfn = item.rollToolCheck;
            } else
                return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoTool") };
        } else {
            if (request == 'death') {
                rollfn = actor.rollDeathSave;
                request = options;
            }
            else if (request == 'init') {
                rollfn = actor.rollInitiative;
                request = { createCombatants: false, initiativeOptions: options };
            }
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
}