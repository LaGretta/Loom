using AutoMapper;
using FluentAssertions;
using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Security;
using Loom.Application.Service;
using Loom.Domain.Entities.Users;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace Loom.Tests;

public class AuthServiceTests
{
    private readonly Mock<IAuthRepository> _authRepo = new();
    private readonly Mock<IPasswordHasher> _hasher = new();
    private readonly Mock<IJwtTokenGenerator> _jwt = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly Mock<IConfiguration> _config = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _jwt.Setup(j => j.GenerateAccessToken(It.IsAny<User>())).Returns("access");
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("refresh");
        _config.Setup(c => c["Jwt:RefreshTokenDays"]).Returns("30");
        _mapper.Setup(m => m.Map<AuthResponseDto>(It.IsAny<User>())).Returns(new AuthResponseDto());

        _sut = new AuthService(
            _authRepo.Object, _hasher.Object, _jwt.Object,
            _uow.Object, _mapper.Object, _config.Object);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Throws()
    {
        _authRepo.Setup(r => r.ExistsByEmailAsync("a@a.com", It.IsAny<CancellationToken>()))
                 .ReturnsAsync(true);

        var dto = new RegisterDto { UserName = "sasha", DisplayName = "Sasha", Email = "a@a.com", Password = "123456" };
        var act = () => _sut.Register(dto, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Email*");
    }

    [Fact]
    public async Task Register_DuplicateUserName_Throws()
    {
        _authRepo.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(false);
        _authRepo.Setup(r => r.ExistsByUserNameAsync("sasha", It.IsAny<CancellationToken>()))
                 .ReturnsAsync(true);

        var dto = new RegisterDto { UserName = "sasha", DisplayName = "Sasha", Email = "a@a.com", Password = "123456" };
        var act = () => _sut.Register(dto, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Username*");
    }

    [Fact]
    public async Task Register_Valid_ReturnsTokens()
    {
        _authRepo.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _authRepo.Setup(r => r.ExistsByUserNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _hasher.Setup(h => h.Hash("123456")).Returns("hashed");

        var dto = new RegisterDto { UserName = "sasha", DisplayName = "Sasha", Email = "a@a.com", Password = "123456" };
        var result = await _sut.Register(dto, CancellationToken.None);

        result.AccessToken.Should().Be("access");
        result.RefreshToken.Should().Be("refresh");
        _authRepo.Verify(r => r.AddUserAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Login_WrongPassword_Throws()
    {
        var user = new User { Email = "a@a.com", PasswordHash = "hashed" };
        _authRepo.Setup(r => r.GetUserByEmailAsync("a@a.com", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _hasher.Setup(h => h.Verify("wrong", "hashed")).Returns(false);

        var dto = new LoginDto { Email = "a@a.com", Password = "wrong" };
        var act = () => _sut.Login(dto, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Login_UserNotFound_Throws()
    {
        _authRepo.Setup(r => r.GetUserByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((User?)null);

        var dto = new LoginDto { Email = "x@x.com", Password = "123" };
        var act = () => _sut.Login(dto, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}