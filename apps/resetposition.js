import { MonksTokenBar, log, error, i18n, setting } from "../monks-tokenbar.js";

export class ResetPosition extends FormApplication {
    constructor(object, options) {
        super(object, options);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = '';
        options.id = 'tokenbar-resetposition';
        options.template = 'modules/monks-tokenbar/templates/resetposition.html';
        options.closeOnSubmit = true;
        options.popOut = true;
        options.width = 1;
        options.height = 1;
        return options;
    }

    static async resetPosition(app) {
        await game.user.unsetFlag("monks-tokenbar", "position");
        if (MonksTokenBar.tokenbar != undefined)
            MonksTokenBar.tokenbar.render(true);
        app.close({ force: true });
    }
}

Hooks.on("renderResetPosition", ResetPosition.resetPosition);