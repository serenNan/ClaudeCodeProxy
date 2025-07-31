namespace ClaudeCodeProxy.Host.Models;

public class ExchangeCodeInput
{
    public string SessionId { get; set; }

    public string? AuthorizationCode { get; set; }

    public string? CallbackUrl { get; set; }
}