const cp = require('child_process');

// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
	// css style for panel
	style: `
    @import url('app://bower_components/fontawesome/css/font-awesome.min.css');
    h2 { color: #f90; }
  `,

	// html template for panel
	template: `
	<title>Prefab生成工具</title>
    <hr />
    <h3>Prefab保存路径</h3>
	<div style="display:flex;">
    <ui-input class="flex-1" placeholder="路径..." readonly v-value="savePath"></ui-input>
	<ui-button class="transparent" @confirm="onPathClicked"><i class="fa fa-folder-open"></i></ui-button>
	</div>
	
    <h3>图片资源目录</h3>
	<div style="display:flex;">
    <ui-input class="flex-1" placeholder="路径..." readonly v-value="textureFolder"></ui-input>
	<ui-button class="transparent" @confirm="onTextureFolderClicked"><i class="fa fa-folder-open"></i></ui-button>
	</div>

    <h3>字体资源目录</h3>
	<div style="display:flex;">
    <ui-input class="flex-1" placeholder="路径..." readonly v-value="fontFolder"></ui-input>
	<ui-button class="transparent" @confirm="onFontFolderClicked"><i class="fa fa-folder-open"></i></ui-button>
	</div>

    <h3>导入Json</h3>
	<div style="display:flex;">
		<ui-asset style="flex:1;" v-value="json" type="json"></ui-asset>   
		<ui-button class="transparent" @confirm="onCreateClicked"><i class="fa fa-magic"></i></ui-button>
	</div>
	
    <br/>

	<div style="font-size: 14px; cursor:pointer;" @click="gitHub">
        <i class="fa fa-github"> https://github.com/glegoo/ngui-cocos-creator-convertor </i>
    </div>

  `,

	// method executed when template and styles are successfully loaded and initialized
	ready() {
		new window.Vue({
			el: this.shadowRoot,
			data: {
				json: "",
				savePath: "",
				textureFolder: "",
				fontFolder: "",
			},
			created: function () {
				this.savePath = "db://assets/"
				this.textureFolder = "db://assets/"
				this.fontFolder = "db://assets/"
			},
			methods: {
				onCreateClicked(event) {
					Editor.Scene.callSceneScript('prefab-creator', 'create', {
						json: this.json,
						savePath: this.savePath,
						textureFolder: this.textureFolder,
						fontFolder: this.fontFolder
					});
				},

				onPathClicked(event) {
					let path = this._openSelectSaveFolder(this.savePath)
					if (path) {
						this.savePath = path
					}
				},

				onTextureFolderClicked(event) {
					let path = this._openSelectSaveFolder(this.textureFolder)
					if (path) {
						this.textureFolder = path
					}
				},

				onFontFolderClicked(event) {
					let path = this._openSelectSaveFolder(this.fontFolder)
					if (path) {
						this.fontFolder = path
					}
				},

				_openSelectSaveFolder(defaultUrl) {
					let path = null

					let defaultPath = Editor.assetdb.remote.urlToFspath(defaultUrl)

					let selectPath = Editor.Dialog.openFile({
						defaultPath: defaultPath,
						properties: ['openDirectory'],
						title: '请选择保存路径'
					})

					if (selectPath !== -1) {
						selectPath = String(selectPath)
						if (!selectPath.includes(Editor.projectInfo.path + '\\assets')) {
							Editor.Dialog.messageBox({
								title: '提示',
								type: 'warning',
								message: '请选择游戏工程assets文件夹下的目录!'
							})
						}
						else {
							path = Editor.assetdb.remote.fspathToUrl(selectPath)
						}
					}
					return path
				},

				gitHub() {
					cp.exec('start https://github.com/glegoo/ngui-cocos-creator-convertor');
				}
			}
		})
	},

	// register your ipc messages here
	messages: {
		'prefab-creator:hello'(event) {
			// this.$node.innerText = 'Hello!';
			// Editor.log(this.$node.name)
		}
	}
});