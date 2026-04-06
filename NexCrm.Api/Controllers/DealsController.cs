using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using NexCrm.Api.Data;
using NexCrm.Api.Models;

namespace NexCrm.Api.Controllers;

[Authorize]
    [ApiController]
[Route("api/[controller]")]
public class DealsController : ControllerBase
{
    private readonly IMongoCollection<Deal> _deals;

    public DealsController(MongoDbContext db)
    {
        _deals = db.Deals;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Deal>>> GetDeals()
    {
        var deals = await _deals.Find(_ => true).ToListAsync();
        return Ok(deals);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDeal(string id)
    {
        var deal = await _deals.Find(d => d.Id == id).FirstOrDefaultAsync();
        if (deal == null) return NotFound();
        return Ok(deal);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDeal(Deal deal)
    {
        deal.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        await _deals.InsertOneAsync(deal);
        return CreatedAtAction(nameof(GetDeal), new { id = deal.Id }, deal);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDeal(string id, Deal deal)
    {
        deal.Id = id;
        var result = await _deals.ReplaceOneAsync(d => d.Id == id, deal);
        if (result.MatchedCount == 0) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDeal(string id)
    {
        var result = await _deals.DeleteOneAsync(d => d.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }
}

