import GLib from "gi://GLib";
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export default class DatetimeExtension extends Extension {
    enable() {
        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        
        var label = new St.Label({ text: '00:00\n1/1 一' });
        label.set_style('text-align:center');        
        this._indicator.add_child(label);        

        // Add the indicator to the panel
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        
        const menuItem = new PopupMenu.PopupMenuItem('');
        this._indicator.menu.addMenuItem(menuItem);
        
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
            const text = h + ' : ' + m + '\n' + (date.getMonth() + 1) + '/' + date.getDate() + ' ' + weekday[day];            
            label.set_text(text);
            menuItem.label.text = date.toLocaleString() + ' ' + weekday1[day];
            // Run as loop, not once.
            return GLib.SOURCE_CONTINUE;
        });
        
    }

    disable() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        this._indicator?.destroy();
        this._indicator = null;        
    }
    
}
