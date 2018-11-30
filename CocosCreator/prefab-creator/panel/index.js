// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
	// css style for panel
	style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
  `,

	// html template for panel
	template: `
    <h2>Prefab生成工具</h2>
    <hr />
    <h3>Prefab保存路径</h3>
    <ui-input style="width: 200px;" placeholder="路径..." readonly v-value="savePath"></ui-input>
	<ui-button @confirm="onPathClicked">选择</ui-button>
	
    <hr />
    <h3>图片资源目录</h3>
    <ui-input style="width: 200px;" placeholder="路径..." readonly v-value="textureFolder"></ui-input>
	<ui-button @confirm="onTextureFolderClicked">选择</ui-button>

    <hr />
    <h3>导入Json</h3>
    <ui-asset style="width: 200px;" v-value="json" type="text"></ui-asset>   
	<ui-button @confirm="onCreateClicked">生成</ui-button>

  `,

	// method executed when template and styles are successfully loaded and initialized
	ready() {
		new window.Vue({
			el: this.shadowRoot,
			data: {
				json: "",
				savePath: "",
				textureFolder: "",
			},
			created: function () {
				this.savePath = "db://assets/"
				this.textureFolder = "db://assets/"
			},
			methods: {
				onCreateClicked(event) {
					Editor.Scene.callSceneScript('prefab-creator', 'create', {
						json: this.json,
						savePath: this.savePath,
						textureFolder: this.textureFolder
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