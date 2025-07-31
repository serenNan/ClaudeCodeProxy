namespace ClaudeCodeProxy.Host.Models;

public class GenerateAuthUrlResult
{
    public string SessionId { get; set; }

    public string AuthUrl { get; set; }

    public string[] Instructions { get; set; }
}