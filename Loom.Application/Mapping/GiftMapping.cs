using AutoMapper;
using Loom.Application.DTO;
using Loom.Domain.Entities;

namespace Loom.Application.Mapping;

public class GiftMapping : Profile
{
    public GiftMapping()
    {
        CreateMap<Gift, GiftDto>();
        CreateMap<GiftInstance, GiftInstanceDto>()
            .ForMember(d => d.GiftName, o => 
                o.MapFrom(s => s.Gift.Name))
            .ForMember(d => d.GiftImageUrl, o => 
                o.MapFrom(s => s.Gift.ImageUrl))
            .ForMember(d => d.SenderName, o => 
                o.MapFrom(s => s.Sender.DisplayName));
        CreateMap<StarTransaction, StarTransactionDto>();
    }
}