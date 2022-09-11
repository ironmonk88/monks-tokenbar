import { MonksTokenBar, log, i18n, warn, setting } from "../monks-tokenbar.js";

export class LootablesApp extends FormApplication {
    constructor(entity, options) {
        super(options);

        this.usecr = false;
        let tokens = [];
        if (entity != undefined && entity instanceof Combat) {
            tokens = entity.combatants.filter(c => {
                return c.actor?.token && c.token?.disposition != 1
            }).map(c => {
                return c.token;
            });
        } else {
            tokens = entity || canvas.tokens.controlled.filter(t => t.actor != undefined);
            if (tokens != undefined && !$.isArray(tokens))
                tokens = [tokens];
        }

        let currency = Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {}).reduce((a, v) => ({ ...a, [v]: 0 }), {});

        this.entries = tokens.map(t => {
            let items = t.actor.items
                .filter(item => {
                    // Weapons are fine, unless they're natural
                    let result = false;
                    if (item.type == 'weapon') {
                        result = item.system.weaponType != 'natural';
                    }
                    // Equipment's fine, unless it's natural armor
                    else if (item.type == 'equipment') {
                        if (!item.system.armor)
                            result = true;
                        else
                            result = item.system.armor.type != 'natural';
                    } else
                        result = !(['class', 'spell', 'feat', 'action', 'lore'].includes(item.type));

                    return result;
                }).map(i => {
                    let data = i.toObject();
                    data.included = true;
                    data.from = t.name;
                    return data;
                });

            let curr = Object.keys(t.actor.system.currency).reduce((a, v) => {
                a[v] = this.getCurrency(t.actor.system.currency[v]);
                return a;
            }, {});

            return {
                id: t.id,
                include: true,
                actor: t.actor,
                token: t.document || t,
                items: items,
                currency: Object.assign({}, currency, curr)
            };
        });
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "lootables",
            title: i18n("MonksTokenBar.Lootables"),
            template: "./modules/monks-tokenbar/templates/lootables.html",
            width: 400,
            popOut: true
        });
    }

    async getData(options) {
        let notes = "";
        let hasItems = false;
        let lootsheet = setting('loot-sheet');
        let lootentity = setting('loot-entity');
        let sheetName = "";
        switch (lootsheet) {
            case 'lootsheetnpc5e': sheetName = "Loot Sheet NPC 5e"; break;
            case 'merchantsheetnpc': sheetName = "Merchant Sheet"; break;
            case 'monks-enhanced-journal': sheetName = "Monk's Enhanced Journal"; break;
            case 'item-piles': sheetName = "Item Piles"; break;
        }

        let entity;
        try {
            entity = await fromUuid(lootentity);
        } catch { }

        let convertEntity = lootentity == "convert";
        let createEntity = (entity == undefined || entity instanceof Folder || entity instanceof JournalEntry);

        if (convertEntity)
            notes = `Convert tokens to lootable using ${sheetName}`;
        else {
            let entityName = "New " + (this.isLootActor(lootsheet) ? "Actor" : "Loot Journal Entry");
            if (this.isLootActor(lootsheet)) {
                entityName = this.getEntityName(entity);
                hasItems = (entity?.items.size || 0) > 0;
            } else {
                entityName = this.getEntityName(entity);
                hasItems = (entity?.getFlag('monks-enhanced-journal', 'items') || []).length > 0;
            }
            notes = `${entityName}, using ${sheetName}${setting("create-canvas-object") ? `, and create a ${(this.isLootActor(lootsheet) ? "Token" : "Note")} on the Canvas` : ''}`;
        }           

        return {
            usecr: this.usecr,
            convertEntity: convertEntity,
            createEntity: createEntity,
            clearEntity: !convertEntity && !createEntity && hasItems,
            notes: notes,
            placeholder: this.getLootableName(),
            entries: this.entries,
            actionText: (convertEntity ? i18n('MonksTokenBar.ConvertToLootable') : (createEntity ? i18n('MonksTokenBar.TransferToNewLootable') : i18n('MonksTokenBar.TransferToLootable')))
        };
    }

    isLootActor(lootsheet) {
        return ['lootsheetnpc5e', 'merchantsheetnpc', 'item-piles'].includes(lootsheet);
    }

    getCurrency(currency) {
        if (!currency)
            return 0;
        return (currency.value != undefined ? currency.value : currency) || 0;
    }

    disableToken(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        let id = $(ev.currentTarget).closest('.item').attr('data-item-id');
        //let token = this.entries.find(t => { return t.token.id === id; });
        //if (token != undefined)
        //    token.disabled = !token.disabled;
        this.calcGold();
    }

    activateListeners(html) {
        super.activateListeners(html);
        var that = this;

        //$('.item-create', html).click($.proxy(this.addToken, this));

        $('[name="include"]', html).click(this.disableToken.bind(this));

        $('.dialog-button.convert-to-lootable', html).click(this.convert.bind(this));
        $('#assign-gold-by-cr', html).change($.proxy(this.calcGold, this));

        $('.included-items > div', html).on('click', this.includeItem.bind(this));

        $('.item-row', html).on('click', this.toggleTooltip.bind(this));
    };

    toggleTooltip(ev) {
        $(ev.currentTarget).next().toggle();
    }

    includeItem(ev) {
        $(ev.currentTarget).prev().prop('checked', !$(ev.currentTarget).prev().prop('checked'));
    }

    convert() {
        this.convertToLootable({ name: $('#entity-name').val(), clear: $('#clear-items').prop('checked') });
    }

    calcGold() {
        let lootingUsers = game.users.contents.filter(user => { return user.role >= 1 && user.role <= 2 });
        this.usecr = $('#assign-gold-by-cr').is(':checked');
        for (let token of this.entries) {
            let hasGold = false;
            for (const [k, v] in Object.entries(token.actor.system.currency)) {
                hasGold = (hasGold && parseInt(v.value || v) > 0);
            }
            // If the actor has no gold, assign gold by CR: gold = 0.6e(0.15*CR)
            if (!hasGold) {
                let goldformula = setting('gold-formula');
                if (this.usecr && !this.disabled) {
                    let gold = 0;
                    try {
                        const compiled = Handlebars.compile(goldformula);
                        let content = compiled({ actor: token.actor }, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true }).trim();

                        //const exponent = 0.15 * (getProperty(token.actor, "system.details.cr") ?? 0);
                        //let gold = Math.round(0.6 * 10 * (10 ** (0.15 * ({{ actor.system.details.cr}} ?? 0))));

                        gold = eval(content);
                    } catch {}

                    // Ensure it can divide evenly across all looting players
                    gold = gold + (gold % Math.max(lootingUsers.length, 1)) ?? 0;
                    token.currency.gp = gold;
                } else {
                    token.gold = null;
                }
            }
        }
        this.render(true);
    }

    _getSubmitData(updateData = {}) {
        const data = super._getSubmitData(updateData);
        //Fix an issue with Foundry core not retrieving all the form inputs
        for (let el of this.form.elements) {
            if (!el.name || el.disabled || (el.tagName === "BUTTON")) continue;
            const field = this.form.elements[el.name];

            // Duplicate Fields
            if (field instanceof RadioNodeList) {
                const values = [];
                for (let f of field) {
                    if (f.type === "checkbox")
                        values.push(f.checked);
                }
                if (values.length)
                    data[el.name] = values;
            }
        }

        return data;
    }

    getEntityName(entity) {
        if (entity instanceof JournalEntryPage || entity instanceof Actor)
            return "Transferring to " + entity.name;
        else if (entity instanceof JournalEntry)
            return "Adding new loot page to " + entity.name;
        else if (entity instanceof Folder)
            return (entity.documentClass.documentName == "JournalEntry" ? "Create new Journal Entry within " + entity.name + " folder" : "Create within " + entity.name + " folder");
        else
            return "Create in the root folder";
    }

    getLootableName(entity) {
        //find the folder and find the next available 'Loot Entry (x)'
        let lootSheet = setting('loot-sheet');
        let collection = (this.isLootActor(lootSheet) ? game.actors : game.journal);

        let documents = (entity == undefined ? collection.filter(e => e.folder == undefined) : entity.contents || entity.pages);
        let previous = documents.map((e, i) =>
            parseInt(e.name.replace('Loot Entry ', '').replace('(', '').replace(')', '')) || (i + 1)
        ).sort((a, b) => { return b - a; });
        let num = (previous.length ? previous[0] + 1 : 1);

        name = `${i18n("MonksTokenBar.LootEntry")}${(num > 1 ? ` (${num})` : '')}`;
        return name;
    }

    async convertToLootable({ clear = false, name = null }) {
        let data = expandObject(this._getSubmitData());

        // Limit selection to Players and Trusted Players
        let lootingUsers = game.users.contents.filter(user => { return user.role >= 1 && user.role <= 2 });
        let lootSheet = setting('loot-sheet');
        let lootEntity = setting('loot-entity');

        if (lootSheet == 'none')
            return;

        let msg = "";

        for (let entry of this.entries) {
            let ed = data.tokens[entry.id];
            entry.currency = mergeObject(entry.currency, ed?.currency || {});
            entry.include = ed.include;
            for (let item of entry.items) {
                item.included = ed.items[item._id].included;
            }
        }

        if (lootEntity == 'convert') {
            if (lootSheet == "item-piles") {
                let tokens = this.entries.map(t => t.token);
                ItemPiles.API.turnTokensIntoItemPiles(tokens);
            } else {
                for (let entry of this.entries) {
                    if (entry.include === false)
                        continue;

                    // Don't run this on PC tokens by mistake
                    if (entry.actor.type === 'character')
                        continue;

                    // Change sheet to lootable, and give players permissions.
                    let newActorData = {};
                    if (lootSheet == 'lootsheetnpc5e') {
                        newActorData = {
                            'flags': {
                                'core': {
                                    'sheetClass': 'dnd5e.LootSheetNPC5e'
                                },
                                'lootsheetnpc5e': {
                                    'lootsheettype': 'Loot'
                                },
                                'monks-tokenbar': {
                                    'converted': true
                                }
                            }
                        };
                    } else if (lootSheet == 'merchantsheetnpc') {
                        newActorData = {
                            'flags': {
                                'core': {
                                    'sheetClass': 'core.a'
                                },
                                'monks-tokenbar': {
                                    'converted': true
                                }
                            }
                        };
                    }

                    if (!['dnd5e.LootSheet5eNPC', 'core.a'].includes(entry.actor.data?.flags?.core?.sheetClass))
                        newActorData.flags['monks-tokenbar'].oldsheetClass = entry.actor.data?.flags?.core?.sheetClass; //token.actor._getSheetClass();

                    // Remove items that shouldn't be lootable
                    let oldItems = [];
                    let newItems = entry.actor.items
                        .filter(item => {
                            let itemData = entry.items.find(i => i._id == item.id);
                            if (!itemData?.included)
                                oldItems.push(item);

                            return itemData?.included;
                        });

                    newActorData.items = newItems;
                    //only store the old items if the there are old items to avoid overwriting a second time
                    if (oldItems.length > 0) {
                        if (entry.actor.getFlag('monks-tokenbar', 'olditems') != undefined)
                            oldItems = oldItems.concat(entry.actor.getFlag('monks-tokenbar', 'olditems'));
                        newActorData.flags["monks-tokenbar"].olditems = oldItems;
                    }
                    //await token.actor.update(newActorData);

                    // This section is a workaround for the fact that the LootSheetNPC module
                    // currently uses an older currency schema, compared to current 5e expectations.
                    // Need to convert the actor's currency data to the LS schema here to avoid
                    // breakage. If there is already currency on the actor, it is retained.

                    /*
                    for (let curr of ['cp', 'sp', 'ep', 'gp', 'pp']) {
                        if (typeof (entry.actor.system.currency[curr]) === "number" || entry.actor.system.currency[curr] == undefined) {
                            let oldCurrencyData = entry.actor.system.currency[curr];
                            newActorData[`system.currency.${curr}`] = { 'value': oldCurrencyData || 0 };
                        }
                    }*/

                    for (let curr of Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {})) {
                        if (entry.currency[curr] != undefined)
                            newActorData[`system.currency.${curr}`] = (entry.actor.system.currency[curr].hasOwnProperty("value") ? { value: entry.currency[curr] } : entry.currency[curr]);
                    }

                    newActorData = expandObject(newActorData);

                    entry.actor._sheet = null;

                    MonksTokenBar.emit('refreshsheet', { tokenid: entry?.id });
                    await entry.actor.update(newActorData);

                    let oldIds = oldItems.map(i => i.id);
                    if (oldIds.length > 0) {
                        for (let id of oldIds) {
                            let item = entry.actor.items.find(i => i.id == id);
                            if (item)
                                await item.delete();
                        }
                        //await Item.deleteDocuments(oldIds, {parent: token.actor});
                    }

                    // Update permissions to level 2, so players can loot
                    let permissions = {};
                    Object.assign(permissions, entry.actor.ownership);
                    lootingUsers.forEach(user => {
                        permissions[user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;
                    });

                    // If using Combat Utility Belt, need to remove any of its condition overlays
                    // before we can add the chest icon overlay.
                    if (game.modules.get("combat-utility-belt")?.active) {
                        await game.cub.removeAllConditions(entry.actor);
                    }

                    let oldAlpha = entry.token.alpha;
                    await entry.token.update({
                        "overlayEffect": 'icons/svg/chest.svg',
                        "alpha": 0.6,
                        "actorData": {
                            "actor": {
                                "flags": {
                                    "loot": {
                                        "playersPermission": 2
                                    }
                                }
                            },
                            "permission": permissions
                        },
                        "flags.monks-tokenbar.alpha": oldAlpha
                    });
                }
            }

            msg = `Actors have been converted to lootable`;
        } else {
            let collection = (this.isLootActor(lootSheet) ? game.actors : game.journal);

            let entity;
            try {
                entity = await fromUuid(lootEntity);
            } catch { }
            name = entity?.name;

            if (entity == undefined)
                warn("Could not find Loot Entity, defaulting to creating one");

            let created = (entity == undefined || entity instanceof Folder || entity instanceof JournalEntry);
            if (created) {
                //create the entity in the Correct Folder
                if (name == undefined || name == '')
                    name = this.getLootableName(entity);

                if ((entity instanceof Folder || entity == undefined) && collection.documentName == "JournalEntry") {
                    entity = await JournalEntry.create({ folder: entity, name: name, ownership: { 'default': CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER } }, { render: false });
                }

                if (this.isLootActor(lootSheet)) {
                    const cls = collection.documentClass;
                    entity = await cls.create({ folder: entity, name: name, img: 'icons/svg/chest.svg', type: 'npc', flags: { core: { 'sheetClass': (lootSheet == "lootsheetnpc5e" ? 'dnd5e.LootSheetNPC5e' : 'core.a') } }, ownership: { 'default': CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER } });
                    ui.actors.render();
                    MonksTokenBar.emit("refreshDirectory", { name: "actors" });
                } else {
                    entity = await JournalEntryPage.create({ name: name, type: "text", flags: { "monks-enhanced-journal": { type: "loot", purchasing: "confirm" } }, ownership: { 'default': CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER } }, { parent: entity, render: false });
                    ui.journal.render();
                    MonksTokenBar.emit("refreshDirectory", { name: "journal" });
                }
            }

            if (!entity)
                return ui.notifications.warn("Could not find Loot Entity");

            if (clear) {
                if (this.isLootActor(lootSheet)) {
                    for (let item of entity.items) {
                        await item.delete();
                    }
                } else {
                    await entity.setFlag('monks-enhanced-journal', 'items', []);
                }
            }

            let ptAvg = { x: 0, y: 0, count: 0 };
            let items = [];
            let currency = {};

            for (let entry of this.entries) {
                if (entry.disabled === true)
                    continue;

                ptAvg.x += entry.token.x;
                ptAvg.y += entry.token.y;
                ptAvg.count++;

                let loot = entry.items.filter(i => i.included);
                items = items.concat(loot);

                let entryCurr = entry.currency;
                for (let curr of Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {})) {
                    currency[curr] = (currency[curr] || 0) + parseInt(this.getCurrency(entryCurr[curr]) || 0);
                }
            }

            if (this.isLootActor(lootSheet)) {
                if (lootSheet == "item-piles") {
                    let pt = { x: ptAvg.x / ptAvg.count, y: ptAvg.y / ptAvg.count };
                    ItemPiles.API.createItemPile(pt, { items });
                } else {
                    entity.createEmbeddedDocuments("Item", items);

                    let entityCurr = entity.system.currency || {};
                    for (let curr of Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {})) {
                        if (currency[curr] != undefined) {
                            let value = entityCurr[curr].value ?? entityCurr[curr];
                            value = parseInt(currency[curr] || 0) + parseInt(value || 0);
                            entityCurr[curr] = (entityCurr[curr].hasOwnProperty("value") ? { value: value } : value);
                        }
                    }

                    entity.update({ data: { currency: entityCurr } });
                }
            } else if (lootSheet == 'monks-enhanced-journal') {
                let entityItems = duplicate(entity.getFlag('monks-enhanced-journal', 'items') || []);
                entityItems = entityItems.concat(items);
                await entity.setFlag('monks-enhanced-journal', 'items', entityItems);

                let entityCurr = entity.getFlag("monks-enhanced-journal", "currency") || {};
                for (let curr of Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {})) {
                    entityCurr[curr] = parseInt(currency[curr] || 0) + parseInt(entityCurr[curr] || 0);
                }
                await entity.setFlag('monks-enhanced-journal', 'currency', currency);
            }

            msg = (created ?
                `${name} has been created, items have been transferred to it` :
                `Items have been transferred to ${name}`);

            if (setting("create-canvas-object") && lootSheet !== "item-piles") {
                let pt = { x: ptAvg.x / ptAvg.count, y: ptAvg.y / ptAvg.count };
                // Snap to Grid
                let snap = canvas.grid.getSnappedPosition(pt.x, pt.y, canvas[(this.isLootActor(lootSheet) ? 'tokens' : 'notes')].gridPrecision);
                pt.x = snap.x;
                pt.y = snap.y;

                // Validate the final position
                if (canvas.dimensions.rect.contains(pt.x, pt.y)) {
                    if (this.isLootActor(lootSheet)) {
                        const td = await entity.getTokenData(pt);

                        const cls = getDocumentClass("Token");
                        await cls.create(td, { parent: canvas.scene });
                    } else if (lootSheet == 'monks-enhanced-journal') {
                        let data = {
                            x: parseInt(pt.x + (canvas.scene.dimensions.size / 2)),
                            y: parseInt(pt.y + (canvas.scene.dimensions.size / 2)),
                            entryId: entity.parent.id,
                            pageId: entity.id,
                            icon: "icons/svg/chest.svg"
                        };

                        const cls = getDocumentClass("Note");
                        await cls.create(data, { parent: canvas.scene });
                    }
                }

                msg += `and a ${this.isLootActor(lootSheet) ? "Token" : "Note"} has been added to the canvas`
            }

            if (setting('open-loot') != "none" && entity) {
                if (setting('open-loot') != 'players') {
                    if (game.modules.get('monks-enhanced-journal')?.active && lootSheet == 'monks-enhanced-journal') {
                        if (!game.MonksEnhancedJournal.openJournalEntry(entity))
                            entity.sheet.render(true);
                    } else
                        entity.sheet.render(true);
                }
                if (setting('open-loot') != 'gm') {
                    MonksTokenBar.emit("renderLootable", { entityid: entity.uuid });
                }
            }
        }

        if(msg != "")
            ui.notifications.info(msg);

        this.close();
    }

    static async revertLootable(app) {
        let actor = app.token.actor;

        log('Reverting lootable', actor);

        if (actor == undefined)
            return;

        $('.revert-lootable', app.element).remove();
        await app.close(true);

        let actorData = {
            'flags': {
                'core': {
                    'sheetClass': (actor.flags['monks-tokenbar'].oldsheetClass || null)
                },
                'monks-tokenbar': {
                    'converted': false
                }
            }
        };

        let newItems = [];
        if (actor.getFlag('monks-tokenbar', 'olditems')?.length) {
            actorData.items = duplicate(actor.items);
            for (let olditem of actor.getFlag('monks-tokenbar', 'olditems')) {
                if (actorData.items.findIndex(i => { return i._id == olditem._id; }) < 0)
                    actorData.items.push(olditem);
            }

            actorData.flags["monks-tokenbar"].olditems = [];
        }

        MonksTokenBar.emit('refreshsheet', { tokenid: app.token?.id } );

        //if (newItems.length > 0)
        //    await Item.create(newItems, { parent: actor });
        await actor.update(actorData); /*.then((token) => {
            //if (app._state === Application.RENDER_STATES.CLOSED)
            //    token.actor.sheet.render(true);
        });*/

        let lootingUsers = game.users.contents.filter(user => { return user.role >= 1 && user.role <= 2 });
        let permissions = {};
        Object.assign(permissions, actor.ownership);
        lootingUsers.forEach(user => {
            permissions[user.id] = 0;
        });
        await app.token.update({
            "overlayEffect": null,
            "alpha": app.token.getFlag('monks-tokenbar', 'alpha'),
            "actorData": {
                "permission": permissions
            }
        });

        actor._sheet = null;

        let waitClose = 40;
        while (app._state !== Application.RENDER_STATES.CLOSED && waitClose-- > 0) {
            await new Promise((r) => setTimeout(r, 100));
        }
        if (app._state === Application.RENDER_STATES.CLOSED)
            actor.sheet.render(true);
    }
}
