import Gio from 'gi://Gio';
import St from 'gi://St';
import Shell from 'gi://Shell';
import GMenu from 'gi://GMenu';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as SystemActions from 'resource:///org/gnome/shell/misc/systemActions.js';
import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';

export default class DatetimeExtension extends Extension {

    enable() {
        this.indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        
        this.settings = this.getSettings();
        this.settings.connectObject('changed', () => this.reload(), this);
        
        let icon_name = this.settings.get_string('icon-name');
        if (icon_name == '')
            icon_name = this.dir.get_path() + '/gnome.svg';
        let gicon = Gio.icon_new_for_string(icon_name);
        this.icon = new St.Icon({
            gicon: gicon,
            style_class: 'system-status-icon'    
        });
        this.indicator.add_child(this.icon);
        
        //favorite
        let menuItem = new PopupMenu.PopupSubMenuMenuItem('收藏', true, {});
        menuItem.icon.icon_name = 'favorite';        
        this.indicator.menu.addMenuItem(menuItem);
        this.loadFavorites(menuItem);
        
        // /usr/share/gnome-shell/extensions/arcmenu@arcmenu.com/menulayouts/baseMenuLayout.js
        let appSys = Shell.AppSystem.get_default();
        let tree = new GMenu.Tree({ menu_basename: 'applications.menu' });
        tree.load_sync();
        const root = tree.get_root_directory();
        const iter = root.iter();
        let nextType;
        while ((nextType = iter.next())) {
            //console.log(nextType);
            if (nextType == GMenu.TreeItemType.DIRECTORY) {
                let dir = iter.get_directory();
                //console.log(dir.get_name());
                // https://gjs.guide/extensions/topics/popup-menu.html#popupsubmenumenuitem
                let menuItem = new PopupMenu.PopupSubMenuMenuItem(dir.get_name(), true, {});
                // /usr/share/gnome-shell/extensions/arcmenu@arcmenu.com/menulayouts/utils.js
                //console.log(dir.get_icon().to_string());
                menuItem.icon.icon_name = dir.get_icon().to_string();
                this.indicator.menu.addMenuItem(menuItem);
                let iter1 = dir.iter();
                let nextType1;
                while (nextType1 = iter1.next()) {
                    //console.log(nextType1);
                    if (nextType1 == GMenu.TreeItemType.ENTRY) {
                        let id = iter1.get_entry().get_desktop_file_id();                        
                        let app = appSys.lookup_app(id);
                        // https://gjs.guide/extensions/topics/popup-menu.html, addAction(title, callback, icon)
                        //menuItem.menu.addAction(app.get_name(), () => app.open_new_window(-1), app.get_icon().to_string()); //路径图标不显示
                        menuItem.menu.addAction(app.get_name(), () => app.open_new_window(-1), Gio.icon_new_for_string(app.get_icon().to_string()));
                    }
                }
            }
        }
        
        menuItem = new PopupMenu.PopupImageMenuItem('设置', 'settings', {});        
        menuItem.connect('activate', () => {
            /*
            let id = 'org.gnome.Settings.desktop';
            let app = appSys.lookup_app(id);
            app.open_new_window(-1);
            */
            //https://gjs.guide/extensions/development/preferences.html
            this.openPreferences();
        });
        this.indicator.menu.addMenuItem(menuItem);
        
        // Shutdown
        // /usr/share/gnome-shell/extensions/arcmenu@arcmenu.com/menuButton.js
        let systemActions = SystemActions.getDefault();
        menuItem = new PopupMenu.PopupSubMenuMenuItem('关机', true, {});
        menuItem.icon.icon_name = 'system-shutdown';
        this.indicator.menu.addMenuItem(menuItem);
        menuItem.menu.addAction('关机', () => systemActions.activatePowerOff(), 'system-shutdown');
        menuItem.menu.addAction('重启', () => systemActions.activateRestart(), 'system-reboot');
        menuItem.menu.addAction('锁定', () => systemActions.activateLockScreen(), 'changes-prevent');
        menuItem.menu.addAction('注销', () => systemActions.activateLogout(), 'system-log-out');        
        menuItem.menu.addAction('休眠', () => systemActions.activateSuspend(), 'weather-clear-night');
        
        //Main.panel.addToStatusArea(this.uuid, this.indicator);
        //https://extensions.gnome.org/review/51343
        Main.panel.addToStatusArea(this.uuid, this.indicator, 1, 'left');
    }

    disable() {
        this.indicator?.destroy();
        this.indicator = null;
    }
    
    // /usr/share/gnome-shell/extensions/arcmenu@arcmenu.com/menulayouts/baseMenuLayout.js
    //https://extensions.gnome.org/review/51343
    loadFavorites(menuItem) {
        const appList = AppFavorites.getAppFavorites().getFavorites();
        for (let i=0; i<appList.length; i++) {
            let app = appList[i];            
            menuItem.menu.addAction(app.get_name(), () => app.open_new_window(-1), Gio.icon_new_for_string(app.get_icon().to_string()));
        }
    }
    
    reload() {
        let icon_name = this.settings.get_string('icon-name');
        if (icon_name == '')
            icon_name = this.dir.get_path() + '/gnome.svg';        
        let gicon = Gio.icon_new_for_string(icon_name);
        this.icon.gicon = gicon;
    }
    
}
