namespace ClaudeCodeProxy.Host.Env;

public class EnvHelper
{
    private static string _userName;

    /// <summary>
    /// 默认账号密码
    /// </summary>
    /// <returns></returns>
    public static string UserName => _userName;

    private static string _password;

    /// <summary>
    /// 默认账号密码
    /// </summary>
    public static string Password => _password;

    private static string _ApiVersion = "2023-06-01";

    public static string ApiVersion => _ApiVersion;

    private static string _betaHeader;
    
    public static string BetaHeader => _betaHeader;

    public static void Initialize(IConfiguration configuration)
    {
        var apiVersion = configuration["API_VERSION"];
        if (!string.IsNullOrEmpty(apiVersion))
        {
            _ApiVersion = apiVersion;
        }
        
        _betaHeader = configuration["BETA_HEADER"] ?? "oauth-2025-04-20";

        var userName = configuration["USER_NAME"];
        var password = configuration["PASSWORD"];
        if (!string.IsNullOrEmpty(userName))
        {
            if (string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("Password cannot be empty when UserName is provided.");
            }

            _userName = userName;
            _password = password;
        }
        else
        {
            // 提供默认的账号密码
            _userName = "admin";
            _password = "admin123";
        }
    }
}