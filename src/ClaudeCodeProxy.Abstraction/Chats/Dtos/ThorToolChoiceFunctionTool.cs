using System.Text.Json.Serialization;

namespace Thor.Abstractions.Chats.Dtos;

public class ThorToolChoiceFunctionTool
{
    [JsonPropertyName("name")] public string Name { get; set; }
}