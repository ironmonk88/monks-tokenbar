export const registerSettings = function () {
    // Register any custom module settings here
	let modulename = "monks-tokenbar";

	let imageoptions = {
		'token': game.i18n.localize("MonksTokenBar.token-pictures.token"),
		'actor': game.i18n.localize("MonksTokenBar.token-pictures.actor"),
	};
	
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
	game.settings.register(modulename, "allow-player", {
		name: game.i18n.localize("MonksTokenBar.allow-player.name"),
		hint: game.i18n.localize("MonksTokenBar.allow-player.hint"),
		scope: "world",
		config: true,
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
		default: (game.world.system === "pf1" ? "attributes.ac.normal.total" : "attributes.ac.value"),
		type: String,
	});
	game.settings.register(modulename, "stat2-icon", {
		name: game.i18n.localize("MonksTokenBar.stat2-icon.name"),
		hint: game.i18n.localize("MonksTokenBar.stat2-icon.hint"),
		scope: "client",
		config: false,
		default: "fa-eye",
		type: String,
	});
	game.settings.register(modulename, "stat2-resource", {
		name: game.i18n.localize("MonksTokenBar.stat2-resource.name"),
		hint: game.i18n.localize("MonksTokenBar.stat2-resource.hint"),
		scope: "client",
		config: false,
		default: false,
		type: String,
	});
	
	//this is just a global setting for movement mode
	game.settings.register(modulename, "movement", {
		scope: "world",
		config: false,
		default: "free",
		type: String,
	});

};
