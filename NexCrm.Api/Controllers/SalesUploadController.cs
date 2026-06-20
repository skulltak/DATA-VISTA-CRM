using Microsoft.AspNetCore.Authorization;
using ExcelDataReader;
using Microsoft.AspNetCore.Mvc;
using NexCrm.Api.Data;
using NexCrm.Api.Models;
using System.Data;

namespace NexCrm.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SalesUploadController : ControllerBase
{
    private readonly MongoDbContext _db;

    public SalesUploadController(MongoDbContext db)
    {
        _db = db;
    }

    [HttpPost("sales-data")]
    public async Task<IActionResult> UploadSalesData(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            using var stream = file.OpenReadStream();
            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

            IExcelDataReader reader;
            if (file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                reader = ExcelReaderFactory.CreateCsvReader(stream);
            }
            else
            {
                reader = ExcelReaderFactory.CreateReader(stream);
            }

            var result = reader.AsDataSet(new ExcelDataSetConfiguration()
            {
                ConfigureDataTable = (_) => new ExcelDataTableConfiguration() { UseHeaderRow = true }
            });

            if (result.Tables.Count == 0)
            {
                return BadRequest("File contains no data.");
            }

            var table = result.Tables[0];
            var salesRecords = new List<SalesRecord>();

            foreach (DataRow row in table.Rows)
            {
                var record = new SalesRecord
                {
                    Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                    StoreName = GetRowValue(row, table, "STORE NAME"),
                    Brand = GetRowValue(row, table, "BRAND"),
                    Product = GetRowValue(row, table, "PRODUCT"),
                    SerialNo = GetRowValue(row, table, "SERIAL NO"),
                    BillValue = GetRowValue(row, table, "BILL VALUE"),
                    BillDate = GetRowValue(row, table, "BILL DATE"),
                    CustomerName = GetRowValue(row, table, "CUSTOMER NAME"),
                    CustomerContact = GetRowValue(row, table, "CUSTOMER CONTACT"),
                    CustomerEmailId = GetRowValue(row, table, "CUSTOMER EMAIL ID"),
                    BrandWarranty = GetRowValue(row, table, "BRAND WARRANTY"),
                    ExtendedWarranty = GetRowValue(row, table, "EXTENDED WARRANTY"),
                    ActivationValue = GetRowValue(row, table, "ACTIVATION VALUE"),
                    BillNo = GetRowValue(row, table, "BILL NO"),
                    OrderId = GetRowValue(row, table, "Order id"),
                    MaiYesNo = GetRowValue(row, table, "mai yes/ no"),
                    Payment = GetRowValue(row, table, "Payment"),
                    DateReceived = GetRowValue(row, table, "Date received")
                };
                salesRecords.Add(record);
            }

            if (salesRecords.Any())
            {
                await _db.SalesRecords.InsertManyAsync(salesRecords);
            }

            return Ok(new
            {
                message = $"{salesRecords.Count} records imported successfully."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error processing file: {ex.Message}");
        }
    }

    private string? GetRowValue(DataRow row, DataTable table, string columnName)
    {
        // Try exact match or case-insensitive match
        var col = table.Columns.Cast<DataColumn>().FirstOrDefault(c => c.ColumnName.Equals(columnName, StringComparison.OrdinalIgnoreCase) || c.ColumnName.Trim().Equals(columnName, StringComparison.OrdinalIgnoreCase));
        
        if (col != null && row[col] != DBNull.Value)
        {
            return row[col].ToString();
        }
        return null;
    }
}
