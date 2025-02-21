# Survivalcraft Content Toolkit 生存战争内容工具箱

A toolkit for assisting in the editing of content files for Survivalcraft game, including database (.xdb), clothes (.clo) and widgets (or screens, dialogs). Still in development.  
用于辅助编辑生存战争游戏的内容文件的工具箱，包括数据库(.xdb)、衣服(.clo)和部件(Widget、Screen、Dialog)。持续开发中。

## Features 功能

### Database 数据库

* **Diagnostics in real-time**: This toolkit will diagnotize the database files and indicate below issues in real-time.  
  **实时诊断**：此工具箱会实时对数据库文件进行诊断，并提示以下问题
  * Duplicated GUIDs 重复的识别码
  * InheritanceParents without definition 没有定义的继承码
  * Invalid InheritanceParents 无效的继承码

> **NOTE 说明**  
> A GUID in the tag with `new-Value` attribute will be considered as a InheritanceParent.  
> 含有`new-Value`属性的标签中的识别码将被视为继承码

* **View the definition of InheritanceParents**: Hover cursor on an InheritanceParent, or right click it and then clik `Go to Definition`.  
  **查看继承码的定义 (InheritanceParent)**：将鼠标悬停在一个InheritanceParent上，或者右键点击它，然后点击`转到定义`
* **View the references of GUIDs**: Hover cursor on a GUID, or right click it and then clik `Find All References`.  
  **查看 GUID 的引用**：将鼠标悬停在一个识别码 (GUID) 上，或者右键点击它，然后点击`查找所有引用`
* **Insert a random GUID**: You can add a random GUID by two ways: typing `guid` and hit the return key, or right-clicking in the editor and clicking `Insert a random GUID`.  
  **插入一个随机 GUID**：你可以按以下两种方式添加一个随机 GUID：输入`guid`并按回车键，或者在编辑器中右键，然后点击`插入一个随机 GUID`
* **Insert clipboard with randomized GUIDs**: You can insert clipboard with randomized GUIDs by two ways: right-clicking in the editor and clicking `Insert clipboard with randomized GUIDs`, or clicking the button `Insert clipboard with randomized GUIDs` in title bar.  
  **插入 GUID 随机化的剪贴板**：你可以按以下两种方式插入 GUID 随机化的剪贴板：在编辑器中右键，然后点击`插入 GUID 随机化的剪贴板`，或者点击标题栏上的`插入 GUID 随机化的剪贴板`按钮

#### Usage 使用
For above features to work, please ensure your root element of database file is:  
为了让以上功能能生效，请确保你的数据库文件的根元素是。
```xml
<Mod xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://gitee.com/THPRC/survivalcraft-api/raw/SCAPI1.8/Survivalcraft/Content/Assets/Database.xsd">
```
And you have to add the basic `Database.xml` to the preposed databases by right-clicking on it and clicking `Add this file to SCT preposed databases`.  
同时你还需要将基础的`Database.xml`添加到前置数据库中（右键点击它，然后点击`添加该文件到 SCT 前置数据库中`）

### Widget 部件

For contents like `CenterColor="50, 150, 35"`, there will be a colored square ${{\color{#329623}■}}$ displayed after the `=` sign, indicating the color corresponding to the content.  
在像`CenterColor="50, 150, 35"`这样内容的`=`后面会显示一个带颜色的方块${\color{#329623}■}$，以指示该内容对应的颜色

# Clothes 衣服

Only suggests to set the root element as  
仅提示设置根元素为
```xml
<Mod xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://gitee.com/THPRC/survivalcraft-api/raw/SCAPI1.8/Survivalcraft/Content/Assets/Clothes.xsd">
```

### Common 一般

After you right-clicking on a json language file and adding it to the preposed language files, you can hover over contents like `"[MainMenuScreen:2]"`, and it will display the corresponding string `Play` and its language `(English)`.  
当你通过右键把 json 格式的语言文件添加到前置语言文件后，你可以把鼠标悬停在像`"[MainMenuScreen:2]"`这样的内容上，将像这样显示其对应的字符串`游戏`以及其语言`(中文)`

## Requirements 要求

Need installing belows before using:  
使用前需要安装以下内容

* [Visual Studio Code](https://code.visualstudio.com)
* [XML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-xml) extension for Visual Studio Code