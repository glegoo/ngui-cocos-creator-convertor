let path = require('fire-path');

FillDirection = {
    Horizontal: 0,
    Vertical: 1,
    Radial90: 2,
    Radial180: 3,
    Radial360: 4,
}

Movement = {
    Horizontal: 0,
    Vertical: 1,
    Unrestricted: 2,
    Custom: 3
}

Arrangement = {
    Horizontal: 0,
    Vertical: 1,
    CellSnap: 2
}

module.exports = {
    // prefabs: null,
    'create': function (event, info) {
        this.show(info)
        if (!info.json) {
            Editor.Dialog.messageBox({
                title: '错误',
                type: 'error',
                message: '请选择Json文件!'
            })
            return
        }
        const callback = () => {
            this.editPrefab(info.json, info.savePath)
        }

        if (!this.textureMap || !this.fontMap) {
            this.loadResources(info.textureFolder, info.fontFolder, callback)
        }
        else {
            callback()
        }
    },

    loadResources(textureFolder, fontFolder, callback) {
        if (!this.textureMap) {
            this.loadTextures(textureFolder, () => {
                if (!this.fontMap) {
                    this.loadFonts(fontFolder, callback)
                } else if (!callback) {
                    callback()
                }
            })
        }
    },

    loadTextures(folder, callback) {
        Editor.log('开始加载图片资源')
        let self = this
        Editor.assetdb.queryAssets(folder + '/**\/*', "sprite-frame", function (err, results) {
            if (err) {
                throw err
            }
            if (results.length == 0) {
                if (callback) callback()
                return
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

    loadFonts(folder, callback) {
        Editor.log('开始加载字体')
        let self = this
        Editor.assetdb.queryAssets(folder + '/**\/*', "bitmap-font", function (err, results) {
            if (err) {
                throw err
            }
            let count = 0
            results.forEach(function (result, index) {
                self.fontMap = {}
                cc.AssetLibrary.loadAsset(result.uuid, function (error, asset) {
                    let ext = path.extname(result.path)
                    let filename = path.basename(result.path, ext)
                    self.fontMap[filename] = asset
                    count++
                    Editor.log('字体资源加载...' + count + '/' + results.length)
                    if (count === results.length) {
                        Editor.log('字体资源加载完成!')
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
                        node.anchorX = 1
                    } else if (element.pivot.includes('Left')) {
                        node.anchorX = 0
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

                        if (element.spType == "Filled") {
                            spr.type = cc.Sprite.Type.FILLED
                            if (spr.fillDir === FillDirection.Horizontal) {
                                spr.fillType = cc.Sprite.FillType.HORIZONTAL
                            }
                            if (spr.fillDir === FillDirection.Vertical) {
                                spr.fillType = cc.Sprite.FillType.VERTICAL
                            }
                        }
                    }

                    // 在label设置overflow前设置宽高
                    node.width = element.size.width
                    node.height = element.size.height

                    if (element.type == "UILabel") {
                        let label = node.addComponent(cc.Label)
                        label.string = element.text
                        label.fontSize = element.fontSize
                        label.lineHeight = element.fontSize + element.spacingY
                        if (element.overflow === "ShrinkContent") {
                            label.overflow = cc.Label.Overflow.SHRINK
                        } else if (element.overflow === "ResizeHeight") {
                            label.overflow = cc.Label.Overflow.RESIZE_HEIGHT
                        }
                        if (element.outlineColor) {
                            let outline = node.addComponent(cc.LabelOutline)
                            outline.color = this.hex2color(element.outlineColor)
                            outline.width = element.outlineWidth
                            // 防止描边被切掉
                            label.lineHeight = label.lineHeight + outline.width * 2
                        }

                        if (element.pivot.includes('Top')) {
                            label.verticalAlign = cc.Label.VerticalAlign.TOP
                        } else if (element.pivot.includes('Bottom')) {
                            label.verticalAlign = cc.Label.VerticalAlign.BOTTOM
                        } else {
                            label.verticalAlign = cc.Label.VerticalAlign.CENTER
                        }

                        if (element.pivot.includes('Right')) {
                            label.horizontalAlign = cc.Label.HorizontalAlign.RIGHT
                        } else if (element.pivot.includes('Left')) {
                            label.horizontalAlign = cc.Label.HorizontalAlign.LEFT
                        } else {
                            label.horizontalAlign = cc.Label.HorizontalAlign.CENTER
                        }

                        if (element.bitmapFont) {
                            label.spacingX = element.spacingX
                            label.font = this.fontMap[element.bitmapFont]
                        }
                    }

                    if (element.type == "UIWidget") node.addComponent(cc.Widget)
                });
            }

            if (info.button) node.addComponent(cc.Button)

            if (info.scrollView) {
                let sv = node.addComponent(cc.ScrollView)
                if (sv.movement === Movement.Horizontal) {
                    sv.horizontal = true
                } else if (sv.movement === Movement.Horizontal) {
                    sv.vertical = true
                }

                // 使上对齐
                node.anchorY = 1
                node.width = info.scrollView.size.x
                node.height = info.scrollView.size.y
                info.pos.x += info.scrollView.offset.x
                info.pos.y += info.scrollView.offset.y + node.height / 2

                // 添加遮罩子节点
                let mask = new cc.Node('mask')
                mask.addComponent(cc.Mask)
                mask.setParent(node)
                mask.width = node.width
                mask.height = node.height
                mask.anchorY = 1
                mask.position = cc.Vec2.ZERO
            }

            if (info.grid) {
                let layout = node.addComponent(cc.Layout)
                layout.resizeMode = cc.Layout.ResizeMode.CONTAINER
                if (info.grid.arrangement === Arrangement.Horizontal) {
                    layout.type = cc.Layout.Type.HORIZONTAL
                } else if (info.grid.arrangement === Arrangement.Vertical) {
                    layout.type = cc.Layout.Type.VERTICAL
                }
                // 如果是scroll view的内容
                if (node.parent.name == 'mask') {
                    info.pos.x = 0
                    info.pos.y = 0
                    node.width = node.parent.width
                    node.anchorY = 1
                    let sv = node.parent.parent.getComponent(cc.ScrollView)
                    if (sv) {
                        sv.content = node
                    }
                }
            }

            if (info.children) {
                // 如果是ScrollView 子节点添加到mask下
                let childsParent = info.scrollView ? node.children[0] : node

                info.children.sort((a, b) => {
                    let aDepth = a.components ? a.components[0].depth : info.children.indexOf(a)
                    let bDepth = b.components ? b.components[0].depth : info.children.indexOf(b)
                    return aDepth - bDepth
                })
                info.children.forEach(child => {
                    let childNode = new cc.Node(child.name)
                    childNode.setParent(childsParent)
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

    // main.js中可以打印出完整结构
    show(any) {
        Editor.Ipc.sendToMain('prefab-creator:show', any)
    }
};