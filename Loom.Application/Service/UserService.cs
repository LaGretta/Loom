using AutoMapper;
using Loom.Application.DTO;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Security;
using Loom.Application.Interfaces.Service;

namespace Loom.Application.Service;

public class UserService : IUserService
{
    private readonly IMapper _mapper;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UserService(
          IMapper mapper
        , IUserRepository userRepository
        , IUnitOfWork unitOfWork)
    {
        _mapper = mapper;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<UserProfileDto> GetMyProfile(int userid, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(userid, ct);
        if (user == null)
            throw new KeyNotFoundException("User not found");
        return _mapper.Map<UserProfileDto>(user);
    }

    public async Task<UserProfileDto> GetProfile(int targetUserId, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(targetUserId, ct);
        if (user == null)
            throw new KeyNotFoundException("User not found");
        return _mapper.Map<UserProfileDto>(user);
    }

    public async Task<UserProfileDto> UpdateProfile(int userid, UpdateProfileDto  dto, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(userid, ct);
        if (user == null)
            throw new KeyNotFoundException("User not found");
        user.DisplayName = dto.DisplayName;
        user.Bio = dto.Bio;
        await _unitOfWork.SaveChangesAsync(ct);
        return _mapper.Map<UserProfileDto>(user);
    }

    public async Task<List<UserSummaryDto>> Search(int userid, string query, CancellationToken ct)
    {
        var users = await _userRepository.SearchAsync(query, ct);
        return _mapper.Map<List<UserSummaryDto>>(users);
    }
}