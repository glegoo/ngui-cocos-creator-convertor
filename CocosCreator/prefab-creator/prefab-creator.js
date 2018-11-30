let path = require('fire-path');

module.exports = {
    // prefabs: null,
    'create': function (event, info) {
        this.show(info)
        const callback = () => {
            this.editPrefab(info.json, info.savePath)
        }

        if (!this.textureMap) {
            this.loadTextures(info.textureFolder, callback)
        }
        else {
            callback()
        }
    },

    loadTextures(folder, callback) {
        Editor.log('开始加载图片资源')
        let self = this
        Editor.assetdb.queryAssets(folder + '/**\/*', "sprite-frame", function (err, results) {
            if (err) {
                throw err
            }
            let count = 0
            results.forEach(function (result, index) {
                self.textureMap = {}
                cc.AssetLibrary.loadAsset(result.uuid, function (error, asset) {
                    let ext = path.extname(result.path)
                    let filename = path.basename(result.path, ext)
                    self.textureMap[filename] = asset
                    count++
                    Editor.log('图片资源加载...' + count + '/' + results.length)
                    if (count === results.length) {
                        Editor.log('图片资源加载完成!')
                        if (callback) {
                            callback()
                        }
                    }
                })
            })
        })
    },

    editPrefab(uuid, savePath) {
        let self = this
        cc.loader.load({ type: 'uuid', uuid: uuid }, function (err, res) {
            let info = res
            // Editor.log('开始创建prefab')
            if (info) {
                let root = new cc.Node(info.name)
                root.setParent(cc.find('Canvas'))
                self.editNode(info, root)

                Editor.Ipc.sendToPanel('scene', 'scene:create-prefab', root.uuid, savePath);

                // 进入prefab编辑模式
                // let uuid = Editor.assetdb.remote.urlToUuid(savePath + info.name + '.prefab')
                // Editor.Ipc.sendToAll('scene:enter-prefab-edit-mode', uuid);
            }
        })
    },

    editNode(info, node) {
        if (info) {

            if (info.components) {
                info.components.forEach(element => {
                    node.color = this.hex2color(element.color)

                    // 锚点设置
                    if (element.pivot.includes('Top')) {
                        node.anchorY = 1
                    } else if (element.pivot.includes('Bottom')) {
                        node.anchorY = 0
                    }

                    if (element.pivot.includes('Right')) {
                        node.anchorY = 1
                    } else if (element.pivot.includes('Left')) {
                        node.anchorY = 0
                    }

                    if (element.type == "UISprite" || element.type == "UITexture") {
                        let spr = node.addComponent(cc.Sprite)
                        this.setSpriteFrame(spr, element.atlas, element.spName)
                        // 修改border
                        if (spr.spriteFrame && element.border) {
                            if (spr.spriteFrame.insetTop !== element.border.top
                                || spr.spriteFrame.insetBottom !== element.border.bottom
                                || spr.spriteFrame.insetLeft !== element.border.left
                                || spr.spriteFrame.insetRight !== element.border.right) {
                                this.editBorder(spr.spriteFrame, element.border)
                            }
                        }
                        if (element.spType == "Sliced") spr.type = cc.Sprite.Type.SLICED
                    }

                    // 在label设置overflow前设置宽高
                    node.width = element.size.width
                    node.height = element.size.height

                    if (element.type == "UILabel") {
                        let label = node.addComponent(cc.Label)
                        label.string = element.text
                        label.fontSize = element.fontSize
                        if (element.overflow === "ShrinkContent") {
                            label.overflow = cc.Label.Overflow.SHRINK
                        } else if (element.overflow === "ResizeHeight") {
                            label.overflow = cc.Label.Overflow.RESIZE_HEIGHT
                        }
                        if (element.outlineColor) {
                            let outline = node.addComponent(cc.LabelOutline)
                            outline.color = this.hex2color(element.outlineColor)
                            outline.width = element.outlineWidth
                        }
                    }

                    if (element.type == "UIWidget") node.addComponent(cc.Widget)
                });
            }

            if (info.button) node.addComponent(cc.Button)

            if (info.children) {
                info.children.forEach(child => {
                    let childNode = new cc.Node(child.name)
                    childNode.setParent(node)
                    this.editNode(child, childNode)
                });
            }

            // 最后设置位置, 防止锚点影响
            node.position = cc.v2(info.pos.x, info.pos.y)
            node.rotation = info.rotation
            node.scale.x = info.scale.x
            node.scale.y = info.scale.y
            node.active = info.active
        }
    },

    // 修改SpriteFrame的Border
    editBorder(spriteFrame, border) {
        Editor.assetdb.queryMetaInfoByUuid(spriteFrame._uuid, function (err, info) {
            let meta = JSON.parse(info.json)
            meta.borderTop = border.top
            meta.borderBottom = border.bottom
            meta.borderLeft = border.left
            meta.borderRight = border.right
            Editor.assetdb.saveMeta(spriteFrame._uuid, JSON.stringify(meta))
        })
    },

    hex2color(hexColor) {
        const hex = hexColor.replace(/^#?/, "0x");
        const c = parseInt(hex);
        const r = c >> 16;
        const g = (65280 & c) >> 8;
        const b = 255 & c;
        return cc.color(r, g, b, 255);
    },

    setSpriteFrame(sprite, atlas, name) {
        sprite.spriteFrame = this.textureMap[name]
    },

    openSelectSaveFolder(defaultPath) {
        let path = null

        if (!defaultPath) {
            defaultPath = Editor.projectInfo.path + '/assets'
        }

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
                path = selectPath
            }
        }
        return path
    },

    // main.js中可以打印出完整结构
    show(any) {
        Editor.Ipc.sendToMain('prefab-creator:show', any)
    }
};