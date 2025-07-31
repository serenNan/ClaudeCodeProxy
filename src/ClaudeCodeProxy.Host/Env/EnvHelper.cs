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

    public static void Initialize(IConfiguration configuration)
    {
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