import GLib from "gi://GLib";
import Gio from 'gi://Gio';
import St from 'gi://St';
import Soup from 'gi://Soup';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export var schema = 'org.gnome.desktop.background';
export var imagePath = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES) + '/BingWallpaper';

export default class BingWallpaperExtension extends Extension {
    enable() {
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        
        let gicon = Gio.icon_new_for_string(this.dir.get_path() + '/bing-symbolic.svg');
        const icon = new St.Icon({
            gicon: gicon,
            style_class: 'system-status-icon'
        });
        this._indicator.add_child(icon);
        //this._indicator.connect('pressed', () => this.getWallpaper());
        
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        
        const menu_browse = new PopupMenu.PopupImageMenuItem('Browse', 'folder-directory-symbolic', {});
        menu_browse.connect('activate', () => {
            let uri = 'file://' + imagePath;
            Gio.app_info_launch_default_for_uri(uri, global.create_app_launch_context(0, -1));
        });
        this._indicator.menu.addMenuItem(menu_browse);
        
        this.gsettings = new Gio.Settings({ schema: schema });
        let uri = this.gsettings.get_string('picture-uri');
        let filename = uri.substring(uri.lastIndexOf('/') + 1)
        this.menu_update = new PopupMenu.PopupImageMenuItem(filename, 'info-symbolic', {});
        this.menu_update.connect('activate', () => this.getWallpaper());
        this._indicator.menu.addMenuItem(this.menu_update);
    }

    disable() {        
        this._indicator?.destroy();
        this._indicator = null;        
    }
    
    getWallpaper() {        
        var url = 'http://cn.bing.com/HPImageArchive.aspx';
        let params = { format: 'js', idx: '0' , n: '1' } ;
        let httpSession = new Soup.Session();
        let request = Soup.Message.new_from_encoded_form('GET', url, Soup.form_encode_hash(params));
        httpSession.send_and_read_async(request, GLib.PRIORITY_DEFAULT, null, (httpSession, message) => {            
            const decoder = new TextDecoder();
            var data = decoder.decode(httpSession.send_and_read_finish(message).get_data());
            var json = JSON.parse(data);
            let imgUrl = "http://www.bing.com" + json.images[0].url;
            var filename = json.images[0].enddate + '_' + json.images[0].urlbase.replace('/th?id=OHR.', '') + '.jpg';
            this.menu_update.label.text = json.images[0].copyright;
            var filepath = imagePath + '/' + filename;
            let file = Gio.file_new_for_path(filepath);
            let request = Soup.Message.new('GET', imgUrl);
            httpSession.send_and_read_async(request, GLib.PRIORITY_DEFAULT, null, (httpSession, message) => {
                data = httpSession.send_and_read_finish(message).get_data();
                file.replace_contents_bytes_async(data, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null, (file, res) => {
                    let uri = 'file://' + filepath;
                    this.gsettings.set_string('picture-uri', uri);
                    this.gsettings.set_string('picture-uri-dark', uri);
                    Gio.Settings.sync();
                    this.gsettings.apply();
                });
            });            
        });
    }
    
}
