import { ResetPosition } from "./apps/resetposition.js";
import { EditStats } from "./apps/editstats.js";
import { MonksTokenBar } from "./monks-tokenbar.js"

export const divideXpOptions = {
	"no-split": "MonksTokenBar.divide-xp-no-split.name",
	"equal-split": "MonksTokenBar.divide-xp-equal-split.name",
	"robin-hood-split": "MonksTokenBar.divide-xp-robin-hood-split.name",
	"nottingham-split": "MonksTokenBar.divide-xp-nottingham-split.name",
};

export const registerSettings = function () {
    // Register any custom module settings here
	let modulename = "monks-tokenbar";

	const debouncedReload = foundry.utils.debounce(function () { window.location.reload(); }, 100);

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

	/*
	let stat1 = "attributes.ac.value";
	let stat2 = "";
	switch (game.system.id) {
		case "pf1":
			stat1 = "attributes.ac.normal.total";
			stat2 = "skills.per.mod";
			break;
		case "D35E":
			stat1 = "attributes.ac.normal.total";
			stat2 = "skills.spt.value";
			break;
		case "dnd4eBeta":
			stat1 = "defences.ac.value";
			stat2 = "skills.prc.total";
			break;
		case "dnd5e":
		case "sw5e":
			stat2 = "skills.prc.passive";
			break;
		case "tormenta20":
			stat1 = "defesa.value";
			stat2 = "pericias.per.value";
			break;
		case "pf2e":
			stat2 = "attributes.perception.value + 10";
			break;
		case "ose":
			stat1 = "ac.value";
			break;
		case "sfrpg":
			stat1 = "attributes.kac.value";
			stat2 = "attributes.eac.value";
			break;
		case "swade":
			stat1 = "stats.toughness.value";
			stat2 = "";
			break;
	}

	let icon1 = "fa-shield-alt";
	let icon2 = "fa-eye";
	switch (game.system.id) {
		case "sfrpg":
			icon2 = "fa-shield-virus";
			break;
	}*/

	const dividexp = (game.system.id === "pf2e" ? "no-split" : "equal-split");

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


	game.settings.register(modulename, "divide-xp", {
		name: game.i18n.localize("MonksTokenBar.divide-xp.name"),
		hint: game.i18n.localize("MonksTokenBar.divide-xp.hint"),
		scope: "world",
		config: true,
		default: dividexp,
		type: String,
		choices: divideXpOptions,
		localize: true
	});

	game.settings.register(modulename, "send-levelup-whisper", {
		name: game.i18n.localize("MonksTokenBar.send-levelup-whisper.name"),
		hint: game.i18n.localize("MonksTokenBar.send-levelup-whisper.hint"),
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
	game.settings.register(modulename, "allow-after-movement", {
		name: game.i18n.localize("MonksTokenBar.allow-after-movement.name"),
		hint: game.i18n.localize("MonksTokenBar.allow-after-movement.hint"),
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
	game.settings.register(modulename, "show-on-tracker", {
		name: game.i18n.localize("MonksTokenBar.show-on-tracker.name"),
		hint: game.i18n.localize("MonksTokenBar.show-on-tracker.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "free-npc-combat", {
		name: game.i18n.localize("MonksTokenBar.free-npc-combat.name"),
		hint: game.i18n.localize("MonksTokenBar.free-npc-combat.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
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
	game.settings.register(modulename, "delete-after-grab", {
		name: game.i18n.localize("MonksTokenBar.delete-after-grab.name"),
		hint: game.i18n.localize("MonksTokenBar.delete-after-grab.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "show-lootable-menu", {
		name: game.i18n.localize("MonksTokenBar.show-lootable-menu.name"),
		hint: game.i18n.localize("MonksTokenBar.show-lootable-menu.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "show-inspiration", {
		name: game.i18n.localize("MonksTokenBar.show-inspiration.name"),
		hint: game.i18n.localize("MonksTokenBar.show-inspiration.hint"),
		scope: "client",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "show-disable-panning-option", {
		name: game.i18n.localize("MonksTokenBar.show-disable-panning-option.name"),
		hint: game.i18n.localize("MonksTokenBar.show-disable-panning-option.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "request-roll-sound", {
		name: game.i18n.localize("MonksTokenBar.request-roll-sound.name"),
		hint: game.i18n.localize("MonksTokenBar.request-roll-sound.hint"),
		scope: "world",
		config: false,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "request-roll-sound-file", {
		name: game.i18n.localize("MonksTokenBar.request-roll-sound.name"),
		hint: game.i18n.localize("MonksTokenBar.request-roll-sound.hint"),
		scope: "client",
		config: true,
		default: "modules/monks-tokenbar/sounds/RollRequestAlert.ogg",
		type: String,
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
		scope: "world",
		config: false,
		default: null,//icon1, //MonksTokenBar.system._defaultSetting.icon1,
		type: String,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "stat1-resource", {
		name: game.i18n.localize("MonksTokenBar.stat1-resource.name"),
		hint: game.i18n.localize("MonksTokenBar.stat1-resource.hint"),
		scope: "world",
		config: false,
		default: null, //stat1, //MonksTokenBar.system._defaultSetting.stat1,
		type: String,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "stat2-icon", {
		name: game.i18n.localize("MonksTokenBar.stat2-icon.name"),
		hint: game.i18n.localize("MonksTokenBar.stat2-icon.hint"),
		scope: "world",
		config: false,
		default: null, //icon2, //MonksTokenBar.system._defaultSetting.icon2,
		type: String,
		//choices: imageoptions,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "stat2-resource", {
		name: game.i18n.localize("MonksTokenBar.stat2-resource.name"),
		hint: game.i18n.localize("MonksTokenBar.stat2-resource.hint"),
		scope: "world",
		config: false,
		default: null, //stat2, //MonksTokenBar.system._defaultSetting.stat2,
		type: String,
		onChange: debouncedReload
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
	game.settings.registerMenu(modulename, 'editStats', {
		name: 'Edit Stats',
		label: 'Edit Stats',
		hint: 'Edit the stats that are displayed on the Tokenbar',
		icon: 'fas fa-align-justify',
		restricted: true,
		type: EditStats
	});
	
	//this is just a global setting for movement mode
	game.settings.register(modulename, "movement", {
		scope: "world",
		config: false,
		default: "free",
		type: String,
	});
	game.settings.register(modulename, "debug", {
		scope: "world",
		config: false,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "stats", {
		scope: "world",
		config: false,
		type: Object,
	});

};
