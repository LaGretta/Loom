using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Loom.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Loom.Infrastructure.Media;

public class CloudinaryStorage : IMediaStorage
{
    private static readonly string[] ImageExtensions =
        { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg" };

    private static readonly string[] MediaExtensions =
        { ".webm", ".mp3", ".m4a", ".ogg", ".wav", ".aac", ".mp4", ".mov", ".avi", ".mkv" };

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

        if (ImageExtensions.Contains(ext))
        {
            var imageParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, fileStream)
            };
            var imageResult = await _cloudinary.UploadAsync(imageParams, ct);
            return imageResult.SecureUrl.ToString();
        }

        if (MediaExtensions.Contains(ext))
        {
            // Cloudinary handles audio under the video resource type as well.
            var videoParams = new VideoUploadParams
            {
                File = new FileDescription(fileName, fileStream)
            };
            var videoResult = await _cloudinary.UploadAsync(videoParams, ct);
            return videoResult.SecureUrl.ToString();
        }
        
        
        var rawParams = new RawUploadParams
        {
            File = new FileDescription(fileName, fileStream)
        };
        var rawResult = await _cloudinary.UploadAsync(rawParams, "raw", ct);
        return rawResult.SecureUrl.ToString();
    }
}
