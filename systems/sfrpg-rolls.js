import { BaseRolls } from "./base-rolls.js"
import { i18n, log } from "../monks-tokenbar.js"

export class SFRPGRolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "abilities", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "saves", text: i18n("MonksTokenBar.SavingThrow"), groups: this.config.saves },
            { id: "skills", text: i18n("MonksTokenBar.Skill"), groups: this.config.skills }
        ].concat(this._requestoptions);
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            log(message);
            if (message?.speaker?.monkstokenbar == 'delete')
                return false;
            else
                return true;
        });
    }

    get contestedoptions() {
        return this._requestoptions.filter(o => { return o.id != 'saves' });
    }

    defaultRequest(app) {
        let allPlayers = (app.tokens.filter(t => t.actor?.hasPlayerOwner).length == app.tokens.length);
        return (allPlayers ? 'skills:per' : null);
    }

    defaultContested() {
        return 'abilities:str';
    }

    roll({ id, actor, request, requesttype, fastForward = false }, callback, e) {
        let rollfn = null;
        let opts = { event: e };

        rollfn = new Promise(function (resolve, reject) {
            let _requesttype = (requesttype == 'saves' ? 'attributes' : requesttype);
            const value = getProperty(actor.data.data, `${_requesttype}.${request}`);
            const label = CONFIG.SFRPG[requesttype][request];
            let title = (requesttype == "abilities" ? 'Ability Check' : (requesttype == "saves" ? 'Save' : 'Skill Check')) + ` - ${label}`;

            let parts = [];
            let data = actor.getRollData();

            //Include ability check bonus only if it's not 0
            if (requesttype == 'ability' && value.abilityCheckBonus) {
                parts.push('@abilityCheckBonus');
                data.abilityCheckBonus = value.abilityCheckBonus;
            }
            let part = (requesttype == 'saves' ? 'bonus' : 'mod');
            parts.push(`@${_requesttype}.${request}.${part}`);

            const rollContext = new SFRPGRollContext(actor, data);
            actor.setupRollContexts(rollContext);

            let speaker = ChatMessage.getSpeaker({ actor: actor });
            speaker.monkstokenbar = 'delete';

            return game.sfrpg.dice.d20Roll({
                event: e,
                rollContext: rollContext,
                parts: parts,
                title: title,
                flavor: null,
                speaker: speaker,
                dialogOptions: {
                    left: e ? e.clientX - 80 : null,
                    top: e ? e.clientY - 80 : null,
                    skipUI: fastForward
                },
                onClose: function (roll) { resolve(callback(roll)); }
            });
        }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });

        /*
        if (requesttype == 'ability') {
            rollfn = new Promise(function (resolve, reject) {
                const abl = actor.data.data.abilities[request]

                let parts = [];
                let data = actor.getRollData();

                //Include ability check bonus only if it's not 0
                if (abl.abilityCheckBonus) {
                    parts.push('@abilityCheckBonus');
                    data.abilityCheckBonus = abl.abilityCheckBonus;
                }
                parts.push(`@abilities.${request}.mod`);

                const rollContext = new SFRPGRollContext(actor, data);
                actor.setupRollContexts(rollContext);

                return game.sfrpg.dice.d20Roll({
                    event: e,
                    rollContext: rollContext,
                    parts: parts,
                    title: 'removemessage',
                    flavor: null,
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    dialogOptions: {
                        left: e ? e.clientX - 80 : null,
                        top: e ? e.clientY - 80 : null
                    },
                    onClose: function (roll) { resolve(callback(roll)); }
                });
            }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
        }
        else if (requesttype == 'save') {
            rollfn = new Promise(function (resolve, reject) {
                const save = actor.data.data.attributes[request]

                let parts = [];
                let data = actor.getRollData();

                parts.push(`@attributes.${request}.bonus`);

                const rollContext = new SFRPGRollContext(actor, data);
                actor.setupRollContexts(rollContext);

                return game.sfrpg.dice.d20Roll({
                    event: e,
                    rollContext: rollContext,
                    parts: parts,
                    title: 'removemessage',
                    flavor: null,
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    dialogOptions: {
                        left: e ? e.clientX - 80 : null,
                        top: e ? e.clientY - 80 : null
                    },
                    onClose: function (roll) { resolve(callback(roll)); }
                });
            }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
        }
        else if (requesttype == 'skill') {
            rollfn = new Promise(function (resolve, reject) {
                const skl = actor.data.data.skills[request];

                let parts = [];
                let data = actor.getRollData();

                parts.push(`@skills.${request}.mod`);

                const rollContext = new SFRPGRollContext(actor, data);
                actor.setupRollContexts(rollContext);

                return game.sfrpg.dice.d20Roll({
                    event: e,
                    rollContext: rollContext,
                    parts: parts,
                    title: 'removemessage',
                    flavor: null,
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    dialogOptions: {
                        left: e ? e.clientX - 80 : null,
                        top: e ? e.clientY - 80 : null
                    },
                    onClose: function (roll) { resolve(callback(roll)); }
                });
            }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
        }*/

        if (rollfn != undefined) {
            try {
                return rollfn.catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
            } catch{
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
			}
        } else
            return { id: id, error: true, msg: actor.name + i18n("MonksTokenBar.ActorNoRollFunction") };
    }
}

class SFRPGRollContext {
    constructor(actor, data) {
        this.allContexts = {
            main: {
                data: data || actor.data.data,
                entity: actor
            }
        };
        this.mainContext = "main";
        this.selectors = [];
    }

    isValid() {
        return true;
    }

    getValue(variable) {
        if (!variable) return null;

        const [context, key] = this.getContextForVariable(variable);

        let result = SFRPGRollContext._readValue(context.data, key);
        if (!result) {
            result = SFRPGRollContext._readValue(context.entity.data, key);
        }

        return result;
    }

    getContextForVariable(variable) {
        if (variable[0] === '@') {
            variable = variable.substring(1);
        }

        const firstToken = variable.split('.')[0];

        if (this.allContexts[firstToken]) {
            //console.log(["getContextForVariable", variable, contexts, contexts.allContexts[firstToken]]);
            return [this.allContexts[firstToken], variable.substring(firstToken.length + 1)];
        }

        const context = (this.mainContext ? this.allContexts[this.mainContext] : null);
        //console.log(["getContextForVariable", variable, contexts, context]);
        return [context, variable];
    }

    hasMultipleSelectors() {
        return false;
    }

    static _readValue(object, key) {
        //console.log(["_readValue", key, object]);
        if (!object || !key) return null;

        const tokens = key.split('.');
        for (const token of tokens) {
            object = object[token];
            if (!object) return null;
        }

        return object;
    }
}