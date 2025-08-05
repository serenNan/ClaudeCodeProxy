namespace ClaudeCodeProxy.Host.Models;

public class InvitationRecordDto
{
    public Guid Id { get; set; }
    public string InvitedUsername { get; set; } = string.Empty;
    public string InvitedEmail { get; set; } = string.Empty;
    public DateTime InvitedAt { get; set; }
    public decimal InviterReward { get; set; }
    public decimal InvitedReward { get; set; }
    public bool RewardProcessed { get; set; }
    public string? Notes { get; set; }
}

public class InvitationStatsDto
{
    public int TotalInvited { get; set; }
    public int MaxInvitations { get; set; }
    public decimal TotalReward { get; set; }
    public string InvitationLink { get; set; } = string.Empty;
}

public class UpdateInvitationSettingsRequest
{
    public decimal InviterReward { get; set; }
    public decimal InvitedReward { get; set; }
    public int MaxInvitations { get; set; }
    public bool InvitationEnabled { get; set; }
}