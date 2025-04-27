import GLib from "gi://GLib";
import Gio from "gi://Gio";
import St from 'gi://St';
import Clutter from "gi://Clutter";

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

var db0 = 0, ub0 = 0, tt0 = 0, idle0 = 0, mp, cp;

export default class CMUDExtension extends Extension {

    enable() {
        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        var box = new St.BoxLayout();
        this._indicator.add_child(box);
        
        var area_mem = new St.DrawingArea();
        area_mem.width = 3;
        area_mem.height = this._indicator.height;
        area_mem.connect('repaint', this.onRepaint_mem);
        box.add_child(area_mem);
        
        var label = new St.Label({ text: '↑  0KB/s\n↓  0KB/s', y_align: Clutter.ActorAlign.CENTER });
        label.set_style('text-align:center; font-family:Noto Mono');
        box.add_child(label);
        
        var area_cpu = new St.DrawingArea();
        area_cpu.width = 3;
        area_cpu.height = this._indicator.height;
        area_cpu.connect('repaint', this.onRepaint_cpu);
        box.add_child(area_cpu);

        // Add the indicator to the panel
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        
        const menuItem = new PopupMenu.PopupMenuItem('');
        this._indicator.menu.addMenuItem(menuItem);
        
        this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            var net = this.net();
            label.set_text('↑' + this.B2G(net.ubs) + '/s\n↓' + this.B2G(net.dbs) + '/s');
            this.mem();
            area_mem.queue_repaint();
            this.cpu();
            area_cpu.queue_repaint();
            var s = 'Uptime: ' + this.uptime() + '\nCPU: ' + cp + '%\nMem: ' + this.mem() + '\nUp: ' + this.B2G(net.ub) + '\nDown: ' + this.B2G(net.db);
            menuItem.label.text = s;
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
    
    uptime() {
        const file = Gio.File.new_for_path('/proc/uptime');
        const [, contents, etag] = file.load_contents(null);
        var t = contents.toString().split(' ');        
        var tt = Number(t[0]);
        var d = 0;
        if (tt > 86400) {
            d = tt / 86400;
            tt -= d * 86400;
         }
        var ds = "";
        if (d > 0)
            ds = d + "day";
        var h = ~~(tt/3600);
        if (h < 10)
            h = '0' + h;
        var m = ~~(tt%3600/60);
        if (m < 10)
            m = '0' + m;
        var s = ~~(tt%3600%60);
        if (s < 10)
            s = '0' + s;
        var hms = ds + h + ':' + m + ':' + s;
        return hms;
    }
    
    net() {
        const file = Gio.File.new_for_path('/proc/net/dev');
        const [, contents, etag] = file.load_contents(null);
        var l = contents.toString().trim().split('\n');        
        var db = 0, ub = 0;        
        for (var i=2; i<l.length; i++) {
            var la = l[i].trim().split(/\s+/);            
            db += Number(la[1]);
            ub += Number(la[9]);            
        }        
        var dbs = db - db0;
        var ubs = ub - ub0;
        db0 = db;
        ub0 = ub;
        return {db, ub, dbs, ubs};
    }
    
    mem() {
        const file = Gio.File.new_for_path('/proc/meminfo');
        const [, contents, etag] = file.load_contents(null);
        var s = contents.toString().split('\n');        
        var MT = s[0].split(/\s+/);
        var MA = s[2].split(/\s+/);
        var mt = Number(MT[1]);
        var ma = Number(MA[1]);
        var mu = mt - ma;
        mp = ~~(mu / mt * 100);
        var m = this.B2G(mu*1024) + ' / '+ this.B2G(mt*1024) + ' = ' + mp + '%';
        return m;
    }
    
    cpu() {
        const file = Gio.File.new_for_path('/proc/stat');
        const [, contents, etag] = file.load_contents(null);
        var s = contents.toString().split('\n');
        var ca = s[0].split(/\s+/);
        var tt = 0;
        for (var i=1; i<ca.length; i++) {            
            tt += Number(ca[i]);
         }        
        var idle = Number(ca[4]);
        cp = ~~(((tt - tt0) - (idle - idle0)) * 100 / (tt - tt0));
        tt0 = tt;
        idle0 = idle;
    }
    
    B2G(b) {
        var s = '';
        if (b > 999999999) {
            b = b / (1024 * 1024 * 1024);
            if (b >= 100) {
                s = ' ' + b.toFixed(0) + 'GB';
            } else if (b >= 10) {
                s = b.toFixed(1) + 'GB';
            } else {
                s = b.toFixed(2) + 'GB';
            }
        } else {
            if (b > 999999) {
                b = b / (1024 * 1024);
                if (b >= 100) {
                    s = ' ' + b.toFixed(0) + 'MB';
                } else if (b >= 10) {
                    s = b.toFixed(1) + 'MB';
                } else {
                    s = b.toFixed(2) + 'MB';
                }
           } else {
                if (b > 999) {
                    b = b / 1024;
                    if (b >= 100) {
                        s = ' ' + b.toFixed(0) + 'KB';
                    } else if (b >= 10) {
                        s = '  ' + b.toFixed(0) + 'KB';
                    } else {
                        s = '   ' + b.toFixed(0) + 'KB';
                    }
                } else {
                    if (b >= 100) {
                        s = ' ' + b + ' B';
                    } else if (b >= 10) {
                        s = '  ' + b + ' B';
                    } else {
                        s = '   ' + b + ' B';
                    }
                }
            }
        }
        return s;
    }
    
    onRepaint_mem(area) {
        let ctx = area.get_context();
        ctx.setLineWidth(3);
        if (mp >= 90)
            ctx.setSourceRGBA(1, 0, 0, 1);
        else
            ctx.setSourceRGBA(1, 1, 1, 1);
        ctx.moveTo(0, area.height);
        ctx.lineTo(0, area.height * (100 - mp) / 100);
        ctx.stroke();
        ctx.$dispose();
    }
    
    onRepaint_cpu(area) {
        let ctx = area.get_context();
        ctx.setLineWidth(3);        
        if (cp >= 90)
            ctx.setSourceRGBA(1, 0, 0, 1);
        else
            ctx.setSourceRGBA(1, 1, 1, 1);
        ctx.moveTo(0, area.height);
        ctx.lineTo(0, area.height * (100 - cp) / 100);
        ctx.stroke();
        ctx.$dispose();
    }
    
}
