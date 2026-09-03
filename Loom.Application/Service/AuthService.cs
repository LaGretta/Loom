using AutoMapper;
using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Security;
using Loom.Application.Interfaces.Service;
using Loom.Domain.Entities;
using Loom.Domain.Entities.Users;
using Loom.Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace Loom.Application.Service;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepo;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenGenerator _jwt;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IConfiguration _config;

    public AuthService(
        IAuthRepository authRepo,
        IPasswordHasher hasher,
        IJwtTokenGenerator jwt,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IConfiguration config)
    {
        _authRepo = authRepo;
        _hasher = hasher;
        _jwt = jwt;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _config = config;
    }

    public async Task<AuthResponseDto> Register(RegisterDto dto, CancellationToken ct)
    {
        if (await _authRepo.ExistsByEmailAsync(dto.Email, ct))
            throw new InvalidOperationException("Email already in use");
        if (await _authRepo.ExistsByUserNameAsync(dto.UserName, ct))
            throw new InvalidOperationException("Username already taken");

        var user = new User
        {
            UserName = dto.UserName,
            DisplayName = dto.DisplayName,
            Email = dto.Email,
            PasswordHash = _hasher.Hash(dto.Password),
            Status = UserStatus.Offline,
            LastSeenAt = DateTime.UtcNow,
            PremiumTier = PremiumTier.None,
            StarBalance = 0,
            CreatedAt = DateTime.UtcNow
        };

        await _authRepo.AddUserAsync(user, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return await BuildAuthResponse(user, ct);
    }

    public async Task<AuthResponseDto> Login(LoginDto dto, CancellationToken ct)
    {
        var user = await _authRepo.GetUserByEmailAsync(dto.Email, ct);
        if (user == null || !_hasher.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials");

        return await BuildAuthResponse(user, ct);
    }

    public async Task<AuthResponseDto> Refresh(string refreshToken, CancellationToken ct)
    {
        var existing = await _authRepo.GetRefreshTokenAsync(refreshToken, ct);
        if (existing == null || !existing.IsActive)
            throw new UnauthorizedAccessException("Invalid refresh token");

        existing.IsRevoked = true;
        await _unitOfWork.SaveChangesAsync(ct);

        return await BuildAuthResponse(existing.User, ct);
    }

    public async Task Logout(string refreshToken, CancellationToken ct)
    {
        var existing = await _authRepo.GetRefreshTokenAsync(refreshToken, ct);
        if (existing != null && !existing.IsRevoked)
        {
            existing.IsRevoked = true;
            await _unitOfWork.SaveChangesAsync(ct);
        }
    }

    private async Task<AuthResponseDto> BuildAuthResponse(User user, CancellationToken ct)
    {
        var accessToken = _jwt.GenerateAccessToken(user);
        var refreshToken = _jwt.GenerateRefreshToken();

        var days = int.Parse(_config["Jwt:RefreshTokenDays"]!);
        await _authRepo.AddRefreshTokenAsync(new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(days),
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var response = _mapper.Map<AuthResponseDto>(user);
        response.AccessToken = accessToken;
        response.RefreshToken = refreshToken;
        return response;
    }
}