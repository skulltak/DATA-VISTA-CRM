using MongoDB.Driver;
using NexCrm.Api.Models;

namespace NexCrm.Api.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _db;

    public MongoDbContext(IConfiguration configuration, ILogger<MongoDbContext> logger)
    {
        var envVar = Environment.GetEnvironmentVariable("MONGODB_URI");
        var connectionString = !string.IsNullOrEmpty(envVar) ? envVar : configuration.GetConnectionString("MongoDB");

        if (string.IsNullOrEmpty(connectionString))
        {
            logger.LogCritical("MongoDB Connection String is missing!");
            throw new Exception("MongoDB Connection String is missing. Set 'MONGODB_URI' env var or 'ConnectionStrings:MongoDB'.");
        }

        logger.LogWarning("Connecting to MongoDB using: {Source}", !string.IsNullOrEmpty(envVar) ? "Environment Variable (MONGODB_URI)" : "appsettings.json");
        
        var client = new MongoClient(connectionString);
        _db = client.GetDatabase("NexCrmDb");
    }

    public IMongoCollection<Contact> Contacts =>
        _db.GetCollection<Contact>("contacts");

    public IMongoCollection<Deal> Deals =>
        _db.GetCollection<Deal>("deals");

    public IMongoCollection<ImportedFile> ImportedFiles =>
        _db.GetCollection<ImportedFile>("importedFiles");

    public IMongoCollection<ImportedRecord> ImportedRecords =>
        _db.GetCollection<ImportedRecord>("importedRecords");

    public IMongoCollection<VoyagerFile> VoyagerFiles =>
        _db.GetCollection<VoyagerFile>("voyagerFiles");
}
