import GLib from "gi://GLib";
import St from 'gi://St';
import Clutter from "gi://Clutter";
import Gio from 'gi://Gio';
import * as Dialog from 'resource:///org/gnome/shell/ui/dialog.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Calendar from 'resource:///org/gnome/shell/ui/calendar.js';

export default class DatetimeExtension extends Extension {

    enable() {
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        
        var label = new St.Label({ text: '00:00\n1/1 一', x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER });
        this._indicator.add_child(label);
        
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        
        const menu_calendar = new PopupMenu.PopupMenuItem('');
        //https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/dateMenu.js#L901
        let calendar = new Calendar.Calendar();        
        let now = new Date();
        calendar.setDate(now);
        menu_calendar.add_child(calendar);
        menu_calendar.height = 300;        
        this._indicator.menu.addMenuItem(menu_calendar);        
        
        //https://gjs.guide/extensions/development/preferences.html
        const schema = 'org.gnome.shell.extensions.datetime';
        this._settings = this.getSettings(schema);
        
        const menu_set = new PopupMenu.PopupMenuItem('Set');
        menu_set.connect('activate', () => {            
            //https://gjs.guide/extensions/topics/dialogs.html            
            const dialog = new Dialog.Dialog(global.stage, 'my-dialog');
            
            const box = new St.BoxLayout();
            const label = new St.Label({ text: 'Memo', y_align: Clutter.ActorAlign.CENTER });
            label.style = 'margin:0 10px;';
            box.add_child(label);
            
            var s = this._settings.get_string('memo');
            const entry = new St.Entry({ text: s });
            entry.width = 200;
            box.add_child(entry);
            
            dialog.contentLayout.add_child(box);
            
            dialog.addButton({
                label: 'Save',
                action: () => {                    
                    this._settings.set_string('memo', entry.text);
                    dialog.destroy();
                },
            });
            dialog.addButton({
                label: 'Close',
                isDefault: true,
                action: () => {
                    dialog.destroy();
                },
            });
            dialog.set_position(parseInt(global.stage.width/2 - dialog.width/2), parseInt(global.stage.height/2 - dialog.height/2));
        });
        this._indicator.menu.addMenuItem(menu_set);
        
        this.label_tooltip = new St.Label();
        this.label_tooltip.set_style('background:#222; padding:10px; border:1px solid #aaa; border-radius:10px;');
        global.stage.add_child(this.label_tooltip);
        this.label_tooltip.hide();
        this._indicator.connect('notify::hover', () => {            
            const [x, y] = this._indicator.get_transformed_position();
            //console.log(x, y);
            if (x == 0 && y != 0) //LEFT
                this.label_tooltip.set_position(x + this._indicator.width + 1, y);
            else if (x != 0 && y == 0) //TOP
                this.label_tooltip.set_position(x - this.label_tooltip.width / 2 + this._indicator.width / 2, y + this._indicator.height + 1);                
            else
                if (this._indicator.height == Main.panel.height) //BOTTOM
                    this.label_tooltip.set_position(parseInt(x - this.label_tooltip.width / 2 + this._indicator.width / 2), y - this.label_tooltip.height - 1);
                else //RIGHT
                    this.label_tooltip.set_position(x - this.label_tooltip.width - 1, y);
            //console.log(x - this.label_tooltip.width / 2 + this._indicator.width / 2);
            if (this._indicator.hover)
                this.label_tooltip.show();
            else
                this.label_tooltip.hide();
        });
        
        this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            var date = new Date();
	        var h = date.getHours();
	        if (h < 10)
	            h = "0" + h;
	        var m = date.getMinutes();
	        if (m < 10)
	            m = "0" + m;
	        var day = date.getDay();
	        var weekday = ["日", "一", "二", "三", "四", "五", "六"];
	        var weekday1 = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
            var text = h + ':' + m + '\n' + (date.getMonth() + 1) + '/' + date.getDate() + ' ' + weekday[day];            
            label.set_text(text);            
            var s = this._settings.get_string('memo');
            this.label_tooltip.text = date.toLocaleString() + ' ' + weekday1[day] + '\n' + s;
            // Run as loop, not once.
            return GLib.SOURCE_CONTINUE;
        });
        
    }

    disable() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        this.label_tooltip?.destroy();
        this.label_tooltip = null;        
        this._indicator?.destroy();
        this._indicator = null;
        this._settings = null;
    }
    
}
