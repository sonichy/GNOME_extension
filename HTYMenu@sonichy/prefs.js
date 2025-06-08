import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import Gdk from 'gi://Gdk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import * as Config from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js';

export default class ExamplePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {       
        const settings = this.getSettings();
        
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'settings',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup();
        page.add(group);
        
        let icon_name = settings.get_string('icon-name');
        if (icon_name == '')
            icon_name = this.dir.get_path() + '/gnome.svg';
        const icon = new Gtk.Image({
            gicon: Gio.icon_new_for_string(icon_name),
            pixel_size: 64
        });
        group.add(icon);
        
        const button = new Gtk.Button({
            label: _('Browse'),
            valign: Gtk.Align.CENTER
        });
        //button.container.add(icon);
        button.connect('clicked', () => {
            console.log('button clicked!');
        });
        const row_icon = new Adw.ActionRow({
            title: _('Choose a New Icon'),
            activatable_widget: button,
            subtitle: settings.get_string('icon-name')
        });
        row_icon.add_suffix(button);
        group.add(row_icon);
        
        // /usr/share/gnome-shell/extensions/arcmenu@arcmenu.com/settings/MenuButtonPage.js, IconChooserDialog
        const searchEntry = new Gtk.SearchEntry({
            placeholder_text: '搜索...',
            search_delay: 250
        });
        searchEntry.connect('search-changed', () => {
            const query = searchEntry.text;
            if (!query) {
                filter.set_filter_func(null);
                return;
            }
            filter.set_filter_func(item => {
                return item.string.includes(query);
            });
        });
        group.add(searchEntry);
        
        const iconThemeDefault = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
        const iconTheme = new Gtk.IconTheme({
            resource_path: iconThemeDefault.resource_path,
            theme_name: iconThemeDefault.theme_name
        });
        const iconNames = iconTheme.get_icon_names();
        iconNames.sort((a, b) => a.localeCompare(b));
        const listStore = new Gtk.StringList({ strings: iconNames });

        const filter = new Gtk.CustomFilter();
        const filterListModel = new Gtk.FilterListModel({
            model: listStore,
            filter,
        });
        const factory = new Gtk.SignalListItemFactory();
        factory.connect('setup', (factory_, item) => {
            item.connect('notify::selected', () => {                
                let s = listView.model.get_selected_item().string;                
                icon.gicon = Gio.icon_new_for_string(s);
                row_icon.subtitle = s;                
                settings.set_string('icon-name', s);
            });
            const box = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 12,
                margin_top: 3,
                margin_bottom: 3,
                margin_start: 12,
                margin_end: 12,
            });

            const image = new Gtk.Image({
                pixel_size: 32,
                hexpand: false,
                halign: Gtk.Align.START,
            });
            box.image = image;

            const label = new Gtk.Label({
                hexpand: false,
                halign: Gtk.Align.START,
                wrap: true,
                //wrap_mode: Pango.WrapMode.WORD_CHAR,
            });
            box.label = label;
            
            box.append(image);
            box.append(label);
            item.set_child(box);
        });
        factory.connect('bind', (factory_, {child, item}) => {
            const iconName = item.string;
            child.image.icon_name = iconName;
            child.label.label = iconName;
        });
        const listView = new Gtk.ListView({
            model: new Gtk.SingleSelection({ model: filterListModel, autoselect: false, selected: -1 }),
            factory,
            vexpand: true,
            valign: Gtk.Align.FILL,
        });
        const scrollWindow = new Gtk.ScrolledWindow({
            child: listView,
            //hscrollbar_policy: Gtk.PolicyType.NEVER,
            //vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
        });
        group.add(scrollWindow);
        
        
        // /usr/share/gnome-shell/extensions/arcmenu@arcmenu.com/settings/AboutPage.js
        const page_about = new Adw.PreferencesPage({
            title: _('About'),
            icon_name: 'dialog-information',
        });
        window.add(page_about);        
        
        const group_head = new Adw.PreferencesGroup();
        page_about.add(group_head);
        
        const projectImage = new Gtk.Image({            
            icon_name: 'gnome_apps',
            pixel_size: 100,
        });
        group_head.add(projectImage);
        
        const projectTitleLabel = new Gtk.Label({
            label: _('HTYMenu'),
            css_classes: ['title-1'],
            //vexpand: true,
            valign: Gtk.Align.FILL,
        });
        group_head.add(projectTitleLabel);
        
        const projectDescriptionLabel = new Gtk.Label({
            label: 'GNOME 应用程序菜单扩展',
            hexpand: false,
            vexpand: false,
        });
        group_head.add(projectDescriptionLabel);
    
        const group_info = new Adw.PreferencesGroup();
        page_about.add(group_info);
        
        const projectVersionRow = new Adw.ActionRow({            
            title: 'HTYMenu Version',
        });
        projectVersionRow.add_suffix(new Gtk.Label({
            label: '1.1',
            css_classes: ['dim-label'],
        }));
        group_info.add(projectVersionRow);
        
        const gnomeVersionRow = new Adw.ActionRow({
            title: _('GNOME Version'),
        });
        gnomeVersionRow.add_suffix(new Gtk.Label({
            label: Config.PACKAGE_VERSION.toString(),
            css_classes: ['dim-label'],
        }));
        group_info.add(gnomeVersionRow);
        
        const osRow = new Adw.ActionRow({
            title: _('OS Name'),
        });
        const name = GLib.get_os_info('NAME');
        const prettyName = GLib.get_os_info('PRETTY_NAME');
        osRow.add_suffix(new Gtk.Label({            
            label: prettyName ? prettyName : name,
            css_classes: ['dim-label'],
        }));
        group_info.add(osRow);
        
        const sessionTypeRow = new Adw.ActionRow({
            title: _('Window System'),
        });
        sessionTypeRow.add_suffix(new Gtk.Label({
            label: GLib.getenv('XDG_SESSION_TYPE'),
            css_classes: ['dim-label'],
        }));
        group_info.add(sessionTypeRow);        
        
        const uri = 'https://github.com/sonichy/GNOME_extension';
        const linkRow = new Adw.ActionRow({
            title: 'Source',
            activatable: true,
            //tooltip_text: uri,
            subtitle: uri
        });
        linkRow.connect('activated', () => {
            Gtk.show_uri(page_about.get_root(), uri, Gdk.CURRENT_TIME);
        });
        const image = new Gtk.Image({
            icon_name: 'adw-external-link-symbolic',
            valign: Gtk.Align.CENTER,
        });
        linkRow.add_suffix(image);
        group_info.add(linkRow);
        
        //window._settings = this.getSettings();
        //window._settings.bind('show-indicator', row, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}
