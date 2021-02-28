import { ResetPosition } from "./apps/resetposition.js";

export const registerSettings = function () {
    // Register any custom module settings here
	let modulename = "monks-tokenbar";

	let imageoptions = {
		'token': game.i18n.localize("MonksTokenBar.token-pictures.token"),
		'actor': game.i18n.localize("MonksTokenBar.token-pictures.actor"),
	};

	let movementoptions = {
		'free': game.i18n.localize("MonksTokenBar.FreeMovement"),
		'none': game.i18n.localize("MonksTokenBar.NoMovement"),
		'combat': game.i18n.localize("MonksTokenBar.CombatTurn"),
		'ignore': game.i18n.localize("MonksTokenBar.Ignore"),
	};
	
	let stat1;
	switch (game.world.system) {
		case "pf1":
			stat1 = "attributes.ac.normal.total";
			break;
		case "tormenta20":
			stat1 = "defesa.value";
			break;
		case "ose":
			stat1 = "ac.value";
			break;
		default:
			stat1 = "attributes.ac.value";
	}

	let stat2;
	switch (game.world.system) {
		case "pf1":
			stat2 = "skills.per.mod";
			break;
		case "dnd5e":
			stat2 = "skills.prc.passive";
			break;
		case "tormenta20":
			stat2 = "pericias.per.value";
			break;
		default:
			stat2 = "";
	}
	
	game.settings.register(modulename, "notify-on-change", {
		name: game.i18n.localize("MonksTokenBar.notify-on-change.name"),
		hint: game.i18n.localize("MonksTokenBar.notify-on-change.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register(modulename, "show-xp-dialog", {
		name: game.i18n.localize("MonksTokenBar.show-xp-dialog.name"),
		hint: game.i18n.localize("MonksTokenBar.show-xp-dialog.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register(modulename, "show-resource-bars", {
		name: game.i18n.localize("MonksTokenBar.show-resource-bars.name"),
		hint: game.i18n.localize("MonksTokenBar.show-resource-bars.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "token-pictures", {
		name: game.i18n.localize("MonksTokenBar.token-pictures.name"),
		hint: game.i18n.localize("MonksTokenBar.token-pictures.hint"),
		scope: "world",
		config: true,
		default: "token",
		type: String,
		choices: imageoptions,
	});
	game.settings.register(modulename, "change-to-combat", {
		name: game.i18n.localize("MonksTokenBar.change-to-combat.name"),
		hint: game.i18n.localize("MonksTokenBar.change-to-combat.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "movement-after-combat", {
		name: game.i18n.localize("MonksTokenBar.movement-after-combat.name"),
		hint: game.i18n.localize("MonksTokenBar.movement-after-combat.hint"),
		scope: "world",
		config: true,
		default: "free",
		type: String,
		choices: movementoptions,
	});
	game.settings.register(modulename, "assign-loot", {
		name: game.i18n.localize("MonksTokenBar.assign-loot.name"),
		hint: game.i18n.localize("MonksTokenBar.assign-loot.hint"),
		scope: "world",
		config: game.modules.get("lootsheetnpc5e")?.active,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "allow-player", {
		name: game.i18n.localize("MonksTokenBar.allow-player.name"),
		hint: game.i18n.localize("MonksTokenBar.allow-player.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "disable-tokenbar", {
		name: game.i18n.localize("MonksTokenBar.disable-tokenbar.name"),
		hint: game.i18n.localize("MonksTokenBar.disable-tokenbar.hint"),
		scope: "client",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "popout-tokenbar", {
		name: game.i18n.localize("MonksTokenBar.popout-tokenbar.name"),
		hint: game.i18n.localize("MonksTokenBar.popout-tokenbar.hint"),
		scope: "client",
		config: false,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "stat1-icon", {
		name: game.i18n.localize("MonksTokenBar.stat1-icon.name"),
		hint: game.i18n.localize("MonksTokenBar.stat1-icon.hint"),
		scope: "client",
		config: true,
		default: "fa-shield-alt",
		type: String,
	});
	game.settings.register(modulename, "stat1-resource", {
		name: game.i18n.localize("MonksTokenBar.stat1-resource.name"),
		hint: game.i18n.localize("MonksTokenBar.stat1-resource.hint"),
		scope: "client",
		config: true,
		default: stat1,
		type: String,
	});
	game.settings.register(modulename, "stat2-icon", {
		name: game.i18n.localize("MonksTokenBar.stat2-icon.name"),
		hint: game.i18n.localize("MonksTokenBar.stat2-icon.hint"),
		scope: "client",
		config: true,
		default: "fa-eye",
		type: String,
	});
	game.settings.register(modulename, "stat2-resource", {
		name: game.i18n.localize("MonksTokenBar.stat2-resource.name"),
		hint: game.i18n.localize("MonksTokenBar.stat2-resource.hint"),
		scope: "client",
		config: true,
		default: stat2,
		type: String,
	});
	game.settings.registerMenu(modulename, 'resetPosition', {
		name: 'Reset Position',
		label: 'Reset Position',
		hint: 'Reset the position of the tokenbar if it disappears off the screen.',
		icon: 'fas fa-desktop',
		restricted: true,
		type: ResetPosition,
		onClick: (value) => {
			log('Reset position');
		}
	});
	
	//this is just a global setting for movement mode
	game.settings.register(modulename, "movement", {
		scope: "world",
		config: false,
		default: "free",
		type: String,
	});

};
