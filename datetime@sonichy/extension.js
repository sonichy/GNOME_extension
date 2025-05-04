import GLib from "gi://GLib";
import St from 'gi://St';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Calendar from 'resource:///org/gnome/shell/ui/calendar.js';

export default class DatetimeExtension extends Extension {

    enable() {
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        
        var label = new St.Label({ text: '00:00\n1/1 一' });
        label.set_style('text-align:center');
        this._indicator.add_child(label);
        
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        
        const menuItem = new PopupMenu.PopupMenuItem('');
        //https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/dateMenu.js#L901
        let calendar = new Calendar.Calendar();
        menuItem.add_child(calendar);
        menuItem.height = 300;
        let now = new Date();
        calendar.setDate(now);        
        this._indicator.menu.addMenuItem(menuItem);
        
        //const menuItem1 = new PopupMenu.PopupMenuItem('');
        //menuItem1.label.set_style('text-align:center'); //无效
        //this._indicator.menu.addMenuItem(menuItem1);
        
        this.label_tooltip = new St.Label({ text: '' });
        this.label_tooltip.set_style('background:#222;padding:10px;border:1px solid #aaa;border-radius:10px;');
        global.stage.add_child(this.label_tooltip);
        this.label_tooltip.hide();
        this._indicator.connect('notify::hover', () => {            
            const [x, y] = this._indicator.get_transformed_position();
            //console.log(x, y);
            if (x == 0 && y != 0) //LEFT
                this.label_tooltip.set_position(x + this._indicator.width + 1, y);
            else if (x != 0 && y == 0) //TOP
                this.label_tooltip.set_position(x, y + this._indicator.height + 1);                
            else
                if (this._indicator.height == Main.panel.height) //BOTTOM
                    this.label_tooltip.set_position(x, y - this.label_tooltip.height - 1);
                else //RIGHT
                    this.label_tooltip.set_position(x - this.label_tooltip.width - 1, y);
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
            var text = h + ' : ' + m + '\n' + (date.getMonth() + 1) + '/' + date.getDate() + ' ' + weekday[day];            
            label.set_text(text);            
            //menuItem1.label.text = date.toLocaleString() + ' ' + weekday1[day];
            this.label_tooltip.text = date.toLocaleString() + ' ' + weekday1[day];
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
    }
    
}
