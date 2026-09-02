using FluentValidation;
using Loom.Application.DTO;

namespace Loom.Application.Validator;

public class SendGiftDtoValidator : AbstractValidator<SendGiftDto>
{
    public SendGiftDtoValidator()
    {
        RuleFor(x => x.GiftId).GreaterThan(0);
        RuleFor(x => x.ReceiverId).GreaterThan(0);
    }
}
public class PurchaseStarsDtoValidator : AbstractValidator<PurchaseStarsDto>
{
    public PurchaseStarsDtoValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0);
    }
}