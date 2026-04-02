using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using NexCrm.Api.Data;

namespace NexCrm.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly MongoDbContext _db;

    public HealthController(MongoDbContext db)
    {
        _db = db;
    }

    [HttpGet("db")]
    public async Task<IActionResult> CheckDb()
    {
        try
        {
            // Ping the database to verify the connection is active
            var isAlive = await _db.ImportedFiles.Database.RunCommandAsync((Command<BsonDocument>)"{ping:1}");
            return Ok(new { status = "connected" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { status = "disconnected", error = ex.Message, detail = ex.ToString() });
        }
    }
}
