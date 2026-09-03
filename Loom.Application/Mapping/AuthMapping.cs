using AutoMapper;
using Loom.Application.DTO;
using Loom.Domain.Entities;
using Loom.Domain.Entities.Users;

namespace Loom.Application.Mapping;

public class AuthMapping : Profile
{
    public AuthMapping()
    {
        CreateMap<User, AuthResponseDto>();
    }
}