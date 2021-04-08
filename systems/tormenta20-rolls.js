import { BaseRolls } from "./base-rolls.js"
import { i18n } from "../monks-tokenbar.js"

export class Tormenta20Rolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.atributos },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: this.config.resistencias },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.pericias }
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return true;
    }

    defaultRequest(app) {
        let allPlayers = (app.tokens.filter(t => t.actor?.hasPlayerOwner).length == app.tokens.length);
        return (allPlayers ? 'skill:per' : null);
    }

    defaultContested() {
        return 'ability:for';
    }

    roll({ id, actor, request, requesttype, fastForward = false }, callback, e) {
        let rollfn = null;
        let opts = request;
        if (requesttype == 'ability') {
            rollfn = actor.rollAtributo;
        }
        else if (requesttype == 'save' || requesttype == 'skill') {
            opts = {
                actor: actor,
                type: "perícia",
                data: actor.data.data.pericias[opts],
                name: actor.data.data.pericias[opts].label,
                id: opts
            };
            rollfn = actor.rollPericia;
        }
        if (rollfn != undefined) {
            try {
                return rollfn.call(actor, opts, e).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
            } catch{
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
            }
        }
        else
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
    }
}