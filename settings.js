export const registerSettings = function () {
    // Register any custom module settings here
	let modulename = "monks-tokenbar";
	
	game.settings.register(modulename, "notify-on-change", {
		name: "Notify on Movement Change",
		hint: "Send a notification to all players when the GM changes the allowable movement",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	if (game.world.system === "dnd5e" && !game.settings.get('dnd5e', 'disableExperienceTracking')) {
		game.settings.register(modulename, "show-xp-dialog", {
			name: "Show XP Dialog",
			hint: "Show the XP Dialog automatically after you complete an encounter",
			scope: "world",
			config: true,
			default: true,
			type: Boolean,
		});
	}

	game.settings.register(modulename, "show-resource-bars", {
		name: "Show Resource Bars",
		hint: "Show the Token resource bars",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	
	//this is just a global setting for movement mode
	game.settings.register(modulename, "movement", {
		scope: "world",
		config: false,
		default: "free",
		type: String,
	});
};