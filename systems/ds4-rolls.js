import { BaseRolls } from "./base-rolls.js"
import { i18n, log, setting } from "../monks-tokenbar.js"

export class DS4Rolls extends BaseRolls {
    constructor() {
        super();

        this._config = CONFIG.DS4
        /* TODO: No point in exposing, until rolling dice is fixed
        this._requestoptions = [
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.i18nKeys.checks },
        ].concat(this._requestoptions);
        */
    }

    get _supportedSystem() {
        return true;
    }

    getLevel(actor) {
        return actor.data.data.progression?.level || 0;
    }

    getXP(actor) {
        return actor.data.data.progression?.experiencePoints || 0;
    }

    get defaultStats() {
        return [{ stat: "combatValues.hitPoints.value", icon: "fa-heart" },
        { stat: "combatValues.defense.total", icon: "fa-shield-alt" },
        { stat: "checks.perception", icon: "fa-eye" }];
    }

    /*  TODO: Rolls technically work, but results are not returned by the DS4 system (Promise<void>)

        defaultRequest(app) {
            let allPlayers = (app.entries.filter(t => t.token.actor?.hasPlayerOwner).length == app.entries.length);
            return (allPlayers ? 'skill:perception' : null);
        }
    
        defaultContested() {
            return 'skill:perception';
        }
    
        roll({ id, actor, request, requesttype, fastForward = false }, callback, e) {
            let rollfn = null;
    
            rollfn = actor.rollCheck;
    
            if (rollfn != undefined) {
                try {
                    return rollfn.call(actor, request).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
                } catch {
                    return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
                }
            } else
                return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
        }
    */
    async assignXP(msgactor) {
        let actor = game.actors.get(msgactor.id);
        await actor.update({
            "data.progression.experiencePoints": parseInt(actor.data.data.progression.experiencePoints) + parseInt(msgactor.xp)
        });
    }
}