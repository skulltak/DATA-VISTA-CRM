using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using NexCrm.Api.Data;
using NexCrm.Api.Models;
using System.Text.Json;

namespace NexCrm.Api.Controllers;

[Authorize]
    [ApiController]
[Route("api/[controller]")]
public class PivotController : ControllerBase
{
    private readonly IMongoCollection<ImportedFile> _files;
    private readonly IMongoCollection<ImportedRecord> _records;

    public PivotController(MongoDbContext db)
    {
        _files = db.ImportedFiles;
        _records = db.ImportedRecords;
    }

    public class ValueConfig
    {
        public string Field { get; set; } = string.Empty;
        public string Type { get; set; } = "sum";
    }

    public class PivotRequest
    {
        public string FileId { get; set; } = string.Empty;
        public List<string> Rows { get; set; } = new();
        public List<string> Columns { get; set; } = new();
        public List<ValueConfig> Values { get; set; } = new();
    }

    [HttpPost("build")]
    public async Task<IActionResult> BuildPivot(PivotRequest request)
    {
        var file = await _files.Find(f => f.Id == request.FileId).FirstOrDefaultAsync();
        if (file == null) return NotFound("File not found.");

        var recordDocs = await _records.Find(r => r.FileId == request.FileId).ToListAsync();

        var records = recordDocs
            .Select(r => JsonSerializer.Deserialize<Dictionary<string, object?>>(r.DataJson))
            .ToList();

        // If no metrics are selected, default to a count of records
        if (!request.Values.Any())
        {
            request.Values.Add(new ValueConfig { Type = "count", Field = "" });
        }

        var result = records
            .GroupBy(r => GetGroupKey(r, request.Rows))
            .Select(g => new
            {
                Key = g.Key,
                Values = request.Columns.Any()
                    ? g.GroupBy(r => GetGroupKey(r, request.Columns))
                        .ToDictionary(
                            cg => cg.Key, 
                            cg => (object?)request.Values.ToDictionary(
                                v => string.IsNullOrEmpty(v.Field) ? v.Type : $"{v.Field} ({v.Type})",
                                v => Aggregate(cg, v.Field, v.Type)
                            )
                        )
                    : new Dictionary<string, object?> { 
                        { "Total", request.Values.ToDictionary(
                            v => string.IsNullOrEmpty(v.Field) ? v.Type : $"{v.Field} ({v.Type})",
                            v => Aggregate(g, v.Field, v.Type)) 
                        } 
                    }
            })
            .ToList();

        return Ok(result);
    }

    private string GetGroupKey(Dictionary<string, object?>? record, List<string> fields)
    {
        if (record == null) return "Unknown";
        return string.Join(" | ", fields.Select(f => record.ContainsKey(f) ? record[f]?.ToString() ?? "N/A" : "N/A"));
    }

    private object? Aggregate(IEnumerable<Dictionary<string, object?>?> group, string? field, string type)
    {
        if (string.IsNullOrEmpty(field)) return group.Count();

        var values = group
            .Where(r => r != null && r.ContainsKey(field) && r[field] != null)
            .Select(r =>
            {
                var val = r![field];
                if (val is JsonElement je && je.ValueKind == JsonValueKind.Number) return je.GetDouble();
                if (double.TryParse(val?.ToString(), out double d)) return d;
                return (double?)null;
            })
            .Where(v => v.HasValue)
            .Select(v => v!.Value)
            .ToList();

        if (type.ToLower() == "count") return group.Count();
        if (!values.Any()) return 0;

        return type.ToLower() switch
        {
            "sum" => Math.Round(values.Sum(), 2),
            "avg" => Math.Round(values.Average(), 2),
            "min" => values.Min(),
            "max" => values.Max(),
            _ => Math.Round(values.Sum(), 2),
        };
    }
}

