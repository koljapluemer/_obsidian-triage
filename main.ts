import {
	App,
	Component,
	Editor,
	MarkdownRenderer,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		// create directory Triage in the vault (if it doesn't exist)
		this.app.vault.createFolder("Triage");
		// same with Triage/Keep, Triage/Kill, Triage/Flag
		this.app.vault.createFolder("Triage/Keep");
		this.app.vault.createFolder("Triage/Kill");
		this.app.vault.createFolder("Triage/Flag");

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"axe",
			"Triage",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new SampleModal(this.app).open();
			}
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		// get all files containing the string "q-type: article"
		const files = this.app.vault.getMarkdownFiles();

		const articlesPromise = Promise.all(
			files.map((file) =>
				this.app.vault.read(file).then((content: any) => {
					return {
						file,
						isArticle: content.includes("q-type: article"),
					};
				})
			)
		);

		articlesPromise.then((articles) => {
			const filteredArticles = articles.filter(
				(article) => article.isArticle
			);
			console.log(`Found ${filteredArticles.length} articles`);

			for (const file of filteredArticles) {
				this.renderNote(contentEl, file.file);
			}
		});
	}

	renderNote(container: any, note: TFile) {
		const noteEl = container.createEl("div", "note");

		this.app.vault.read(note).then((content: any) => {
			MarkdownRenderer.render(
				this.app,
				content,
				container,
				note.path,
				container
			);
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
