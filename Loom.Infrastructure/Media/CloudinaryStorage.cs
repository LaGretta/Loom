using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Loom.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Loom.Infrastructure.Media;

public class CloudinaryStorage : IMediaStorage
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryStorage(IConfiguration config)
    {
        var account = new Account(
            config["Cloudinary:CloudName"],
            config["Cloudinary:ApiKey"],
            config["Cloudinary:ApiSecret"]);
        _cloudinary = new Cloudinary(account);
    }
    public async Task<string> UploadImageAsync(Stream fileStream, string fileName, CancellationToken ct)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream)
        };
        var result = await _cloudinary.UploadAsync(uploadParams, ct);
        return result.SecureUrl.ToString();
    }
}