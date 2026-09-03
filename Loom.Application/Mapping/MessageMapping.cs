using AutoMapper;
using Loom.Application.DTO;
using Loom.Domain.Entities;
using Loom.Domain.Entities.Chats;

namespace Loom.Application.Mapping;

public class MessageMapping : Profile
{
    public MessageMapping()
    {
        CreateMap<Message, MessageResponseDto>()
            .ForMember(d => d.SenderName, o => 
                o.MapFrom(s => s.Sender.DisplayName))
            .ForMember(d => d.SenderAvatarUrl, o => 
                o.MapFrom(s => s.Sender.AvatarUrl));
        CreateMap<Attachment, AttachmentDto>();
    }
}