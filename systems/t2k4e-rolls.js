import { BaseRolls } from "./base-rolls.js"
import { i18n, log, MonksTokenBar, setting } from "../monks-tokenbar.js"

export class T2K4ERolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "attribute", text: "MonksTokenBar.Attributes", groups: this.config.attributes },
            { id: "skill", text: "MonksTokenBar.Skills", groups: this.config.skills }
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return true;
    }

    roll({ id, actor, request, rollMode, fastForward = false, message }, callback, e) {
        let rollfn = game.t2k4e.roller.taskCheck;
        let context = game.t2k4e.roller;
        let options = { actor, askForOptions: e.shiftKey, rollMode, skipDialog: fastForward, sendMessage: false };
        if (request.type == 'attribute') {
            options.attributeName = request.key;
            options.attribute = actor.system.attributes[options.attributeName].value;
            options.title = game.i18n.localize(this.config.attributes[options.attributeName]);
            options.skill = 0;
        }
        else if (request.type == 'skill') {
            options.skillName = request.key;
            options.skill = this.config.skills[options.skillName].value;
            options.attributeName = game.t2k4e.config.skillsMap[options.skillName];
            options.title = game.i18n.localize(this.config.skills[options.skillName]);
            options.attribute = actor.system.attributes[options.attributeName].value;
            let isRangedSkill = ["rangedCombat", "heavyWeapons"].includes(options.skillName)
            let isCombatSkill = ["rangedCombat", "heavyWeapons", "closeCombat"].includes(options.skillName);
            options.rof = isRangedSkill ? 6 : 0;
            options.locate = isCombatSkill;
        }

        if (rollfn != undefined) {
            try {
                return rollfn.call(context, options).then((roll) => { return callback(roll); }).catch((e) => {
                    console.error(e);
                    return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
                });
            } catch (e) {
                console.error(e);
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
            }
        } else
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
    }
}