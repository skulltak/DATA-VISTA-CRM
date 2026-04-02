using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using NexCrm.Api.Data;
using NexCrm.Api.Models;

namespace NexCrm.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactsController : ControllerBase
{
    private readonly IMongoCollection<Contact> _contacts;

    public ContactsController(MongoDbContext db)
    {
        _contacts = db.Contacts;
    }

    [HttpGet]
    public async Task<IActionResult> GetContacts(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        FilterDefinition<Contact> filter = Builders<Contact>.Filter.Empty;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            filter = Builders<Contact>.Filter.Or(
                Builders<Contact>.Filter.Regex(c => c.Name,    new MongoDB.Bson.BsonRegularExpression(s, "i")),
                Builders<Contact>.Filter.Regex(c => c.Email,   new MongoDB.Bson.BsonRegularExpression(s, "i")),
                Builders<Contact>.Filter.Regex(c => c.Company, new MongoDB.Bson.BsonRegularExpression(s, "i"))
            );
        }

        var total = await _contacts.CountDocumentsAsync(filter);
        var items = await _contacts.Find(filter)
            .SortBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        Response.Headers.Append("X-Total-Count", total.ToString());
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetContact(string id)
    {
        var contact = await _contacts.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (contact == null) return NotFound();
        return Ok(contact);
    }

    [HttpPost]
    public async Task<IActionResult> CreateContact(Contact contact)
    {
        contact.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        await _contacts.InsertOneAsync(contact);
        return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, contact);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateContact(string id, Contact contact)
    {
        contact.Id = id;
        var result = await _contacts.ReplaceOneAsync(c => c.Id == id, contact);
        if (result.MatchedCount == 0) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteContact(string id)
    {
        var result = await _contacts.DeleteOneAsync(c => c.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }
}
