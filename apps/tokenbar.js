import { MonksTokenBar, log, error, i18n, setting, MTB_MOVEMENT_TYPE } from "../monks-tokenbar.js";
import { SavingThrowApp } from "../apps/savingthrow.js";
import { ContestedRollApp } from "../apps/contestedroll.js";
import { AssignXPApp } from "../apps/assignxp.js";

export class TokenBar extends Application {
	constructor(options) {
	    super(options);

        this.tokens = [];

        /**
            * Track collapsed state
            * @type {boolean}
            */
        this._collapsed = false;

        /**
            * Track which hotbar slot is the current hover target, if any
            * @type {number|null}
            */
        this._hover = null;

        //this.changeGlobalMovement("free");
    }

    /* -------------------------------------------- */

    /** @override */
	static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
        id: "tokenbar",
        template: "./modules/monks-tokenbar/templates/tokenbar.html",
        popOut: false
    });
    }

	/* -------------------------------------------- */

    /** @override */
	getData(options) {
        return {
            tokens: this.tokens,
            movement: setting("movement"),
            stat1icon: setting("stat1-icon"),
            stat2icon: setting("stat2-icon"),
            playanimation: setting('token-animation')
        };
    }

    show() {
        $(this.element).removeClass('loading').css({ display: 'flex !important' });
    }

    setPos() {
        let pos = game.user.getFlag("monks-tokenbar", "position");

        if (pos == undefined) {
            let hbpos = $('#hotbar').position();
            let width = $('#hotbar').width();
            pos = { left: hbpos.left + width + 4, right: '', top: '', bottom: '' };
        }

        $(this.element).css(pos);

        return this;
    }

    mapToken(token) {
        let actor = token.actor;

        let stat1 = getProperty(actor.data, "data." + setting("stat1-resource")) || 0;

        /*
        stat1 = 10;
        if (game.world.system === "pf1") {
            stat1 = actor.data.data.attributes.ac.normal.total
        } else {
            stat1 = (isNaN(parseInt(actor.data.data.attributes.ac.value)) || parseInt(actor.data.data.attributes.ac.value) === 0) ? 10 : parseInt(actor.data.data.attributes.ac.value);
        }*/

        //let perceptionTitle = "Passive Perception";
        let stat2 = 10;
        if (game.world.system === "pf1") {
            stat2 = actor.data.data.skills.per.mod
            //perceptionTitle = "Perception Mod";
        } else if (game.world.system === "pf2e") {
            if (actor.data.type === "npc" || actor.data.type === "familiar") {
                stat2 = stat2 + actor.data.data.attributes.perception.value;
            } else {
                //const proficiency = actor.data.data.attributes.perception.rank ? actor.data.data.attributes.perception.rank * 2 + actor.data.data.details.level.value : 0;
                stat2 = stat2 + actor.data.data.attributes.perception.value; //actor.data.data.abilities[actor.data.data.attributes.perception.ability].mod + proficiency + actor.data.data.attributes.perception.item;
            }
            //perceptionTitle = "Perception DC";
        } else if (game.world.system === "dnd5e") {
            stat2 = actor.data.data?.skills?.prc?.passive || (10 + (actor.data.data?.abilities?.wis?.mod || 0));
        } else {
            stat2 = '';
        }

        token.unsetFlag("monks-tokenbar", "notified");

        let resources = [null, null];
        if (game.settings.get("monks-tokenbar", "show-resource-bars")) {
            ["bar1", "bar2"].forEach((b, i) => {
                const attr = token.getBarAttribute(b);

                if (attr != undefined && attr.type == "bar") {
                    const val = Number(attr.value);
                    const pct = Math.clamped(val, 0, attr.max) / attr.max;

                    if (val != undefined) {
                        let color = (i === 0) ? [(1 - (pct / 2)), pct, 0] : [(0.5 * pct), (0.7 * pct), 0.5 + (pct / 2)];
                        resources[i] = { pct: (pct * 100), color: 'rgba(' + parseInt(color[0] * 255) + ',' + parseInt(color[1] * 255) + ',' + parseInt(color[2] * 255) + ', 0.7)' };
                    }
                }
            });
        }

        let img = token.data.img;
        if (setting("token-pictures") == "actor" && token.actor != undefined)
            img = token.actor.data.img;

        return {
            id: token.id,
            token: token,
            icon: img,
            animated: img.endsWith('webm'),
            stat1: stat1,
            stat2: stat2,
            resource1: resources[0],
            resource2: resources[1]
        }
    }

    getCurrentTokens() {
        log('Get current Tokens');
        let tokens = canvas.tokens.placeables.filter(t => {
            return t.actor != undefined && t.actor?.hasPlayerOwner && (game.user.isGM || t.actor?.owner) && t.actor?.data.type != 'npc';
        }).map(t => {
            return this.mapToken(t);
        });

        this.tokens = tokens;
    }

    updateToken(token) {
        log('Update token', token);
        let idx = this.tokens.map(function (e) { return e.id; }).indexOf(token.id);
        if(idx != -1)
            this.tokens[idx] = this.mapToken(token);
    }

	/* -------------------------------------------- */

    /**
    * Collapse the Hotbar, minimizing its display.
    * @return {Promise}    A promise which resolves once the collapse animation completes
    */
    /*async collapse() {
        if ( this._collapsed ) return true;
        const toggle = this.element.find(".bar-toggle");
        const icon = toggle.children("i");
        const bar = this.element.find("#token-action-bar");
        return new Promise(resolve => {
            bar.slideUp(200, () => {
            bar.addClass("collapsed");
            icon.removeClass("fa-caret-down").addClass("fa-caret-up");
            this._collapsed = true;
            resolve(true);
            });
        });
    }*/

	/* -------------------------------------------- */

    /**
    * Expand the Hotbar, displaying it normally.
    * @return {Promise}    A promise which resolves once the expand animation completes
    */
    /*
    expand() {
        if ( !this._collapsed ) return true;
        const toggle = this.element.find(".bar-toggle");
        const icon = toggle.children("i");
        const bar = this.element.find("#token-action-bar");
        return new Promise(resolve => {
            bar.slideDown(200, () => {
            bar.css("display", "");
            bar.removeClass("collapsed");
            icon.removeClass("fa-caret-up").addClass("fa-caret-down");
            this._collapsed = false;
            resolve(true);
            });
        });
    }*/

	/* -------------------------------------------- */
    /*  Event Listeners and Handlers
	/* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Macro actions
        //html.find('.bar-toggle').click(this._onToggleBar.bind(this));
        if (game.user.isGM) {
            html.find(".request-roll").click(this._onRequestRoll.bind(this));
            html.find(".contested-roll").click(this._onContestedRoll.bind(this));
            html.find(".assign-xp").click(this._onAssignXP.bind(this));
            html.find(".token-movement").click(this._onChangeMovement.bind(this));
        }
        html.find(".token").click(this._onClickToken.bind(this)).dblclick(this._onDblClickToken.bind(this)).hover(this._onHoverToken.bind(this));

        html.find('#tokenbar-move-handle').mousedown(ev => {
            ev.preventDefault();
            ev = ev || window.event;
            let isRightMB = false;
            if ("which" in ev) { // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
                isRightMB = ev.which == 3;
            } else if ("button" in ev) { // IE, Opera 
                isRightMB = ev.button == 2;
            }

            if (!isRightMB) {
                dragElement(document.getElementById("tokenbar"));
                let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

                function dragElement(elmnt) {
                    elmnt.onmousedown = dragMouseDown;
                    function dragMouseDown(e) {
                        e = e || window.event;
                        e.preventDefault();
                        pos3 = e.clientX;
                        pos4 = e.clientY;

                        document.onmouseup = closeDragElement;
                        document.onmousemove = elementDrag;
                    }

                    function elementDrag(e) {
                        e = e || window.event;
                        e.preventDefault();
                        // calculate the new cursor position:
                        pos1 = pos3 - e.clientX;
                        pos2 = pos4 - e.clientY;
                        pos3 = e.clientX;
                        pos4 = e.clientY;
                        // set the element's new position:
                        elmnt.style.bottom = null;
                        elmnt.style.right = null
                        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
                        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
                        elmnt.style.position = 'fixed';
                        elmnt.style.zIndex = 100;
                    }

                    function closeDragElement() {
                        // stop moving when mouse button is released:
                        elmnt.onmousedown = null;
                        elmnt.style.zIndex = null;
                        document.onmouseup = null;
                        document.onmousemove = null;

                        let xPos = Math.clamped((elmnt.offsetLeft - pos1), 0, window.innerWidth - 200);
                        let yPos = Math.clamped((elmnt.offsetTop - pos2), 0, window.innerHeight - 20);

                        let position = {top: null, bottom: null, left: null, right: null};
                        if (yPos > (window.innerHeight / 2))
                            position.bottom = (window.innerHeight - yPos - elmnt.offsetHeight);
                        else 
                            position.top = yPos + 1;

                        //if (xPos > (window.innerWidth / 2))
                        //    position.right = (window.innerWidth - xPos);
                        //else
                            position.left = xPos + 1;

                        elmnt.style.bottom = (position.bottom ? position.bottom + "px" : null);
                        elmnt.style.right = (position.right ? position.right + "px" : null);
                        elmnt.style.top = (position.top ? position.top + "px" : null);
                        elmnt.style.left = (position.left ? position.left + "px" : null);

                        //$(elmnt).css({ bottom: (position.bottom || ''), top: (position.top || ''), left: (position.left || ''), right: (position.right || '') });

                        log(`Setting monks-tokenbar position:`, position);
                        game.user.setFlag('monks-tokenbar', 'position', position);
                    }
                }
            }
        });

        // Activate context menu
        this._contextMenu(html);
    }

    _contextMenu(html) {
        let context = new ContextMenu(html, ".token", [
            {
                name: "MonksTokenBar.EditCharacter",
                icon: '<i class="fas fa-edit"></i>',
                callback: li => {
                    const entry = this.tokens.find(t => t.id === li[0].dataset.tokenId);
                    if (entry.token.actor) entry.token.actor.sheet.render(true);
                }
            },
            {
                name: "MonksTokenBar.EditToken",
                icon: '<i class="fas fa-edit"></i>',
                callback: li => {
                    const entry = this.tokens.find(t => t.id === li[0].dataset.tokenId);
                    if (entry.token.actor) entry.token.sheet.render(true)
                }
            },
            {
                name: "MonksTokenBar.TargetToken",
                icon: '<i class="fas fa-bullseye"></i>',
                condition: game.user.isGM,
                callback: li => {
                    const entry = this.tokens.find(t => t.id === li[0].dataset.tokenId);
                    const targeted = !entry.token.isTargeted;
                    entry.token.setTarget(targeted, { releaseOthers: false });
                }
            },
            {
                name: "MonksTokenBar.FreeMovement",
                icon: '<i class="fas fa-running" data-movement="free"></i>',
                condition: game.user.isGM,
                callback: li => {
                    this.changeTokenMovement(this.getEntry(li[0].dataset.tokenId), MTB_MOVEMENT_TYPE.FREE);
                }
            },
            {
                name: "MonksTokenBar.NoMovement",
                icon: '<i class="fas fa-street-view" data-movement="none"></i>',
                condition: game.user.isGM,
                callback: li => {
                    this.changeTokenMovement(this.getEntry(li[0].dataset.tokenId), MTB_MOVEMENT_TYPE.NONE);
                }
            },
            {
                name: "MonksTokenBar.CombatTurn",
                icon: '<i class="fas fa-fist-raised" data-movement="combat"></i>',
                condition: game.user.isGM,
                callback: li => {
                    this.changeTokenMovement(this.getEntry(li[0].dataset.tokenId), MTB_MOVEMENT_TYPE.COMBAT);
                }
            }
        ]);

        let oldRender = context.render;
        context.render = function (target) {
            let result = oldRender.call(this, target);

            //Highlight the current movement if different from the global
            const entry = MonksTokenBar?.tokenbar.tokens.find(t => t.id === target[0].dataset.tokenId);
            let movement = entry?.token.getFlag("monks-tokenbar", "movement");
            let html = $("#context-menu");
            if (movement != undefined) {
                $('i[data-movement="' + movement + '"]', html).parent().addClass('selected');
            }

            return result;
        };
    }

    getEntry(id) {
        return this.tokens.find(t => t.id === id);
    }

    async _onRequestRoll(event) {
        event.preventDefault();

        this.savingthrow = new SavingThrowApp().render(true);
    }

    async _onContestedRoll(event) {
        event.preventDefault();

        this.contestedroll = new ContestedRollApp().render(true);
    }

    async _onAssignXP(event) {
        event.preventDefault();

        new AssignXPApp().render(true);
    }

    async _onChangeMovement(event) {
        event.preventDefault();

        const btn = event.currentTarget;
        this.changeGlobalMovement(btn.dataset.movement);
    }

    async changeGlobalMovement(movement) {
        if (movement == MTB_MOVEMENT_TYPE.COMBAT && (game.combat == undefined || !game.combat.started))
            return;

        await game.settings.set("monks-tokenbar", "movement", movement);
        //clear all the tokens individual movement settings
        for (let i = 0; i < this.tokens.length; i++) {
            await this.tokens[i].token.setFlag("monks-tokenbar", "movement", null);
            this.tokens[i].token.unsetFlag("monks-tokenbar", "notified");
        };
        this.render(true);

        this.displayNotification(movement);
    }

    async changeTokenMovement(entry, movement) {
        if (typeof entry == 'string')
            entry = this.getEntry(entry);

        if (movement != undefined && MTB_MOVEMENT_TYPE[movement] == undefined)
            return;

        let newMove = (game.settings.get("monks-tokenbar", "movement") != movement ? movement : null);
        let oldMove = entry.token.getFlag("monks-tokenbar", "movement");
        if (newMove != oldMove) {
            await entry.token.setFlag("monks-tokenbar", "movement", newMove);
            entry.token.unsetFlag("monks-tokenbar", "notified");
            this.render(true);

            let dispMove = entry.token.getFlag("monks-tokenbar", "movement") || game.settings.get("monks-tokenbar", "movement") || MTB_MOVEMENT_TYPE.FREE;
            this.displayNotification(dispMove, entry.token);
        }
    }

    displayNotification(movement, token) {
        if (game.settings.get("monks-tokenbar", "notify-on-change")) {
            let msg = (token != undefined ? token.name + ": " : "") + i18n("MonksTokenBar.MovementChanged") + (movement == MTB_MOVEMENT_TYPE.FREE ? i18n("MonksTokenBar.FreeMovement") : (movement == MTB_MOVEMENT_TYPE.NONE ? i18n("MonksTokenBar.NoMovement") : i18n("MonksTokenBar.CombatTurn")));
            ui.notifications.warn(msg);
            log('display notification');
            game.socket.emit(
                MonksTokenBar.SOCKET,
                {
                    msgtype: 'movementchange',
                    senderId: game.user._id,
                    msg: msg,
                    tokenid: token?.id
                },
                (resp) => { }
            );
        }
    }

    /* -------------------------------------------- */

    /**
    * Handle left-click events to
    * @param event
    * @private
    */
    async _onClickToken(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const entry = this.tokens.find(t => t.id === li.dataset.tokenId);

        log('Center on token', entry, entry.token);
        entry.token.control({ releaseOthers: true });
        return canvas.animatePan({ x: entry.token.x, y: entry.token.y });
    }

    async _onDblClickToken(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const entry = this.tokens.find(t => t.id === li.dataset.tokenId);

        if (entry.token.actor)
            entry.token.actor.sheet.render(true);
    }

    /* -------------------------------------------- */

    /**
    * Handle hover events on a macro button to track which slot is the hover target
    * @param {Event} event   The originating mouseover or mouseleave event
    * @private
    */
    _onHoverToken(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const hasAction = !li.classList.contains("inactive");

        // Remove any existing tooltip
        const tooltip = li.querySelector(".tooltip");
        if ( tooltip ) li.removeChild(tooltip);

        // Handle hover-in
        if ( event.type === "mouseenter" ) {
            this._hover = li.dataset.tokenId;
            if (hasAction) {
                const entry = this.tokens.find(t => t.id === li.dataset.tokenId);
                const tooltip = document.createElement("SPAN");
                tooltip.classList.add("tooltip");
                tooltip.textContent = entry.token.name;
                li.appendChild(tooltip);
            }
        }

        // Handle hover-out
        else {
            this._hover = null;
        }
    }

    /* -------------------------------------------- */

    /**
    * Handle click events to toggle display of the macro bar
    * @param {Event} event
    * @private
    */
    /*
    _onToggleBar(event) {
        event.preventDefault();
        if ( this._collapsed ) this.expand();
        else this.collapse();
    }*/
}

Hooks.on('renderTokenBar', (app, html) => {
    //MonksTokenBar.tokenbar.setPos().show();
    app.setPos().show();
    //MonksTokenBar.tokenbar._getTokensByScene();
    let gMovement = game.settings.get("monks-tokenbar", "movement");
    $('.token-movement[data-movement="' + gMovement + '"]', html).addClass('active');
    $('.token-movement[data-movement="combat"]', html).toggleClass('disabled', game.combats.active?.started !== true);
    $(app.tokens).each(function () {
        let tMovement = this.token.getFlag("monks-tokenbar", "movement");
        if (tMovement != undefined && tMovement != gMovement) {
            $('.token[data-token-id="' + this.id + '"] .movement-icon', html).attr('movement', tMovement);
        }
    });

    if (game.world.system == "dnd5e") {
        $('.assign-xp', html).css({ visibility: (game.settings.get('dnd5e', 'disableExperienceTracking') ? 'hidden' : 'visible') });
    } else {
        //$('.dialog-col', html).hide();
    }
    $('.dialog-col', html).toggle(game.user.isGM);

});

Hooks.on('updateToken', (scene, token, data) => {
    if (game.user.isGM && game.settings.get("monks-tokenbar", "show-resource-bars") && MonksTokenBar.tokenbar != undefined) {
        let tkn = MonksTokenBar.tokenbar.tokens.find(t => t.token.id == token._id);
        if (tkn != undefined && (data.bar1 != undefined || data.bar2 != undefined)) {
            MonksTokenBar.tokenbar.updateToken(tkn.token);
            MonksTokenBar.tokenbar.render();
        }
    }
});

Hooks.on('updateActor', (actor, data) => {
    if (game.user.isGM && game.settings.get("monks-tokenbar", "show-resource-bars") && MonksTokenBar.tokenbar != undefined) {
        let tkn = MonksTokenBar.tokenbar.tokens.find(t => t.token.actor._id == actor._id);
        if (tkn != undefined) {
            if (data?.attributes?.ac != undefined
                || data?.skills?.prc != undefined
                || data?.data?.customModifiers?.ac != undefined
                || data?.data?.customModifiers?.perception != undefined
                || data?.data?.abilities?.wis != undefined
                || data?.data?.abilities?.dex != undefined
                || getProperty(data.data, tkn.token.data.bar1.attribute) != undefined
                || getProperty(data.data, tkn.token.data.bar2.attribute) != undefined)
            {
                MonksTokenBar.tokenbar.updateToken(tkn.token);
                MonksTokenBar.tokenbar.render();
            }
        }
    }
});

