using AutoMapper;
using FluentAssertions;
using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Service;
using Loom.Domain.Entities.Chats;
using Moq;
using Xunit;

namespace Loom.Tests;

public class MessageServiceTests
{
    private readonly Mock<IMessageRepository> _messageRepo = new();
    private readonly Mock<IChatRepository> _chatRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly Mock<IChatNotifier> _notifier = new();
    private readonly MessageService _sut;

    public MessageServiceTests()
    {
        _sut = new MessageService(
            messageRepo: _messageRepo.Object,
            chatRepo: _chatRepo.Object,
            unitOfWork: _uow.Object,
            mapper: _mapper.Object,
            notifier: _notifier.Object);
    }

    [Fact]
    public async Task SendMessage_NotMember_ThrowsUnauthorized()
    {
        _chatRepo.Setup(r => r.IsMemberAsync(5, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);  
        var dto = new SendMessageDto { ChatId = 5, Content = "hi" };
        var act = () => _sut.SendMessage(1, dto, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task EditMessage_NotOwner_ThrowsUnauthorized()
    {
        var message = new Message { Id = 10, SenderId = 999, ChatId = 5 };   
        _messageRepo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(message);

        var dto = new EditMessageDto { MessageId = 10, Content = "edited" };
        var act = () => _sut.EditMessage(1, dto, CancellationToken.None);   

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}