import { BaseRolls } from "./base-rolls.js"
import { i18n, log, setting } from "../monks-tokenbar.js"

export class CoC7Rolls extends BaseRolls {
    constructor() {
        super();

        let characteristics = {};
        for (let [k, v] of Object.entries(game.system.model.Actor.character.characteristics))
            characteristics[k] = v.label;

        this._requestoptions = [
            { id: "misc", text: '', groups: { init: "MonksTokenBar.Initiative" } },
            { id: "characteristics", text: "MonksTokenBar.Characteristics", groups: characteristics }
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return true;
    }

    /*
    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            if (message.getFlag('monks-tokenbar', 'ignore') === true)
                return false;
            else
                return true;
        });
    }*/

    get defaultStats() {
        return [{ stat: "attribs.san.value", icon: "fa-head-side-virus" }, { stat: "attribs.mp.value", icon: "fa-hat-wizard" }];
    }

    getLevel(actor) {
        return 0;
    }

    get showXP() {
        return false;
    }

    /*
    defaultRequest(app) {
        let allPlayers = (app.tokens.filter(t => t.actor?.hasPlayerOwner).length == app.tokens.length);
        //if all the tokens have zero hp, then default to death saving throw
        let allZeroHP = app.tokens.filter(t => getProperty(t.actor, "data.data.attributes.hp.value") == 0).length;
        return (allZeroHP == app.tokens.length && allZeroHP != 0 ? 'misc:death' : null) || (allPlayers ? 'skill:prc' : null);
    }*/

    defaultContested() {
        return 'characteristics:str';
    }

    dynamicRequest(tokens) {
        let skills = {};
        //get the first token's skills
        for (let item of tokens[0].actor.items) {
            if (item.type == 'skill') {
                let sourceID = item.getFlag("core", "sourceId") || item.id;
                skills[sourceID] = item.data.name;
            }
        }
        //see if the other tokens have these skills
        if (Object.keys(skills).length > 0) {
            for (let i = 1; i < tokens.length; i++) {
                let token = tokens[i];
                for (let [k, v] of Object.entries(skills)) {
                    let tool = token.actor.items.find(t => {
                        return t.type == 'skill' && (t.getFlag("core", "sourceId") || t.id) == k;
                    });
                    if (tool == undefined)
                        delete skills[k];
                }
            }
        }

        if (Object.keys(skills).length == 0)
            return;

        return [{ id: 'skill', text: 'Skills', groups: skills }];
    }

    roll({ id, actor, request, requesttype, fastForward = false }, callback, e) {
        /*
        let rollfn = null;
        let options = { fastForward: fastForward, chatMessage: false, event: e };
        let context = actor;
        if (requesttype == 'characteristics') {
            rollfn = actor.rollCharacteristicsValue;
        } else if (requesttype == 'tool' || requesttype == 'skill') {
            let item = actor.items.find(i => { return i.getFlag("core", "sourceId") == request || i.id == request; });
            if (item != undefined) {
                context = item;
                request = options;
                rollfn = item.rollToolCheck;
            } else
                return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoTool") };
        } else {
            if (request == 'init') {
                rollfn = actor.rollInitiative;
                options.messageOptions = { flags: { 'monks-tokenbar': { ignore: true }} };
                request = { createCombatants: false, rerollInitiative: true, initiativeOptions: options };
            }
        }

        if (rollfn != undefined) {
            try {
                return rollfn.call(context, request, options).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
            } catch{
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
            }
        } else*/
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
    }
}