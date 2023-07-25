import { MonksTokenBar, log, error, debug, i18n, setting, MTB_MOVEMENT_TYPE } from "../monks-tokenbar.js";
import { SavingThrowApp } from "./savingthrow.js";
import { EditStats } from "./editstats.js";

export class TokenBar extends Application {
	constructor(options) {
	    super(options);

        this.entries = [];
        this.thumbnails = {};

        this._hover = null;
        this._collapsed = false;

        Hooks.on('canvasReady', () => {
            this.refresh();
        });

        Hooks.on("createToken", (token) => {
            this.refresh();
        });

        Hooks.on("deleteToken", (token) => {
            this.refresh();
        });

        Hooks.on('updateToken', (document, data, options) => {
            if ((game.user.isGM || setting("allow-player")) && getProperty(data, "flags.monks-tokenbar.include") != undefined) {
                this.refresh();
            } else if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                let entry = this.entries.find(t => t.token?.id == document.id);
                if (entry)
                    this.updateEntry(entry, options.ignoreRefresh !== true)
            }
        });

        Hooks.on('updateOwnedItem', (actor, item, data) => {
            if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                let entry = this.entries.find(t => t.actor?.id == actor.id);
                if (entry != undefined) {
                    setTimeout(function () { this.updateEntry(entry); }, 100); //delay slightly so the PF2E condition can be rendered properly.
                }
            }
        });

        Hooks.on('updateActor', (actor, data) => {
            if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                let entry = this.entries.find(t => t.actor?.id == actor.id);
                if (data.ownership != undefined) {
                    this.refresh();
                } else if (entry != undefined) {
                    this.updateEntry(entry)
                }
            }
        });

        Hooks.on("updateActiveEffect", (effect) => {
            if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                let actor = effect.parent;
                if (actor instanceof Actor) {
                    let entry = this.entries.find(t => t.actor?.id == actor.id);
                    if (entry != undefined) {
                        this.updateEntry(entry)
                    } else if (actor.ownership != undefined) {
                        this.refresh();
                    }
                }
            }
        });

        //updateActiveEffect 

        this.buttons = MonksTokenBar.system.getButtons();
    }

    /* -------------------------------------------- */

    /** @override */
	static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
        id: "tokenbar-window",
        template: "./modules/monks-tokenbar/templates/tokenbar.html",
        popOut: false,
        dragDrop: [{ dragSelector: ".token" }],
    });
    }

	/* -------------------------------------------- */

    /** @override */
    getData(options) {
        let css = [
            !game.user.isGM ? "hidectrl" : null,
            setting('show-vertical') ? "vertical" : null,
        ].filter(c => !!c).join(" ");
        let pos = this.getPos();

        let collapseIcon;
        if (setting('show-vertical'))
            collapseIcon = this._collapsed ? "fa-caret-down": "fa-caret-up";
        else
            collapseIcon = this._collapsed ? "fa-caret-right" : "fa-caret-left";

        return {
            entries: this.entries,
            movement: setting("movement"),
            stat1icon: setting("stat1-icon"),
            stat2icon: setting("stat2-icon"),
            cssClass: css,
            pos: pos,
            buttons: this.buttons,
            collapsed: this._collapsed,
            collapseIcon: collapseIcon
        };
    }

    getPos() {
        this.pos = game.user.getFlag("monks-tokenbar", "position");

        if (this.pos == undefined) {
            let hbpos = $('#ui-bottom').offset();
            let width = $('#hotbar').width();
            this.pos = { left: hbpos.left + width + 4, right: '', top: '', bottom: 10 };
            game.user.setFlag("monks-tokenbar", "position", this.pos);
        }

        let result = '';
        if (this.pos != undefined) {
            result = Object.entries(this.pos).filter(k => {
                return k[1] != null;
            }).map(k => {
                return k[0] + ":" + k[1] + 'px';
            }).join('; ');
        }

        return result;
    }

    setPos() {
        this.pos = game.user.getFlag("monks-tokenbar", "position");

        if (this.pos == undefined) {
            let hbpos = $('#ui-bottom').offset();
            let width = $('#hotbar').width();
            this.pos = { left: hbpos.left + width + 36, right: '', top: '', bottom: 10 };
            game.user.setFlag("monks-tokenbar", "position", this.pos);
        }

        log('Setting position', this.pos, this.element);
        $(this.element).css(this.pos);

        return this;
    }

    _canDragStart(selector) {
        return game.user.isGM;
    }

    _onDragStart(event) {
        const target = event.currentTarget;

        const dragData = { uuid: `Actor.${target.dataset.actorId}`, type: "Actor" };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    refresh() {
        //need this so that if a whole bunch of tokens are added or refreshed at once, then we wait until the last one is done before trying to refresh
        var that = this;
        if (this.refreshTimer != null)
            clearTimeout(this.refreshTimer);

        this.refreshTimer = setTimeout(async function () {
            await that.getCurrentTokens();
            that.refreshTimer = null;
            that.render(true);
        }, 100);
    }

    static processStat (formula, data) {
        if (formula == undefined || formula == '')
            return null;

        if (formula.includes("{{")) {
            const compiled = Handlebars.compile(formula);
            formula = compiled(data, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true }).trim();
        }
        //formula = formula.replaceAll('@', '');
        formula = formula.replace(/@/g, '');
        let dataRgx = new RegExp(/([a-z.0-9_\-]+)/gi);
        let result = formula.replace(dataRgx, (match, term) => {
            let value = parseInt(term);
            if (isNaN(value)) {
                value = getProperty(data, term);
                return (value == undefined || value == null ? null : String(typeof value == 'object' ? value.value : value).trim());
            } else
                return value;
        });

        if (result == undefined || result == 'null')
            return null;

        try {
            result = eval(result);
        } catch{ }
        return String(result).replace(/["']/g, "");
    }

    async getCurrentTokens() {
        //log('Get current Tokens');
        this.entries = (canvas.scene?.tokens || [])
            .filter(t => {
                let include = t.getFlag('monks-tokenbar', 'include');
                include = (include === true ? 'include' : (include === false ? 'exclude' : include || 'default'));

                let hasActor = (t.actor != undefined);
                let canView = (game.user.isGM || t.actor?.isOwner || t.actor?.testUserPermission(game.user, setting("minimum-ownership") || "LIMITED"));
                let showOnline = setting("show-offline") || game.users.find(u => u.active && u.character?.id == t.actor?.id)
                let disp = ((t.actor?.hasPlayerOwner && t.disposition == 1 && include != 'exclude') || include === 'include');

                let mlt = !!getProperty(t, "flags.multilevel-tokens.stoken");

                let addToken = hasActor && canView && disp && !mlt && showOnline;
                debug("Checking token", t, "addToken", addToken, "Has Actor", hasActor, "Can View", canView, "Disposition", disp, "Included", include, "Online", showOnline);

                return addToken;
            })
            .map(t => {
                return {
                    id: t.id,
                    token: t,
                    actor: t.actor,
                    img: null,
                    thumb: null,
                    movement: t.flags["monks-tokenbar"]?.movement,
                    stats: { },
                    resource1: { },
                    resource2: {},
                    cssClass: ""
                }
            });

        if (setting("include-actor")) {
            for (let user of game.users) {
                if ((user.active || setting("show-offline")) && user.character && !this.entries.find(t => t.actor?.id === user.character?.id)) {
                    this.entries.push({
                        id: user.character.id,
                        token: null,
                        actor: user.character,
                        img: null,
                        thumb: null,
                        stats: {},
                        resource1: {},
                        resource2: {},
                        cssClass: "only-actor"
                    });
                }
            }
        }

        this.entries = this.entries.sort(function (a, b) {
            let aName = a.token?.name || a.actor?.name || "";
            let bName = a.token?.name || a.actor?.name || "";
            return aName.localeCompare(bName);
        })

        for (let t of this.entries)
            await this.updateEntry(t, false);

        //this is causing token to disappear
        //if(this.entries.length)
        //    this.entries[0].token.constructor.updateDocuments(this.entries.map(t => { return { _id: t.id, 'flags.monks-tokenbar.-=notified': null } }), { parent: canvas.scene, options: { ignoreRefresh: true } })
    }

    getResourceBar(token, bar) {
        let resource = {};
        if (token.displayBars > 0) {
            let attr = token.getBarAttribute(bar);
            if (attr.attribute == "attributes.hp")
                attr = mergeObject(attr, (getProperty(token, "actor.system.attributes.hp") || {}));

            if (attr != undefined && attr.type == "bar") {
                let { value, max, temp, tempmax } = attr;
                temp = Number(temp || 0);
                tempmax = Number(tempmax || 0);
                value = Number(value);

                const effectiveMax = Math.max(0, max + tempmax);
                let displayMax = max + (tempmax > 0 ? tempmax : 0);

                const tempPct = Math.clamped(temp, 0, displayMax) / displayMax;
                const valuePct = Math.clamped(value, 0, effectiveMax) / displayMax;
                const colorPct = Math.clamped(value, 0, effectiveMax) / displayMax;

                if (value != undefined) {
                    let color = (bar === "bar1") ? [(1 - (colorPct / 2)), colorPct, 0] : [(0.5 * colorPct), (0.7 * colorPct), 0.5 + (colorPct / 2)];
                    resource = {
                        value,
                        valuePct: (valuePct * 100),
                        tempPct: (tempPct * 100),
                        color: 'rgba(' + parseInt(color[0] * 255) + ',' + parseInt(color[1] * 255) + ',' + parseInt(color[2] * 255) + ', 0.7)'
                    };
                }
            }
        }

        return resource;
    }

    async updateEntry(entry, refresh = true) {
        let diff = {};

        if (game.settings.get("monks-tokenbar", "show-resource-bars") && entry.token) {
            if (entry?.resource1?.value != entry.token.getBarAttribute('bar1')?.value) {
                diff.resource1 = this.getResourceBar(entry.token, "bar1");
            }
            if (entry?.resource2?.value != entry.token.getBarAttribute('bar2')?.value) {
                diff.resource2 = this.getResourceBar(entry.token, "bar2");
            }
        }

        let viewstats = entry.actor?.getFlag('monks-tokenbar', 'stats') || MonksTokenBar.stats;
        let diffstats = {};
        for (let stat of viewstats) {
            let value = TokenBar.processStat(stat.stat, entry.actor.system) || TokenBar.processStat(stat.stat, entry.token);

            if (entry.stats[stat.stat] == undefined) {
                entry.stats[stat.stat] = { icon: stat.icon, value: value, hidden: (!setting("show-undefined") && value == undefined) };
                diffstats[stat.stat] = entry.stats[stat.stat];
            }
            else {
                let tokenstat = duplicate(entry.stats[stat.stat]);
                if (tokenstat.value != value) {
                    tokenstat.value = value;
                    tokenstat.hidden = (!setting("show-undefined") && value == undefined);
                    diffstats[stat.stat] = tokenstat;
                }
            }
        }
        for (let [k, v] of Object.entries(entry.stats)) {
            if (!viewstats.find(s => s.stat == k))
                delete entry.stats[k];
        }
        if (Object.keys(diffstats).length > 0) {
            diff.stats = diffstats;
        }

        if (entry.img != (setting("token-pictures") == "actor" && entry.actor != undefined ? entry.actor.img : entry.token?.texture.src || entry.actor?.img)) {
            diff.img = (setting("token-pictures") == "actor" && entry.actor != undefined ? entry.actor.img : entry.token?.texture.src || entry.actor?.img);
            let thumb = this.thumbnails[diff.img];
            if (!thumb) {
                try {
                    thumb = await ImageHelper.createThumbnail(diff.img, { width: setting("resolution-size"), height: setting("resolution-size") });
                    this.thumbnails[diff.img] = (thumb?.thumb || thumb);
                } catch {
                    thumb = 'icons/svg/mystery-man.svg';
                }
            }

            diff.thumb = (thumb?.thumb || thumb);
        }

        if (entry.token && entry.movement != getProperty(entry.token, "flags.monks-tokenbar.movement")) {
            diff.movement = getProperty(entry.token, "flags.monks-tokenbar.movement");
        }

        if (entry.inspiration != (entry.actor.system?.attributes?.inspiration && setting('show-inspiration')))
            diff.inspiration = (entry.actor.system?.attributes?.inspiration && setting('show-inspiration'));

        if (setting("show-disable-panning-option")) {
            if (entry.nopanning != entry.token.flags['monks-tokenbar']?.nopanning) {
                diff.nopanning = entry.token.flags['monks-tokenbar']?.nopanning;
            }
        } else {
            diff.nopanning = false;
        }

        if (Object.keys(diff).length > 0) {
            mergeObject(entry, diff);
            if(refresh)
                this.render();
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        if (game.user.isGM) {
            for (let group of this.buttons) {
                for (let button of group) {
                    if (button.click)
                        $('#' + button.id).on('click', $.proxy(button.click, this));
                }
            }
        }
        html.find(".token").click(this._onClickToken.bind(this)).dblclick(this._onDblClickToken.bind(this)).hover(this._onHoverToken.bind(this));
        $('.toggle-collapse', html).on("click", this.toggleCollapse.bind(this));

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

                        if (elmnt.style.bottom != undefined) {
                            elmnt.style.top = elmnt.offsetTop + "px";
                            elmnt.style.bottom = null;
                        }

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

                        let position = { top: null, bottom: null, left: null, right: null };
                        if (yPos > (window.innerHeight / 2))
                            position.bottom = (window.innerHeight - yPos - elmnt.offsetHeight);
                        else
                            position.top = yPos + 1;

                        //if (xPos > (window.innerWidth / 2))
                        //    position.right = (window.innerWidth - xPos);
                        //else
                        position.left = xPos;// + 1;

                        elmnt.style.bottom = (position.bottom ? position.bottom + "px" : null);
                        elmnt.style.right = (position.right ? position.right + "px" : null);
                        elmnt.style.top = (position.top ? position.top + "px" : null);
                        elmnt.style.left = (position.left ? position.left + "px" : null);

                        //$(elmnt).css({ bottom: (position.bottom || ''), top: (position.top || ''), left: (position.left || ''), right: (position.right || '') });

                        //log(`Setting monks-tokenbar position:`, position);
                        game.user.setFlag('monks-tokenbar', 'position', position);
                        this.pos = position;
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
                name: "MonksTokenBar.PrivateMessage",
                icon: '<i class="fas fa-microphone"></i>',
                condition: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId || t.actor?.id === li[0].dataset.actorId);
                    if (!game.user.isGM && entry.actor?.isOwner)
                        return false;

                    let players = game.users.contents
                        .filter(u =>
                            !u.isGM && (entry.actor.ownership[u.id] == 3 || entry.actor.ownership.default == 3)
                    );
                    return players.length > 0;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId || t.actor?.id === li[0].dataset.actorId);
                    let players = game.users.contents
                    .filter(u =>
                        !u.isGM && (entry.actor?.ownership[u.id] == 3 || entry.actor?.ownership.default == 3)
                    )
                    .map(u => {
                        return (u.name.indexOf(" ") > -1 ? "[" + u.name + "]" : u.name);
                    });
                    if (ui.sidebar.activeTab !== "chat")
                        ui.sidebar.activateTab("chat");

                    $("#chat-message").val('/w ' + players.join(' ') + ' ');
                    $("#chat-message").focus();
                }
            },
            {
                name: "MonksTokenBar.ExcludeFromTokenBar",
                icon: '<i class="fas fa-ban"></i>',
                condition: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId || t.actor?.id === li[0].dataset.actorId);
                    return game.user.isGM && entry?.token;
                },
                callback: (li) => {
                    Dialog.confirm({
                        title: "Exclude Token",
                        content: "Are you sure you wish to remove this token from the Tokenbar?",
                        yes: () => {
                            const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                            if (entry)
                                entry.token.setFlag("monks-tokenbar", "include", "exclude");
                        }
                    });
                }
            },
            {
                name: "MonksTokenBar.EditCharacter",
                icon: '<i class="fas fa-edit"></i>',
                condition: li => {
                    const entry = this.entries.find(t => t.actor?.id === li[0].dataset.actorId);
                    if (game.user.isGM && entry?.actor)
                        return true;
                    if (entry?.actor && entry?.actor?.testUserPermission(game.user, "OWNER"))
                        return true;
                    return false;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.actor?.id === li[0].dataset.actorId);
                    if (entry.actor) entry.actor.sheet.render(true);
                }
            },
            {
                name: "MonksTokenBar.EditToken",
                icon: '<i class="fas fa-edit"></i>',
                condition: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    if (game.user.isGM && entry?.token)
                        return true;
                    if (entry?.actor?.testUserPermission(game.user, "OWNER") && entry?.token)
                        return true;
                    return false;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    if (entry.token) entry.token.sheet.render(true)
                }
            },
            {
                name: "MonksTokenBar.EditStats",
                icon: '<i class="fas fa-list-ul"></i>',
                condition: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    if (game.user.isGM && entry?.token)
                        return true;
                    return false;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.actor?.id === li[0].dataset.actorId);
                    if (entry)
                        new EditStats(entry.actor).render(true);
                }
            },
            {
                name: "MonksTokenBar.DisablePanning",
                icon: '<i class="fas fa-user-slash no-panning"></i>',
                condition: li => {
                    if (game.settings.get("monks-tokenbar", "show-disable-panning-option")) {
                        const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                        if (game.user.isGM && entry?.token)
                            return true;
                        if (entry?.token && entry?.token?.actor?.testUserPermission(game.user, "OWNER"))
                            return true;
                    }
                    return false;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    MonksTokenBar.changeTokenPanning(entry.token);
                }
            },
            {
                name: "MonksTokenBar.TargetToken",
                icon: '<i class="fas fa-bullseye"></i>',
                condition: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    if (game.user.isGM && entry?.token)
                        return true;
                    return false;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    if (entry) {
                        const targeted = !entry.token.isTargeted;
                        entry.token._object?.setTarget(targeted, { releaseOthers: false });
                    }
                }
            },
            {
                name: "MonksTokenBar.FreeMovement",
                icon: '<i class="fas fa-running" data-movement="free"></i>',
                condition: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    if (game.user.isGM && entry?.token)
                        return true;
                    return false;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    MonksTokenBar.changeTokenMovement(MTB_MOVEMENT_TYPE.FREE, entry.token);
                }
            },
            {
                name: "MonksTokenBar.NoMovement",
                icon: '<i class="fas fa-street-view" data-movement="none"></i>',
                condition: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    if (game.user.isGM && entry?.token)
                        return true;
                    return false;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    MonksTokenBar.changeTokenMovement(MTB_MOVEMENT_TYPE.NONE, entry.token);
                }
            },
            {
                name: "MonksTokenBar.CombatTurn",
                icon: '<i class="fas fa-fist-raised" data-movement="combat"></i>',
                condition: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    if (game.user.isGM && entry?.token)
                        return true;
                    return false;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.token?.id === li[0].dataset.tokenId);
                    MonksTokenBar.changeTokenMovement(MTB_MOVEMENT_TYPE.COMBAT, entry.token);
                }
            }
        ]);

        let oldRender = context.render;
        context.render = function (target) {
            let result = oldRender.call(this, target);

            //Highlight the current movement if different from the global
            const entry = MonksTokenBar?.tokenbar.entries.find(t => t.id === target[0].dataset.tokenId);
            let movement = entry?.token.getFlag("monks-tokenbar", "movement");
            let html = $("#context-menu");
            if (movement != undefined) {
                $('i[data-movement="' + movement + '"]', html).parent().addClass('selected');
            }

            //Highlight if nopanning option is selected
            let nopanning = entry?.token.getFlag("monks-tokenbar", "nopanning");
            if (nopanning) {
                $('i.no-panning', html).parent().addClass('selected');
            }

            return result;
        };
    }

    toggleCollapse(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this._collapsed) this.expand();
        else this.collapse();
    }

    collapse() {
        if (this._collapsed) return;
        const toggle = this.element.find(".toggle-collapse");
        const icon = toggle.children("i");
        const bar = this.element.find("#token-action-bar");
        return new Promise(resolve => {
            bar.slideUp(200, () => {
                bar.addClass("collapsed");
                if (setting('show-vertical'))
                    icon.removeClass("fa-caret-up").addClass("fa-caret-down");
                else
                    icon.removeClass("fa-caret-left").addClass("fa-caret-right");
                this._collapsed = true;
                resolve(true);
            });
        });
    }

    expand() {
        if (!this._collapsed) return true;
        const toggle = this.element.find(".toggle-collapse");
        const icon = toggle.children("i");
        const bar = this.element.find("#token-action-bar");
        return new Promise(resolve => {
            bar.slideDown(200, () => {
                bar.css("display", "");
                bar.removeClass("collapsed");
                if (setting('show-vertical'))
                    icon.removeClass("fa-caret-down").addClass("fa-caret-up");
                else
                    icon.removeClass("fa-caret-right").addClass("fa-caret-left");
                this._collapsed = false;
                resolve(true);
            });
        });
    }

    getEntry(id) {
        return this.entries.find(t => t.id === id);
    }
    
    async _onClickToken(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const entry = this.entries.find(t => t.token?.id === li.dataset.tokenId);

        let that = this;
        if (!this.dbltimer) {
            this.dbltimer = window.setTimeout(async function () {
                if (that.doubleclick !== true) {
                    if (event?.originalEvent?.ctrlKey || event?.originalEvent?.metaKey) {
                        let token = canvas.tokens.get(entry?.id);
                        if (!token)
                            return;
                        if (game.user.targets.has(token)) {
                            // remove from targets
                            token.setTarget(false, { user: game.user, releaseOthers: false, groupSelection: false });
                        } else {
                            // add to user targets
                            token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: false });
                        }
                    } else if (event?.originalEvent?.altKey && setting("movement") == "none" && game.user.isGM) {
                        if (entry && (entry.movement == undefined || entry.movement == "")) {
                            // Dungeon mode
                            for (let entry of that.entries) {
                                if (entry.movement == "free") {
                                    entry.movement = null;
                                    await entry.token.unsetFlag("monks-tokenbar", "movement");
                                }
                            }
                            entry.movement = "free";
                            await entry.token.setFlag("monks-tokenbar", "movement", "free");
                            that.render(true);
                        }
                    } else {
                        if (game.user.isGM || entry.actor?.testUserPermission(game.user, "OBSERVER")) {
                            let animate = MonksTokenBar.manageTokenControl(entry?.token._object, { shiftKey: event?.originalEvent?.shiftKey });

                            if (entry?.token.getFlag("monks-tokenbar", "nopanning"))
                                animate = false;
                            (animate ? canvas.animatePan({ x: entry?.token?._object?.x, y: entry?.token?._object?.y }) : true);
                        }
                    }
                }
                that.doubleclick = false;
                delete that.dbltimer;
            }, 200);
        }
    }

    async _onDblClickToken(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const entry = this.entries.find(t => t.token?.id === li.dataset.tokenId);

        if (setting("dblclick-action") == "request" && (game.user.isGM || setting("allow-roll"))) {
            let entries = MonksTokenBar.getTokenEntries([entry.token._object]);
            new SavingThrowApp(entries).render(true);
        } else {
            if (entry.actor)
                entry.actor.sheet.render(true);
        }
        this.doubleclick = true;
    }

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
                const entry = this.entries.find(e => e.token?.id === li.dataset.tokenId || e.actor?.id === li.dataset.actorId);
                const tooltip = document.createElement("SPAN");
                tooltip.classList.add("tooltip");
                tooltip.textContent = entry?.token?.name || entry?.actor?.name;
                li.appendChild(tooltip);
            }
        }

        // Handle hover-out
        else {
            this._hover = null;
        }
    }
}

