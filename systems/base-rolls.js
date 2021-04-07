import { i18n } from "../monks-tokenbar.js"

export class BaseRolls {
    constructor() {
        this._config = (game.system.id == "tormenta20" ? CONFIG.T20 : CONFIG[game.system.id.toUpperCase()]);
        this._requestoptions = [{
            id: "dice", text: "Dice", cssclass: "dice-group", groups: { "1d2": "1d2", "1d4": "1d4", "1d6": "1d6", "1d8": "1d8", "1d10": "1d10", "1d12": "1d12", "1d20": "1d20", "1d100": "1d100" }
        }]
    }

    static activateHooks() {
    }

    get requestoptions() {
        return this._requestoptions;
    }

    get contestedoptions() {
        return this._requestoptions.filter(o => { return o.id != 'save' && o.id != 'misc' });
    }

    get config() {
        return this._config;
    }

    defaultRequest() {
        return null;
    }

    defaultContested() {
        return null;
    }

    roll({ id }, callback, e) {
        return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
    }
}