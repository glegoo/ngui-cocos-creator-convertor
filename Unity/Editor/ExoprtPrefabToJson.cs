using UnityEditor;
using UnityEngine;
using System.IO;
using System.Collections;
using System.Collections.Generic;
using LitJson;

public class ExportPrefabToJson : Editor
{
    delegate bool Filter(Component component);

    [MenuItem("Assets/Export To Json")]
    static void ExportSelect()
    {
        if (Selection.objects != null)
        {
            Object[] prefabs = Selection.GetFiltered(typeof(GameObject), SelectionMode.TopLevel);
            if (prefabs != null)
            {

                // string outPath = Application.dataPath + "/../../../../../TulongQPProject/Assets/Tlqp/Lua/View";
                string savePath = EditorUtility.SaveFolderPanel("选择导出位置", null, "");
                if (!string.IsNullOrEmpty(savePath))
                {
                    foreach (Object obj in prefabs)
                    {
                        ExportJson(obj as GameObject, savePath);
                    }
                }
            }
        }
    }

    static void ExportJson(GameObject prefab, string savePath)
    {
        JsonData jd = GetNodeJson(prefab);

        // Debug.Log(JsonMapper.ToJson(jd));
        WriteJsonFile(JsonMapper.ToJson(jd), savePath, prefab.name);
    }

    static JsonData GetNodeJson(GameObject go)
    {
        JsonData node = new JsonData();
        node["name"] = go.name;
        node["pos"] = new JsonData();
        // 保留小数点后两位
        node["pos"]["x"] = System.Math.Round((double)go.transform.localPosition.x, 2);
        node["pos"]["y"] = System.Math.Round((double)go.transform.localPosition.y, 2);
        node["scale"] = new JsonData();
        node["scale"]["x"] = System.Math.Round((double)go.transform.localScale.x, 2);
        node["scale"]["y"] = System.Math.Round((double)go.transform.localScale.y, 2);
        node["rotation"] = System.Math.Round((double)go.transform.localEulerAngles.z, 2);
        node["active"] = go.activeSelf;

        Component[] comps = go.GetComponents<UIWidget>();
        if (comps.Length > 0)
        {
            node["components"] = new JsonData();
            foreach (UIWidget comp in comps)
            {
                JsonData cj = new JsonData();
                cj["type"] = comp.GetType().ToString();
                cj["size"] = new JsonData();
                cj["size"]["width"] = comp.width;
                cj["size"]["height"] = comp.height;
                cj["color"] = ColorUtility.ToHtmlStringRGB(comp.color);

                cj["pivot"] = comp.pivot.ToString();

                if (comp is UILabel)
                {
                    UILabel label = (comp as UILabel);
                    cj["text"] = label.text;
                    cj["fontSize"] = label.fontSize;
                    cj["overflow"] = label.overflowMethod.ToString();
                    if (label.effectStyle == UILabel.Effect.Outline || label.effectStyle == UILabel.Effect.Outline8)
                    {
                        cj["outlineColor"] = ColorUtility.ToHtmlStringRGB(label.effectColor);
                        cj["outlineWidth"] = label.effectiveSpacingX;
                    }
                }

                if (comp is UISprite)
                {
                    UISprite sprite = comp as UISprite;
                    cj["spType"] = sprite.type.ToString();
                    cj["spName"] = sprite.spriteName;
                    if (sprite.atlas)
                    {
                        cj["atlas"] = sprite.atlas.name;
                    }

                    if (sprite.border != Vector4.zero)
                    {
                        cj["border"] = new JsonData();
                        cj["border"]["left"] = sprite.border.x;
                        cj["border"]["right"] = sprite.border.z;
                        cj["border"]["top"] = sprite.border.w;
                        cj["border"]["bottom"] = sprite.border.y;
                        Debug.Log("border: " + sprite.spriteName + " node: " + go.name);
                    }
                }

                if (comp is UITexture)
                {
                    UITexture texture = comp as UITexture;
                    if (texture.mainTexture != null)
                    {
                        cj["spName"] = texture.mainTexture.name;
                        cj["spType"] = texture.type.ToString();
                    }
                }

                node["components"].Add(cj);
            }
        }

        Component[] boxes = go.GetComponents<BoxCollider>();
        if (boxes.Length > 0)
        {
            node["button"] = true;
        }

        if (go.transform.childCount > 0)
        {
            node["children"] = new JsonData();
            for (int i = 0, len = go.transform.childCount; i < len; ++i)
            {
                JsonData child = GetNodeJson(go.transform.GetChild(i).gameObject);
                node["children"].Add(child);
            }
        }

        return node;
    }

    static void WriteJsonFile(string content, string savePath, string name)
    {
        savePath = string.Format("{0}/{1}.json", savePath, name);
        Debug.Log("SavePath: " + savePath);
        if (File.Exists(savePath))
        {
            int option = EditorUtility.DisplayDialogComplex("文件已存在",
                savePath + "已存在, 是否替换?",
                "替换",
                "取消",
                "保留两者");

            switch (option)
            {
                case 0:
                    File.Delete(savePath);
                    break;

                case 1:
                    return;

                case 2:
                    savePath = savePath.Replace(".lua", "_auto.lua");
                    if (File.Exists(savePath))
                        File.Delete(savePath);
                    break;

                default:
                    Debug.LogError("Unrecognized option.");
                    break;
            }
        }

        FileStream fs = new FileStream(savePath, FileMode.Create);
        StreamWriter sw = new StreamWriter(fs);
        sw.Write(content);

        //清空缓冲区
        sw.Flush();
        //关闭流
        sw.Close();
        fs.Close();
    }
}