using System.Text.Json.Serialization;
using Thor.Abstractions.Chats.Consts;

namespace Thor.Abstractions.Chats.Dtos;

/// <summary>
///     工具
/// </summary>
public class ThorToolChoice
{
    /// <summary>
    ///     "none" 表示模型不会调用任何工具<br />
    ///     "auto" 表示模型可以在生成消息或调用一个或多个工具之间进行选择 <br />
    ///     "required" 表示模型必须调用一个或多个工具 <br />
    ///     "function" 指定特定工具会强制模型调用该工具<br />
    ///     使用<see cref="ThorToolChoiceTypeConst" /> 赋值
    /// </summary>
    [JsonPropertyName("type")]
    public string Type { get; set; }

    /// <summary>
    ///     调用的函数定义
    /// </summary>
    [JsonPropertyName("function")]
    public ThorToolChoiceFunctionTool? Function { get; set; }

    /// <summary>
    ///     表示模型不会调用任何工具
    /// </summary>
    public static ThorToolChoice GetNone()
    {
        return new ThorToolChoice { Type = ThorToolChoiceTypeConst.None };
    }

    /// <summary>
    ///     表示模型可以在生成消息或调用一个或多个工具之间进行选择
    /// </summary>
    public static ThorToolChoice GetAuto()
    {
        return new ThorToolChoice { Type = ThorToolChoiceTypeConst.Auto };
    }

    /// <summary>
    ///     表示模型必须调用一个或多个工具
    /// </summary>
    public static ThorToolChoice GetRequired()
    {
        return new ThorToolChoice { Type = ThorToolChoiceTypeConst.Required };
    }

    /// <summary>
    ///     指定特定工具会强制模型调用该工具
    /// </summary>
    /// <param name="functionName">函数名</param>
    /// <returns></returns>
    public static ThorToolChoice GetFunction(string functionName)
    {
        return new ThorToolChoice
        {
            Type = ThorToolChoiceTypeConst.Function,
            Function = new ThorToolChoiceFunctionTool
            {
                Name = functionName
            }
        };
    }
}