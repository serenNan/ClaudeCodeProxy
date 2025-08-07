namespace ClaudeCodeProxy.Domain;

public class Announcement : Entity<long>
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsVisible { get; set; } = true;
    public string? BackgroundColor { get; set; } = "bg-blue-50";
    public string? TextColor { get; set; } = "text-blue-800";
    public int Priority { get; set; } = 0;
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}