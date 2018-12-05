# 插件说明
需求将Unity项目移植到CocosCreator(H5). 如果UI全部重拼一遍太费时费力. 故抽出时间写了这个扩展. 用于Unity NGUI制作的UI prefab移植到Cocos Creator.

NGUI版本: 3.8.2<br>
CocosCreator版本: 1.9.0

暂时没精力顾及其他版本, 只用到一些基础方法, 如果有API变动请自行修改.

# 工作原理
将Unity中prefab的节点父子结构, 以及节点上NGUI的UISprite, UILabel, UITexture等控件的有用信息保存至json文件. 在CocosCreator中解析后再创建.

目前可移植项:
> * 节点: position, scale, rotation(仅z轴), active, name
> * UIWidget: 锚点信息, 宽高, 颜色
> * UISprite, UITexture: 图集, 图片, 是否使用Slice, 九宫格Border信息
> * UILabel: 字号, 描边颜色宽度, overflow, 对齐方式, 行间距
> * 带有BoxCollider的节点会被挂载UIButton

可以覆盖大部分需求.

# 使用方法
1. 将 **Unity** 文件夹内文件放至Unity工程内. 在Prefab上右键导出Json文件.
2. 将 **prefab-creator** 文件夹放至CocosCreator工程packages目录下. 在扩展菜单中选择 **Prefab生成工具** 打开扩展窗口. 配置导出路径以及图片文件夹. 图片文件夹内放入需要的资源, 支持图集和散图, **图集文件名/图集内图片文件名/散图文件名要与Unity端一致!!!**. 之后拖入第一步导出的Json文件, 点生成即可. 
3. 首次创建时需要加载文件夹内的所有图片, 根据图片数量可能需要较长时间. 所以建议移除文件夹内的无用图片资源.

# 效果预览
![](https://github.com/glegoo/ngui-cocos-creator-convertor/blob/master/example.gif?raw=true)

## 领个红包支持一下吧:moneybag:
![](https://github.com/glegoo/ngui-cocos-creator-convertor/blob/master/hmj.png?raw=true)