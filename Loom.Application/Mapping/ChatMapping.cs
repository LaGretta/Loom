using AutoMapper;
using Loom.Application.DTO;
using Loom.Domain.Entities;

namespace Loom.Application.Mapping;

public class ChatMapping : Profile
{
    public ChatMapping()
    {
        CreateMap<Chat, ChatResponseDto>();
        CreateMap<ChatMember , ChatMemberDto>()
            .ForMember(n => n.UserName ,  opt => 
                opt.MapFrom(s => s.User.UserName))
            .ForMember(n => n.DisplayName, opt => 
                opt.MapFrom(s => s.User.DisplayName))
            .ForMember(d => d.AvatarUrl, o => 
                o.MapFrom(s => s.User.AvatarUrl))
            .ForMember(d => d.Status, o => 
                o.MapFrom(s => s.User.Status));
    } 
}