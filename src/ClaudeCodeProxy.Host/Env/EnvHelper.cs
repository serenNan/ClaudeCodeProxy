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

    // 用户初始余额配置
    private static decimal _initialUserBalance = 0m;
    public static decimal InitialUserBalance => _initialUserBalance;

    // 邀请奖励配置
    private static decimal _inviterReward = 10.0m;
    public static decimal InviterReward => _inviterReward;

    private static decimal _invitedReward = 5.0m;
    public static decimal InvitedReward => _invitedReward;

    private static int _maxInvitations = 10;
    public static int MaxInvitations => _maxInvitations;

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

        // 初始化用户余额配置
        var initialBalance = configuration["INITIAL_USER_BALANCE"];
        if (!string.IsNullOrEmpty(initialBalance) && decimal.TryParse(initialBalance, out var balance))
        {
            _initialUserBalance = balance;
        }

        // 初始化邀请奖励配置
        var inviterReward = configuration["INVITER_REWARD"];
        if (!string.IsNullOrEmpty(inviterReward) && decimal.TryParse(inviterReward, out var invReward))
        {
            _inviterReward = invReward;
        }

        var invitedReward = configuration["INVITED_REWARD"];
        if (!string.IsNullOrEmpty(invitedReward) && decimal.TryParse(invitedReward, out var invedReward))
        {
            _invitedReward = invedReward;
        }

        var maxInvitations = configuration["MAX_INVITATIONS"];
        if (!string.IsNullOrEmpty(maxInvitations) && int.TryParse(maxInvitations, out var maxInv))
        {
            _maxInvitations = maxInv;
        }
    }
}