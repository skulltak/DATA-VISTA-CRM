using ExcelDataReader;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using NexCrm.Api.Data;
using NexCrm.Api.Models;
using System.Data;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using NexCrm.Api.Hubs;

namespace NexCrm.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImportController : ControllerBase
{
    private readonly IMongoCollection<ImportedFile> _files;
    private readonly IMongoCollection<ImportedRecord> _records;
    private readonly IHubContext<NotificationHub> _hubContext;

    public ImportController(MongoDbContext db, IHubContext<NotificationHub> hubContext)
    {
        _files = db.ImportedFiles;
        _records = db.ImportedRecords;
        _hubContext = hubContext;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        try 
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            await _hubContext.Clients.All.SendAsync("ReceiveNotification", "Chrome Sync: Fetching auto-imported report data...", "fetching");
            
            using var stream = file.OpenReadStream();
            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
            
            IExcelDataReader reader;
            if (file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase)) {
                reader = ExcelReaderFactory.CreateCsvReader(stream);
            } else {
                reader = ExcelReaderFactory.CreateReader(stream);
            }

            var result = reader.AsDataSet(new ExcelDataSetConfiguration()
            {
                ConfigureDataTable = (_) => new ExcelDataTableConfiguration() { UseHeaderRow = true }
            });

            if (result.Tables.Count == 0) {
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", "Chrome Sync: File contains no data.", "error");
                return BadRequest("File contains no data.");
            }

            // Convert dataset to VoyagerFile format
            var sheets = new List<object>();
            foreach(DataTable table in result.Tables)
            {
                var sheetData = new List<List<object>>();
                
                // Add Headers
                var headers = table.Columns.Cast<DataColumn>().Select(c => (object)c.ColumnName).ToList();
                sheetData.Add(headers);

                // Add Rows
                foreach (DataRow row in table.Rows)
                {
                    var rowData = new List<object>();
                    foreach (DataColumn col in table.Columns)
                    {
                        rowData.Add(row[col] == DBNull.Value ? "" : row[col]);
                    }
                    sheetData.Add(rowData);
                }

                sheets.Add(new {
                    name = table.TableName,
                    data = sheetData
                });
            }

            var voyagerFile = new VoyagerFile {
                Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                Name = file.FileName,
                Size = file.Length,
                SheetsJson = JsonSerializer.Serialize(sheets)
            };

            var db = HttpContext.RequestServices.GetRequiredService<MongoDbContext>();
            await db.VoyagerFiles.InsertOneAsync(voyagerFile);

            await _hubContext.Clients.All.SendAsync("ReceiveNotification", "Chrome Sync: Report imported and mapped successfully!", "success");

            return Ok(new
            {
                message = "Imported successfully.",
                fileId = voyagerFile.Id
            });
        }
        catch (Exception ex)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", $"Chrome Sync Error: {ex.Message}", "error");
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("files/{fileId}/records")]
    public async Task<IActionResult> GetFileRecords(string fileId)
    {
        var file = await _files.Find(f => f.Id == fileId).FirstOrDefaultAsync();
        if (file == null) return NotFound();

        var recordDocs = await _records.Find(r => r.FileId == fileId).ToListAsync();
        
        var records = recordDocs
            .Select(r => JsonSerializer.Deserialize<Dictionary<string, object?>>(r.DataJson))
            .ToList();

        return Ok(new
        {
            headers = JsonSerializer.Deserialize<List<string>>(file.HeadersJson),
            records
        });
    }

    [HttpGet("files/{fileId}/headers")]
    public async Task<IActionResult> GetFileHeaders(string fileId)
    {
        var file = await _files.Find(f => f.Id == fileId).FirstOrDefaultAsync();
        if (file == null) return NotFound();
        return Ok(JsonSerializer.Deserialize<List<string>>(file.HeadersJson));
    }

    [HttpGet("files")]
    public async Task<IActionResult> GetImportedFiles()
    {
        var files = await _files.Find(_ => true).ToListAsync();
        var result = new List<object>();

        foreach (var f in files)
        {
            var count = await _records.CountDocumentsAsync(r => r.FileId == f.Id);
            result.Add(new
            {
                f.Id,
                f.FileName,
                f.UploadDate,
                RecordCount = count
            });
        }
        
        return Ok(result);
    }
}
