using AutoMapper;
using FluentAssertions;
using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Service;
using Loom.Domain.Entities.Chats;
using Loom.Domain.Entities.Stars;
using Loom.Domain.Entities.Users;
using Moq;
using Xunit;

namespace Loom.Tests;

public class GiftServiceTests
{
    private readonly Mock<IGiftRepository> _giftRepo = new();
    private readonly Mock<IStarRepository> _starRepo = new();
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly Mock<IChatRepository> _chatRepo = new();
    private readonly Mock<IMessageRepository> _messageRepo = new();
    private readonly Mock<IChatNotifier> _notifier = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly GiftService _sut;

    public GiftServiceTests()
    {
        _mapper.Setup(m => m.Map<GiftInstanceDto>(It.IsAny<GiftInstance>()))
               .Returns(new GiftInstanceDto());
        _mapper.Setup(m => m.Map<MessageResponseDto>(It.IsAny<Message>()))
               .Returns(new MessageResponseDto());

        _sut = new GiftService(
            giftRepository: _giftRepo.Object,
            starRepository: _starRepo.Object,
            userRepository: _userRepo.Object,
            chatRepository: _chatRepo.Object,
            messageRepository: _messageRepo.Object,
            notifier: _notifier.Object,
            unitOfWork: _uow.Object,
            mapper: _mapper.Object);
    }

    [Fact]
    public async Task SendGift_EnoughStars_DeductsAndCreatesInstance()
    {
        var gift = new Gift { Id = 1, Name = "Rose", StarCost = 200, IsActive = true };
        var sender = new User { Id = 1, StarBalance = 1000 };
        var receiver = new User { Id = 2, StarBalance = 0 };

        _giftRepo.Setup(r => r.GetGiftByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(gift);
        _userRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sender);
        _userRepo.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(receiver);
        // Direct-чат уже існує (щоб не йшло у створення)
        _chatRepo.Setup(r => r.GetDirectChatAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new Chat { Id = 1 });

        var dto = new SendGiftDto { GiftId = 1, ReceiverId = 2 };
        await _sut.SendGift(1, dto, CancellationToken.None);

        sender.StarBalance.Should().Be(800);
        _giftRepo.Verify(r => r.AddGiftInstanceAsync(It.IsAny<GiftInstance>(), It.IsAny<CancellationToken>()), Times.Once);
        _starRepo.Verify(r => r.AddTransactionAsync(It.IsAny<StarTransaction>(), It.IsAny<CancellationToken>()), Times.Once);
        _messageRepo.Verify(r => r.CreateAsync(It.IsAny<Message>(), It.IsAny<CancellationToken>()), Times.Once);
        _notifier.Verify(n => n.MessageSent(It.IsAny<int>(), It.IsAny<MessageResponseDto>()), Times.Once);
        _uow.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
    [Fact]
    public async Task SendGift_NotEnoughStars_Throws()
    {
        var gift = new Gift { Id = 1, Name = "Rose", StarCost = 200, IsActive = true };
        var sender = new User { Id = 1, StarBalance = 100 };

        _giftRepo.Setup(r => r.GetGiftByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(gift);
        _userRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(sender);

        var dto = new SendGiftDto { GiftId = 1, ReceiverId = 2 };
        var act = () => _sut.SendGift(1, dto, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*stars*");
        sender.StarBalance.Should().Be(100);
    }
    [Fact]
    public async Task SendGift_GiftNotFound_Throws()
    {
        _giftRepo.Setup(r => r.GetGiftByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((Gift?)null);

        var dto = new SendGiftDto { GiftId = 999, ReceiverId = 2 };
        var act = () => _sut.SendGift(1, dto, CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}