using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using NexCrm.Api.Data;
using NexCrm.Api.Models;
using System.Text.Json;

namespace NexCrm.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VoyagerController : ControllerBase
{
    private readonly IMongoCollection<VoyagerFile> _files;

    public VoyagerController(MongoDbContext db)
    {
        _files = db.VoyagerFiles;
    }

    [HttpGet]
    public async Task<IActionResult> GetFiles()
    {
        var files = await _files.Find(_ => true).ToListAsync();
        var result = files.Select(f => new {
            id = f.Id,
            name = f.Name,
            size = f.Size,
            uploadDate = f.UploadDate,
            sheets = string.IsNullOrEmpty(f.SheetsJson) ? new object[0] : JsonSerializer.Deserialize<object>(f.SheetsJson)
        });
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetFile(string id)
    {
        var f = await _files.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (f == null) return NotFound();
        return Ok(new {
            id = f.Id,
            name = f.Name,
            size = f.Size,
            uploadDate = f.UploadDate,
            sheets = string.IsNullOrEmpty(f.SheetsJson) ? new object[0] : JsonSerializer.Deserialize<object>(f.SheetsJson)
        });
    }

    [HttpPost]
    public async Task<IActionResult> UploadFile([FromBody] JsonElement payload)
    {
        var name = payload.TryGetProperty("name", out var n) ? n.GetString() : "Unknown";
        var size = payload.TryGetProperty("size", out var s) ? s.GetInt64() : 0;
        var sheetsJson = payload.TryGetProperty("sheets", out var sh) ? sh.GetRawText() : "[]";
        
        var file = new VoyagerFile {
            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            Name = name ?? "Unknown",
            Size = size,
            SheetsJson = sheetsJson
        };
        
        await _files.InsertOneAsync(file);
        return Ok(new {
            id = file.Id,
            name = file.Name,
            size = file.Size,
            uploadDate = file.UploadDate,
            sheets = JsonSerializer.Deserialize<object>(file.SheetsJson)
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFile(string id, [FromBody] JsonElement payload)
    {
        var f = await _files.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (f == null) return NotFound();
        
        if (payload.TryGetProperty("name", out var nameProp)) f.Name = nameProp.GetString() ?? f.Name;
        if (payload.TryGetProperty("size", out var sizeProp)) f.Size = sizeProp.GetInt64();
        if (payload.TryGetProperty("sheets", out var sheetsProp)) f.SheetsJson = sheetsProp.GetRawText();
        
        await _files.ReplaceOneAsync(x => x.Id == id, f);
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFile(string id)
    {
        await _files.DeleteOneAsync(x => x.Id == id);
        return Ok();
    }
}
