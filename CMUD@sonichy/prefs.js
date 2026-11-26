import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CMUDPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Exibição no painel',
        });
        page.add(group);

        const row = new Adw.ActionRow({
            title: 'Exibir em duas linhas',
            subtitle: 'Linha 1: upload/download. Linha 2: CPU, memória e uptime. Desligado mostra tudo numa linha só.',
        });
        group.add(row);

        const toggle = new Gtk.Switch({
            active: settings.get_boolean('two-line'),
            valign: Gtk.Align.CENTER,
        });
        settings.bind(
            'two-line',
            toggle,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        row.add_suffix(toggle);
        row.activatable_widget = toggle;

        window.add(page);
    }
}
