import { MonksTokenBar, log, i18n, setting } from "../monks-tokenbar.js"
import { SavingThrowApp } from "../apps/savingthrow.js";
import { ContestedRollApp } from "../apps/contestedroll.js";
import { AssignXPApp } from "../apps/assignxp.js";

export class BaseRolls {
    constructor() {
        this._config = CONFIG[game.system.id.toUpperCase()];
        this._requestoptions = [{
            id: "dice", text: "Dice", cssclass: "dice-group", groups: { "1d2": "1d2", "1d4": "1d4", "1d6": "1d6", "1d8": "1d8", "1d10": "1d10", "1d12": "1d12", "1d20": "1d20", "1d100": "1d100" }
        }];
    }

    get _supportedSystem() {
        return false;
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

    get showRoll() {
        return true;
    }

    get useDegrees() {
        return false;
    }

    rollSuccess(roll, dc) {
        return roll.total >= dc;
    }

    get showXP() {
        return true;
    }

    getXP (actor) {
        return { value: 0, max: 0 };
    }

    getLevel(actor) {
        return actor.data.data.details?.level?.value || actor.data.data.details?.level || 0;
    }

    get dcLabel() {
        return "MonksTokenBar.SavingDC";
    }

    get defaultStats() {
        return [];
    }

    getButtons() {
        var buttons =
        [
            [
                {
                    id: 'movement-free',
                    title: 'MonksTokenBar.FreeMovement',
                    icon: 'fa-running',
                    click: (game.user.isGM ?
                        (event) => {
                        event.preventDefault();
                        MonksTokenBar.changeGlobalMovement('free');
                        } : null)
                },
                {
                    id: 'movement-none',
                    title: 'MonksTokenBar.NoMovement',
                    icon: 'fa-street-view',
                    click: (game.user.isGM ?
                        (event) => {
                        event.preventDefault();
                        MonksTokenBar.changeGlobalMovement('none');
                        } : null)
                },
                {
                    id: 'movement-combat',
                    title: 'MonksTokenBar.CombatTurn',
                    icon: 'fa-fist-raised',
                    click: (game.user.isGM ? (event) => {
                        event.preventDefault();
                        MonksTokenBar.changeGlobalMovement('combat');
                        } : null)
                }
            ]
        ];
        if (game.user.isGM && MonksTokenBar.system._supportedSystem) {
            buttons.push([
                {
                    id: 'request-roll',
                    title: 'MonksTokenBar.RequestRoll',
                    icon: 'fa-tools',
                    click: (event) => {
                        event.preventDefault();
                        this.savingthrow = new SavingThrowApp().render(true);
                    }
                },
                {
                    id: 'contested-roll',
                    title: 'MonksTokenBar.ContestedRoll',
                    icon: 'fa-people-arrows',
                    click: (event) => {
                        event.preventDefault();
                        this.contestedroll = new ContestedRollApp().render(true);
                    }
                },
                {
                    id: 'assign-xp',
                    title: 'MonksTokenBar.AssignXP',
                    icon: 'fa-book-medical',
                    hidden: !MonksTokenBar.system.showXP,
                    click: (event) => {
                        event.preventDefault();
                        new AssignXPApp().render(true);
                    }
                }
            ]);
        }
        return buttons;
    }

    defaultRequest() {
        return null;
    }

    defaultContested() {
        return null;
    }

    get canGrab() {
        return false;
    }

    dynamicRequest(tokens) {
        return [];
    }

    roll({ id }, callback, e) {
        return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
    }

    async assignXP(msgactor) {

    }

    parseKeys(e, keys) {

    }
}