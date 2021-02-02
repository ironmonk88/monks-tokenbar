export const registerSettings = function () {
    // Register any custom module settings here
	let modulename = "monks-tokenbar";

	let imageoptions = {
		'token': 'Token Image',
		'actor': 'Actor Portrait',
	};
	
	game.settings.register(modulename, "notify-on-change", {
		name: game.i18n.localize("MonksTokenBar.notify-on-change.name"),
		hint: game.i18n.localize("MonksTokenBar.notify-on-change.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	if (game.world.system === "dnd5e" && !game.settings.get('dnd5e', 'disableExperienceTracking')) {
		game.settings.register(modulename, "show-xp-dialog", {
			name: game.i18n.localize("MonksTokenBar.show-xp-dialog.name"),
			hint: game.i18n.localize("MonksTokenBar.show-xp-dialog.hint"),
			scope: "world",
			config: true,
			default: true,
			type: Boolean,
		});
	}

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
	
	//this is just a global setting for movement mode
	game.settings.register(modulename, "movement", {
		scope: "world",
		config: false,
		default: "free",
		type: String,
	});
};
