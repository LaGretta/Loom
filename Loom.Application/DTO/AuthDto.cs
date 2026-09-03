namespace Loom.Application.DTO;

public class RegisterDto
{
    public string UserName { get; set; } = string.Empty;  
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;       
    public string Password { get; set; } = string.Empty;
}
public class LoginDto
{
    public string Email { get; set; } = string.Empty;       
    public string Password { get; set; } = string.Empty;
}
public class AuthResponseDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}