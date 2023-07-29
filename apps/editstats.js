import { MonksTokenBar, log, error, i18n, setting, makeid } from "../monks-tokenbar.js";
import { PickIcon } from "./pick-icon.js";

export class EditStats extends FormApplication {
    constructor(object, options = {}) {
        let stats = object?.getFlag('monks-tokenbar', 'stats') || MonksTokenBar.stats;
        options.height = 62 + (Math.max(stats.length, 4) * 27);
        
        super(object, options);
        if (!Array.isArray(stats)) {
            stats = []; // If the stats is not an array, construct an empty array instead.
        }
        this.stats = stats.map(s => {
            s.id = s.id || makeid();
            return s;
        });
        //let's just grab the first player character we can find
        let player = game.actors.find(a => a.type == 'character');
        if (player) {
            let attributes = getDocumentClass("Token")?.getTrackedAttributes(player.system ?? {});
            if (attributes)
                this.attributes = attributes.value.concat(attributes.bar).map(a => a.join('.'));
        }
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "tokenbar-editstats",
            title: 'Edit Stats',
            template: "./modules/monks-tokenbar/templates/editstats.html",
            width: 600,
            closeOnSubmit: true,
            resizable: true,
            popOut: true,
            dragDrop: [{ dragSelector: ".icon", dropSelector: ".item-list" }]
        });
    }

    getData(options) {
        return {
            hasObject: this.object instanceof Actor,
            stats: this.stats
        };
    }

    _updateObject() {
        if (Object.keys(this.object).length != 0) {
            this.object.setFlag('monks-tokenbar', 'stats', this.stats);
        }else
            game.settings.set('monks-tokenbar', 'stats', this.stats);
        MonksTokenBar.tokenbar.refresh();
        this.submitting = true;
    }

    addStat(event) {
        this.stats.push({ id: makeid(), stat: "", icon: "fa-address-book" });
        this.render(true);
    }

    removeStat() {
        let statid = event.currentTarget.closest('.item').dataset.id;
        this.stats.findSplice(s => s.id === statid);
        $('.item[data-id="' + statid + '"]', this.element).remove();
    }

    resetStats() {
        if (Object.keys(this.object).length != 0) {
            this.stats = MonksTokenBar.stats;
            this.object.unsetFlag('monks-tokenbar', 'stats');
            this.close();
        }
        else
            this.stats = MonksTokenBar.system.defaultStats;
        this.render(true);
        let that = this;
        window.setTimeout(function () { that.setPosition(); }, 100);
    }

    changeIcon(event) {
        this.statid = event.currentTarget.closest('.item').dataset.id;
        let stat = this.stats.find(s => s.id == this.statid);
        new PickIcon(stat, this).render(true);
    }

    changeText(event) {
        let statid = event.currentTarget.closest('.item').dataset.id;
        let stat = this.stats.find(s => s.id == statid);
        stat.stat = $(event.currentTarget).val();
        if (!this.submitting)
            this.render(true);
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('button[name="submit"]', html).click(this._onSubmit.bind(this));
        $('button[name="reset"]', html).click(this.resetStats.bind(this));

        $('div.icon', html).click(this.changeIcon.bind(this));
        $('.stat-text', html).blur(this.changeText.bind(this));
        $('.remove', html).click(this.removeStat.bind(this));
        $('.item-add', html).click(this.addStat.bind(this));

        if (this.attributes) {
            let that = this;

            var substringMatcher = function (strs) {
                return function findMatches(q, cb) {
                    var matches, substrRegex;

                    // an array that will be populated with substring matches
                    matches = [];

                    // regex used to determine if a string contains the substring `q`
                    substrRegex = new RegExp(q, 'i');

                    // iterate through the pool of strings and for any string that
                    // contains the substring `q`, add it to the `matches` array
                    $.each(strs, function (i, str) {
                        if (substrRegex.test(str)) {
                            matches.push(str);
                        }
                    });

                    cb(matches);
                };
            };

            $('.stat-text', html).typeahead(
                {
                    minLength: 1,
                    hint: true,
                    highlight: true
                },
                {
                    source: substringMatcher(that.attributes)
                }
            );
        }
    };

    _onDragStart(event) {
        let li = event.currentTarget.closest(".item");
        const dragData = { id: li.dataset.id };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    _canDragStart(selector) {
        return true;
    }

    _onDrop(event) {
        // Try to extract the data
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        }
        catch (err) {
            return false;
        }

        // Identify the drop target
        const target = event.target.closest(".item") || null;

        // Call the drop handler
        if (target && target.dataset.id) {
            if (data.id === target.dataset.id) return; // Don't drop on yourself

            let from = this.stats.findIndex(a => a.id == data.id);
            let to = this.stats.findIndex(a => a.id == target.dataset.id);
            log('from', from, 'to', to);
            this.stats.splice(to, 0, this.stats.splice(from, 1)[0]);

            if (from < to)
                $('.item-list .item[data-id="' + data.id + '"]', this.element).insertAfter(target);
            else
                $('.item-list .item[data-id="' + data.id + '"]', this.element).insertBefore(target);
        }
    }
}
