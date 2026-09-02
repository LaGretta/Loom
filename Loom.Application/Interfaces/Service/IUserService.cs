using Loom.Application.DTO;

namespace Loom.Application.Interfaces.Service;

public interface IUserService
{
    Task<UserProfileDto> GetMyProfile(int userid , CancellationToken ct);
    Task<UserProfileDto> GetProfile(int targetUserId, CancellationToken ct);
    Task<UserProfileDto> UpdateProfile(int userid ,UserProfileDto dto, CancellationToken ct);
    Task<List<UserSummaryDto>> Search(int userid , string query, CancellationToken ct);
}