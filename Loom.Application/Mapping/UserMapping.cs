using AutoMapper;
using Loom.Application.DTO;
using Loom.Domain.Entities;

namespace Loom.Application.Mapping;

public class UserMapping : Profile
{
    public UserMapping()
    {
        CreateMap<User, UserProfileDto>();
        CreateMap<User, UserSummaryDto>();
    }
}