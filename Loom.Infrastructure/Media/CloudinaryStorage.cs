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

    public async Task<string> UploadAsync(Stream fileStream, string fileName, CancellationToken ct)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var isImage = ext is ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" or ".bmp" or ".svg";

        if (isImage)
        {
            var imageParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, fileStream)
            };
            var imageResult = await _cloudinary.UploadAsync(imageParams, ct);
            return imageResult.SecureUrl.ToString();
        }

        // аудіо, відео та решта — Cloudinary обробляє їх як video-ресурс
        var videoParams = new VideoUploadParams
        {
            File = new FileDescription(fileName, fileStream)
        };
        var videoResult = await _cloudinary.UploadAsync(videoParams, ct);
        return videoResult.SecureUrl.ToString();
    }
}